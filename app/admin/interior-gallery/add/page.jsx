"use client"

import { Badge } from "@/components/ui/badge"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { ArrowLeft, X } from "lucide-react"
import Link from "next/link"

const CATEGORIES = [
  { value: "office_space", label: "Office Space" },
  { value: "hotel_space", label: "Hotel Space" },
  { value: "residential", label: "Residential" },
  { value: "commercial_space", label: "Commercial Space" },
]

export default function AddInteriorProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    featured: false,
    project_details: {
      area: "",
      duration: "",
      client: "",
      year: new Date().getFullYear().toString(),
    },
  })
  const [imageFiles, setImageFiles] = useState([])
  const [imageUrls, setImageUrls] = useState([])

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
    const files = Array.from(e.target.files)
    setImageFiles((prev) => [...prev, ...files])

    // Create preview URLs
    files.forEach((file) => {
      const url = URL.createObjectURL(file)
      setImageUrls((prev) => [...prev, url])
    })
  }

  const removeImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImageUrls((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const uploadImages = async () => {
    const uploadedUrls = []

    for (const file of imageFiles) {
      const formData = new FormData()
      formData.append("file", file)

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        const result = await response.json()
        if (result.success) {
          uploadedUrls.push(result.url)
        } else {
          throw new Error(result.error)
        }
      } catch (error) {
        console.error("Error uploading image:", error)
        toast.error(`Failed to upload image: ${file.name}`)
        return null
      }
    }

    return uploadedUrls
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title || !formData.category) {
      toast.error("Please fill in all required fields")
      return
    }

    if (imageFiles.length === 0) {
      toast.error("Please add at least one image")
      return
    }

    setLoading(true)

    try {
      // Upload images first
      const uploadedImageUrls = await uploadImages()
      if (!uploadedImageUrls) {
        setLoading(false)
        return
      }

      // Create project
      const response = await fetch("/api/admin/interior-gallery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          image_urls: uploadedImageUrls,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Project created successfully")
        router.push("/admin/interior-gallery")
      } else {
        toast.error(result.error || "Failed to create project")
      }
    } catch (error) {
      console.error("Error creating project:", error)
      toast.error("Failed to create project")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/admin/interior-gallery">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Add Interior Project</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
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

          {/* Project Details */}
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

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Project Images *</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="images">Upload Images</Label>
                <Input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="cursor-pointer"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Select multiple images. First image will be used as the main image.
                </p>
              </div>

              {imageUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      {index === 0 && (
                        <div className="absolute bottom-2 left-2">
                          <Badge className="bg-amber-500 text-white text-xs">Main</Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Link href="/admin/interior-gallery">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </form>
    </div>
  )
}
