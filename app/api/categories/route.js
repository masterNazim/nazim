import { supabase } from "@/lib/supabase"
import { cachedQuery, createCacheKey, addCacheHeaders } from "@/lib/cache"

export async function GET() {
  try {
    const cacheKey = createCacheKey('categories', 'all')
    
    const result = await cachedQuery(
      cacheKey,
      async () => {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("name", { ascending: true })

        if (error) {
          throw error
        }

        return { data: data || [] }
      },
      600 // Cache for 10 minutes
    )

    if (result.error) {
      console.error("Database error:", result.error)
      return Response.json(
        {
          success: false,
          error: "Failed to fetch categories",
        },
        { status: 500 },
      )
    }

    const response = Response.json({
      success: true,
      data: result.data,
    })

    // Add cache headers - categories don't change often
    return addCacheHeaders(response, 600, 1200) // 10 min client, 20 min CDN
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
