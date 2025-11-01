import { supabaseAdmin } from "@/lib/supabase-admin"
import { cachedQuery, createCacheKey, addCacheHeaders, invalidateAllProductCache } from "@/lib/cache"

export const dynamic = "force-dynamic"

export async function GET(request, { params }) {
  try {
    const { id } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return Response.json(
        {
          success: false,
          error: "Invalid product ID format",
        },
        { status: 400 },
      )
    }

    const cacheKey = createCacheKey("products", "single", id)

    const result = await cachedQuery(
      cacheKey,
      async () => {
        const { data, error } = await supabaseAdmin
          .from("products")
          .select(`
            *,
            categories (
              id,
              name
            )
          `)
          .eq("id", id)
          .single()

        if (error) {
          if (error.code === "PGRST116") {
            return { error: "Product not found", status: 404 }
          }
          throw error
        }

        return { data }
      },
      300, // Cache individual products for 5 minutes
    )

    if (result.error) {
      console.error("Database error:", result.error)
      return Response.json(
        {
          success: false,
          error: result.error,
        },
        { status: result.status || 500 },
      )
    }

    const response = Response.json({
      success: true,
      data: result.data,
    })

    // Add cache headers
    return addCacheHeaders(response, 300, 600) // 5 min client, 10 min CDN
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

export async function PUT(request, { params }) {
  try {
    const { id } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return Response.json(
        {
          success: false,
          error: "Invalid product ID format",
        },
        { status: 400 },
      )
    }

    const formData = await request.formData()

    // Extract form fields to match database schema
    const productData = {
      name: formData.get("name"),
      description: formData.get("description"),
      price: Number.parseFloat(formData.get("price")),
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
    }

    // Fetch existing product to get current image_urls
    const { data: existingProduct, error: fetchError } = await supabaseAdmin
      .from("products")
      .select("image_urls")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Fetch error:", fetchError)
      return Response.json(
        {
          success: false,
          error: `Failed to fetch existing product: ${fetchError.message}`,
        },
        { status: 500 },
      )
    }

    let imageUrls = existingProduct.image_urls || []

    // Handle deletions
    const deleteImages = formData.getAll("delete_image")
    console.log("[v0] Images to delete:", deleteImages)
    console.log("[v0] Current image URLs:", imageUrls)
    imageUrls = imageUrls.filter((url) => !deleteImages.includes(url))
    console.log("[v0] Remaining images after deletion:", imageUrls)

    // Handle new uploads (up to 4 total)
    const newImageUrls = []
    const maxImages = 4
    const availableSlots = maxImages - imageUrls.length

    for (let i = 0; i < availableSlots && i < 4; i++) {
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

          newImageUrls.push(publicUrl)
          console.log("[v0] Successfully uploaded new image:", publicUrl)
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

    // Combine existing and new
    imageUrls = [...imageUrls, ...newImageUrls]
    console.log("[v0] Final image URLs:", imageUrls)
    productData.image_urls = imageUrls

    // Update product in database
    const { data, error } = await supabaseAdmin
      .from("products")
      .update({ ...productData, image_urls: productData.image_urls || [] })
      .eq("id", id)
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
          error: `Failed to update product: ${error.message}`,
        },
        { status: 500 },
      )
    }

    // Invalidate product caches when product is updated
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

export async function DELETE(request, { params }) {
  try {
    const { id } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return Response.json(
        {
          success: false,
          error: "Invalid product ID format",
        },
        { status: 400 },
      )
    }

    const { error } = await supabaseAdmin.from("products").delete().eq("id", id)

    if (error) {
      console.error("Database error:", error)
      return Response.json(
        {
          success: false,
          error: `Failed to delete product: ${error.message}`,
        },
        { status: 500 },
      )
    }

    // Invalidate product caches when product is deleted
    invalidateAllProductCache()

    return Response.json({
      success: true,
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
