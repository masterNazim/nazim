"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Package, TrendingUp, AlertCircle } from "lucide-react"

export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [stats, setStats] = useState({
    total: 0,
    featured: 0,
    outOfStock: 0,
    lowStock: 0,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 15

  useEffect(() => {
    // Initial data fetch on component mount
    fetchData()

    // No need for a timeout that might cause issues
    // Just a single initial fetch
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      // Fetch products and stats in parallel, similar to main product page
      await Promise.all([fetchProducts(), fetchStats()])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load products data")
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      // Use AbortController for timeout management like in the main products page
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
      
      const response = await fetch("/api/admin/products?limit=1000&order=created_at.desc", {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      const result = await response.json()

      if (result.success) {
        // Sort products by created_at date
        setProducts(result.data)
        console.log(`Loaded ${result.data.length} products`)
      } else {
        console.error("Failed to fetch products:", result.error)
        toast.error("Failed to fetch products")
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error("Request timed out when fetching products")
        toast.error("Request timed out. Please try refreshing the page.")
      } else {
        console.error("Error fetching products:", error)
        toast.error("Failed to fetch products")
      }
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/products/stats")
      const result = await response.json()

      if (result.success) {
        setStats(result.data)
      } else {
        console.error("Error fetching stats:", result.error)
        setStats({
          total: 0,
          featured: 0,
          outOfStock: 0,
          lowStock: 0,
        })
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
      setStats({
        total: 0,
        featured: 0,
        outOfStock: 0,
        lowStock: 0,
      })
    }
  }

  const handleDelete = async (productId) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Product deleted successfully")
        await Promise.all([fetchProducts(), fetchStats()])
      } else {
        toast.error(result.error || "Failed to delete product")
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error("Failed to delete product")
    }
  }

  const toggleFeatured = async (productId, currentStatus) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/featured`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_featured: !currentStatus }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Product ${!currentStatus ? "featured" : "unfeatured"} successfully`)
        await Promise.all([fetchProducts(), fetchStats()])
      } else {
        toast.error("Failed to update product")
      }
    } catch (error) {
      console.error("Error updating product:", error)
      toast.error("Failed to update product")
    }
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.categories?.name && product.categories.name.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const sortedFilteredProducts = filteredProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const totalPages = Math.ceil(sortedFilteredProducts.length / productsPerPage)
  const currentProducts = sortedFilteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage,
  )

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/admin/products/add">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Featured</p>
                <p className="text-2xl font-bold">{stats.featured}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold">{stats.outOfStock}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold">{stats.lowStock}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={fetchData}>
          Refresh
        </Button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {currentProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="aspect-square relative">
              <img
                src={product.image_urls?.[0] || product.image_url || "/placeholder.svg?height=200&width=200"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.is_featured && <Badge className="absolute top-2 left-2 bg-amber-500">Featured</Badge>}
              {product.stock <= 0 && (
                <Badge variant="destructive" className="absolute top-2 right-2">
                  Out of Stock
                </Badge>
              )}
            </div>

            <CardContent className="p-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                <p className="text-xs text-gray-600">{product.categories?.name}</p>
                <p className="font-bold text-amber-600">{formatPrice(product.price)}</p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Stock: {product.stock || 0}</span>
                  <span>ID: {product.id}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <Link href={`/products/${product.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/products/${product.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleFeatured(product.id, product.is_featured)}>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      {product.is_featured ? "Unfeature" : "Feature"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(product.id)} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {sortedFilteredProducts.length > 0 && totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
      {sortedFilteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No products found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery ? "Try adjusting your search terms" : "Get started by adding your first product"}
          </p>
          {!searchQuery && (
            <Link href="/admin/products/add">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
