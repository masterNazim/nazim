import { supabaseAdmin } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

    // Upload to Supabase Storage using INTERIOR bucket
    const { data, error } = await supabaseAdmin.storage
      .from("INTERIOR")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (error) {
      console.error("Upload error:", error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("INTERIOR")
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      url: publicUrl,
    })
  } catch (error) {
    console.error("Upload API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
