import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function GET() {
    try {
        console.log("[API] Collections: Starting fetch...")

        // Fetch all required data in parallel for better performance
        const [collectionsResult, categoriesResult, productsResult] = await Promise.all([
            supabaseAdmin
                .from("collections")
                .select("*")
                .eq("is_active", true)
                .order("display_order", { ascending: true }),
            supabaseAdmin
                .from("categories")
                .select("id, name"),
            supabaseAdmin
                .from("products")
                .select("*")
        ])

        if (collectionsResult.error) {
            console.error("[API] Collections fetch error:", collectionsResult.error)
            throw new Error(`Collections fetch failed: ${collectionsResult.error.message}`)
        }
        if (categoriesResult.error) {
            console.error("[API] Categories fetch error:", categoriesResult.error)
            throw new Error(`Categories fetch failed: ${categoriesResult.error.message}`)
        }
        if (productsResult.error) {
            console.error("[API] Products fetch error:", productsResult.error)
            throw new Error(`Products fetch failed: ${productsResult.error.message}`)
        }

        const collectionsData = collectionsResult.data || []
        const categoriesData = categoriesResult.data || []
        const productsData = productsResult.data || []

        console.log(`[API] Collections: Fetched ${collectionsData.length} collections, ${categoriesData.length} categories, ${productsData.length} products`)

        // Create lookup maps for efficient joining
        const categoriesMap = new Map(categoriesData.map((cat) => [cat.id, cat]))
        const productsMap = new Map(productsData.map((prod) => [prod.id, prod]))

        // Join collections with categories and products
        const collections = collectionsData.map((collection) => ({
            ...collection,
            categories: categoriesMap.get(collection.category_id) || {
                id: collection.category_id,
                name: "Unknown Category",
            },
            products: productsMap.get(collection.product_id) || {
                id: collection.product_id,
                name: "Unknown Product",
                price: 0,
                discount_price: null,
                image_urls: [],
                image_url: null,
            },
        }))

        console.log(`[API] Collections: Successfully processed ${collections.length} collections`)

        // Return response with no-cache headers for immediate updates
        return new Response(
            JSON.stringify({
                success: true,
                data: collections
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                }
            }
        )

    } catch (error) {
        console.error("[API] Collections error:", error)
        return Response.json(
            {
                success: false,
                error: error.message || "Failed to fetch collections"
            },
            { status: 500 }
        )
    }
}
