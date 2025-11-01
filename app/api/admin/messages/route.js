import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("[v0] Messages API: Starting request")
    console.log("[v0] Messages API: Supabase admin client initialized")

    console.log("[v0] Messages API: Checking if contact_messages table exists")
    const { data: tableCheck, error: tableError } = await supabaseAdmin
      .from("contact_messages")
      .select("count", { count: "exact", head: true })

    if (tableError) {
      console.error("[v0] Messages API: Table check failed:", tableError)
      if (tableError.code === "42P01" || tableError.message?.includes("does not exist")) {
        console.log("[v0] Messages API: Table doesn't exist, returning empty array")
        return Response.json({
          success: true,
          data: [],
          message: "Contact messages table not found - please run database setup",
        })
      }
    }

    console.log("[v0] Messages API: Table exists, fetching messages")
    const { data, error } = await supabaseAdmin
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Messages API: Database error:", error)
      return Response.json(
        {
          success: false,
          error: "Failed to fetch messages",
          details: error.message,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Messages API: Successfully fetched", data?.length || 0, "messages")
    return Response.json({
      success: true,
      data: data || [],
    })
  } catch (error) {
    console.error("[v0] Messages API: Unexpected error:", error)
    return Response.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
