import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from("buyer_gallery")
            .select(`
        *,
        categories (
          id,
          name
        )
      `)
            .order("is_featured", { ascending: false })
            .order("created_at", { ascending: false })

        if (error) {
            console.error("Database error:", error)
            return Response.json({ success: false, error: "Failed to fetch buyer gallery" }, { status: 500 })
        }

        return Response.json({ success: true, data })
    } catch (error) {
        console.error("API error:", error)
        return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
    }
}

// Update the POST handler to work with existing schema
export async function POST(request) {
    try {
        const formData = await request.formData()
        const productName = formData.get("product_name")
        const clientName = formData.get("client_name")
        const deliveryLocation = formData.get("delivery_location")
        const categoryId = formData.get("category_id")
        const isFeatured = formData.get("is_featured") === "true"
        
        // Check for required fields
        if (!productName || !clientName || !deliveryLocation) {
            return Response.json({ success: false, error: "Missing required fields" }, { status: 400 })
        }
        
        // Just handle one image for now
        let imageUrl = null
        const imageFile = formData.get("image_0")
        
        if (!imageFile || imageFile.size === 0) {
            return Response.json({ success: false, error: "Project image is required" }, { status: 400 })
        }
        
        try {
            // Generate unique filename
            const fileExt = imageFile.name.split('.').pop()
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
            
            // Upload to Supabase Storage
            const { error: uploadError } = await supabaseAdmin.storage
                .from("buyergallery")
                .upload(fileName, imageFile, {
                    cacheControl: "3600",
                    upsert: false,
                })
            
            if (uploadError) {
                console.error("Upload error:", uploadError)
                return Response.json({ success: false, error: "Failed to upload image" }, { status: 500 })
            }
            
            // Get public URL
            const {
                data: { publicUrl },
            } = supabaseAdmin.storage.from("buyergallery").getPublicUrl(fileName)
            
            imageUrl = publicUrl
        } catch (error) {
            console.error(`Image upload error:`, error)
            return Response.json(
                {
                    success: false,
                    error: "Failed to upload image",
                },
                { status: 500 },
            )
        }
        
        // Insert project into database (without image_urls for now)
        const { data, error } = await supabaseAdmin
            .from("buyer_gallery")
            .insert({
                product_name: productName,
                client_name: clientName,
                delivery_location: deliveryLocation,
                category_id: categoryId || null,
                is_featured: isFeatured,
                image_url: imageUrl, // Just use single image URL for now
            })
            .select()
            .single()
        
        if (error) {
            console.error("Database error:", error)
            return Response.json({ success: false, error: "Failed to create project" }, { status: 500 })
        }
        
        return Response.json({ success: true, data })
    } catch (error) {
        console.error("API error:", error)
        return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
    }
}
