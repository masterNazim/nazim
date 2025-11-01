"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Building, Hotel, Home, Store } from "lucide-react"
import Link from "next/link"

const CATEGORIES = [
  {
    value: "office_space",
    label: "Office Space",
    icon: Building,
    description: "Modern and functional office designs that boost productivity",
    color: "bg-blue-500",
  },
  {
    value: "hotel_space",
    label: "Hotel Space",
    icon: Hotel,
    description: "Luxurious hospitality interiors that create memorable experiences",
    color: "bg-purple-500",
  },
  {
    value: "residential",
    label: "Residential",
    icon: Home,
    description: "Comfortable and stylish home interiors for modern living",
    color: "bg-green-500",
  },
  {
    value: "commercial_space",
    label: "Commercial Space",
    icon: Store,
    description: "Strategic retail and commercial designs that drive business",
    color: "bg-orange-500",
  },
]

export default function InteriorCategories() {
  const [featuredProjects, setFeaturedProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedProjects()
  }, [])

  const fetchFeaturedProjects = async () => {
    try {
      const response = await fetch("/api/interior-gallery?featured=true&limit=4")
      const result = await response.json()

      if (result.success) {
        setFeaturedProjects(result.data)
      }
    } catch (error) {
      console.error("Error fetching featured projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryData = (category) => {
    return CATEGORIES.find((c) => c.value === category) || CATEGORIES[0]
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Interior Design Services</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transform your space with our expert interior design services across various categories
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {CATEGORIES.map((category) => {
            const Icon = category.icon
            return (
              <Card key={category.value} className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div
                    className={`w-16 h-16 ${category.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.label}</h3>
                  <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                  <Link href={`/gallery?category=${category.value}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="group-hover:bg-amber-50 group-hover:border-amber-300 bg-transparent"
                    >
                      View Projects
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Featured Projects */}
        {!loading && featuredProjects.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Featured Projects</h3>
              <Link href="/gallery">
                <Button variant="outline">
                  View All Projects
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProjects.map((project) => {
                const categoryData = getCategoryData(project.category)
                return (
                  <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div className="aspect-square relative">
                      <img
                        src={project.image_urls?.[0] || "/placeholder.svg?height=300&width=300&query=interior design"}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-3 left-3 bg-amber-500">Featured</Badge>
                    </div>
                    <CardContent className="p-4">
                      <Badge variant="secondary" className="mb-2">
                        {categoryData.label}
                      </Badge>
                      <h4 className="font-semibold text-sm line-clamp-2 mb-2">{project.title}</h4>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-3">{project.description}</p>
                      <Link href={`/gallery/${project.id}`}>
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          View Details
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Space?</h3>
            <p className="text-amber-100 mb-6 max-w-2xl mx-auto">
              Let our expert designers create the perfect interior solution for your needs. From concept to completion,
              we bring your vision to life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/gallery">
                <Button size="lg" className="bg-white text-amber-700 hover:bg-gray-100">
                  View Our Portfolio
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-amber-700 bg-transparent"
                >
                  Get Free Consultation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
