import { supabaseAdmin } from "@/lib/supabase-admin"
import { invalidateAllProductCache } from "@/lib/cache"

export const dynamic = "force-dynamic"

export async function PATCH(request, { params }) {
  try {
    const { id } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return Response.json(
        {
          success: false,
          error: "Invalid product ID format",
        },
        { status: 400 },
      )
    }

    const { is_featured } = await request.json()

    const { data, error } = await supabaseAdmin
      .from("products")
      .update({ is_featured })
      .eq("id", id)
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .single()

    if (error) {
      console.error("Database error:", error)
      return Response.json(
        {
          success: false,
          error: `Failed to update product: ${error.message}`,
        },
        { status: 500 },
      )
    }

    // Invalidate product caches when featured status changes
    invalidateAllProductCache()

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
