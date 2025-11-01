import { supabaseAdmin } from "@/lib/supabase-admin"
import CollectionsClient from "./CollectionsClient"

export const dynamic = "force-dynamic"
export const revalidate = 0 // Add this line to disable caching

export default async function CollectionsPage() {
  let collections = []
  let featuredCollections = []

  try {
    const [collectionsResult, categoriesResult, productsResult] = await Promise.all([
      supabaseAdmin.from("collections").select("*").eq("is_active", true).order("display_order", { ascending: true }),
      supabaseAdmin.from("categories").select("id, name"),
      supabaseAdmin.from("products").select("*"),
    ])

    // Add a separate query for featured collections
    const featuredResult = await supabaseAdmin
      .from("collections")
      .select("*")
      .eq("is_active", true)
      .eq("is_featured", true)
      .limit(12) // Limit to 12 items (3 rows of 4)
      .order("display_order", { ascending: true })

    console.log(
      "[v0] Server: Collections result:",
      collectionsResult.error ? collectionsResult.error : `${collectionsResult.data?.length || 0} collections`,
    )
    console.log(
      "[v0] Server: Categories result:",
      categoriesResult.error ? categoriesResult.error : `${categoriesResult.data?.length || 0} categories`,
    )
    console.log(
      "[v0] Server: Products result:",
      productsResult.error ? productsResult.error : `${productsResult.data?.length || 0} products`,
    )

    if (collectionsResult.error) {
      console.error("Collections error:", collectionsResult.error)
    }
    if (categoriesResult.error) {
      console.error("Categories error:", categoriesResult.error)
    }
    if (productsResult.error) {
      console.error("Products error:", productsResult.error)
    }

    const collectionsData = collectionsResult.data || []
    const categoriesData = categoriesResult.data || []
    const productsData = productsResult.data || []

    // Create lookup maps
    const categoriesMap = new Map(categoriesData.map((cat) => [cat.id, cat]))
    const productsMap = new Map(productsData.map((prod) => [prod.id, prod]))

    console.log("[v0] Server: Created lookup maps - categories:", categoriesMap.size, "products:", productsMap.size)

    // Join collections with categories and products
    collections = collectionsData.map((collection) => {
      const joinedCollection = {
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
      }

      console.log("[v0] Server: Joined collection:", {
        id: joinedCollection.id,
        category_name: joinedCollection.categories?.name,
        product_name: joinedCollection.products?.name,
        has_image: !!(joinedCollection.products?.image_urls?.[0] || joinedCollection.products?.image_url),
        image_urls_length: joinedCollection.products?.image_urls?.length || 0,
        image_url_exists: !!joinedCollection.products?.image_url,
      })

      return joinedCollection
    })

    // Process featured collections
    if (!featuredResult.error) {
      const featuredData = featuredResult.data || []
      const joinedFeatured = featuredData.map(collection => {
        return {
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
        }
      })
      featuredCollections = joinedFeatured
    }

    console.log("[v0] Server: Final collections count:", collections.length)
  } catch (err) {
    console.error("Failed to fetch collections:", err)
  }

  return <CollectionsClient collections={collections} featuredCollections={featuredCollections} />
}
