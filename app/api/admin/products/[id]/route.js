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
    const formData = await request.formData()

    // Get form data
    const productData = {
      name: formData.get("name"),
      description: formData.get("description"),
      price: parseFloat(formData.get("price")),
      category_id: formData.get("category_id"),
      stock: parseInt(formData.get("stock")) || 0,
      is_featured: formData.get("is_featured") === "true",
    }

    // Get existing product to access current images
    const { data: existingProduct, error: fetchError } = await supabaseAdmin
      .from("products")
      .select("image_urls")
      .eq("id", id)
      .single()

    if (fetchError) {
      return Response.json(
        {
          success: false,
          error: `Failed to fetch existing product: ${fetchError.message}`,
        },
        { status: 500 },
      )
    }

    let imageUrls = existingProduct.image_urls || []

    // Handle deletions - remove from array and delete from storage
    const deleteImages = formData.getAll("delete_image")
    console.log("[v0] Images to delete:", deleteImages)
    
    if (deleteImages.length > 0) {
      // Delete from storage
      for (const imageUrl of deleteImages) {
        try {
          // Extract filename from URL
          const urlParts = imageUrl.split('/')
          const fileName = urlParts[urlParts.length - 1]
          
          const { error: deleteError } = await supabaseAdmin.storage
            .from("productimage")
            .remove([fileName])
            
          if (deleteError) {
            console.error("Error deleting image from storage:", deleteError)
          }
        } catch (deleteErr) {
          console.error("Error processing image deletion:", deleteErr)
        }
      }
      
      // Remove from array
      imageUrls = imageUrls.filter((url) => !deleteImages.includes(url))
    }

    console.log("[v0] Remaining images after deletion:", imageUrls)

    // Handle new uploads
    const newImageUrls = []
    const maxImages = 4
    const availableSlots = maxImages - imageUrls.length

    for (let i = 0; i < availableSlots && i < 4; i++) {
      const imageFile = formData.get(`image_${i}`)
      if (!imageFile || imageFile.size === 0) continue

      try {
        // Generate unique filename
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabaseAdmin.storage
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

    // Combine existing and new images
    imageUrls = [...imageUrls, ...newImageUrls]
    console.log("[v0] Final image URLs:", imageUrls)
    
    // Ensure we don't exceed 4 images
    if (imageUrls.length > 4) {
      imageUrls = imageUrls.slice(0, 4)
    }
    
    productData.image_urls = imageUrls

    // Update product in database
    const { data, error } = await supabaseAdmin
      .from("products")
      .update(productData)
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
          error: `Database error: ${error.message}`,
        },
        { status: 500 },
      )
    }

    return Response.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Server error:", error)
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
