import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const { title, description, youtube_id, display_order, is_active } = await request.json()

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
      .update({
        title,
        description,
        youtube_id,
        display_order,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return Response.json(
        {
          success: false,
          error: "Failed to update video",
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

export async function DELETE(request, { params }) {
  try {
    const { id } = params

    const { error } = await supabaseAdmin.from("videos").delete().eq("id", id)

    if (error) {
      console.error("Database error:", error)
      return Response.json(
        {
          success: false,
          error: "Failed to delete video",
        },
        { status: 500 },
      )
    }

    return Response.json({
      success: true,
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
