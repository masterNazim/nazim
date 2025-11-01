"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Edit, Eye, EyeOff, X, Upload, Plus } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { supabase } from "@/lib/supabase"

const FIXED_IMAGE_SLOTS = [
    // Room Collections (4 slots)
    { id: "living-room", title: "Living Room", room_type: "Living Room", display_order: 1 },
    { id: "bedroom", title: "Bedroom", room_type: "Bedroom", display_order: 2 },
    { id: "dining-room", title: "Dining Room", room_type: "Dining Room", display_order: 3 },
    { id: "kids-room", title: "Kids Room", room_type: "Kids Room", display_order: 4 },
    // Interior Design Collections (4 slots)
    { id: "office-space", title: "Office Space", room_type: "Interior Design Collections", display_order: 5 },
    { id: "hotel-space", title: "Hotel Space", room_type: "Interior Design Collections", display_order: 6 },
    { id: "residential-space", title: "Residential Space", room_type: "Interior Design Collections", display_order: 7 },
    { id: "commercial-space", title: "Commercial Space", room_type: "Interior Design Collections", display_order: 8 },
]

// Updated Edit Modal Component with multiple image support
const EditImageModal = ({ isOpen, onClose, slot, existingImage, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        room_type: "",
        display_order: 0,
        is_active: true,
    })
    const [images, setImages] = useState([])
    const [existingImages, setExistingImages] = useState([])
    const [uploading, setUploading] = useState(false)

    // Initialize form data when modal opens
    useEffect(() => {
        if (isOpen && slot) {
            const newFormData = {
                title: existingImage?.title || slot.title,
                description: existingImage?.description || "",
                room_type: slot.room_type,
                display_order: slot.display_order,
                is_active: existingImage?.is_active !== undefined ? existingImage.is_active : true,
            }
            setFormData(newFormData)

            // Set existing images
            if (existingImage?.image_urls && Array.isArray(existingImage.image_urls)) {
                setExistingImages(existingImage.image_urls)
            } else if (existingImage?.image_url) {
                setExistingImages([existingImage.image_url])
            } else {
                setExistingImages([])
            }

            setImages([])
            console.log("[Homepage Images] Modal initialized with existing images:", existingImage?.image_urls)
        }
    }, [isOpen, slot, existingImage])

    const uploadImage = async (file) => {
        const fileExt = file.name.split(".").pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage.from("homepageimage").upload(filePath, file)
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage.from("homepageimage").getPublicUrl(filePath)
        return publicUrl
    }

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files)
        const maxImages = 8 - existingImages.length - images.length

        if (files.length > maxImages) {
            toast.error(`You can only add ${maxImages} more images (maximum 8 total)`)
            return
        }

        files.forEach((file) => {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image size should be less than 5MB")
                return
            }
            if (!file.type.startsWith("image/")) {
                toast.error("Please select valid image files")
                return
            }

            const reader = new FileReader()
            reader.onload = (e) => {
                setImages(prev => [...prev, { file, preview: e.target.result }])
            }
            reader.readAsDataURL(file)
        })

        e.target.value = ''
    }

    const removeNewImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index))
    }

    const removeExistingImage = (index) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setUploading(true)

        try {
            if (!formData.title.trim()) {
                toast.error("Title is required")
                return
            }

            const totalImages = existingImages.length + images.length
            if (totalImages === 0) {
                toast.error("Please add at least one image")
                return
            }

            // Upload new images
            const uploadedUrls = []
            for (const img of images) {
                try {
                    const url = await uploadImage(img.file)
                    uploadedUrls.push(url)
                } catch (error) {
                    console.error("Error uploading image:", error)
                    toast.error(`Failed to upload image: ${img.file.name}`)
                }
            }

            // Combine existing and new image URLs
            const allImageUrls = [...existingImages, ...uploadedUrls]

            const imageData = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                room_type: formData.room_type,
                display_order: formData.display_order,
                is_active: formData.is_active,
                image_urls: allImageUrls,
                image_url: allImageUrls[0] || null, // First image as primary
            }

            if (existingImage) {
                const { error } = await supabase.from("homepage_images").update(imageData).eq("id", existingImage.id)
                if (error) throw error
                toast.success("Images updated successfully")
            } else {
                const { error } = await supabase.from("homepage_images").insert([imageData])
                if (error) throw error
                toast.success("Images added successfully")
            }

            onSuccess()
            onClose()
        } catch (error) {
            console.error("Error saving images:", error)
            toast.error("Failed to save images")
        } finally {
            setUploading(false)
        }
    }

    const handleClose = () => {
        setFormData({
            title: "",
            description: "",
            room_type: "",
            display_order: 0,
            is_active: true,
        })
        setImages([])
        setExistingImages([])
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">
                        {existingImage ? `Edit ${slot?.title}` : `Add ${slot?.title}`}
                    </h2>
                    <Button variant="ghost" size="sm" onClick={handleClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <p className="text-gray-600 text-sm mb-6">
                    {existingImage
                        ? `Update details and images for ${slot?.room_type} slot ${slot?.display_order}`
                        : `Add images to ${slot?.room_type} slot ${slot?.display_order}`}
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="new-title">Title *</Label>
                                <Input
                                    id="new-title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    placeholder="Enter image title"
                                />
                            </div>

                            <div>
                                <Label htmlFor="new-description">Description</Label>
                                <Textarea
                                    id="new-description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    placeholder="Enter image description"
                                />
                            </div>

                            <div>
                                <Label>Section Type</Label>
                                <Input value={formData.room_type} disabled className="bg-gray-100" />
                            </div>

                            <div>
                                <Label>Display Order</Label>
                                <Input value={formData.display_order} disabled className="bg-gray-100" />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="new-is-active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                />
                                <Label htmlFor="new-is-active">Active</Label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="new-images">
                                    Add Images (up to 8 total) *
                                </Label>
                                <Input
                                    id="new-images"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    className="cursor-pointer"
                                    disabled={existingImages.length + images.length >= 8}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Supported formats: JPG, PNG. Max size: 5MB per image.
                                    Total: {existingImages.length + images.length}/8 images
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Existing Images */}
                    {existingImages.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
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
                                            onClick={() => removeExistingImage(index)}
                                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors duration-200"
                                            title="Remove this image"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                        {index === 0 && (
                                            <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                                                Primary
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* New Images */}
                    {images.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-medium text-green-700">New Images to Add</Label>
                                <span className="text-sm text-green-600">Will be added when you save</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {images.map((img, index) => (
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
                                                <Badge className="bg-amber-500 text-white text-xs">Primary</Badge>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No images state */}
                    {existingImages.length === 0 && images.length === 0 && (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">No images selected. Please add at least one image.</p>
                        </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={uploading}>
                            {uploading ? "Saving..." : existingImage ? "Update" : "Add"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function HomepageImagesPage() {
    const [images, setImages] = useState([])
    const [loading, setLoading] = useState(true)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState(null)
    const [selectedImage, setSelectedImage] = useState(null)

    useEffect(() => {
        fetchImages()
    }, [])

    const fetchImages = async () => {
        try {
            console.log("[Homepage Images] Fetching images from database...")
            const { data, error } = await supabase
                .from("homepage_images")
                .select("*")
                .order("display_order", { ascending: true })

            if (error) {
                console.log("[Homepage Images] Database error:", error)
                throw error
            }
            console.log("[Homepage Images] Fetched images:", data)
            setImages(data || [])
        } catch (error) {
            console.error("Error fetching images:", error)
            toast.error("Failed to fetch images")
        } finally {
            setLoading(false)
        }
    }

    const toggleActive = async (id, currentStatus) => {
        try {
            console.log("[Homepage Images] Toggling active status for image:", id, "current:", currentStatus)
            const { error } = await supabase.from("homepage_images").update({ is_active: !currentStatus }).eq("id", id)

            if (error) throw error
            toast.success(`Image ${!currentStatus ? "activated" : "deactivated"} successfully`)
            fetchImages()
        } catch (error) {
            console.error("Error updating image status:", error)
            toast.error("Failed to update image status")
        }
    }

    const handleOpenEditModal = (slot, existingImage = null) => {
        console.log("[Homepage Images] Opening edit modal for slot:", slot, "existing image:", existingImage)
        setSelectedSlot(slot)
        setSelectedImage(existingImage)
        setEditModalOpen(true)
    }

    const handleCloseEditModal = () => {
        setEditModalOpen(false)
        setSelectedSlot(null)
        setSelectedImage(null)
    }

    const getImageForSlot = (slot) => {
        return images.find((img) => img.room_type === slot.room_type && img.display_order === slot.display_order)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Homepage Images</h1>
                    <p className="text-gray-600 mt-1">Manage showcase images for the homepage - 8 fixed slots (up to 8 images each)</p>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">Room Collections (4 slots)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {FIXED_IMAGE_SLOTS.slice(0, 4).map((slot) => {
                        const existingImage = getImageForSlot(slot)
                        const imageUrls = existingImage?.image_urls || (existingImage?.image_url ? [existingImage.image_url] : [])

                        return (
                            <Card key={slot.id} className="overflow-hidden">
                                <div className="relative h-48">
                                    <Image
                                        src={imageUrls[0] || "/placeholder.svg"}
                                        alt={slot.title}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        <Badge variant={existingImage?.is_active ? "default" : "secondary"}>
                                            {existingImage?.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                        {imageUrls.length > 1 && (
                                            <Badge variant="outline" className="bg-white/80">
                                                +{imageUrls.length - 1} more
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-lg">{slot.title}</h3>
                                        <Badge variant="outline">{slot.room_type}</Badge>
                                    </div>
                                    {existingImage?.description && (
                                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{existingImage.description}</p>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col text-sm text-gray-500">
                                            <span>Slot {slot.display_order}</span>
                                            <span>{imageUrls.length} image{imageUrls.length !== 1 ? 's' : ''}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {existingImage && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => toggleActive(existingImage.id, existingImage.is_active)}
                                                >
                                                    {existingImage.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleOpenEditModal(slot, existingImage)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">Interior Design Collections (4 slots)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {FIXED_IMAGE_SLOTS.slice(4, 8).map((slot) => {
                        const existingImage = getImageForSlot(slot)
                        const imageUrls = existingImage?.image_urls || (existingImage?.image_url ? [existingImage.image_url] : [])

                        return (
                            <Card key={slot.id} className="overflow-hidden">
                                <div className="relative h-48">
                                    <Image
                                        src={imageUrls[0] || "/placeholder.svg"}
                                        alt={slot.title}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        <Badge variant={existingImage?.is_active ? "default" : "secondary"}>
                                            {existingImage?.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                        {imageUrls.length > 1 && (
                                            <Badge variant="outline" className="bg-white/80">
                                                +{imageUrls.length - 1} more
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-lg">{slot.title}</h3>
                                        <Badge variant="outline">Interior Design</Badge>
                                    </div>
                                    {existingImage?.description && (
                                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{existingImage.description}</p>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col text-sm text-gray-500">
                                            <span>Slot {slot.display_order}</span>
                                            <span>{imageUrls.length} image{imageUrls.length !== 1 ? 's' : ''}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {existingImage && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => toggleActive(existingImage.id, existingImage.is_active)}
                                                >
                                                    {existingImage.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleOpenEditModal(slot, existingImage)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>

            {/* Edit Modal */}
            <EditImageModal
                isOpen={editModalOpen}
                onClose={handleCloseEditModal}
                slot={selectedSlot}
                existingImage={selectedImage}
                onSuccess={fetchImages}
            />
        </div>
    )
}
