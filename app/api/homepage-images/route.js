import { createBrowserClient } from "@supabase/ssr"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Create Supabase client
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Get all homepage images ordered by display_order
    const { data, error } = await supabase
      .from("homepage_images")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Error fetching homepage images:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch homepage images",
    }, { status: 500 })
  }
}