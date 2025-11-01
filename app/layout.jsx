import { Inter } from "next/font/google"
import { SpeedInsights } from '@vercel/speed-insights/next';
import { GoogleAnalytics } from '@next/third-parties/google';
import "./globals.css"
import { SupabaseProvider } from "@/lib/supabase-provider"
import { CartProvider } from "@/lib/cart-context"
import { Toaster } from "@/components/ui/sonner"
import ConditionalLayout from "@/components/layout/conditional-layout"
import LenisProvider from "@/components/ui/lenis-provider"
import { Analytics } from "@vercel/analytics/react"
import { Suspense } from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: 'Eight Hands Work',
  description: 'Your website description here',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
    shortcut: '/logo.png',
  },
  // You can also add OpenGraph metadata for better social media sharing
  openGraph: {
    images: ['/logo.png'],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SupabaseProvider>
          <CartProvider>
            <LenisProvider>
              <Suspense fallback={null}>
                <ConditionalLayout>
                  <main>{children}</main>
                </ConditionalLayout>
              </Suspense>
              <Toaster />
            </LenisProvider>
          </CartProvider>
        </SupabaseProvider>
       <Analytics />
      <GoogleAnalytics gaId="G-R3HXHY7V5L" />
     <SpeedInsights />
      </body>
    </html>
  )
}
