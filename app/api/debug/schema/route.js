import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
  try {
    // Try to get the table structure by querying with limit 0
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .limit(0)

    if (error) {
      console.error("Schema check error:", error)
      return Response.json({
        success: false,
        error: error.message,
        details: error
      })
    }

    // Also try to get a sample row to see actual structure
    const { data: sampleData, error: sampleError } = await supabaseAdmin
      .from("products")
      .select("*")
      .limit(1)

    return Response.json({
      success: true,
      message: "Schema check completed",
      sampleStructure: sampleData?.[0] ? Object.keys(sampleData[0]) : [],
      sampleData: sampleData?.[0] || null
    })
  } catch (error) {
    console.error("API error:", error)
    return Response.json({
      success: false,
      error: "Internal server error",
      details: error.message
    })
  }
}
