"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Filter, Grid, List, Search, X } from "lucide-react"

export default function ProductsClient({ initialProducts, categories, initialCategory, initialSearch }) {
  // Convert URL category parameter to appropriate format
  const normalizeInitialCategory = (categoryParam) => {
    if (!categoryParam || categoryParam === "all") {
      return "all"
    }

    // Check if it's a main category
    const mainCategories = ["Living Room", "Dining", "Bedroom", "Office", "Storage", "Restaurant", "Industrial", "Interior", "Kitchen & Bath"]
    if (mainCategories.includes(categoryParam)) {
      return categoryParam
    }

    // Check if it matches a specific category by name
    const matchingCategory = categories.find(cat => cat.name === categoryParam)
    if (matchingCategory) {
      return matchingCategory.id
    }

    // Check if it's already a category ID
    const categoryById = categories.find(cat => cat.id === categoryParam)
    if (categoryById) {
      return categoryParam
    }

    return "all"
  }

  const [selectedCategory, setSelectedCategory] = useState(normalizeInitialCategory(initialCategory))
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [viewMode, setViewMode] = useState("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 12
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const params = new URLSearchParams()

    if (selectedCategory && selectedCategory !== "all") {
      // If it's a main category, use the name directly
      const mainCategories = ["Living Room", "Dining", "Bedroom", "Office", "Storage", "Restaurant", "Industrial", "Interior", "Kitchen & Bath"]
      if (mainCategories.includes(selectedCategory)) {
        params.set("category", selectedCategory)
      } else {
        // If it's a subcategory ID, find the category name
        const category = categories.find(cat => cat.id === selectedCategory)
        if (category) {
          params.set("category", category.name)
        }
      }
    }

    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim())
    }

    const newUrl = params.toString() ? `/products?${params.toString()}` : "/products"
    router.replace(newUrl, { scroll: false })
  }, [selectedCategory, searchQuery, router, categories])

  const getCategoryGroup = (categoryName) => {
    if (!categoryName) return "Other"

    const name = categoryName.toLowerCase()

    if (
      name.includes("living") ||
      name.includes("sofa") ||
      name.includes("center table") ||
      name.includes("tv cabinet") ||
      name.includes("display cabinet") ||
      name.includes("shelf") ||
      name.includes("carpet") ||
      name.includes("lamp") ||
      name.includes("light") ||
      name.includes("chandelier") ||
      name.includes("arm chair") ||
      name.includes("end table")
    ) {
      return "Living Room"
    } else if (name.includes("dining") || name.includes("dinner wagon")) {
      return "Dining"
    } else if (name.includes("bed") || name.includes("dressing table")) {
      return "Bedroom"
    } else if (
      name.includes("office") ||
      name.includes("desk") ||
      name.includes("conference") ||
      name.includes("work station") ||
      name.includes("visitor chair") ||
      name.includes("break room") ||
      name.includes("study table")
    ) {
      return "Office"
    } else if (
      name.includes("cabinet") ||
      name.includes("book shelf") ||
      name.includes("shoe rack") ||
      name.includes("store cabinet")
    ) {
      return "Storage"
    } else if (
      name.includes("restaurant") ||
      name.includes("reception") ||
      name.includes("bar stool") ||
      name.includes("cash counter")
    ) {
      return "Restaurant"
    } else if (
      name.includes("industrial") ||
      name.includes("pu flooring") ||
      name.includes("lab clear coat")
    ) {
      return "Industrial"
    } else if (
      name.includes("interior") ||
      name.includes("consultation") ||
      name.includes("project execution") ||
      name.includes("epoxy services") ||
      name.includes("portable partition")
    ) {
      return "Interior"
    } else if (
      name.includes("kitchen") ||
      name.includes("counter top") ||
      name.includes("wash basin")
    ) {
      return "Kitchen & Bath"
    }

    return "Other"
  }

  const filteredProducts = useMemo(() => {
    let filtered = initialProducts

    // Filter by category
    if (selectedCategory !== "all") {
      // First check if it's a main category group
      const mainCategories = ["Living Room", "Dining", "Bedroom", "Office", "Storage", "Restaurant", "Industrial", "Interior", "Kitchen & Bath"]

      if (mainCategories.includes(selectedCategory)) {
        // Filter by main category group
        filtered = filtered.filter((product) => {
          const productCategoryName = product.categories?.name || ""
          const productGroup = getCategoryGroup(productCategoryName)
          return productGroup === selectedCategory
        })
      } else {
        // Filter by specific subcategory
        filtered = filtered.filter((product) => product.category_id === selectedCategory)
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.categories?.name.toLowerCase().includes(query),
      )
    }

    filtered.sort((a, b) => {
      const categoryA = a.categories?.name || "Uncategorized"
      const categoryB = b.categories?.name || "Uncategorized"

      // First sort by category name
      if (categoryA !== categoryB) {
        return categoryA.localeCompare(categoryB)
      }

      // Then sort by creation date within same category (newest first)
      return new Date(b.created_at) - new Date(a.created_at)
    })

    return filtered
  }, [initialProducts, selectedCategory, searchQuery])

  // Paginate products
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
  const startIndex = (currentPage - 1) * productsPerPage
  const currentProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage)

  // Reset to page 1 when category or search changes
  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }

  const handleSearchChange = (value) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const clearSearch = () => {
    setSearchQuery("")
    setCurrentPage(1)
  }

  // Helper function to get display name for selected category
  const getCategoryDisplayName = (categoryValue) => {
    const mainCategories = ["Living Room", "Dining", "Bedroom", "Office", "Storage", "Restaurant", "Industrial", "Interior", "Kitchen & Bath"]

    if (mainCategories.includes(categoryValue)) {
      return categoryValue
    }

    const category = categories.find(cat => cat.id === categoryValue)
    return category ? category.name : categoryValue
  }

  const ProductCard = ({ product }) => (
    <Link href={`/products/${product.id}`} className="group">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={product.primary_image || product.image_url || "/placeholder-furniture.jpg"}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
          {product.is_featured && <Badge className="absolute top-2 left-2 bg-amber-600">Featured</Badge>}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Badge variant="destructive">Out of Stock</Badge>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="mb-2">
            <Badge variant="outline" className="text-xs">
              {product.categories?.name || "Furniture"}
            </Badge>
          </div>
          <h3 className="font-semibold text-lg mb-2 group-hover:text-amber-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-amber-600">৳{product.price.toFixed(2)}</span>
            <span
              className={`text-sm ${product.stock > 10 ? "text-green-600" : product.stock > 0 ? "text-yellow-600" : "text-red-600"
                }`}
            >
              {product.stock > 0 ? `${product.stock} left` : "Out of stock"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Our Products</h1>
          <p className="text-gray-600">Discover our complete collection of premium furniture pieces</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-gray-500" />
              <div className="relative flex-1 max-w-md">
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pr-8"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter and View Mode */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-gray-500" />
                  <span className="font-medium text-gray-700">Filter by:</span>
                </div>

                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>

                    {/* Main Category Groups */}
                    <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase">Main Categories</div>
                    <SelectItem value="Living Room">Living Room</SelectItem>
                    <SelectItem value="Dining">Dining</SelectItem>
                    <SelectItem value="Bedroom">Bedroom</SelectItem>
                    <SelectItem value="Office">Office</SelectItem>
                    <SelectItem value="Storage">Storage</SelectItem>
                    <SelectItem value="Restaurant">Restaurant</SelectItem>
                    <SelectItem value="Industrial">Industrial</SelectItem>
                    <SelectItem value="Interior">Interior</SelectItem>
                    <SelectItem value="Kitchen & Bath">Kitchen & Bath</SelectItem>

                    {/* Specific Categories */}
                    <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase border-t mt-1 pt-2">Specific Categories</div>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
            {searchQuery && <span> for "{searchQuery}"</span>}
            {selectedCategory !== "all" && (
              <span>
                {" in "}
                {getCategoryDisplayName(selectedCategory)}
              </span>
            )}
          </p>
          {(searchQuery || selectedCategory !== "all") && (
            <div className="flex flex-wrap gap-2 mt-2">
              {searchQuery && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: "{searchQuery}"
                  <button onClick={clearSearch} className="ml-1 hover:text-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Category: {getCategoryDisplayName(selectedCategory)}
                  <button onClick={() => handleCategoryChange("all")} className="ml-1 hover:text-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Products Grid */}
        {currentProducts.length > 0 ? (
          <div
            className={`grid gap-6 mb-8 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
              }`}
          >
            {currentProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="space-y-4">
              <p className="text-gray-600 text-lg">
                {searchQuery ? `No products found for "${searchQuery}"` : "No products found."}
              </p>
              <p className="text-gray-500 text-sm">
                {searchQuery || selectedCategory !== "all"
                  ? "Try adjusting your search or filters."
                  : "Check back later for new products."}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
                {searchQuery && (
                  <Button onClick={clearSearch} variant="outline">
                    Clear Search
                  </Button>
                )}
                {selectedCategory !== "all" && (
                  <Button onClick={() => handleCategoryChange("all")} variant="outline">
                    Show All Categories
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {currentPage} of {totalPages} ({filteredProducts.length} total products)
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>

              {/* Page numbers */}
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, Math.max(1, currentPage - 2))) + i

                  if (pageNum > totalPages) return null

                  return (
                    <Button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              <Button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
