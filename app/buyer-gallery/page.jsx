"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MapPin, User, Package, Filter } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function BuyerGalleryPage() {
    const [projects, setProjects] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const projectsPerPage = 12

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            await Promise.all([fetchProjects(), fetchCategories()])
        } catch (error) {
            console.error("Error fetching data:", error)
            toast.error("Failed to load buyer gallery")
        } finally {
            setLoading(false)
        }
    }

    const fetchProjects = async () => {
        try {
            const response = await fetch("/api/buyer-gallery")
            const result = await response.json()

            if (result.success) {
                setProjects(result.data)
            } else {
                console.error("Failed to fetch projects:", result.error)
                toast.error("Failed to fetch projects")
            }
        } catch (error) {
            console.error("Error fetching projects:", error)
            toast.error("Failed to fetch projects")
        }
    }

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

    const filteredProjects = projects.filter((project) => {
        const matchesSearch =
            project.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.delivery_location.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesCategory = selectedCategory === "all" || project.category_id === selectedCategory

        return matchesSearch && matchesCategory
    })

    const totalPages = Math.ceil(filteredProjects.length / projectsPerPage)
    const currentProjects = filteredProjects.slice((currentPage - 1) * projectsPerPage, currentPage * projectsPerPage)

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Buyer Gallery</h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Discover our completed projects and see how our furniture transforms homes across the country
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search by product, client, or location..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="lg:w-64">
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger>
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Filter by category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Projects Grid */}
                {currentProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {currentProjects.map((project) => (
                            <Link href={`/buyer-gallery/${project.id}`} key={project.id}>
                                <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
                                    <div className="aspect-square relative">
                                        <img
                                            src={project.image_url || "/placeholder.svg?height=300&width=300"}
                                            alt={project.product_name}
                                            className="w-full h-full object-cover"
                                        />
                                        {project.is_featured && (
                                            <Badge className="absolute top-3 left-3 bg-amber-500 hover:bg-amber-600">Featured</Badge>
                                        )}
                                    </div>

                                    <CardContent className="p-4">
                                        <div className="space-y-3">
                                            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">{project.product_name}</h3>

                                            <div className="space-y-2">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <User className="h-4 w-4 mr-2 text-gray-400" />
                                                    <span>{project.client_name}</span>
                                                </div>

                                                <div className="flex items-center text-sm text-gray-600">
                                                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                                    <span>{project.delivery_location}</span>
                                                </div>

                                                {project.categories && (
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Package className="h-4 w-4 mr-2 text-gray-400" />
                                                        <span>{project.categories.name}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-2 border-t">
                                                <p className="text-xs text-gray-500">
                                                    Delivered on {new Date(project.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No projects found</h3>
                        <p className="text-gray-500">
                            {searchQuery || selectedCategory !== "all"
                                ? "Try adjusting your search or filter criteria"
                                : "Check back soon for completed projects"}
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-2 mt-8">
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
            </div>
        </div>
    )
}
