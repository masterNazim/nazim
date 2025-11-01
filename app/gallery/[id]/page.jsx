"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, MapPin, User, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

const CATEGORIES = [
  { value: "office_space", label: "Office Space" },
  { value: "hotel_space", label: "Hotel Space" },
  { value: "residential", label: "Residential" },
  { value: "commercial_space", label: "Commercial Space" },
]

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [relatedProjects, setRelatedProjects] = useState([])

  useEffect(() => {
    if (params.id) {
      fetchProject()
    }
  }, [params.id])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/interior-gallery/${params.id}`)
      const result = await response.json()

      if (result.success) {
        setProject(result.data)
        // Fetch related projects
        fetchRelatedProjects(result.data.category)
      } else {
        console.error("Failed to fetch project:", result.error)
        router.push("/gallery")
      }
    } catch (error) {
      console.error("Error fetching project:", error)
      router.push("/gallery")
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedProjects = async (category) => {
    try {
      const response = await fetch(`/api/interior-gallery?category=${category}&limit=4`)
      const result = await response.json()

      if (result.success) {
        // Filter out current project and limit to 3
        const filtered = result.data.filter((p) => p.id !== params.id).slice(0, 3)
        setRelatedProjects(filtered)
      }
    } catch (error) {
      console.error("Error fetching related projects:", error)
    }
  }

  const getCategoryLabel = (category) => {
    const cat = CATEGORIES.find((c) => c.value === category)
    return cat ? cat.label : category
  }

  const nextImage = () => {
    if (project?.image_urls) {
      setCurrentImageIndex((prev) => (prev + 1) % project.image_urls.length)
    }
  }

  const prevImage = () => {
    if (project?.image_urls) {
      setCurrentImageIndex((prev) => (prev - 1 + project.image_urls.length) % project.image_urls.length)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">Project not found</h2>
          <Link href="/gallery">
            <Button>Back to Gallery</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">

          <div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-200">
              <img
                src={
                  project.image_urls?.[currentImageIndex] ||
                  "/placeholder.svg?height=600&width=600&query=interior design" ||
                  "/placeholder.svg"
                }
                alt={`${project.title} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              {project.image_urls && project.image_urls.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {project.image_urls.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {project.image_urls && project.image_urls.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {project.image_urls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${index === currentImageIndex ? "border-amber-500" : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <img
                      src={url || "/placeholder.svg"}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Project Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{project.title}</h1>
              <div className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">{project.description}</div>
            </div>

            {/* Project Information */}
            {project.project_details && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Project Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {project.project_details.area && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-amber-600" />
                        <div>
                          <p className="text-sm text-gray-500">Area</p>
                          <p className="font-medium">{project.project_details.area}</p>
                        </div>
                      </div>
                    )}
                    {project.project_details.duration && (
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-amber-600" />
                        <div>
                          <p className="text-sm text-gray-500">Duration</p>
                          <p className="font-medium">{project.project_details.duration}</p>
                        </div>
                      </div>
                    )}
                    {project.project_details.client && (
                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-amber-600" />
                        <div>
                          <p className="text-sm text-gray-500">Client</p>
                          <p className="font-medium">{project.project_details.client}</p>
                        </div>
                      </div>
                    )}
                    {project.project_details.year && (
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-amber-600" />
                        <div>
                          <p className="text-sm text-gray-500">Year</p>
                          <p className="font-medium">{project.project_details.year}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact CTA */}

          </div>
        </div>

        {/* Related Projects */}
        {relatedProjects.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProjects.map((relatedProject) => (
                <Card key={relatedProject.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square relative">
                    <img
                      src={
                        relatedProject.image_urls?.[0] ||
                        "/placeholder.svg?height=300&width=300&query=interior design" ||
                        "/placeholder.svg"
                      }
                      alt={relatedProject.title}
                      className="w-full h-full object-cover"
                    />
                    {relatedProject.featured && <Badge className="absolute top-2 left-2 bg-amber-500">Featured</Badge>}
                  </div>
                  <CardContent className="p-4">
                    <Badge variant="secondary" className="mb-2">
                      {getCategoryLabel(relatedProject.category)}
                    </Badge>
                    <h3 className="font-semibold mb-2 line-clamp-2">{relatedProject.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{relatedProject.description}</p>
                    <Link href={`/gallery/${relatedProject.id}`}>
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        View Project
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
