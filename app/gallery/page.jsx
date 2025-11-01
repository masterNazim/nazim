"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Eye, Calendar, MapPin, User } from "lucide-react"
import Link from "next/link"

const CATEGORIES = [
  { value: "office_space", label: "Office Space" },
  { value: "hotel_space", label: "Hotel Space" },
  { value: "residential", label: "Residential" },
  { value: "commercial_space", label: "Commercial Space" },
]

export default function GalleryPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const projectsPerPage = 12

  useEffect(() => {
    // Parse URL parameters for initial filter state
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    
    if (categoryParam) {
      // Map product categories to gallery categories if needed
      if (categoryParam === "Office") {
        setCategoryFilter("office_space");
      } else if (categoryParam === "Hotel") {
        setCategoryFilter("hotel_space");
      } else if (categoryParam === "Residential") {
        setCategoryFilter("residential");
      } else if (categoryParam === "Commercial" || categoryParam === "Restaurant") {
        setCategoryFilter("commercial_space");
      }
    }
    
    fetchProjects();
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/interior-gallery")
      const result = await response.json()

      if (result.success) {
        // Sort by featured first, then by creation date
        const sortedProjects = result.data.sort((a, b) => {
          if (a.featured && !b.featured) return -1
          if (!a.featured && b.featured) return 1
          return new Date(b.created_at) - new Date(a.created_at)
        })
        setProjects(sortedProjects)
      } else {
        console.error("Failed to fetch projects:", result.error)
        setProjects([])
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || project.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage)
  const currentProjects = filteredProjects.slice((currentPage - 1) * projectsPerPage, currentPage * projectsPerPage)

  const getCategoryLabel = (category) => {
    const cat = CATEGORIES.find((c) => c.value === category)
    return cat ? cat.label : category
  }

  const getCategoryStats = () => {
    const stats = {}
    projects.forEach((project) => {
      stats[project.category] = (stats[project.category] || 0) + 1
    })
    return stats
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white mt-16 pt-8">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Interior Design Gallery</h1>
            <p className="text-xl text-amber-100 mb-8 max-w-2xl mx-auto">
              Explore our portfolio of stunning interior design projects across various spaces and styles
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {Object.entries(getCategoryStats()).map(([category, count]) => (
                <div key={category} className="bg-white/20 rounded-full px-4 py-2">
                  <span className="font-medium">{getCategoryLabel(category)}: </span>
                  <span>{count} projects</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {currentProjects.map((project) => (
            <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="aspect-square relative">
                <img
                  src={project.image_urls?.[0] || "/placeholder.svg?height=300&width=300&query=interior design"}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
                {project.featured && (
                  <Badge className="absolute top-3 left-3 bg-amber-500 hover:bg-amber-600">Featured</Badge>
                )}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
                  <Link href={`/gallery/${project.id}`}>
                    <Button size="sm" className="bg-white text-gray-900 hover:bg-gray-100">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      {getCategoryLabel(project.category)}
                    </Badge>
                    <h3 className="font-semibold text-lg line-clamp-2">{project.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                  </div>

                  {project.project_details && (
                    <div className="space-y-2 text-xs text-gray-500">
                      {project.project_details.area && (
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{project.project_details.area}</span>
                        </div>
                      )}
                      {project.project_details.client && (
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          <span>{project.project_details.client}</span>
                        </div>
                      )}
                      {project.project_details.year && (
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{project.project_details.year}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <Link href={`/gallery/${project.id}`} className="block">
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <Eye className="h-4 w-4 mr-2" />
                      View Project
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {filteredProjects.length > 0 && totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2">
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

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <div className="h-24 w-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No projects found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || categoryFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Check back soon for new interior design projects"}
            </p>
            {(searchQuery || categoryFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setCategoryFilter("all")
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
