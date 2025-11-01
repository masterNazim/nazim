import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
    try {
        // Get total count
        const { count: totalCount, error: totalError } = await supabaseAdmin
            .from("buyer_gallery")
            .select("*", { count: "exact", head: true })

        if (totalError) {
            console.error("Error fetching total count:", totalError)
            return Response.json({ success: false, error: "Failed to fetch stats" }, { status: 500 })
        }

        // Get featured count
        const { count: featuredCount, error: featuredError } = await supabaseAdmin
            .from("buyer_gallery")
            .select("*", { count: "exact", head: true })
            .eq("is_featured", true)

        if (featuredError) {
            console.error("Error fetching featured count:", featuredError)
            return Response.json({ success: false, error: "Failed to fetch stats" }, { status: 500 })
        }

        const stats = {
            total: totalCount || 0,
            featured: featuredCount || 0,
        }

        return Response.json({ success: true, data: stats })
    } catch (error) {
        console.error("API error:", error)
        return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
    }
}
