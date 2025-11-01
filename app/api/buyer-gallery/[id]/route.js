import { supabase } from "@/lib/supabase"

export async function GET(request, { params }) {
    try {
        const { id } = params

        // Fetch the project with its category
        const { data, error } = await supabase
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

        if (!data) {
            return Response.json({ success: false, error: "Project not found" }, { status: 404 })
        }

        return Response.json({ success: true, data })
    } catch (error) {
        console.error("API error:", error)
        return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
    }
}