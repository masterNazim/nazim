import { supabaseAdmin } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"

export async function GET(request, { params }) {
  try {
    // Validate params
    if (!params?.id) {
      return NextResponse.json({ 
        success: false,
        error: "Project ID is required" 
      }, { status: 400 })
    }

    const { data: project, error } = await supabaseAdmin
      .from("interior_gallery")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Error fetching interior project:", error)
      return NextResponse.json({ 
        success: false,
        error: error.message || "Failed to fetch project" 
      }, { status: error.code === 'PGRST116' ? 404 : 500 })
    }

    if (!project) {
      return NextResponse.json({ 
        success: false,
        error: "Project not found" 
      }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: project })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ 
      success: false,
      error: error?.message || "Internal server error" 
    }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    // Validate params
    if (!params?.id) {
      return NextResponse.json({ 
        success: false,
        error: "Project ID is required" 
      }, { status: 400 })
    }

    const body = await request.json()
    
    // Validate request body
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json({ 
        success: false,
        error: "Request body is required" 
      }, { status: 400 })
    }
    
    const { data: project, error } = await supabaseAdmin
      .from("interior_gallery")
      .update(body)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating interior project:", error)
      return NextResponse.json({ 
        success: false,
        error: error.message || "Failed to update project" 
      }, { status: error.code === 'PGRST116' ? 404 : 500 })
    }

    if (!project) {
      return NextResponse.json({ 
        success: false,
        error: "Project not found" 
      }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: project })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ 
      success: false,
      error: error?.message || "Internal server error" 
    }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    // Validate params
    if (!params?.id) {
      return NextResponse.json({ 
        success: false,
        error: "Project ID is required" 
      }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from("interior_gallery")
      .delete()
      .eq("id", params.id)

    if (error) {
      console.error("Error deleting interior project:", error)
      return NextResponse.json({ 
        success: false,
        error: error.message || "Failed to delete project" 
      }, { status: error.code === 'PGRST116' ? 404 : 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Project deleted successfully" 
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ 
      success: false,
      error: error?.message || "Internal server error" 
    }, { status: 500 })
  }
}
