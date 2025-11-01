"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function FeaturedCollections() {
  const [featuredCollections, setFeaturedCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const supabase = createClientComponentClient()

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
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover transition-all duration-500 ease-in-out hover:scale-105"
        onError={handleError}
      />
    )
  }

  // Create a reusable fetchFeaturedCollections function with useCallback
  const fetchFeaturedCollections = useCallback(async () => {
    try {
      setLoading(true)
      console.log("[FeaturedCollections] Fetching collections directly from Supabase...")

      // First, get featured collections
      const { data: collections, error: collectionsError } = await supabase
        .from('collections')
        .select('*, categories(*)')
        .eq('is_featured', true)
        .order('updated_at', { ascending: false })

      if (collectionsError) {
        console.error("[FeaturedCollections] Collection error:", collectionsError)
        setError(collectionsError.message)
        setLoading(false)
        return
      }

      console.log("[FeaturedCollections] Found collections:", collections?.length || 0)

      if (!collections || collections.length === 0) {
        setFeaturedCollections([])
        setLoading(false)
        return
      }

      // Now fetch products for these collections
      // FIXED: Removed is_active from the query since it doesn't exist
      const enrichedCollections = await Promise.all(
        collections.map(async (collection) => {
          try {
            const { data: products, error: productsError } = await supabase
              .from('products')
              .select('*')
              .eq('category_id', collection.category_id)
              .order('created_at', { ascending: false })
              .limit(5)

            if (productsError) {
              console.error(`[FeaturedCollections] Error fetching products for collection ${collection.id}:`, productsError)
              return { ...collection, products: [] }
            }

            return { ...collection, products: products || [] }
          } catch (err) {
            console.error(`[FeaturedCollections] Exception fetching products for collection ${collection.id}:`, err)
            return { ...collection, products: [] }
          }
        })
      )

      // Only update state with collections that have products
      const collectionsWithProducts = enrichedCollections.filter(
        collection => collection.products && collection.products.length > 0
      )

      console.log("[FeaturedCollections] Collections with products:", collectionsWithProducts.length)

      setFeaturedCollections(collectionsWithProducts)
      setError(null)
    } catch (error) {
      console.error("[FeaturedCollections] Fetch error:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Initial fetch and set up real-time subscription
  useEffect(() => {
    console.log("[FeaturedCollections] Component mounted, fetching data...")
    fetchFeaturedCollections()

    // Set up real-time subscriptions to relevant tables
    const collectionsChannel = supabase
      .channel('collections-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'collections' },
        (payload) => {
          console.log('[FeaturedCollections] Collections changed:', payload)
          fetchFeaturedCollections()
        }
      )
      .subscribe()

    const productsChannel = supabase
      .channel('products-for-collections')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('[FeaturedCollections] Products changed:', payload)
          fetchFeaturedCollections()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(collectionsChannel)
      supabase.removeChannel(productsChannel)
    }
  }, [fetchFeaturedCollections, supabase])

  // Add visibility change listener for data refresh when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("[FeaturedCollections] Tab became visible, refreshing data...")
        fetchFeaturedCollections()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchFeaturedCollections])

  const getImageSrc = (collection) => {
    if (collection.products && !Array.isArray(collection.products)) {
      if (
        collection.products.image_urls &&
        Array.isArray(collection.products.image_urls) &&
        collection.products.image_urls.length > 0
      ) {
        return collection.products.image_urls[0]
      }
      if (collection.products.image_url && collection.products.image_url.trim()) {
        return collection.products.image_url
      }
    }

    if (collection.products && Array.isArray(collection.products) && collection.products.length > 0) {
      const product = collection.products[0]
      if (product.image_urls && Array.isArray(product.image_urls) && product.image_urls.length > 0) {
        return product.image_urls[0]
      }
      if (product.image_url && product.image_url.trim()) {
        return product.image_url
      }
    }

    return placeholderImage
  }

  const getCategoryName = (collection) => {
    if (collection.categories) {
      return Array.isArray(collection.categories)
        ? collection.categories[0]?.name
        : collection.categories.name
    }
    return "Featured Collection"
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
    return { name: "Featured Product", price: 0, discount_price: null }
  }

  // Always show loading state when loading
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-medium mb-4">Featured Collections</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Loading our handpicked selection of exceptional furniture pieces...
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="aspect-square w-full relative bg-gray-100"></div>
              <div className="p-4">
                <div className="h-4 w-full mb-2 bg-gray-200"></div>
                <div className="h-4 w-24 bg-gray-200"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // If we have no featured collections, don't show the section
  if (featuredCollections.length === 0) {
    return null
  }

  // Always show if we have any collections, even if there was also an error
  return (
    <div className="container mx-auto px-4 py-12 bg-gray-50">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-medium mb-4">Featured Collections</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Explore our handpicked selection of exceptional furniture pieces
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        {featuredCollections.slice(0, 12).map((collection) => {
          const imageSrc = getImageSrc(collection)
          const productInfo = getProductInfo(collection)
          const categoryName = getCategoryName(collection)

          return (
            <div
              key={collection.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1"
            >
              <Link href={`/products?category=${collection.category_id}`}>
                <div className="relative aspect-square overflow-hidden rounded-t-lg">
                  <CollectionImage
                    src={imageSrc}
                    alt={productInfo.name || categoryName || "Featured collection"}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20 hover:bg-opacity-10 transition-all duration-300" />
                  <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 text-white">
                    <h3 className="text-sm md:text-lg font-semibold">{categoryName}</h3>
                    <p className="text-xs md:text-sm opacity-90">
                      Starting from ৳{productInfo.discount_price || productInfo.price || 0}
                    </p>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                      Featured
                    </span>
                  </div>
                </div>
                <div className="p-2 md:p-4">
                  <h4 className="font-medium text-gray-800 mb-1 md:mb-2 line-clamp-2 text-sm md:text-base">
                    {productInfo.name || "Featured Product"}
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
    </div>
  )
}