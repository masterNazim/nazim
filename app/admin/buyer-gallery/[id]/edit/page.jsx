"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { ArrowLeft, Upload, X } from "lucide-react"
import Link from "next/link"

export default function EditBuyerGalleryPage() {
    const params = useParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [categories, setCategories] = useState([])
    const [existingImages, setExistingImages] = useState([])
    const [newImages, setNewImages] = useState([])
    const [deletedImages, setDeletedImages] = useState([])
    const [formData, setFormData] = useState({
        product_name: "",
        client_name: "",
        delivery_location: "",
        category_id: "",
        is_featured: false,
    })

    useEffect(() => {
        Promise.all([fetchCategories(), fetchProject()])
    }, [params.id])

    const fetchCategories = async () => {
        try {
            const response = await fetch("/api/categories")
            const result = await response.json()

            if (result.success) {
                setCategories(result.data)
            } else {
                console.error("Failed to fetch categories:", result.error)
            }
        } catch (error) {
            console.error("Error fetching categories:", error)
        }
    }

    const fetchProject = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/admin/buyer-gallery/${params.id}`)
            const result = await response.json()

            if (result.success) {
                setFormData({
                    product_name: result.data.product_name || "",
                    client_name: result.data.client_name || "",
                    delivery_location: result.data.delivery_location || "",
                    category_id: result.data.category_id || "",
                    is_featured: result.data.is_featured || false,
                })

                // Set existing images
                const imageUrls = result.data.image_urls || []
                if (result.data.image_url && !imageUrls.includes(result.data.image_url)) {
                    imageUrls.push(result.data.image_url)
                }
                setExistingImages(imageUrls)
            } else {
                toast.error("Failed to load project")
                router.push("/admin/buyer-gallery")
            }
        } catch (error) {
            console.error("Error fetching project:", error)
            toast.error("Failed to load project")
            router.push("/admin/buyer-gallery")
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleImageUpload = (e) => {
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

        if (!formData.product_name.trim()) {
            toast.error("Product name is required")
            return
        }

        if (!formData.client_name.trim()) {
            toast.error("Client name is required")
            return
        }

        if (!formData.delivery_location.trim()) {
            toast.error("Delivery location is required")
            return
        }

        // Calculate total images after deletions
        const remainingExistingImages = existingImages.length
        const totalImages = remainingExistingImages + newImages.length

        if (totalImages === 0) {
            toast.error("At least one project image is required")
            return
        }

        setSubmitting(true)

        try {
            const submitData = new FormData()
            submitData.append("product_name", formData.product_name.trim())
            submitData.append("client_name", formData.client_name.trim())
            submitData.append("delivery_location", formData.delivery_location.trim())
            submitData.append("category_id", formData.category_id || "")
            submitData.append("is_featured", formData.is_featured)

            // Add deleted images to be removed from storage
            deletedImages.forEach((url) => {
                submitData.append("delete_image", url)
            })

            // Include remaining existing images
            existingImages.forEach((url) => {
                submitData.append("existing_image", url)
            })

            // Add new images
            newImages.forEach((img, index) => {
                submitData.append(`image_${index}`, img.file)
            })

            const response = await fetch(`/api/admin/buyer-gallery/${params.id}`, {
                method: "PUT",
                body: submitData,
            })

            const result = await response.json()

            if (result.success) {
                toast.success("Project updated successfully!")
                router.push("/admin/buyer-gallery")
            } else {
                toast.error(result.error || "Failed to update project")
            }
        } catch (error) {
            console.error("Error updating project:", error)
            toast.error("Failed to update project")
        } finally {
            setSubmitting(false)
        }
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
            <div className="flex items-center space-x-4">
                <Link href="/admin/buyer-gallery">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">Edit Project</h1>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Project Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Product Name */}
                        <div className="space-y-2">
                            <Label htmlFor="product_name">Product Name *</Label>
                            <Input
                                id="product_name"
                                value={formData.product_name}
                                onChange={(e) => handleInputChange("product_name", e.target.value)}
                                placeholder="Enter product name"
                                required
                            />
                        </div>

                        {/* Client Name */}
                        <div className="space-y-2">
                            <Label htmlFor="client_name">Client Name *</Label>
                            <Input
                                id="client_name"
                                value={formData.client_name}
                                onChange={(e) => handleInputChange("client_name", e.target.value)}
                                placeholder="Enter client name"
                                required
                            />
                        </div>

                        {/* Delivery Location */}
                        <div className="space-y-2">
                            <Label htmlFor="delivery_location">Delivery Location *</Label>
                            <Input
                                id="delivery_location"
                                value={formData.delivery_location}
                                onChange={(e) => handleInputChange("delivery_location", e.target.value)}
                                placeholder="Enter delivery location"
                                required
                            />
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select value={formData.category_id} onValueChange={(value) => handleInputChange("category_id", value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
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

                        {/* Image Upload */}
                        <div className="space-y-6">
                            <div>
                                <Label htmlFor="image">Add New Images</Label>
                                <Input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="mt-1 cursor-pointer"
                                    multiple
                                    disabled={existingImages.length + newImages.length >= 4}
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Supported formats: JPG, PNG. Max size: 5MB per image.
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
                                                    <img
                                                        src={url || "/placeholder.svg"}
                                                        alt={`Current image ${index + 1}`}
                                                        className="w-full h-full object-cover"
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
                                                    {index === 0 ? "Main" : "Current"}
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
                                                    <img
                                                        src={img.preview || "/placeholder.svg"}
                                                        alt={`New image ${index + 1}`}
                                                        className="w-full h-full object-cover"
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
                                                {existingImages.length === 0 && index === 0 && (
                                                    <div className="absolute top-1 left-1">
                                                        <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded">Main</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {existingImages.length + newImages.length === 0 && (
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500">No images selected. Please add at least one project image.</p>
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

                        {/* Featured */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_featured"
                                checked={formData.is_featured}
                                onCheckedChange={(checked) => handleInputChange("is_featured", checked)}
                            />
                            <Label htmlFor="is_featured">Feature this project</Label>
                        </div>

                        {/* Submit Button */}
                        <div className="flex space-x-4">
                            <Button type="submit" disabled={submitting}>
                                {submitting ? "Updating..." : "Update Project"}
                            </Button>
                            <Link href="/admin/buyer-gallery">
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    )
}