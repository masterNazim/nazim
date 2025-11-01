import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
  try {
    // Fetch featured collections
    const [collectionsResult, categoriesResult, productsResult] = await Promise.all([
      supabaseAdmin
        .from("collections")
        .select("*")
        .eq("is_active", true)
        .eq("is_featured", true)
        .limit(12) // Limit to 12 items (3 rows of 4)
        .order("display_order", { ascending: true }),
      supabaseAdmin.from("categories").select("id, name"),
      supabaseAdmin.from("products").select("*"),
    ])

    if (collectionsResult.error) {
      console.error("Featured collections error:", collectionsResult.error)
      return NextResponse.json({ success: false, error: collectionsResult.error.message }, { status: 500 })
    }

    const collectionsData = collectionsResult.data || []
    const categoriesData = categoriesResult.data || []
    const productsData = productsResult.data || []

    // Create lookup maps
    const categoriesMap = new Map(categoriesData.map((cat) => [cat.id, cat]))
    const productsMap = new Map(productsData.map((prod) => [prod.id, prod]))

    // Join collections with categories and products
    const joinedCollections = collectionsData.map((collection) => ({
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

    return NextResponse.json({ success: true, data: joinedCollections })
  } catch (error) {
    console.error("Error fetching featured collections:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}