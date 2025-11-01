import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// GET - Fetch single interior gallery project (public)
export async function GET(request, { params }) {
  try {
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

    const { data, error } = await supabase.from("interior_gallery").select("*").eq("id", params.id).single()

    if (error) {
      console.error("Error fetching project:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Project API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
