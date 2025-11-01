"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"

export default function CollectionsClient({ collections: initialCollections, featuredCollections: initialFeaturedCollections }) {
  const [collections, setCollections] = useState(initialCollections || [])
  // We can keep this state even though we won't display it
  const [featuredCollections, setFeaturedCollections] = useState(initialFeaturedCollections || [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const placeholderImage =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmM2Y0ZjYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlNWU3ZWIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0idXJsKCNnKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Db2xsZWN0aW9uPC90ZXh0Pjwvc3ZnPg=="

  function CollectionImage({ src, alt }) {
    const [imgSrc, setImgSrc] = useState(src || placeholderImage)
    const [hasError, setHasError] = useState(false)

    const handleError = () => {
      if (!hasError) {
        setHasError(true)
        setImgSrc(placeholderImage)
      }
    }

    return (
      <Image
        src={imgSrc || placeholderImage}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 300px"
        className="object-cover transition-all duration-500 ease-in-out hover:scale-105"
        onError={handleError}
      />
    )
  }

  useEffect(() => {
    fetchCollections()

    // Set up real-time subscription for immediate updates
    const collectionsChannel = supabase
      .channel('collections-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'collections'
        },
        (payload) => {
          console.log('[Collections] Real-time update received:', payload.eventType)
          // Refetch collections immediately when any change occurs
          setTimeout(() => {
            fetchCollections()
          }, 100) // Small delay to ensure database commit
        }
      )
      .subscribe((status) => {
        console.log('[Collections] Subscription status:', status)
      })

    // Also listen to products and categories changes since collections depend on them
    const productsChannel = supabase
      .channel('products-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        () => {
          console.log('[Collections] Products updated, refreshing collections...')
          setTimeout(() => {
            fetchCollections()
          }, 100)
        }
      )
      .subscribe()

    const categoriesChannel = supabase
      .channel('categories-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories'
        },
        () => {
          console.log('[Collections] Categories updated, refreshing collections...')
          setTimeout(() => {
            fetchCollections()
          }, 100)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(collectionsChannel)
      supabase.removeChannel(productsChannel)
      supabase.removeChannel(categoriesChannel)
    }
  }, [])

  const fetchCollections = async () => {
    try {
      // Only show loading spinner on initial load
      if (collections.length === 0) {
        setLoading(true)
      }

      console.log("[Collections] Fetching collections...")

      const response = await fetch("/api/collections", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        },
        cache: "no-store", // Always get fresh data
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch collections")
      }

      console.log("[Collections] Successfully fetched:", result.data?.length || 0, "collections")
      setCollections(result.data || [])
      setError(null)
    } catch (error) {
      console.error("[Collections] Fetch error:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading && collections.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <div className="p-2 md:p-4">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-red-600">Error Loading Collections</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchCollections}
            className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  console.log("[v0] Collections data received:", collections)

  const getImageSrc = (collection) => {
    console.log("[v0] Collection item:", collection)

    // If products is a single object (expected structure from server)
    if (collection.products && !Array.isArray(collection.products)) {
      console.log("[v0] Found products object:", {
        has_image_urls: !!collection.products.image_urls,
        image_urls_length: collection.products.image_urls?.length || 0,
        has_image_url: !!collection.products.image_url,
        image_url_value: collection.products.image_url,
      })

      if (
        collection.products.image_urls &&
        Array.isArray(collection.products.image_urls) &&
        collection.products.image_urls.length > 0 &&
        collection.products.image_urls[0]
      ) {
        console.log("[v0] Using image_urls[0]:", collection.products.image_urls[0])
        return collection.products.image_urls[0]
      }
      if (collection.products.image_url && collection.products.image_url.trim()) {
        console.log("[v0] Using image_url:", collection.products.image_url)
        return collection.products.image_url
      }
    }

    // If products is an array (fallback structure)
    if (collection.products && Array.isArray(collection.products) && collection.products.length > 0) {
      const product = collection.products[0]
      if (product.image_urls && Array.isArray(product.image_urls) && product.image_urls.length > 0) {
        console.log("[v0] Using array products image_urls[0]:", product.image_urls[0])
        return product.image_urls[0]
      }
      if (product.image_url && product.image_url.trim()) {
        console.log("[v0] Using array products image_url:", product.image_url)
        return product.image_url
      }
    }

    console.log("[v0] No valid image found, using placeholder")
    return null // null to use placeholder
  }

  const getCategoryName = (collection) => {
    if (collection.categories) {
      return Array.isArray(collection.categories)
        ? collection.categories[0]?.name
        : collection.categories.name
    }
    return "Unknown Category"
  }

  const getProductInfo = (collection) => {
    if (collection.products) {
      if (Array.isArray(collection.products) && collection.products.length > 0) {
        return collection.products[0]
      }
      if (!Array.isArray(collection.products)) {
        return collection.products
      }
    }
    return { name: "Unknown Product", price: 0, discount_price: null }
  }

  return (
    <div className="py-8 md:py-12">
      {/* Featured Collections Section removed */}

      {/* Regular Collections - existing code */}
      <div className="min-h-screen bg-gray-50 pt-20 pb-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-medium mb-4">All Collections</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our curated collections featuring the finest furniture pieces from each category
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {collections.map((collection, index) => {
              const getImageSrc = () => {
                console.log("[v0] Collection item:", collection)

                // If products is a single object (expected structure from server)
                if (collection.products && !Array.isArray(collection.products)) {
                  console.log("[v0] Found products object:", {
                    has_image_urls: !!collection.products.image_urls,
                    image_urls_length: collection.products.image_urls?.length || 0,
                    has_image_url: !!collection.products.image_url,
                    image_url_value: collection.products.image_url,
                  })

                  if (
                    collection.products.image_urls &&
                    Array.isArray(collection.products.image_urls) &&
                    collection.products.image_urls.length > 0 &&
                    collection.products.image_urls[0]
                  ) {
                    console.log("[v0] Using image_urls[0]:", collection.products.image_urls[0])
                    return collection.products.image_urls[0]
                  }
                  if (collection.products.image_url && collection.products.image_url.trim()) {
                    console.log("[v0] Using image_url:", collection.products.image_url)
                    return collection.products.image_url
                  }
                }

                // If products is an array (fallback structure)
                if (collection.products && Array.isArray(collection.products) && collection.products.length > 0) {
                  const product = collection.products[0]
                  if (product.image_urls && Array.isArray(product.image_urls) && product.image_urls.length > 0) {
                    console.log("[v0] Using array products image_urls[0]:", product.image_urls[0])
                    return product.image_urls[0]
                  }
                  if (product.image_url && product.image_url.trim()) {
                    console.log("[v0] Using array products image_url:", product.image_url)
                    return product.image_url
                  }
                }

                console.log("[v0] No valid image found, using placeholder")
                return null // null to use placeholder
              }

              const getCategoryName = () => {
                if (collection.categories) {
                  return Array.isArray(collection.categories)
                    ? collection.categories[0]?.name
                    : collection.categories.name
                }
                return "Unknown Category"
              }

              const getProductInfo = () => {
                if (collection.products) {
                  if (Array.isArray(collection.products) && collection.products.length > 0) {
                    return collection.products[0]
                  }
                  if (!Array.isArray(collection.products)) {
                    return collection.products
                  }
                }
                return { name: "Unknown Product", price: 0, discount_price: null }
              }

              const productInfo = getProductInfo()
              const imageSrc = getImageSrc()

              return (
                <div
                  key={collection.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1"
                >
                  <Link href={`/products?category=${collection.category_id}`}>
                    <div className="relative aspect-square overflow-hidden rounded-t-lg">
                      <CollectionImage
                        src={imageSrc}
                        alt={productInfo.name || getCategoryName() || "Collection item"}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-20 hover:bg-opacity-10 transition-all duration-300" />
                      <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 text-white">
                        <h3 className="text-sm md:text-lg font-semibold">{getCategoryName()}</h3>
                        <p className="text-xs md:text-sm opacity-90">
                          Starting from ৳{productInfo.discount_price || productInfo.price || 0}
                        </p>
                      </div>
                    </div>
                    <div className="p-2 md:p-4">
                      <h4 className="font-medium text-gray-800 mb-1 md:mb-2 line-clamp-2 text-sm md:text-base">
                        {productInfo.name || "Unknown Product"}
                      </h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {productInfo.discount_price ? (
                            <>
                              <span className="text-amber-600 font-bold text-sm md:text-base">
                                ৳{productInfo.discount_price}
                              </span>
                              <span className="ml-1 md:ml-2 text-gray-400 line-through text-xs md:text-sm">
                                ৳{productInfo.price}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-800 font-bold text-sm md:text-base">
                              ৳{productInfo.price || 0}
                            </span>
                          )}
                        </div>
                        <span className="text-amber-600 text-xs md:text-sm font-medium hover:text-amber-700 transition-colors duration-200">
                          View →
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>

          {collections.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No collections available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
