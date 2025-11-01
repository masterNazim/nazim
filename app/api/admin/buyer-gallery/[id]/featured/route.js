import { supabaseAdmin } from "@/lib/supabase-admin"

export async function PATCH(request, { params }) {
    try {
        const { id } = params
        const { is_featured } = await request.json()

        const { data, error } = await supabaseAdmin
            .from("buyer_gallery")
            .update({ is_featured })
            .eq("id", id)
            .select()
            .single()

        if (error) {
            console.error("Database error:", error)
            return Response.json({ success: false, error: "Failed to update project" }, { status: 500 })
        }

        return Response.json({ success: true, data })
    } catch (error) {
        console.error("API error:", error)
        return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
    }
}
