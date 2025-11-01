import { supabase } from "@/lib/supabase"
import ProductsClient from "./ProductsClient"

// Server-side data fetching - always fresh data
async function getProducts() {
  try {
    console.log("Server: Fetching fresh products and categories")

    // Fetch products and categories in parallel with no cache
    const [productsResult, categoriesResult] = await Promise.all([
      supabase
        .from("products")
        .select(`
          *,
          categories (
            id,
            name
          )
        `)
        .order("created_at", { ascending: false })
        .abortSignal(AbortSignal.timeout(10000)), // 10 second timeout

      supabase
        .from("categories")
        .select("id, name")
        .order("name")
        .abortSignal(AbortSignal.timeout(10000)), // 10 second timeout
    ])

    let products = []
    let categories = []

    if (productsResult.data) {
      // Normalize products like trendy section
      products = productsResult.data.map((product) => ({
        id: product.id,
        name: product.name || "Unnamed Product",
        description: product.description || "No description available",
        price: product.price || 0,
        stock: product.stock || 0,
        image_urls: product.image_urls || [],
        primary_image: (product.image_urls && product.image_urls[0]) || "/placeholder-furniture.jpg",
        is_featured: product.is_featured || false,
        category_id: product.category_id,
        created_at: product.created_at,
        categories: product.categories || { name: "Furniture" },
      }))
    }

    if (categoriesResult.data) {
      categories = categoriesResult.data
    }

    console.log(
      `Server: Fetched ${products.length} products and ${categories.length} categories at ${new Date().toISOString()}`,
    )

    return { products, categories }
  } catch (error) {
    console.error("Server: Error fetching data:", error)
    return { products: [], categories: [] }
  }
}

export default async function ProductsPage({ searchParams }) {
  // Await searchParams before using it
  const params = await searchParams
  const { products, categories } = await getProducts()

  const initialCategory = params?.category || "all"
  const initialSearch = params?.search || ""
  return (
    <ProductsClient
      initialProducts={products}
      categories={categories}
      initialCategory={initialCategory}
      initialSearch={initialSearch}
    />
  )
}

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic"
export const revalidate = 0

// Add headers to prevent all forms of caching
export async function generateMetadata() {
  return {
    title: "Products - Eight Hands Work",
    description: "Browse our latest furniture collection",
    other: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  }
}
