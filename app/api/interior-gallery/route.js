import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// GET - Fetch interior gallery projects (public)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const featured = searchParams.get("featured")
    const limit = searchParams.get("limit")

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

    let query = supabase.from("interior_gallery").select("*").order("created_at", { ascending: false })

    // Apply filters
    if (category && category !== "all") {
      query = query.eq("category", category)
    }

    if (featured === "true") {
      query = query.eq("featured", true)
    }

    if (limit) {
      query = query.limit(Number.parseInt(limit))
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching interior gallery:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error("Interior gallery API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
