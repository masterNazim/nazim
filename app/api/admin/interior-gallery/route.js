import { supabaseAdmin } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { data: projects, error } = await supabaseAdmin
      .from("interior_gallery")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching interior projects:", error)
      return NextResponse.json({ 
        success: false,
        error: error.message || "Failed to fetch projects" 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: projects || [] })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ 
      success: false,
      error: error?.message || "Internal server error" 
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json({ 
        success: false,
        error: "Request body is required" 
      }, { status: 400 })
    }

    const { data: project, error } = await supabaseAdmin
      .from("interior_gallery")
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error("Error creating interior project:", error)
      return NextResponse.json({ 
        success: false,
        error: error.message || "Failed to create project" 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: project }, { status: 201 })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ 
      success: false,
      error: error?.message || "Internal server error" 
    }, { status: 500 })
  }
}
