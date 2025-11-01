import Hero from "@/components/Hero"
import FeaturesSection from "@/components/features-section"
import TrendyProducts from "@/components/trendy-products"
import RoomShowcase from "@/components/room-showcase"
import Achievements from "@/components/achievements"
import ContactForm from "@/components/contact-form"
import FurnitureCategories from "@/components/furniture-categories"
import VideoSection from "@/components/video-section"
import InteriorCategories from "@/components/interior-categories"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import FeaturedCollections from "@/components/FeaturedCollections"


export const dynamic = "force-dynamic"

export default async function Home() {
  let products = []

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

    const { data, error } = await supabase
      .from("products")
      .select("*, categories(id, name)")
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("Supabase error:", error)
    } else {
      products = data || []
    }
  } catch (err) {
    console.error("Failed to fetch products:", err)
  }

  products = products.map((product) => ({
    ...product,
    price: product.price || 0,
    discount_price: product.discount_price || null,
    name: product.name || "Product",
  }))

  return (
    <div className="overflow-x-hidden">
      <Hero />
      <FurnitureCategories />

      {products.length > 0 && <TrendyProducts products={products} />}
      <FeaturedCollections />
      <RoomShowcase />

      <Achievements />
      <FeaturesSection />


      <VideoSection />
    </div>
  )
}
