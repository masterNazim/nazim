import { supabase, safeQuery } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "20"), 100) // Cap at 100
    const category = searchParams.get("category")
    const featured = searchParams.get("featured") === "true"

    const offset = (page - 1) * limit
    const cacheKey = `products_${page}_${limit}_${category || "all"}_${featured}`

    const result = await safeQuery(
      async () => {
        let query = supabase
          .from("products")
          .select(
            `
          *,
          categories (
            id,
            name
          )
        `,
            { count: "exact" },
          )
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1)

        if (category && category !== "all") {
          query = query.eq("category_id", category)
        }

        if (featured) {
          query = query.eq("is_featured", true)
        }

        return await query
      },
      {
        maxRetries: 3,
        timeout: 12000,
        cacheKey,
        cacheTTL: 2 * 60 * 1000, // 2 minutes cache
      },
    )

    const { data, error, count } = result

    if (error) {
      console.error("[v0] Database error:", error.message)
      return Response.json(
        {
          success: false,
          error: "Failed to fetch products",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return Response.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: offset + limit < (count || 0),
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("[v0] API error:", error.message)
    return Response.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
