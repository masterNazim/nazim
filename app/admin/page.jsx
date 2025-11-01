"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingPage } from "@/components/ui/loading"
import { Package, ShoppingCart, DollarSign, TrendingUp, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AdminDashboard() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [profileAttempted, setProfileAttempted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    console.log("[v0] Admin Dashboard - Auth Check:", {
      loading,
      user: user ? "exists" : "null",
      profile: profile
        ? {
            id: profile.id,
            is_admin: profile.is_admin,
            full_name: profile.full_name,
            email: profile.email,
          }
        : "null",
    })

    // Mark that we've attempted to load profile data
    if (!loading && user) {
      setProfileAttempted(true)
    }

    // Only redirect after we've attempted to load profile and confirmed no admin access
    if (!loading && profileAttempted && (!user || (user && profile !== null && !profile?.is_admin))) {
      console.log("[v0] Admin Dashboard - Redirecting to home because:", {
        noUser: !user,
        notAdmin: !profile?.is_admin,
        profileIsAdmin: profile?.is_admin,
        profileAttempted,
      })
      router.push("/")
    }
  }, [user, profile, loading, router, profileAttempted])

  useEffect(() => {
    if (profile?.is_admin) {
      fetchStats()
    }
  }, [profile])

  const fetchStats = async () => {
    try {
      // Fetch products count
      const { count: productsCount } = await supabase.from("products").select("*", { count: "exact", head: true })

      // Fetch orders count
      const { count: ordersCount } = await supabase.from("orders").select("*", { count: "exact", head: true })

      // Fetch pending orders count
      const { count: pendingCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")

      // Fetch total revenue
      const { data: revenueData } = await supabase
        .from("orders")
        .select("total_amount")
        .not("status", "eq", "cancelled")

      const totalRevenue = revenueData?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0

      setStats({
        totalProducts: productsCount || 0,
        totalOrders: ordersCount || 0,
        totalRevenue,
        pendingOrders: pendingCount || 0,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
      toast({ variant: "destructive", description: "Failed to load stats" })
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setDashboardLoading(true)

        // Fetch recent orders
        const { data: recentOrdersData } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5)
        setRecentOrders(recentOrdersData || [])

        setDashboardLoading(false)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setDashboardLoading(false)
        toast({ variant: "destructive", description: "Failed to load dashboard data" })
      }
    }

    const timeout = setTimeout(() => {
      if (dashboardLoading) {
        setDashboardLoading(false)
        toast({ variant: "destructive", description: "Dashboard loading timeout - please refresh" })
      }
    }, 10000)

    fetchDashboardData()
    return () => clearTimeout(timeout)
  }, [])

  // Show loading while auth is loading OR while we haven't attempted to load profile yet
  if (loading || !profileAttempted || statsLoading || dashboardLoading) {
    return <LoadingPage />
  }

  if (!user || !profile?.is_admin) {
    return null
  }

  return (
    <div className="space-y-6 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {profile?.full_name || "Admin"}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">+2 from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => router.push("/admin/products")}
        >
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Manage Products</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Add, edit, or remove products from your catalog</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/admin/orders")}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <span>Manage Orders</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">View and update order statuses</p>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => router.push("/admin/categories")}
        >
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Manage Categories</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Organize products into categories</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
