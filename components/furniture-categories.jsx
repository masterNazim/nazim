"use client"

import Link from "next/link"
import { useState, useEffect, useCallback, useMemo } from "react"

export default function FurnitureCategories() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories")
        const result = await response.json()

        if (result.success && result.data) {
          // Define featured category groups with their search terms
          const featuredCategoryGroups = [
            {
              name: "Table",
              icon: "/icon/table.png",
              description: "Beautiful tables for your home or office",
              searchTerm: "table",
            },
            {
              name: "TV Cabinet",
              icon: "/icon/tv.png",
              description: "Stylish storage for your entertainment system",
              searchTerm: "tv",
            },
            {
              name: "Sofa",
              icon: "/icon/sofa.png",
              description: "Comfortable seating options for your living area",
              searchTerm: "sofa",
            },
            {
              name: "Cabinet",
              icon: "/icon/cabinet.png",
              description: "Storage solutions for your home",
              searchTerm: "cabinet",
            },
            {
              name: "Chair",
              icon: "/icon/swivel-chair.png",
              description: "Stylish seating for every occasion",
              searchTerm: "chair",
            },
            {
              name: "Bed",
              icon: "/icon/hotel-bed.png",
              description: "Comfortable sleeping solutions for your bedroom",
              searchTerm: "bed",
            },
            {
              name: "Shoe Rack",
              icon: "/icon/shoe-rack.png",
              description: "Organized storage for your footwear",
              searchTerm: "shoe",
            },
            {
              name: "Bar Stool",
              icon: "/icon/bar-stool.png",
              description: "Elevated seating for your bar or counter",
              searchTerm: "stool",
            },
          ]

          setCategories(featuredCategoryGroups)
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
        // Fallback to empty array if fetch fails
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const totalSlides = Math.ceil(categories.length / 4)

  const nextSlide = useCallback(() => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % totalSlides)
  }, [totalSlides])

  useEffect(() => {
    if (categories.length > 0) {
      // Increased interval from 4000ms to 8000ms for slower transitions
      const interval = setInterval(nextSlide, 8000)
      return () => clearInterval(interval)
    }
  }, [nextSlide, categories.length])

  const visibleCategories = useMemo(() => {
    if (categories.length === 0) return []

    const startIndex = currentSlide * 4
    const endIndex = startIndex + 4
    const currentCategories = categories.slice(startIndex, endIndex)

    // If we don't have 4 categories to show, wrap around to the beginning
    while (currentCategories.length < 4 && categories.length > 0) {
      currentCategories.push(categories[currentCategories.length % categories.length])
    }

    return currentCategories
  }, [categories, currentSlide])

  if (loading) {
    return (
      <section className="py-8 md:py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-medium text-center mb-8">FEATURED CATEGORIES</h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg p-3 md:p-6 w-full shadow-sm animate-pulse">
                  <div className="h-12 md:h-16 bg-gray-200 rounded mb-2 md:mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-1 md:mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <section className="py-8 md:py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-medium text-center mb-8">FEATURED CATEGORIES</h2>

        <div className="relative overflow-hidden">
          <div className="max-w-4xl mx-auto">
            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 transition-all duration-3000 ease-in-out transform"
              style={{
                opacity: 1,
                transform: "translateX(0)",
              }}
            >
              {visibleCategories.map((category, index) => (
                <Link
                  href={`/products?search=${category.searchTerm}`}
                  key={`${category.name}-${currentSlide}-${index}`}
                  className="flex flex-col items-center group transform transition-all duration-1500 ease-in-out hover:scale-105 animate-in fade-in slide-in-from-bottom-4"
                  style={{
                    animationDelay: `${index * 300}ms`,
                    animationDuration: "1200ms",
                    animationFillMode: "both",
                  }}
                >
                  <div className="bg-white rounded-lg p-3 md:p-6 w-full shadow-sm hover:shadow-lg transition-all duration-1500 ease-in-out">
                    <div className="flex justify-center mb-2 md:mb-4">
                      <img
                        src={category.icon || "/placeholder.svg"}
                        alt={category.name}
                        className="h-12 md:h-16 w-auto object-contain transition-all duration-1500 ease-in-out group-hover:scale-110"
                      />
                    </div>
                    <h3 className="text-xs md:text-lg font-medium text-center text-gray-800 mb-1 md:mb-2 transition-all duration-1500 ease-in-out group-hover:text-gray-900">
                      {category.name}
                    </h3>
                    <p className="text-gray-600 text-center text-[10px] md:text-xs line-clamp-2 transition-all duration-1500 ease-in-out group-hover:text-gray-700">
                      {category.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {totalSlides > 1 && (
          <div className="flex justify-center mt-6">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
                className={`mx-1 rounded-full transition-all duration-1500 ease-in-out ${i === currentSlide ? "bg-blue-600 w-6 h-2" : "bg-gray-300 w-2 h-2 hover:bg-gray-400"
                  }`}
                onClick={() => setCurrentSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
