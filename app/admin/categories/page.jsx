"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { Plus, Search, MoreHorizontal, Edit, Trash2, TrendingUp, Package, AlertCircle } from "lucide-react"

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        image_url: "",
    })

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            setLoading(true)
            const response = await fetch("/api/admin/categories")
            const result = await response.json()

            if (result.success) {
                setCategories(result.data || [])
            } else {
                toast.error("Failed to fetch categories")
            }
        } catch (error) {
            console.error("Error fetching categories:", error)
            toast.error("Failed to fetch categories")
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.name.trim()) {
            toast.error("Category name is required")
            return
        }

        try {
            const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : "/api/admin/categories"
            const method = editingCategory ? "PUT" : "POST"

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            })

            const result = await response.json()

            if (result.success) {
                toast.success(editingCategory ? "Category updated successfully" : "Category created successfully")
                setShowAddForm(false)
                setEditingCategory(null)
                setFormData({ name: "", description: "", image_url: "" })
                fetchCategories()
            } else {
                toast.error(result.error || "Failed to save category")
            }
        } catch (error) {
            console.error("Error saving category:", error)
            toast.error("Failed to save category")
        }
    }

    const handleEdit = (category) => {
        setEditingCategory(category)
        setFormData({
            name: category.name || "",
            description: category.description || "",
            image_url: category.image_url || "",
        })
        setShowAddForm(true)
    }

    const handleDelete = async (categoryId) => {
        if (!confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
            return
        }

        try {
            const response = await fetch(`/api/admin/categories/${categoryId}`, {
                method: "DELETE",
            })

            const result = await response.json()

            if (result.success) {
                toast.success("Category deleted successfully")
                fetchCategories()
            } else {
                toast.error(result.error || "Failed to delete category")
            }
        } catch (error) {
            console.error("Error deleting category:", error)
            toast.error("Failed to delete category")
        }
    }

    const filteredCategories = categories.filter((category) =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Category Management</h1>
                    <p className="text-gray-600">Organize your products into categories</p>
                </div>
                <Button onClick={() => setShowAddForm(true)} className="bg-amber-600 hover:bg-amber-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Categories</p>
                                <p className="text-2xl font-bold text-amber-600">{categories.length}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-amber-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">With Description</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {categories.filter(cat => cat.description && cat.description.trim()).length}
                                </p>
                            </div>
                            <Package className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">With Images</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {categories.filter(cat => cat.image_url && cat.image_url.trim()).length}
                                </p>
                            </div>
                            <Package className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>{editingCategory ? "Edit Category" : "Add New Category"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="name">Category Name *</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Enter category name"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="image_url">Image URL (optional)</Label>
                                    <Input
                                        id="image_url"
                                        name="image_url"
                                        value={formData.image_url}
                                        onChange={handleInputChange}
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="description">Description (optional)</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Enter category description"
                                    rows={3}
                                />
                            </div>

                            <div className="flex space-x-2">
                                <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                                    {editingCategory ? "Update Category" : "Create Category"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowAddForm(false)
                                        setEditingCategory(null)
                                        setFormData({ name: "", description: "", image_url: "" })
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search categories..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Categories List */}
            {filteredCategories.length > 0 ? (
                <div className="grid gap-4">
                    {filteredCategories.map((category) => (
                        <Card key={category.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <h3 className="text-lg font-semibold">{category.name}</h3>
                                            <Badge variant="outline" className="text-xs">
                                                ID: {category.id.slice(0, 8)}...
                                            </Badge>
                                        </div>

                                        {category.description && (
                                            <p className="text-gray-600 text-sm mb-2">{category.description}</p>
                                        )}

                                        {category.image_url && (
                                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                <span>Has image</span>
                                                <Badge variant="secondary" className="text-xs">IMG</Badge>
                                            </div>
                                        )}

                                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                            <span>Created: {new Date(category.created_at).toLocaleDateString()}</span>
                                            {category.updated_at !== category.created_at && (
                                                <span>Updated: {new Date(category.updated_at).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(category)}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(category.id)}
                                                className="text-red-600"
                                            >
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
            ) : (
                <Card>
                    <CardContent className="p-8 text-center">
                        {searchQuery ? (
                            <div>
                                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-600 mb-2">No categories found</h3>
                                <p className="text-gray-500 mb-4">Try adjusting your search terms</p>
                            </div>
                        ) : (
                            <div>
                                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-600 mb-2">No categories yet</h3>
                                <p className="text-gray-500 mb-4">Get started by creating your first category</p>
                                <Button onClick={() => setShowAddForm(true)} className="bg-amber-600 hover:bg-amber-700">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Category
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
