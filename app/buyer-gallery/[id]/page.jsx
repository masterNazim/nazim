"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb"
import { ArrowLeft, Calendar, MapPin, User, Package, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"

export default function BuyerGalleryDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [project, setProject] = useState(null)
    const [loading, setLoading] = useState(true)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [allImages, setAllImages] = useState([])
    
    useEffect(() => {
        fetchProject()
    }, [params.id])
    
    // Process and set all available images whenever the project changes
    useEffect(() => {
        if (!project) return;
        
        // Collect all available images
        const images = [];
        
        // First, add the main image if it exists
        if (project.image_url) {
            images.push(project.image_url);
        }
        
        // Then add any additional images from image_urls array if it exists
        if (project.image_urls && Array.isArray(project.image_urls)) {
            // Filter out any duplicates of the main image
            const additionalImages = project.image_urls.filter(
                url => url && url !== project.image_url
            );
            images.push(...additionalImages);
        }
        
        // Set the collected unique images
        setAllImages(images);
    }, [project]);

    const fetchProject = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/buyer-gallery/${params.id}`)
            const result = await response.json()

            if (result.success) {
                setProject(result.data)
            } else {
                console.error("Failed to fetch project:", result.error)
                toast.error("Project not found")
                router.push("/buyer-gallery")
            }
        } catch (error) {
            console.error("Error fetching project:", error)
            toast.error("Failed to load project")
            router.push("/buyer-gallery")
        } finally {
            setLoading(false)
        }
    }

    const nextImage = () => {
        if (allImages.length <= 1) return;
        setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
    }

    const prevImage = () => {
        if (allImages.length <= 1) return;
        setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
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
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Project Not Found</h2>
                    <p className="text-gray-600 mb-4">The project you're looking for doesn't exist or has been removed.</p>
                    <Link href="/buyer-gallery">
                        <Button>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Buyer Gallery
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumbs */}
                <Breadcrumb className="mb-6">
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/buyer-gallery">Buyer Gallery</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem isCurrentPage>
                        <BreadcrumbLink>{project.product_name}</BreadcrumbLink>
                    </BreadcrumbItem>
                </Breadcrumb>

                {/* Back Button */}
                <div className="mb-6">
                    <Link href="/buyer-gallery">
                        <Button variant="ghost" className="pl-0 text-gray-600 hover:text-gray-900">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Gallery
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Main Image Showcase */}
                    <div className="lg:col-span-3 space-y-4">
                        {/* Main Image */}
                        <div className="relative aspect-[4/3] bg-white rounded-lg overflow-hidden border">
                            {allImages.length > 0 ? (
                                <>
                                    <div className="relative w-full h-full">
                                        <Image
                                            src={allImages[currentImageIndex] || "/placeholder.svg"}
                                            alt={project.product_name}
                                            fill
                                            className="object-contain"
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                            priority
                                        />
                                    </div>
                                    {project.is_featured && (
                                        <Badge className="absolute top-4 left-4 bg-amber-500 hover:bg-amber-600">
                                            Featured Project
                                        </Badge>
                                    )}
                                    {allImages.length > 1 && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 rounded-full"
                                                onClick={prevImage}
                                            >
                                                <ChevronLeft className="h-6 w-6" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 rounded-full"
                                                onClick={nextImage}
                                            >
                                                <ChevronRight className="h-6 w-6" />
                                            </Button>
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1">
                                                {allImages.map((_, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => setCurrentImageIndex(index)}
                                                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                                                            index === currentImageIndex
                                                                ? "bg-amber-500"
                                                                : "bg-gray-300 hover:bg-gray-400"
                                                        }`}
                                                        aria-label={`View image ${index + 1}`}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                    <Package className="h-16 w-16 text-gray-400" />
                                </div>
                            )}
                        </div>

                        {/* Thumbnail Gallery */}
                        {allImages.length > 1 && (
                            <div className="grid grid-cols-5 gap-2">
                                {allImages.map((image, index) => (
                                    <button
                                        key={index}
                                        className={`relative aspect-square rounded overflow-hidden border-2 ${
                                            index === currentImageIndex
                                                ? "border-amber-500"
                                                : "border-gray-200 hover:border-gray-300"
                                        }`}
                                        onClick={() => setCurrentImageIndex(index)}
                                    >
                                        <Image
                                            src={image || "/placeholder.svg"}
                                            alt={`${project.product_name} - view ${index + 1}`}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 20vw, 10vw"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Project Details */}
                    <div className="lg:col-span-2">
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h1 className="text-2xl font-bold text-gray-900 mb-6">{project.product_name}</h1>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <h2 className="text-lg font-semibold text-gray-800">Client Details</h2>
                                    <div className="space-y-4">
                                        <div className="flex items-start">
                                            <User className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-gray-500 font-medium">Client</p>
                                                <p className="text-gray-700">{project.client_name}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start">
                                            <MapPin className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-gray-500 font-medium">Delivery Location</p>
                                                <p className="text-gray-700">{project.delivery_location}</p>
                                            </div>
                                        </div>

                                        {project.categories && (
                                            <div className="flex items-start">
                                                <Package className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm text-gray-500 font-medium">Category</p>
                                                    <p className="text-gray-700">{project.categories.name}</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-start">
                                            <Calendar className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-gray-500 font-medium">Delivery Date</p>
                                                <p className="text-gray-700">
                                                    {new Date(project.created_at).toLocaleDateString("en-US", {
                                                        year: "numeric",
                                                        month: "long",
                                                        day: "numeric",
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-200">
                                    <p className="text-sm text-gray-500 italic">
                                        This project showcases our commitment to quality and customer satisfaction. 
                                        Our furniture pieces are designed to transform spaces and create beautiful environments.
                                    </p>
                                </div>
                                
                                <div className="pt-4 border-t border-gray-200">
                                    <Link href="/contact">
                                        <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                                            Contact Us About This Project
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}