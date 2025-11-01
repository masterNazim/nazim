import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const offset = (page - 1) * limit

    const { data, error, count } = await supabaseAdmin
      .from("videos")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Database error:", error)
      return Response.json(
        {
          success: false,
          error: "Failed to fetch videos",
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
        total: count,
        totalPages: Math.ceil(count / limit),
        hasNext: offset + limit < count,
        hasPrev: page > 1,
      },
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
