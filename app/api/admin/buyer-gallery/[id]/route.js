import { supabaseAdmin } from "@/lib/supabase-admin"

export async function PUT(request, { params }) {
    try {
        const { id } = params
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

        // Initialize project data
        const projectData = {
            product_name: productName,
            client_name: clientName,
            delivery_location: deliveryLocation,
            category_id: categoryId || null,
            is_featured: isFeatured,
        }

        // Get all the existing images that will be kept
        const existingImages = formData.getAll("existing_image") || []

        // Process new uploads
        const newImageUrls = []

        // Process up to 4 new images (or however many are needed to reach 4 total)
        for (let i = 0; i < 4 - existingImages.length; i++) {
            const imageFile = formData.get(`image_${i}`)
            if (!imageFile || typeof imageFile === 'string' || imageFile.size === 0) continue

            try {
                // Generate unique filename
                const fileExt = imageFile.name.split('.').pop().toLowerCase()
                const fileName = `gallery_${Date.now()}_${i}.${fileExt}`

                // Upload to Supabase Storage
                const { error: uploadError } = await supabaseAdmin.storage
                    .from("buyergallery")
                    .upload(fileName, imageFile, {
                        cacheControl: "3600",
                        upsert: true,
                    })

                if (uploadError) {
                    console.error("Upload error:", uploadError)
                    continue // Skip this image if upload fails, but continue with others
                }

                // Get public URL
                const {
                    data: { publicUrl },
                } = supabaseAdmin.storage.from("buyergallery").getPublicUrl(fileName)

                newImageUrls.push(publicUrl)
            } catch (error) {
                console.error(`Image upload error:`, error)
                // Continue with other images
            }
        }

        // Combine existing and new images
        const allImages = [...existingImages, ...newImageUrls]

        // Ensure we have at least one image
        if (allImages.length === 0) {
            return Response.json({ success: false, error: "At least one project image is required" }, { status: 400 })
        }

        // Update main image
        projectData.image_url = allImages[0]

        // Handle deleted images - attempt to remove from storage
        const deletedImages = formData.getAll("delete_image") || []
        for (const url of deletedImages) {
            try {
                // Extract filename from URL
                const urlParts = url.split('/')
                const fileName = urlParts[urlParts.length - 1]
                if (fileName) {
                    await supabaseAdmin.storage.from("buyergallery").remove([fileName])
                }
            } catch (error) {
                console.error("Failed to delete image from storage:", error)
                // Continue even if deletion fails
            }
        }

        // Update project in database - only use image_url for now
        const { data, error } = await supabaseAdmin
            .from("buyer_gallery")
            .update(projectData)
            .eq("id", id)
            .select()

        if (error) {
            console.error("Database error:", error)
            return Response.json({ success: false, error: "Failed to update project: " + error.message }, { status: 500 })
        }

        return Response.json({ success: true, data })
    } catch (error) {
        console.error("API error:", error)
        return Response.json({ success: false, error: "Internal server error: " + error.message }, { status: 500 })
    }
}

export async function GET(request, { params }) {
    try {
        const { id } = params

        const { data, error } = await supabaseAdmin
            .from("buyer_gallery")
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
            console.error("Database error:", error)
            return Response.json({ success: false, error: "Failed to fetch project" }, { status: 500 })
        }

        return Response.json({ success: true, data })
    } catch (error) {
        console.error("API error:", error)
        return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = params

        // First, get the project to get its image
        const { data: project, error: fetchError } = await supabaseAdmin
            .from("buyer_gallery")
            .select("image_url")
            .eq("id", id)
            .single()

        if (fetchError) {
            console.error("Database error:", fetchError)
            return Response.json({ success: false, error: "Failed to fetch project" }, { status: 500 })
        }

        // Delete image from storage if it exists
        if (project?.image_url) {
            try {
                const urlParts = project.image_url.split('/')
                const fileName = urlParts[urlParts.length - 1]
                if (fileName) {
                    await supabaseAdmin.storage.from("buyergallery").remove([fileName])
                }
            } catch (storageError) {
                console.error("Failed to delete image from storage:", storageError)
                // Continue even if image deletion fails
            }
        }

        // Delete the project record
        const { error: deleteError } = await supabaseAdmin
            .from("buyer_gallery")
            .delete()
            .eq("id", id)

        if (deleteError) {
            console.error("Database delete error:", deleteError)
            return Response.json({ success: false, error: "Failed to delete project" }, { status: 500 })
        }

        return Response.json({ success: true })
    } catch (error) {
        console.error("API error:", error)
        return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
    }
}
