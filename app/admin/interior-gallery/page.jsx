"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, ImageIcon, Star, Filter } from "lucide-react"

const CATEGORIES = [
  { value: "office_space", label: "Office Space" },
  { value: "hotel_space", label: "Hotel Space" },
  { value: "residential", label: "Residential" },
  { value: "commercial_space", label: "Commercial Space" },
]

export default function AdminInteriorGalleryPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stats, setStats] = useState({
    total: 0,
    featured: 0,
    byCategory: {},
  })
  const [currentPage, setCurrentPage] = useState(1)
  const projectsPerPage = 12

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        await Promise.all([fetchProjects(), fetchStats()])
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load interior gallery data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/admin/interior-gallery")
      const result = await response.json()

      if (result.success) {
        const sortedProjects = result.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        setProjects(sortedProjects)
      } else {
        console.error("Failed to fetch projects:", result.error)
        toast.error("Failed to fetch projects")
        setProjects([])
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
      toast.error("Failed to fetch projects")
      setProjects([])
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/interior-gallery/stats")
      const result = await response.json()

      if (result.success) {
        setStats(result.data)
      } else {
        console.error("Error fetching stats:", result.error)
        setStats({
          total: 0,
          featured: 0,
          byCategory: {},
        })
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
      setStats({
        total: 0,
        featured: 0,
        byCategory: {},
      })
    }
  }

  const handleDelete = async (projectId) => {
    if (!confirm("Are you sure you want to delete this project?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/interior-gallery/${projectId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Project deleted successfully")
        await Promise.all([fetchProjects(), fetchStats()])
      } else {
        toast.error(result.error || "Failed to delete project")
      }
    } catch (error) {
      console.error("Error deleting project:", error)
      toast.error("Failed to delete project")
    }
  }

  const toggleFeatured = async (projectId, currentStatus) => {
    try {
      const response = await fetch(`/api/admin/interior-gallery/${projectId}/featured`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ featured: !currentStatus }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Project ${!currentStatus ? "featured" : "unfeatured"} successfully`)
        await Promise.all([fetchProjects(), fetchStats()])
      } else {
        toast.error("Failed to update project")
      }
    } catch (error) {
      console.error("Error updating project:", error)
      toast.error("Failed to update project")
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
        <h1 className="text-2xl font-bold">Interior Gallery</h1>
        <Link href="/admin/interior-gallery/add">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <ImageIcon className="h-8 w-8 text-blue-500" />
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
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        {Object.entries(stats.byCategory)
          .slice(0, 2)
          .map(([category, count]) => (
            <Card key={category}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{getCategoryLabel(category)}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <Filter className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
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
          <SelectTrigger className="w-48">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {currentProjects.map((project) => (
          <Card key={project.id} className="overflow-hidden">
            <div className="aspect-square relative">
              <img
                src={project.image_urls?.[0] || "/placeholder.svg?height=300&width=300&query=interior design"}
                alt={project.title}
                className="w-full h-full object-cover"
              />
              {project.featured && <Badge className="absolute top-2 left-2 bg-amber-500">Featured</Badge>}
              <Badge variant="secondary" className="absolute top-2 right-2 bg-white/90 text-gray-700">
                {getCategoryLabel(project.category)}
              </Badge>
            </div>

            <CardContent className="p-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm line-clamp-2">{project.title}</h3>
                <p className="text-xs text-gray-600 line-clamp-2">{project.description}</p>

                {project.project_details && (
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{project.project_details.area || "N/A"}</span>
                    <span>{project.project_details.year || "N/A"}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4">
                <Link href={`/gallery/${project.id}`}>
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
                      <Link href={`/admin/interior-gallery/${project.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleFeatured(project.id, project.featured)}>
                      <Star className="h-4 w-4 mr-2" />
                      {project.featured ? "Unfeature" : "Feature"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(project.id)} className="text-red-600">
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

      {/* Pagination */}
      {filteredProjects.length > 0 && totalPages > 1 && (
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

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No projects found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || categoryFilter !== "all"
              ? "Try adjusting your search or filter"
              : "Get started by adding your first interior project"}
          </p>
          {!searchQuery && categoryFilter === "all" && (
            <Link href="/admin/interior-gallery/add">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
