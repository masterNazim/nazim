import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request) {
    try {
        const { productIds } = await request.json()

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return Response.json(
                {
                    success: false,
                    error: "Product IDs array is required",
                },
                { status: 400 },
            )
        }

        // Validate UUID format for all product IDs
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        const invalidIds = productIds.filter((id) => !uuidRegex.test(id))

        if (invalidIds.length > 0) {
            return Response.json(
                {
                    success: false,
                    error: `Invalid product ID format: ${invalidIds.join(", ")}`,
                },
                { status: 400 },
            )
        }

        const { data, error } = await supabaseAdmin.from("products").select("id, stock").in("id", productIds)

        if (error) {
            console.error("Database error:", error)
            return Response.json(
                {
                    success: false,
                    error: "Failed to fetch product stock",
                },
                { status: 500 },
            )
        }

        return Response.json({
            success: true,
            data: data || [],
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
