"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ArrowLeft, X, Upload } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const CATEGORIES = [
    { value: "office_space", label: "Office Space" },
    { value: "hotel_space", label: "Hotel Space" },
    { value: "residential", label: "Residential" },
    { value: "commercial_space", label: "Commercial Space" },
]

export default function EditInteriorProjectPage() {
    const params = useParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [project, setProject] = useState(null)
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "",
        featured: false,
        project_details: {
            area: "",
            duration: "",
            client: "",
            year: "",
        },
    })

    const [existingImages, setExistingImages] = useState([])
    const [newImages, setNewImages] = useState([])
    const [deletedImages, setDeletedImages] = useState([])

    useEffect(() => {
        const fetchProject = async () => {
            try {
                setLoading(true)
                const response = await fetch(`/api/admin/interior-gallery/${params.id}`)
                const result = await response.json()

                if (result.success) {
                    setProject(result.data)
                    setFormData({
                        title: result.data.title || "",
                        description: result.data.description || "",
                        category: result.data.category || "",
                        featured: result.data.featured || false,
                        project_details: result.data.project_details || {
                            area: "",
                            duration: "",
                            client: "",
                            year: "",
                        },
                    })
                    setExistingImages(result.data.image_urls || [])
                } else {
                    toast.error("Failed to load project")
                    router.push("/admin/interior-gallery")
                }
            } catch (error) {
                console.error("Error fetching project:", error)
                toast.error("Failed to load project")
                router.push("/admin/interior-gallery")
            } finally {
                setLoading(false)
            }
        }

        if (params.id) {
            fetchProject()
        }
    }, [params.id, router])

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleProjectDetailsChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            project_details: {
                ...prev.project_details,
                [field]: value,
            },
        }))
    }

    const handleImageUpload = (e) => {
        const currentActiveImages = existingImages.length - deletedImages.length
        const maxNew = 8 - currentActiveImages - newImages.length

        if (maxNew <= 0) {
            toast.error("Maximum 8 images allowed. Please remove some images first.")
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

        e.target.value = ''
    }

    const removeNewImage = (index) => {
        setNewImages((prev) => prev.filter((_, i) => i !== index))
    }

    const removeExistingImage = (index, url) => {
        setDeletedImages((prev) => [...prev, url])
        setExistingImages((prev) => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.title || !formData.category) {
            toast.error("Please fill in all required fields")
            return
        }

        const remainingExistingImages = existingImages.length
        const totalImages = remainingExistingImages + newImages.length

        if (totalImages === 0) {
            toast.error("Please add at least one project image")
            return
        }

        setSubmitting(true)

        try {
            const submitData = new FormData()

            submitData.append("title", formData.title)
            submitData.append("description", formData.description)
            submitData.append("category", formData.category)
            submitData.append("featured", formData.featured)

            submitData.append("project_details", JSON.stringify(formData.project_details))

            deletedImages.forEach((url) => {
                submitData.append("delete_image", url)
            })

            existingImages.forEach((url) => {
                submitData.append("existing_image", url)
            })

            newImages.forEach((img, index) => {
                submitData.append(`image_${index}`, img.file)
            })

            const response = await fetch(`/api/admin/interior-gallery/${params.id}`, {
                method: "PUT",
                body: submitData,
            })

            const result = await response.json()

            if (result.success) {
                toast.success("Project updated successfully")
                router.push("/admin/interior-gallery")
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
            <div className="flex items-center space-x-4">
                <Link href="/admin/interior-gallery">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">Edit Interior Project</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="title">Project Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => handleInputChange("title", e.target.value)}
                                    placeholder="Enter project title"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="category">Category *</Label>
                                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map((category) => (
                                            <SelectItem key={category.value} value={category.value}>
                                                {category.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => handleInputChange("description", e.target.value)}
                                    placeholder="Describe the project..."
                                    rows={4}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Use line breaks to format your description. They will be preserved when displayed.
                                </p>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="featured"
                                    checked={formData.featured}
                                    onCheckedChange={(checked) => handleInputChange("featured", checked)}
                                />
                                <Label htmlFor="featured">Featured Project</Label>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Project Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="area">Area</Label>
                                <Input
                                    id="area"
                                    value={formData.project_details.area}
                                    onChange={(e) => handleProjectDetailsChange("area", e.target.value)}
                                    placeholder="e.g., 2500 sq ft"
                                />
                            </div>

                            <div>
                                <Label htmlFor="duration">Duration</Label>
                                <Input
                                    id="duration"
                                    value={formData.project_details.duration}
                                    onChange={(e) => handleProjectDetailsChange("duration", e.target.value)}
                                    placeholder="e.g., 3 months"
                                />
                            </div>

                            <div>
                                <Label htmlFor="client">Client</Label>
                                <Input
                                    id="client"
                                    value={formData.project_details.client}
                                    onChange={(e) => handleProjectDetailsChange("client", e.target.value)}
                                    placeholder="e.g., Tech Startup"
                                />
                            </div>

                            <div>
                                <Label htmlFor="year">Year</Label>
                                <Input
                                    id="year"
                                    value={formData.project_details.year}
                                    onChange={(e) => handleProjectDetailsChange("year", e.target.value)}
                                    placeholder="e.g., 2024"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Project Images *</CardTitle>
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
                                    className="mt-1 cursor-pointer"
                                    multiple
                                    disabled={existingImages.length + newImages.length >= 8}
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Supported formats: JPG, PNG, WebP. Max size: 5MB per image.
                                    Total: {existingImages.length + newImages.length}/8 images
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
                                                    Current
                                                </div>
                                                {index === 0 && (
                                                    <div className="absolute top-1 left-1">
                                                        <Badge className="bg-amber-500 text-white text-xs">Main</Badge>
                                                    </div>
                                                )}
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
                                                        <Badge className="bg-amber-500 text-white text-xs">Main</Badge>
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
                    </CardContent>
                </Card>

                <div className="flex justify-end space-x-4">
                    <Link href="/admin/interior-gallery">
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </Link>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? "Updating..." : "Update Project"}
                    </Button>
                </div>
            </form>
        </div>
    )
}