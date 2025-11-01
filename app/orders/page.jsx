"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingPage } from "@/components/ui/loading"
import { Package, Calendar, MapPin, DollarSign, RefreshCw, AlertCircle } from "lucide-react"

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const hasRun = useRef(false)
  const timeoutRef = useRef(null)
  const abortControllerRef = useRef(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    if (authLoading) {
      return
    }

    if (!user) {
      if (mountedRef.current) {
        setLoading(false)
        setError("Please sign in to view your orders")
      }
      return
    }

    if (user && !hasRun.current) {
      hasRun.current = true
      fetchOrders()
    }

    return () => {
      mountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [user, authLoading])

  const fetchOrders = async () => {
    if (!mountedRef.current) return

    setLoading(true)
    setError(null)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (mountedRef.current) {
        setError("Request timed out. Please try again.")
        setLoading(false)
      }
    }, 30000)

    try {
      console.log("[v0] Fetching orders for user:", user?.id)
      if (!user?.id) {
        console.log("[v0] No user ID available, skipping fetch")
        if (mountedRef.current) {
          setOrders([])
          setLoading(false)
          setError("User not authenticated")
        }
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        console.log("[v0] No valid session found")
        if (mountedRef.current) {
          setOrders([])
          setLoading(false)
          setError("Session expired. Please sign in again.")
        }
        return
      }

      abortControllerRef.current = new AbortController()

      // Try RPC function first with shorter timeout
      try {
        const rpcPromise = supabase
          .rpc("get_user_orders_with_details", { user_id_param: user.id })
          .abortSignal(abortControllerRef.current.signal) // Use abort controller instead of timeout

        const { data: rpcOrders, error: rpcError } = await rpcPromise

        if (!rpcError && rpcOrders && Array.isArray(rpcOrders)) {
          console.log("Successfully fetched orders via RPC", rpcOrders)
          const formattedOrders = rpcOrders.map((order) => ({
            ...order,
            order_items: order.items
              ? order.items.map((item) => ({
                  id: item.id,
                  product_id: item.product_id,
                  quantity: item.quantity,
                  price: item.price,
                  products: {
                    name: item.product_name,
                    image_url: item.product_image,
                    image_urls: item.product_image ? [item.product_image] : [],
                  },
                }))
              : [],
          }))
          if (mountedRef.current) {
            setOrders(formattedOrders)
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
            }
            setLoading(false)
          }
          return
        } else if (rpcError) {
          console.log("RPC query failed, falling back to direct query:", rpcError)
        }
      } catch (rpcTimeoutError) {
        console.log("RPC failed, falling back to direct query:", rpcTimeoutError.message)
      }

      // Fallback: Use direct query with correct column names
      try {
        const { data: detailedOrders, error: detailedError } = await supabase
          .from("orders")
          .select(`
              *,
              order_items (
                *,
                products (
                  name,
                  image_urls
                )
              )
            `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .abortSignal(abortControllerRef.current.signal) // Use abort controller

        if (!detailedError && detailedOrders) {
          console.log("Successfully fetched orders via direct query", detailedOrders)
          if (mountedRef.current) {
            setOrders(detailedOrders)
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
            }
            setLoading(false)
          }
          return
        } else if (detailedError) {
          console.error("[v0] Direct query failed:", detailedError)
        }
      } catch (directTimeoutError) {
        console.log("[v0] Direct query failed:", directTimeoutError.message)
      }

      // Final fallback: Simple orders query then fetch items separately
      try {
        const { data: simpleOrders, error: simpleError } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .abortSignal(abortControllerRef.current.signal) // Use abort controller

        if (simpleError) {
          console.error("[v0] Simple orders query failed:", simpleError)
          if (mountedRef.current) {
            setOrders([])
            setLoading(false)
          }
          return
        }

        if (!simpleOrders || simpleOrders.length === 0) {
          console.log("[v0] No orders found for user")
          if (mountedRef.current) {
            setOrders([])
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
            }
            setLoading(false)
          }
          return
        }

        const ordersWithItems = await Promise.all(
          simpleOrders.map(async (order) => {
            try {
              const { data: items, error: itemsError } = await supabase
                .from("order_items")
                .select(`
                   *,
                   products (
                     name,
                     image_urls
                   )
                 `)
                .eq("order_id", order.id)
                .abortSignal(abortControllerRef.current.signal) // Use abort controller

              if (itemsError) {
                console.error(`[v0] Failed to fetch items for order ${order.id}:`, itemsError)
                return { ...order, order_items: [] }
              }

              return { ...order, order_items: items || [] }
            } catch (itemFetchError) {
              console.error(`[v0] Error fetching items for order ${order.id}:`, itemFetchError)
              return { ...order, order_items: [] }
            }
          }),
        )

        if (mountedRef.current) {
          setOrders(ordersWithItems)
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
          }
          setLoading(false)
        }
      } catch (finalError) {
        console.error("[v0] Final fallback failed:", finalError)
        if (mountedRef.current) {
          setOrders([])
          setLoading(false)
          setError("Failed to load orders. Please try again.")
        }
      }
    } catch (error) {
      console.error("[v0] Critical error in fetchOrders:", error)
      if (mountedRef.current) {
        setOrders([])
        setLoading(false)
        const isAbortError = error.name === "AbortError"
        const errorMessage = isAbortError
          ? "Request was cancelled or timed out. Please try again."
          : "An unexpected error occurred. Please try again."
        setError(errorMessage)
      }
    } finally {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      abortControllerRef.current = null
    }
  }

  const handleRetry = () => {
    hasRun.current = false
    setError(null)
    fetchOrders()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "shipped":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (authLoading || loading) {
    return <LoadingPage />
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-4">Please sign in to view your orders</p>
            <Button onClick={() => (window.location.href = "/auth")} className="mt-4">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Orders</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={handleRetry} className="mt-4 flex items-center mx-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">My Orders</h1>
            <p className="text-gray-600">Track your furniture orders and delivery status</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
              <p className="text-gray-600">Start shopping to see your orders here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Order #{order.id ? order.id.slice(0, 8) : "Unknown"}</CardTitle>
                    <Badge className={getStatusColor(order.status || "pending")}>
                      {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : "Pending"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : "Date not available"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">৳{(order.total_amount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {order.shipping_address ? `${order.shipping_address.slice(0, 30)}...` : "Address not available"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Items:</h4>
                    {(order.order_items || []).map((item, index) => (
                      <div
                        key={item.id || `item-${index}`}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                          <Image
                            src={item.products?.image_urls?.[0] || "/placeholder-furniture.jpg"}
                            alt={item.products?.name || "Product"}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.products?.name || "Product"}</p>
                          <p className="text-sm text-gray-600">
                            Quantity: {item.quantity || 1} × ৳{(item.price || 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">৳{((item.quantity || 1) * (item.price || 0)).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
