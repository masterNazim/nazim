import { createServerClient } from "@supabase/ssr"

export async function GET(request) {
    try {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    get(name) {
                        return request.cookies.get(name)?.value
                    },
                },
            },
        )

        const { searchParams } = new URL(request.url)
        const category = searchParams.get("category")
        const featured = searchParams.get("featured")
        const limit = Number.parseInt(searchParams.get("limit")) || 50

        let query = supabase
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
            .limit(limit)

        if (category && category !== "all") {
            query = query.eq("category_id", category)
        }

        if (featured === "true") {
            query = query.eq("is_featured", true)
        }

        const { data, error } = await query

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
