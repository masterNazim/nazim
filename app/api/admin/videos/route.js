import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from("videos").select("*").order("display_order", { ascending: true })

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

export async function POST(request) {
  try {
    const { title, description, youtube_id, display_order } = await request.json()

    if (!title || !youtube_id) {
      return Response.json(
        {
          success: false,
          error: "Title and YouTube ID are required",
        },
        { status: 400 },
      )
    }

    const { data, error } = await supabaseAdmin
      .from("videos")
      .insert({
        title,
        description,
        youtube_id,
        display_order: display_order || 1,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return Response.json(
        {
          success: false,
          error: "Failed to create video",
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
