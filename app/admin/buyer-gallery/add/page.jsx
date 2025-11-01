"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { ArrowLeft, Upload, X } from "lucide-react"
import Link from "next/link"

export default function AddBuyerGalleryPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState([])
    const [images, setImages] = useState([])
    const [formData, setFormData] = useState({
        product_name: "",
        client_name: "",
        delivery_location: "",
        category_id: "",
        is_featured: false,
    })

    useEffect(() => {
        fetchCategories()
    }, [])

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

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files).slice(0, 4 - images.length);
        files.forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image size should be less than 5MB");
                return;
            }
            if (!file.type.startsWith('image/')) {
                toast.error("Please select a valid image file");
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                setImages(prev => [...prev, { file, preview: e.target.result }]);
            };
            reader.readAsDataURL(file);
        });

        // Clear input value to allow re-uploading the same file
        e.target.value = '';
    }

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
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

        if (images.length === 0) {
            toast.error("At least one project image is required")
            return
        }

        setLoading(true)

        try {
            const submitData = new FormData()
            submitData.append("product_name", formData.product_name.trim())
            submitData.append("client_name", formData.client_name.trim())
            submitData.append("delivery_location", formData.delivery_location.trim())
            submitData.append("category_id", formData.category_id || "")
            submitData.append("is_featured", formData.is_featured)

            // Add all images
            images.forEach((img, index) => {
                submitData.append(`image_${index}`, img.file);
            })

            const response = await fetch("/api/admin/buyer-gallery", {
                method: "POST",
                body: submitData,
            })

            const result = await response.json()

            if (result.success) {
                toast.success("Project added successfully!")
                router.push("/admin/buyer-gallery")
            } else {
                toast.error(result.error || "Failed to add project")
            }
        } catch (error) {
            console.error("Error adding project:", error)
            toast.error("Failed to add project")
        } finally {
            setLoading(false)
        }
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
                <h1 className="text-2xl font-bold">Add New Project</h1>
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

                        {/* Image Upload - Now with multiple images */}
                        <div className="space-y-4">
                            <Label>Project Images (up to 4) *</Label>
                            <Input
                                id="image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="cursor-pointer"
                                multiple
                                disabled={images.length >= 4}
                            />
                            <p className="text-sm text-gray-500">
                                Supported formats: JPG, PNG. Max size: 5MB per image.
                            </p>

                            {/* Image Preview */}
                            {images.length > 0 && (
                                <div>
                                    <Label className="mt-4">Image Previews</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                                        {images.map((img, index) => (
                                            <div key={index} className="relative group">
                                                <div className="relative w-full h-32 border-2 border-green-300 rounded-lg overflow-hidden">
                                                    <img
                                                        src={img.preview}
                                                        alt={`Project image ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors duration-200"
                                                    title="Remove this image"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                                {index === 0 && (
                                                    <div className="absolute top-1 left-1">
                                                        <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded">Main</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* No image state */}
                            {!images.length && (
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500">No images uploaded. Please add at least one project image.</p>
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
                            <Button type="submit" disabled={loading}>
                                {loading ? "Adding..." : "Add Project"}
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
