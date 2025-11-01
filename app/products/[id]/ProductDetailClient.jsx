"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, ArrowLeft, Star, Truck, Shield, RefreshCw } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import ProductReviews from "@/components/products/ProductReviews"

export default function ProductDetailClient({ product }) {
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const { addToCart } = useCart()
  const { user } = useAuth()

  const images =
    product.image_urls && product.image_urls.length > 0
      ? product.image_urls
      : product.image_url
        ? [product.image_url]
        : [product.primary_image || "/placeholder.jpg"]

  const currentImage = images[currentImageIndex] || images[0] || "/placeholder.jpg"

  useEffect(() => {
    let interval
    if (isHovered && images.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isHovered, images.length])

  console.log("Auth user state:", !!user)

  const handleAddToCart = () => {
    if (!user) {
      toast.error("Please sign in to add items to cart")
      return
    }

    if (product.stock === 0) {
      toast.error("This item is out of stock")
      return
    }

    if (quantity > product.stock) {
      toast.error(`Only ${product.stock} items available`)
      return
    }

    const productForCart = {
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: currentImage,
    }

    addToCart(productForCart)
    if (quantity > 1) {
      for (let i = 1; i < quantity; i++) {
        addToCart(productForCart)
      }
    }

    toast.success(`Added ${quantity} item(s) to cart!`)
  }

  const formatDescription = (text) => {
    if (!text) return ""
    return text.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        {index < text.split("\n").length - 1 && <br />}
      </span>
    ))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/products" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {" "}
          {/* Increased gap for better spacing */}
          {/* Product Image */}
          <div className="space-y-4">
            <div
              className="relative aspect-square overflow-hidden rounded-xl bg-white shadow-lg" /* Fixed className syntax error */
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => {
                setIsHovered(false)
                setCurrentImageIndex(0)
              }}
            >
              <Image
                src={currentImage || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              {product.is_featured && (
                <Badge className="absolute top-4 left-4 bg-amber-600 hover:bg-amber-700">Featured</Badge>
              )}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {images.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                        index === currentImageIndex ? "bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Additional Images */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {" "}
                {/* Increased gap */}
                {images.map((imgUrl, index) => (
                  <div
                    key={index}
                    className={`relative aspect-square overflow-hidden rounded-lg cursor-pointer border-2 transition-all duration-200 ${
                      index === currentImageIndex
                        ? "border-amber-500 shadow-md"
                        : "border-gray-200 hover:border-gray-300"
                    }`} /* Improved hover states */
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <Image
                      src={imgUrl || "/placeholder.svg"}
                      alt={`${product.name} - view ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 25vw, 100px"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Product Info */}
          <div className="space-y-8">
            {" "}
            {/* Increased spacing */}
            <div>
              <Badge variant="outline" className="mb-4 text-sm">
                {" "}
                {/* Improved spacing */}
                {product.categories?.name || "Furniture"}
              </Badge>
              <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                {" "}
                {/* Larger heading */}
                {product.name}
              </h1>
              <div className="flex items-center space-x-6 mb-6">
                {" "}
                {/* Increased spacing */}
                <span className="text-4xl font-bold text-amber-600">
                  {" "}
                  {/* Larger price */}৳{product.price.toFixed(2)}
                </span>
                <div className="flex items-center space-x-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-gray-600 ml-2">(4.8 rating)</span>
                </div>
              </div>
              {product.description && (
                <div className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">
                  {formatDescription(product.description)}
                </div>
              )}
            </div>
            {/* Stock and Quantity */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Stock:</span>
                <span
                  className={`font-medium ${
                    product.stock > 10 ? "text-green-600" : product.stock > 0 ? "text-yellow-600" : "text-red-600"
                  }`}
                >
                  {product.stock > 0 ? `${product.stock} available` : "Out of stock"}
                </span>
              </div>

              {product.stock > 0 && (
                <div className="flex items-center space-x-4">
                  <label className="text-gray-700 font-medium">Quantity:</label>
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="h-10 w-10"
                    >
                      -
                    </Button>
                    <span className="px-4 py-2 border-x min-w-[60px] text-center">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                      className="h-10 w-10"
                    >
                      +
                    </Button>
                  </div>
                </div>
              )}
            </div>
            {/* Add to Cart */}
            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              size="lg"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </Button>
            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex items-center space-x-2">
                <Truck className="h-5 w-5 text-amber-600" />
                <span className="text-sm text-gray-600">Free Shipping</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-amber-600" />
                <span className="text-sm text-gray-600">2 Year Warranty</span>
              </div>
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-5 w-5 text-amber-600" />
                <span className="text-sm text-gray-600">30 Day Returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">Product Details</h2>
            <div className="prose prose-gray max-w-none">
              <div className="text-gray-600 leading-relaxed mb-6 whitespace-pre-line">
                {formatDescription(
                  product.description ||
                    "This premium furniture piece combines exceptional craftsmanship with modern design. Made from high-quality materials, it offers both style and durability for your home.",
                )}
              </div>
              <h3 className="text-lg font-semibold mb-3">Specifications</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-amber-600 rounded-full mr-3"></span>
                  Material: Premium solid wood and high-grade fabrics
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-amber-600 rounded-full mr-3"></span>
                  Finish: Professional quality with protective coating
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-amber-600 rounded-full mr-3"></span>
                  Assembly: Professional assembly included with delivery
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-amber-600 rounded-full mr-3"></span>
                  Care: Easy maintenance with provided care instructions
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Product Reviews */}
        <ProductReviews productId={product.id} />
      </div>
    </div>
  )
}
