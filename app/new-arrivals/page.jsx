import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import NewArrivalsClient from "./NewArrivalsClient"

async function getNewArrivals() {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .gt("stock", 0) // Check if stock is greater than 0
      .order("created_at", { ascending: false })
      .limit(20) // Show last 20 products

    if (error) {
      console.error("Error fetching new arrivals:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching new arrivals:", error)
    return []
  }
}

export default async function NewArrivals() {
  const products = await getNewArrivals()

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center mb-8">
          <Link href="/" className="inline-flex items-center text-amber-500 hover:text-amber-600 mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold">New Arrivals</h1>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500 text-lg mb-4">No new arrivals at the moment.</p>
            <p className="text-gray-500">Check back soon for our latest products!</p>
            <Link href="/products" className="btn-primary mt-4 inline-block">
              Browse All Products
            </Link>
          </div>
        ) : (
          <NewArrivalsClient products={products} />
        )}
      </div>
    </div>
  )
}
