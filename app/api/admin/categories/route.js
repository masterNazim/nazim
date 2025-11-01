import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from("categories").select("*").order("name", { ascending: true })

    if (error) {
      console.error("Database error:", error)
      return Response.json(
        {
          success: false,
          error: "Failed to fetch categories",
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
    const { name, description, image_url } = await request.json()

    if (!name) {
      return Response.json(
        {
          success: false,
          error: "Category name is required",
        },
        { status: 400 },
      )
    }

    const { data, error } = await supabaseAdmin
      .from("categories")
      .insert({
        name,
        description,
        image_url,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return Response.json(
        {
          success: false,
          error: "Failed to create category",
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
