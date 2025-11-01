import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET(request, { params }) {
    try {
        const { data, error } = await supabaseAdmin
            .from("categories")
            .select("*")
            .eq("id", params.id)
            .single()

        if (error) {
            console.error("Database error:", error)
            return Response.json(
                {
                    success: false,
                    error: "Category not found",
                },
                { status: 404 },
            )
        }

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

export async function PUT(request, { params }) {
    try {
        const { name, description, image_url } = await request.json()

        if (!name || !name.trim()) {
            return Response.json(
                {
                    success: false,
                    error: "Category name is required",
                },
                { status: 400 },
            )
        }

        const { data, error } = await supabaseAdmin
            .from("categories")
            .update({
                name: name.trim(),
                description: description?.trim() || null,
                image_url: image_url?.trim() || null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", params.id)
            .select()
            .single()

        if (error) {
            console.error("Database error:", error)
            return Response.json(
                {
                    success: false,
                    error: "Failed to update category",
                },
                { status: 500 },
            )
        }

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
        // First check if there are products in this category
        const { data: products, error: checkError } = await supabaseAdmin
            .from("products")
            .select("id")
            .eq("category_id", params.id)
            .limit(1)

        if (checkError) {
            console.error("Database error:", checkError)
            return Response.json(
                {
                    success: false,
                    error: "Failed to check category usage",
                },
                { status: 500 },
            )
        }

        if (products && products.length > 0) {
            return Response.json(
                {
                    success: false,
                    error: "Cannot delete category that contains products. Please move or delete all products in this category first.",
                },
                { status: 400 },
            )
        }

        const { error } = await supabaseAdmin
            .from("categories")
            .delete()
            .eq("id", params.id)

        if (error) {
            console.error("Database error:", error)
            return Response.json(
                {
                    success: false,
                    error: "Failed to delete category",
                },
                { status: 500 },
            )
        }

        return Response.json({
            success: true,
            message: "Category deleted successfully",
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
