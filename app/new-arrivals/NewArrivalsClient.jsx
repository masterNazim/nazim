"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/lib/cart-context"

export default function NewArrivalsClient({ products }) {
  const { addToCart } = useCart()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
          <div className="relative overflow-hidden">
            <Image
              src={(product.image_urls && product.image_urls.length > 0 ? product.image_urls[0] : product.image_url) || "/placeholder.svg?height=300&width=400"}
              alt={product.name}
              width={400}
              height={300}
              className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                e.target.src = "/placeholder.svg?height=300&width=400";
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300"></div>
            <button
              onClick={() => addToCart(product)}
              className="absolute bottom-4 right-4 bg-amber-500 hover:bg-amber-600 text-white p-3 rounded-full shadow-lg transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
            >
              <ShoppingCart className="h-5 w-5" />
            </button>
            {/* New badge */}
            <div className="absolute top-4 left-4 bg-green-500 text-white px-2 py-1 text-xs font-medium rounded-md">
              NEW
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-lg font-bold mb-2 line-clamp-1">{product.name}</h3>
            <p className="text-gray-600 mb-2 line-clamp-2 text-sm">{product.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-amber-500">৳{product.price}</span>
              <Link
                href={`/products/${product.id}`}
                className="text-sm text-gray-500 hover:text-amber-500 transition-colors"
              >
                View Details
              </Link>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              Added {new Date(product.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
