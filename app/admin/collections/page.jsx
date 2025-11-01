"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Plus, Edit, Trash2, Package, Eye, EyeOff, Save, X, AlertCircle, TrendingUp } from "lucide-react"

export const dynamic = "force-dynamic"

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState([])
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingCollection, setEditingCollection] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    category_id: "",
    product_id: "",
    display_order: 1,
    is_active: true,
    is_featured: false, // Add this line
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      console.log("[v0] Fetching collections data...")

      const [collectionsRes, categoriesRes, productsRes] = await Promise.all([
        fetch("/api/admin/collections").catch((err) => {
          console.error("Collections API error:", err)
          return { ok: false, json: () => Promise.resolve({ success: false, error: "Collections API unavailable" }) }
        }),
        fetch("/api/admin/categories").catch((err) => {
          console.error("Categories API error:", err)
          return { ok: false, json: () => Promise.resolve({ success: false, error: "Categories API unavailable" }) }
        }),
        fetch("/api/admin/products").catch((err) => {
          console.error("Products API error:", err)
          return { ok: false, json: () => Promise.resolve({ success: false, error: "Products API unavailable" }) }
        }),
      ])

      const [collectionsResult, categoriesResult, productsResult] = await Promise.all([
        collectionsRes.json().catch(() => ({ success: false, error: "Invalid JSON response" })),
        categoriesRes.json().catch(() => ({ success: false, error: "Invalid JSON response" })),
        productsRes.json().catch(() => ({ success: false, error: "Invalid JSON response" })),
      ])

      console.log("[v0] API Results:", {
        collections: collectionsResult.success ? "✓" : collectionsResult.error,
        categories: categoriesResult.success ? "✓" : categoriesResult.error,
        products: productsResult.success ? "✓" : productsResult.error,
      })

      let joinedCollections = []
      if (collectionsResult.success) {
        const collectionsData = collectionsResult.data || []
        const categoriesData = categoriesResult.success ? categoriesResult.data || [] : []
        const productsData = productsResult.success ? productsResult.data || [] : []

        // Create lookup maps for faster joining
        const categoriesMap = new Map(categoriesData.map((cat) => [cat.id, cat]))
        const productsMap = new Map(productsData.map((prod) => [prod.id, prod]))

        // Join the data
        joinedCollections = collectionsData.map((collection) => ({
          ...collection,
          categories: categoriesMap.get(collection.category_id) || {
            id: collection.category_id,
            name: "Unknown Category",
          },
          products: productsMap.get(collection.product_id) || {
            id: collection.product_id,
            name: "Unknown Product",
            price: 0,
          },
        }))

        setCollections(joinedCollections)
      } else {
        console.error("Collections fetch failed:", collectionsResult.error)
        toast.error("Failed to fetch collections: " + collectionsResult.error)
      }

      if (categoriesResult.success) {
        setCategories(categoriesResult.data || [])
      } else {
        console.error("Categories fetch failed:", categoriesResult.error)
        toast.error("Failed to fetch categories: " + categoriesResult.error)
      }

      if (productsResult.success) {
        setProducts(productsResult.data || [])
      } else {
        console.error("Products fetch failed:", productsResult.error)
        toast.error("Failed to fetch products: " + productsResult.error)
      }

      // Show success message only if at least categories and products loaded
      if (categoriesResult.success && productsResult.success) {
        console.log("[v0] Data loaded successfully:", {
          collections: joinedCollections.length,
          categories: categoriesResult.data?.length || 0,
          products: productsResult.data?.length || 0,
        })
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to fetch data: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.category_id || !formData.product_id) {
      toast.error("Category and Product are required")
      return
    }

    try {
      const url = editingCollection ? `/api/admin/collections/${editingCollection.id}` : "/api/admin/collections"
      const method = editingCollection ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      toast.success(editingCollection ? "Collection updated successfully" : "Collection created successfully")
      setEditingCollection(null)
      setShowAddForm(false)
      setFormData({
        category_id: "",
        product_id: "",
        display_order: 1,
        is_active: true,
        is_featured: false, // Add this line
      })
      fetchData()
    } catch (error) {
      console.error("Error saving collection:", error)
      toast.error("Failed to save collection")
    }
  }

  const handleEdit = (collection) => {
    setEditingCollection(collection)
    setFormData({
      category_id: collection.category_id,
      product_id: collection.product_id,
      display_order: collection.display_order,
      is_active: collection.is_active,
      is_featured: collection.is_featured || false, // Add this line
    })
    setShowAddForm(true)
  }

  const handleDelete = async (collectionId) => {
    if (!confirm("Are you sure you want to remove this collection?")) return

    try {
      const response = await fetch(`/api/admin/collections/${collectionId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      toast.success("Collection removed successfully")
      fetchData()
    } catch (error) {
      console.error("Error deleting collection:", error)
      toast.error("Failed to remove collection")
    }
  }

  const toggleActive = async (collection) => {
    try {
      const response = await fetch(`/api/admin/collections/${collection.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...collection,
          is_active: !collection.is_active,
        }),
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      toast.success(`Collection ${collection.is_active ? "deactivated" : "activated"} successfully`)
      fetchData()
    } catch (error) {
      console.error("Error toggling collection status:", error)
      toast.error("Failed to update collection status")
    }
  }

  const toggleFeatured = async (collection) => {
    try {
      const response = await fetch(`/api/admin/collections/${collection.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...collection,
          is_featured: !collection.is_featured,
        }),
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      toast.success(`Collection ${collection.is_featured ? "removed from" : "added to"} featured successfully`)
      fetchData()
    } catch (error) {
      console.error("Error toggling featured status:", error)
      toast.error("Failed to update featured status")
    }
  }

  const getProductsByCategory = (categoryId) => {
    return products.filter((product) => product.category_id === categoryId)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading collections data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Collection Management</h1>
          <p className="text-gray-600">Manage which products appear in each category collection</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-amber-600 hover:bg-amber-700"
          disabled={categories.length === 0 || products.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Collection
        </Button>
      </div>

      {(categories.length === 0 || products.length === 0) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-yellow-800 font-medium">Setup Required</p>
                <p className="text-yellow-700 text-sm">
                  {categories.length === 0 && products.length === 0
                    ? "You need to add categories and products before creating collections."
                    : categories.length === 0
                      ? "You need to add categories before creating collections."
                      : "You need to add products before creating collections."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Collections</p>
                <p className="text-2xl font-bold">{collections.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Collections</p>
                <p className="text-2xl font-bold text-green-600">{collections.filter((c) => c.is_active).length}</p>
              </div>
              <Eye className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available Categories</p>
                <p className="text-2xl font-bold text-amber-600">{categories.length}</p>
              </div>
              <Package className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Featured Collections</p>
                <p className="text-2xl font-bold text-purple-600">
                  {collections.filter((c) => c.is_featured).length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingCollection ? "Edit Collection" : "Add New Collection"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category *</label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => {
                      setFormData({ ...formData, category_id: value, product_id: "" })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={categories.length === 0 ? "No categories available" : "Select category"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Product *</label>
                  <Select
                    value={formData.product_id}
                    onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                    disabled={!formData.category_id}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !formData.category_id
                            ? "Select category first"
                            : getProductsByCategory(formData.category_id).length === 0
                              ? "No products in this category"
                              : "Select product"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {getProductsByCategory(formData.category_id).map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - ৳{product.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Display Order</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: Number.parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    min="1"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium">
                    Active (visible on collections page)
                  </label>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is_featured" className="text-sm font-medium">
                  Featured (appears in featured collections section)
                </label>
              </div>

              <div className="flex space-x-2">
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                  <Save className="h-4 w-4 mr-2" />
                  {editingCollection ? "Update Collection" : "Create Collection"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingCollection(null)
                    setFormData({
                      category_id: "",
                      product_id: "",
                      display_order: 1,
                      is_active: true,
                      is_featured: false, // Add this line
                    })
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Collections List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection) => (
          <Card key={collection.id} className={`${!collection.is_active ? "opacity-60" : ""}`}>
            <CardContent className="p-4">
              <div className="aspect-square bg-gray-100 rounded-lg mb-4 relative overflow-hidden">
                {collection.products?.image_urls?.[0] || collection.products?.image_url ? (
                  <img
                    src={collection.products.image_urls?.[0] || collection.products.image_url}
                    alt={collection.products.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={collection.is_active ? "default" : "secondary"}>
                    Order {collection.display_order}
                  </Badge>
                </div>
                {collection.is_featured && (
                  <Badge className="absolute top-2 left-2 bg-purple-500">
                    Featured
                  </Badge>
                )}
              </div>

              <h3 className="font-semibold text-lg mb-1">{collection.categories?.name}</h3>
              <p className="text-gray-600 text-sm mb-2">{collection.products?.name}</p>
              <p className="text-amber-600 font-bold mb-3">৳{collection.products?.price}</p>

              <div className="flex items-center justify-between">
                <Badge variant={collection.is_active ? "default" : "secondary"}>
                  {collection.is_active ? "Active" : "Inactive"}
                </Badge>

                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(collection)}
                    title={collection.is_active ? "Deactivate" : "Activate"}
                  >
                    {collection.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(collection)} title="Edit">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(collection.id)}
                    className="text-red-600 hover:text-red-700"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleFeatured(collection)}
                    title={collection.is_featured ? "Remove from featured" : "Add to featured"}
                    className={collection.is_featured ? "text-purple-600" : ""}
                  >
                    <TrendingUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {collections.length === 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No collections found</h3>
                <p className="text-gray-500 mb-4">Start building your collections by adding products to categories</p>
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-amber-600 hover:bg-amber-700"
                  disabled={categories.length === 0 || products.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Collection
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
