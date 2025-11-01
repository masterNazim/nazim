import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const { category_id, product_id, display_order, is_active, is_featured } = await request.json()

    if (!category_id || !product_id) {
      return Response.json(
        {
          success: false,
          error: "Category ID and Product ID are required",
        },
        { status: 400 },
      )
    }

    const { data, error } = await supabaseAdmin
      .from("collections")
      .update({
        category_id,
        product_id,
        display_order,
        is_active,
        is_featured, // Make sure this line exists
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
          error: "Failed to update collection",
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

    const { error } = await supabaseAdmin.from("collections").delete().eq("id", id)

    if (error) {
      console.error("Database error:", error)
      return Response.json(
        {
          success: false,
          error: "Failed to delete collection",
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
