import { supabaseAdmin } from "@/lib/supabase-admin"
import { cachedQuery, createCacheKey, addCacheHeaders } from "@/lib/cache"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("[v0] Stats API: Starting request")
    const cacheKey = createCacheKey("products", "stats")

    const result = await cachedQuery(
      cacheKey,
      async () => {
        console.log("[v0] Stats API: Checking if products table exists")
        const { data: tableCheck, error: tableError } = await supabaseAdmin
          .from("products")
          .select("count", { count: "exact", head: true })

        if (tableError) {
          console.error("[v0] Stats API: Table check failed:", tableError)
          if (tableError.code === "42P01" || tableError.message?.includes("does not exist")) {
            console.log("[v0] Stats API: Products table doesn't exist, returning zero stats")
            return {
              data: {
                total: 0,
                featured: 0,
                outOfStock: 0,
                lowStock: 0,
              },
            }
          }
        }

        console.log("[v0] Stats API: Products table exists, fetching data")
        // Single query to get all products with their stock and featured status
        const { data, error } = await supabaseAdmin.from("products").select("stock, is_featured")

        if (error) {
          console.error("[v0] Stats API: Database error:", error)
          throw error
        }

        console.log("[v0] Stats API: Successfully fetched", data?.length || 0, "products")
        // Calculate all stats from the single result set
        const stats = {
          total: data.length,
          featured: data.filter((p) => p.is_featured).length,
          outOfStock: data.filter((p) => p.stock === 0).length,
          lowStock: data.filter((p) => p.stock > 0 && p.stock <= 5).length,
        }

        return { data: stats }
      },
      300, // Cache for 5 minutes - stats can be slightly stale
    )

    if (result.error) {
      console.error("[v0] Stats API: Database error:", result.error)
      return Response.json(
        {
          success: false,
          error: "Failed to fetch product statistics",
          details: result.error.message,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Stats API: Returning stats:", result.data)
    const response = Response.json({
      success: true,
      data: result.data,
    })

    // Add cache headers - stats can be cached for a few minutes
    return addCacheHeaders(response, 300, 600) // 5 min client, 10 min CDN
  } catch (error) {
    console.error("[v0] Stats API: Unexpected error:", error)
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
