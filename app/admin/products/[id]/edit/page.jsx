"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { ArrowLeft, X, Upload } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function EditProductPage({ params }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [newImages, setNewImages] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [deletedImages, setDeletedImages] = useState([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    stock: "",
    is_featured: false,
  })

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true)
        const response = await fetch("/api/categories")
        const result = await response.json()

        if (result.success) {
          setCategories(result.data || [])
        } else {
          console.error("Failed to fetch categories:", result.error)
          toast.error("Failed to load categories")
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
        toast.error("Failed to load categories")
      } finally {
        setCategoriesLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/admin/products/${params.id}`)
        const result = await response.json()

        if (result.success) {
          const product = result.data
          setFormData({
            name: product.name || "",
            description: product.description || "",
            price: product.price || "",
            category_id: product.category_id || "",
            stock: product.stock || "",
            is_featured: product.is_featured || false,
          })
          setExistingImages(product.image_urls || [])
        } else {
          toast.error("Product not found")
          router.push("/admin/products")
        }
      } catch (error) {
        console.error("Error fetching product:", error)
        toast.error("Failed to load product")
        router.push("/admin/products")
      } finally {
        setInitialLoading(false)
      }
    }

    if (params.id) {
      fetchProduct()
    }
  }, [params.id, router])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleImageUpload = (e) => {
    // Calculate how many images we can add
    const currentActiveImages = existingImages.length - deletedImages.length
    const maxNew = 4 - currentActiveImages - newImages.length
    
    if (maxNew <= 0) {
      toast.error("Maximum 4 images allowed. Please remove some images first.")
      return
    }
    
    const files = Array.from(e.target.files).slice(0, maxNew)
    
    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB")
        return
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file")
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setNewImages((prev) => [...prev, { file, preview: e.target.result }])
      }
      reader.readAsDataURL(file)
    })
    
    // Clear the input value to allow re-uploading the same file
    e.target.value = ''
  }

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (index, url) => {
    // Add to deleted images array
    setDeletedImages((prev) => [...prev, url])
    // Remove from existing images array
    setExistingImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields - Modified to allow 0.00 price
      if (!formData.name || !formData.description || formData.price === "" || !formData.category_id) {
        toast.error("Please fill in all required fields")
        return
      }

      // Convert price to number and validate it's not negative
      const price = parseFloat(formData.price)
      if (isNaN(price) || price < 0) {
        toast.error("Please enter a valid price (can be 0.00 or higher)")
        return
      }

      // Calculate total images after deletions
      const remainingExistingImages = existingImages.length
      const totalImages = remainingExistingImages + newImages.length
      
      if (totalImages === 0) {
        toast.error("Please add at least one product image")
        return
      }

      if (totalImages > 4) {
        toast.error("Maximum 4 images allowed")
        return
      }

      // Create FormData for file upload
      const submitData = new FormData()

      // Add form fields
      submitData.append("name", formData.name)
      submitData.append("description", formData.description)
      submitData.append("price", price.toString()) // Ensure it's a string representation of the number
      submitData.append("category_id", formData.category_id)
      submitData.append("stock", formData.stock || "0")
      submitData.append("is_featured", formData.is_featured)

      // Add deleted images to be removed from storage
      deletedImages.forEach((url) => {
        submitData.append("delete_image", url)
      })

      // Add new images
      newImages.forEach((img, index) => {
        submitData.append(`image_${index}`, img.file)
      })

      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: "PUT",
        body: submitData,
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Product updated successfully!")
        router.push("/admin/products")
      } else {
        toast.error(result.error || "Failed to update product")
      }
    } catch (error) {
      console.error("Error updating product:", error)
      toast.error("Failed to update product")
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/admin/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Edit Product</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category_id">Category *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading categories...
                      </SelectItem>
                    ) : categories.length > 0 ? (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-categories" disabled>
                        No categories found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter product description"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (BDT) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label htmlFor="image">Add New Images</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="mt-1"
                  multiple
                  disabled={existingImages.length + newImages.length >= 4}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Supported formats: JPG, PNG, WebP. Max size: 5MB per image.
                  Total: {existingImages.length + newImages.length}/4 images
                  {deletedImages.length > 0 && ` (${deletedImages.length} to be removed)`}
                </p>
              </div>

              {existingImages.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-medium">Current Images</Label>
                    <span className="text-sm text-gray-500">Click × to remove</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {existingImages.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="relative w-full h-32 border-2 border-gray-200 rounded-lg overflow-hidden">
                          <Image
                            src={url || "/placeholder.svg"}
                            alt={`Current image ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index, url)}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors duration-200"
                          title="Remove this image"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                          Current
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {newImages.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-medium text-green-700">New Images to Add</Label>
                    <span className="text-sm text-green-600">Will be added when you save</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {newImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <div className="relative w-full h-32 border-2 border-green-300 rounded-lg overflow-hidden">
                          <Image
                            src={img.preview || "/placeholder.svg"}
                            alt={`New image ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors duration-200"
                          title="Remove this new image"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1 rounded">New</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {existingImages.length + newImages.length === 0 && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No images selected. Please add at least one product image.</p>
                </div>
              )}

              {deletedImages.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">
                    {deletedImages.length} image(s) will be removed when you save
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_featured"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleInputChange}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_featured">Featured Product</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Link href="/admin/products">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading || categoriesLoading}>
            {loading ? "Updating Product..." : "Update Product"}
          </Button>
        </div>
      </form>
    </div>
  )
}
