"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Menu,
  X,
  ExternalLink,
  LogOut,
  MessageSquare,
  Video,
  Grid3X3,
  Star,
  ImageIcon,
  Battery as Gallery,
  Home,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    title: "Messages",
    href: "/admin/messages",
    icon: MessageSquare,
  },
  {
    title: "Reviews",
    href: "/admin/reviews",
    icon: Star,
  },
  {
    title: "Videos",
    href: "/admin/videos",
    icon: Video,
  },
  {
    title: "Collections",
    href: "/admin/collections",
    icon: Grid3X3,
  },
  {
    title: "Interior Gallery",
    href: "/admin/interior-gallery",
    icon: ImageIcon,
  },
  {
    title: "Buyer Gallery",
    href: "/admin/buyer-gallery",
    icon: Gallery,
  },
  {
    title: "Homepage Images",
    href: "/admin/homepage-images",
    icon: Home,
  },
]

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Wait for auth to finish loading
        if (authLoading) return

        if (!user) {
          router.push("/auth?redirect=/admin")
          return
        }

        if (profile && !profile.is_admin) {
          router.push("/auth?error=access_denied")
          return
        }

        if (user && profile) {
          setLoading(false)
        }
      } catch (error) {
        console.error("Auth check error:", error)
        router.push("/auth?redirect=/admin")
      }
    }

    checkAuth()
  }, [user, profile, authLoading, router])

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success("Signed out successfully")
      router.push("/")
    } catch (error) {
      toast.error("Failed to sign out")
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (!user || (profile && !profile.is_admin)) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:h-screen
      `}
      >
        {/* Logo/Brand */}
        <div className="flex items-center justify-between h-20 px-6 border-b bg-gradient-to-r from-amber-600 to-amber-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-amber-600 font-bold text-lg">8H</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Panel</h1>
              <p className="text-amber-100 text-sm">EightHand Furniture</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-white hover:bg-amber-800"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                  ? "bg-amber-50 text-amber-700 border-r-4 border-amber-700"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className={`h-5 w-5 mr-3 ${isActive ? "text-amber-700" : "text-gray-500"}`} />
                {item.title}
              </Link>
            )
          })}

          <div className="pt-6 mt-6 border-t border-gray-200">
            <Link
              href="/"
              className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
            >
              <ExternalLink className="h-5 w-5 mr-3 text-gray-500" />
              View Website
            </Link>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-all duration-200 mt-2"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </button>
          </div>
        </nav>

        {/* User info */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-gradient-to-r from-amber-600 to-amber-700 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">{user.email?.charAt(0).toUpperCase()}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{profile?.full_name || "Admin User"}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-30 bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-4">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
            <div className="w-8"></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
