import { supabaseAdmin } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Get total count
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from("interior_gallery")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("Error fetching total count:", countError)
      return NextResponse.json({ 
        success: false,
        error: countError.message || "Failed to fetch stats" 
      }, { status: 500 })
    }

    // Get featured count
    const { count: featuredCount, error: featuredError } = await supabaseAdmin
      .from("interior_gallery")
      .select("*", { count: "exact", head: true })
      .eq("featured", true)

    if (featuredError) {
      console.error("Error fetching featured count:", featuredError)
      return NextResponse.json({ 
        success: false,
        error: featuredError.message || "Failed to fetch stats" 
      }, { status: 500 })
    }

    // Get categories
    const { data: categories, error: categoryError } = await supabaseAdmin
      .from("interior_gallery")
      .select("category")

    if (categoryError) {
      console.error("Error fetching categories:", categoryError)
      return NextResponse.json({ 
        success: false,
        error: categoryError.message || "Failed to fetch stats" 
      }, { status: 500 })
    }

    // Count categories
    const categoryCount = {}
    categories?.forEach(item => {
      if (item.category) {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + 1
      }
    })

    const stats = {
      total: totalCount || 0,
      featured: featuredCount || 0,
      byCategory: categoryCount,
      categories: categoryCount, // Keep both for compatibility
      categoryBreakdown: Object.entries(categoryCount).map(([name, count]) => ({
        name,
        count
      }))
    }

    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ 
      success: false,
      error: error?.message || "Internal server error" 
    }, { status: 500 })
  }
}
