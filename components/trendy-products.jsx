"use client"
import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function TrendyProducts({ products: propProducts = [] }) {
  // Refs for scrollable containers
  const centerTableScrollRef = useRef(null)
  const tvCabinetScrollRef = useRef(null)
  const diningChairScrollRef = useRef(null)

  // Supabase client (one per component)
  const supabaseRef = useRef(null)
  const didFetchRef = useRef(false) // add
  const [fetchedProducts, setFetchedProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Auto-slide on arrow hover (desktop only)
  const autoScrollTimers = useRef(new Map())
  const isDesktop = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 1024px)").matches

  const stopAutoScroll = (scrollRef) => {
    const id = autoScrollTimers.current.get(scrollRef)
    if (id) {
      clearInterval(id)
      autoScrollTimers.current.delete(scrollRef)
    }
  }

  const startAutoScroll = (scrollRef, dir) => {
    if (!isDesktop() || !scrollRef?.current) return
    stopAutoScroll(scrollRef)
    const id = setInterval(() => {
      scrollRef.current?.scrollBy({ left: dir * 40, behavior: "smooth" })
    }, 100)
    autoScrollTimers.current.set(scrollRef, id)
  }

  useEffect(() => {
    return () => {
      autoScrollTimers.current.forEach((id) => clearInterval(id))
      autoScrollTimers.current.clear()
    }
  }, [])

  // Preferred category order (CASE WHEN)
  const preferredCategoryOrder = {
    "Center Table": 1,
    "Dining Chair": 2,
    "TV Cabinet": 3
  }

  const targetCategories = ["Center Table", "Dining Chair", "TV Cabinet"]

  // Fetch exactly the SQL result set via PostgREST (inner join + filter)
  useEffect(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClientComponentClient()
    }
    if (didFetchRef.current) return // prevent double-run in StrictMode
    didFetchRef.current = true

    const fetchFeatured = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabaseRef.current
          .from("products")
          .select(`
            id,
            name,
            price,
            created_at,
            image_urls,
            categories:category_id!inner(
              name
            )
          `) // match SQL; no image_url, no discount_price
          .eq("is_featured", true)
          .in("categories.name", targetCategories)
          .order("created_at", { ascending: false })
          .range(0, 999)

        if (error) throw error

        const normalized = (data || []).map(p => ({
          ...p,
          // ensure array shape; fall back to empty => placeholder in UI
          image_urls: Array.isArray(p.image_urls)
            ? p.image_urls
            : (typeof p.image_urls === "string" && p.image_urls.trim().startsWith("["))
              ? (() => { try { return JSON.parse(p.image_urls) } catch { return [] } })()
              : [],
        }))

        // Debug: how many rows and per-category counts (matches your second SQL)
        console.log(`[TrendyProducts] fetched rows: ${normalized.length}`)
        const counts = normalized.reduce((acc, p) => {
          const n = p.categories?.name || "Unknown"
          acc[n] = (acc[n] || 0) + 1
          return acc
        }, {})
        console.table(Object.entries(counts)
          .filter(([n]) => targetCategories.includes(n))
          .sort(([a], [b]) => preferredCategoryOrder[a] - preferredCategoryOrder[b])
          .map(([name, count]) => ({ category_name: name, featured_product_count: count }))
        )

        setFetchedProducts(normalized)
      } catch (e) {
        console.error("[TrendyProducts] Fetch error:", e)
        setError(e.message || "Failed to load products")
      } finally {
        setLoading(false)
      }
    }

    // Always fetch from Supabase to mirror the SQL exactly
    fetchFeatured()
  }, [])

  const placeholderImage = "/placeholder.jpg"

  // Use fetched products (fallback to prop for safety)
  const products = fetchedProducts.length ? fetchedProducts : propProducts

  // Filter and sort products exactly like the SQL query
  const categorizedProducts = {}

  // First, filter featured products in the three specific categories (like SQL WHERE clause)
  const featuredProducts = products.filter(product => {
    const isFeatured = product.is_featured === true ||
      product.is_featured === "true" ||
      product.is_featured === 1 ||
      product.is_featured === "1" ||
      fetchedProducts.length > 0 // when fetched, they are already featured

    const categoryName = product.categories?.name
    const isTargetCategory = categoryName && targetCategories.includes(categoryName)

    return isFeatured && isTargetCategory
  })

  // Group by category (like SQL GROUP BY)
  featuredProducts.forEach(product => {
    const categoryName = product.categories?.name
    if (!categorizedProducts[categoryName]) {
      categorizedProducts[categoryName] = []
    }
    categorizedProducts[categoryName].push({
      ...product,
      renderKey: `${product.id}-${Math.random().toString(36).substring(2, 9)}`
    })
  })

  // Sort each category's products by creation date DESC (matching SQL ORDER BY p.created_at DESC)
  Object.keys(categorizedProducts).forEach(category => {
    categorizedProducts[category].sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    )
  })

  // Create ordered categories exactly like SQL ORDER BY CASE statement
  const orderedCategories = Object.keys(categorizedProducts)
    .filter(categoryName => targetCategories.includes(categoryName))
    .sort((a, b) => preferredCategoryOrder[a] - preferredCategoryOrder[b])
    .map(categoryName => ({
      name: categoryName,
      products: categorizedProducts[categoryName],
      count: categorizedProducts[categoryName].length
    }))

  // Enhanced debug logging to match SQL query results
  useEffect(() => {
    console.log("=== TrendyProducts SQL-like Analysis ===")
    console.log(`Total products received: ${products.length}`)

    const categoryStats = {}
    products.forEach(product => {
      const categoryName = product.categories?.name || "Unknown"
      const isFeatured = fetchedProducts.length > 0 // fetched set is already filtered
        ? true
        : (product.is_featured === true ||
          product.is_featured === "true" ||
          product.is_featured === 1 ||
          product.is_featured === "1")

      if (targetCategories.includes(categoryName) && isFeatured) {
        if (!categoryStats[categoryName]) categoryStats[categoryName] = 0
        categoryStats[categoryName]++
      }
    })

    console.log("Featured products by target category (SQL equivalent):")
    const sortedStats = Object.entries(categoryStats)
      .sort(([a], [b]) => preferredCategoryOrder[a] - preferredCategoryOrder[b])

    sortedStats.forEach(([category, count]) => {
      console.log(`  ${category}: ${count} featured products`)
    })

    console.log("Ordered categories for display:",
      orderedCategories.map(c => `${c.name}: ${c.count} products`))

    const totalFeaturedInTargetCategories = featuredProducts.length
    console.log(`Total featured products in target categories: ${totalFeaturedInTargetCategories}`)
  }, [products, orderedCategories, featuredProducts])

  // Function to render a product grid with category heading
  const renderProductGrid = (products, categoryTitle, scrollRef, categoryLink) => {
    if (!products || products.length === 0) return null

    const hasMultipleProducts = products.length > 4

    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <Link
            href={categoryLink}
            className="text-xl font-medium text-amber-600 hover:text-amber-700 transition-colors"
          >
            {categoryTitle}
          </Link>

          {/* Show navigation arrows when there are multiple products */}
          {hasMultipleProducts && (
            <div className="flex space-x-2">
              <button
                className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center hover:bg-amber-200 transition-colors"
                onClick={() => {
                  if (scrollRef.current) {
                    scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' })
                  }
                }}
                onMouseEnter={() => startAutoScroll(scrollRef, -1)}
                onMouseLeave={() => stopAutoScroll(scrollRef)}
              >
                <span className="sr-only">Previous</span>
                &#10094;
              </button>
              <button
                className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center hover:bg-amber-200 transition-colors"
                onClick={() => {
                  if (scrollRef.current) {
                    scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' })
                  }
                }}
                onMouseEnter={() => startAutoScroll(scrollRef, 1)}
                onMouseLeave={() => stopAutoScroll(scrollRef)}
              >
                <span className="sr-only">Next</span>
                &#10095;
              </button>
            </div>
          )}
        </div>

        {/* Single row with horizontal scrolling */}
        <div
          ref={scrollRef}
          className="flex gap-3 md:gap-6 overflow-x-auto scroll-smooth pb-4 scrollbar-hide"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {products.map((product) => (
            <ProductCard
              key={product.renderKey}
              product={product}
              className="min-w-[calc(50%-6px)] sm:min-w-[calc(33.333%-8px)] md:min-w-[calc(25%-12px)] flex-shrink-0"
            />
          ))}
        </div>
      </div>
    )
  }

  const ProductCard = ({ product, className = "" }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [isHovered, setIsHovered] = useState(false)

    const images =
      product.image_urls && product.image_urls.length > 0
        ? product.image_urls
        : [placeholderImage] // no image_url fallback, follow SQL

    useEffect(() => {
      let interval
      if (isHovered && images.length > 1) {
        interval = setInterval(() => {
          setCurrentImageIndex((prev) => (prev + 1) % images.length)
        }, 1500)
      }
      return () => {
        if (interval) clearInterval(interval)
      }
    }, [isHovered, images.length])

    return (
      <div
        className={`bg-white p-3 shadow-sm hover:shadow-md transition-shadow rounded-md ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false)
          setCurrentImageIndex(0)
        }}
      >
        <Link href={`/products/${product.id}`}>
          <div className="relative w-full aspect-square mb-2 overflow-hidden rounded-md bg-gray-100">
            <Image
              src={images[currentImageIndex] || placeholderImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 200px, 250px"
              className="object-cover hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.src = placeholderImage
              }}
            />
            {product.discount_price && (
              <span className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 text-xs rounded-md">SALE</span>
            )}
            {/* Featured badge */}
            <span className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 text-xs rounded-md">FEATURED</span>
            {images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${index === currentImageIndex ? "bg-white" : "bg-white/50"
                      }`}
                  />
                ))}
              </div>
            )}
          </div>
          <h3 className="font-medium text-sm truncate">{product.name}</h3>
          <div className="flex items-center mt-1 mb-1">
            <div className="flex text-amber-500 text-xs">★★★★★</div>
          </div>
          <div className="flex items-center">
            {product.discount_price ? (
              <>
                <span className="text-amber-600 font-bold text-sm">৳{product.discount_price}</span>
                <span className="ml-2 text-gray-400 line-through text-xs">৳{product.price}</span>
              </>
            ) : (
              <span className="text-gray-800 font-bold text-sm">৳{product.price}</span>
            )}
          </div>
        </Link>
      </div>
    )
  }

  return (
    <section className="py-8 md:py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-medium">COLLECTIONS</h2>
          <p className="text-gray-600 mt-2">Discover our handpicked featured products</p>
        </div>

        {/* Render categories in SQL-defined order */}
        {orderedCategories.map((category) => {
          // Assign scroll ref based on category name
          let scrollRef
          switch (category.name) {
            case "Center Table":
              scrollRef = centerTableScrollRef
              break
            case "TV Cabinet":
              scrollRef = tvCabinetScrollRef
              break
            case "Dining Chair":
              scrollRef = diningChairScrollRef
              break
            default:
              scrollRef = centerTableScrollRef
          }

          return (
            <div key={category.name}>
              {renderProductGrid(
                category.products,
                category.name,
                scrollRef,
                `/products?category=${encodeURIComponent(category.name)}`,
              )}
            </div>
          )
        })}

        {/* Show message if no featured products found in target categories */}
        {orderedCategories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No featured products available in Center Table, Dining Chair, or TV Cabinet categories.</p>
            <p className="text-gray-400 text-sm mt-2">Please check back later for updates.</p>
          </div>
        )}

        <div className="text-center mt-8">
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-md font-medium transition-colors duration-200"
          >
            See All Collections
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}
