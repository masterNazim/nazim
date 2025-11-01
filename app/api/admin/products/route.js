import { supabaseAdmin } from "@/lib/supabase-admin"
import { cachedQuery, createCacheKey, addCacheHeaders, invalidateAllProductCache } from "@/lib/cache"

export const dynamic = "force-dynamic"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const category = searchParams.get("category")
    const featured = searchParams.get("featured") === "true"

    const offset = (page - 1) * limit
    const cacheKey = createCacheKey("products", "list", page, limit, category, featured)

    const result = await cachedQuery(
      cacheKey,
      async () => {
        let query = supabaseAdmin
          .from("products")
          .select(
            `
            *,
            categories (
              id,
              name
            )
          `,
            { count: "exact" },
          )
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1)

        if (category && category !== "all") {
          query = query.eq("category_id", category)
        }

        if (featured) {
          query = query.eq("is_featured", true)
        }

        const { data, error, count } = await query

        if (error) {
          throw error
        }

        return {
          data: data || [],
          pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit),
            hasNext: offset + limit < count,
            hasPrev: page > 1,
          },
        }
      },
      180, // Cache for 3 minutes - products change more frequently
    )

    if (result.error) {
      console.error("Database error:", result.error)
      return Response.json(
        {
          success: false,
          error: "Failed to fetch products",
        },
        { status: 500 },
      )
    }

    const response = Response.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    })

    // Add cache headers
    return addCacheHeaders(response, 180, 360) // 3 min client, 6 min CDN
  } catch (error) {
    console.error("API error:", error)
    return Response.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData()

    // Make sure the validation allows price of 0
    const price = parseFloat(formData.get("price"))
    if (isNaN(price) || price < 0) {
      return Response.json(
        {
          success: false,
          error: "Price must be a valid number 0 or greater",
        },
        { status: 400 }
      )
    }

    // Extract form fields to match database schema
    const productData = {
      name: formData.get("name"),
      description: formData.get("description"),
      price,
      stock: Number.parseInt(formData.get("stock")) || 0,
      is_featured: formData.get("is_featured") === "true",
    }

    // Handle category - expect category_id from form or convert category name
    const categoryInput = formData.get("category_id") || formData.get("category")
    if (categoryInput) {
      // If it's a UUID, use it directly; otherwise, look up by name
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (uuidRegex.test(categoryInput)) {
        // Verify the UUID exists in categories table
        const { data: categoryExists } = await supabaseAdmin
          .from("categories")
          .select("id")
          .eq("id", categoryInput)
          .single()

        if (categoryExists) {
          productData.category_id = categoryInput
        } else {
          return Response.json(
            {
              success: false,
              error: `Category with ID ${categoryInput} does not exist`,
            },
            { status: 400 },
          )
        }
      } else {
        // Look up category by name
        const { data: categoryData } = await supabaseAdmin
          .from("categories")
          .select("id")
          .eq("name", categoryInput)
          .single()

        if (categoryData) {
          productData.category_id = categoryData.id
        } else {
          // Category not found - return error instead of proceeding
          return Response.json(
            {
              success: false,
              error: `Category "${categoryInput}" does not exist. Please select a valid category.`,
            },
            { status: 400 },
          )
        }
      }
    } else {
      // No category provided - return error
      return Response.json(
        {
          success: false,
          error: "Category is required. Please select a category.",
        },
        { status: 400 },
      )
    }

    // Handle multiple image uploads (up to 4)
    const imageUrls = []
    for (let i = 0; i < 4; i++) {
      const imageFile = formData.get(`image_${i}`)
      if (imageFile && imageFile.size > 0) {
        const fileName = `${Date.now()}-${i}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

        try {
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from("productimage")
            .upload(fileName, imageFile, {
              cacheControl: "3600",
              upsert: false,
            })

          if (uploadError) {
            console.error("Upload error:", uploadError)
            return Response.json(
              {
                success: false,
                error: `Failed to upload image ${i}: ${uploadError.message}`,
              },
              { status: 500 },
            )
          }

          // Get public URL
          const {
            data: { publicUrl },
          } = supabaseAdmin.storage.from("productimage").getPublicUrl(fileName)

          imageUrls.push(publicUrl)
        } catch (uploadError) {
          console.error(`Image ${i} upload error:`, uploadError)
          return Response.json(
            {
              success: false,
              error: `Failed to upload image ${i}`,
            },
            { status: 500 },
          )
        }
      }
    }

    if (imageUrls.length > 0) {
      productData.image_urls = imageUrls
    }

    // Insert product into database
    const { data, error } = await supabaseAdmin
      .from("products")
      .insert([{ ...productData, image_urls: productData.image_urls || [] }])
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .single()

    if (error) {
      console.error("Database error:", error)
      return Response.json(
        {
          success: false,
          error: `Failed to create product: ${error.message}`,
        },
        { status: 500 },
      )
    }

    // Invalidate product caches when new product is created
    invalidateAllProductCache()

    return Response.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("API error:", error)
    return Response.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
