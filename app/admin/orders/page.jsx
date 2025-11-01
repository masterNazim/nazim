"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { supabaseAdmin, safeAdminQuery } from "@/lib/supabase-admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, MapPin, DollarSign, Phone, User, RefreshCw, AlertCircle } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const timeoutRef = useRef(null)
  const abortControllerRef = useRef(null)

  useEffect(() => {
    console.log("[v0] Admin Orders Page: Initializing")
    fetchOrders()

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("[v0] Admin Orders: Starting fetch process...")

      // Instead of using the complex JOIN query that's failing, use the API route
      console.log("[v0] Admin Orders: Using API route...")

      const response = await fetch("/api/admin/orders", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch orders")
      }

      console.log("[v0] Admin Orders: API successful:", result.data?.length || 0)
      setOrders(result.data || [])
    } catch (error) {
      console.error("[v0] Admin Orders: Complete failure:", error.message)
      const errorMessage =
        error.name === "AbortError"
          ? "Request was cancelled or timed out. Please try again."
          : error.message || "Failed to fetch orders"

      setError(errorMessage)
      toast.error("Failed to fetch orders", {
        description: errorMessage,
        action: {
          label: "Retry",
          onClick: () => fetchOrders(),
        },
      })
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const toastId = toast.loading(`Updating order status to ${newStatus}...`)

      // Try PUT first; if blocked (405), fall back to POST then PATCH
      const methods = ["PUT", "POST", "PATCH"]
      let lastError = null
      let result = null

      for (const method of methods) {
        try {
          const response = await fetch("/api/admin/orders", {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: orderId, status: newStatus }),
          })

          // If this method is not allowed, try the next one
          if (response.status === 405) {
            lastError = new Error(`HTTP 405 for ${method}`)
            continue
          }

          // Safely parse JSON only when present; handle 204/empty responses gracefully
          let parsed = null
          const contentType = response.headers.get("content-type") || ""
          const contentLength = response.headers.get("content-length")
          const isNoContent = response.status === 204 || contentLength === "0"

          if (!isNoContent) {
            try {
              if (contentType.includes("application/json")) {
                parsed = await response.json()
              } else {
                const text = await response.text()
                if (text) {
                  try { parsed = JSON.parse(text) } catch {/* ignore non-JSON */ }
                }
              }
            } catch {/* ignore parse errors */ }
          }

          if (!response.ok) {
            const message = parsed?.error || `HTTP ${response.status}`
            throw new Error(message)
          }

          if (parsed && parsed.success === false) {
            throw new Error(parsed.error || "Failed to update order")
          }

          // Success for this method
          result = parsed
          break
        } catch (err) {
          lastError = err
          // Try next method if available
          continue
        }
      }

      if (!result && lastError) {
        throw lastError
      }

      toast.dismiss(toastId)
      toast.success(`Order status updated to ${newStatus}`)

      setOrders((prevOrders) =>
        prevOrders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)),
      )

      if (typeof window !== "undefined") {
        localStorage.removeItem("query_cache_admin_orders")
      }
    } catch (error) {
      console.error("[v0] Error updating order status:", error.message)
      const errorMessage = error.message.includes("timeout")
        ? "Update timed out. Please try again."
        : `Failed to update order status: ${error.message}`
      toast.error(errorMessage)
    }
  }

  const handleRetry = () => {
    setError(null)
    fetchOrders()
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
          <p className="text-sm text-gray-500 mt-2">This may take up to 60 seconds for complex queries</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to Load Orders</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRetry} variant="outline" className="flex items-center bg-transparent">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Management</h1>
            <p className="text-gray-600">Manage customer orders and update their status</p>
          </div>
          <Button onClick={fetchOrders} variant="outline" className="flex items-center bg-transparent">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {!orders || orders.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-gray-600">Orders will appear here when customers make purchases</p>
            <Button variant="outline" className="mt-4 bg-transparent" onClick={fetchOrders}>
              Refresh Orders
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                    <div className="text-sm text-gray-500 mt-1">{new Date(order.created_at).toLocaleString()}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(order.status || "pending")}>
                      {(order.status || "pending").charAt(0).toUpperCase() + (order.status || "pending").slice(1)}
                    </Badge>

                    <Select
                      value={order.status || "pending"}
                      onValueChange={(value) => updateOrderStatus(order.id, value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Update status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-500">Customer</div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{order.profiles?.full_name || "Unknown"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{order.profiles?.phone || "No phone"}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-500">Shipping Address</div>
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <span className="text-sm">{order.shipping_address || "No address provided"}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-500">Order Summary</div>
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span>{order.order_items?.length || 0} items</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">৳{order.total_amount?.toFixed(2) || "0.00"}</span>
                    </div>
                  </div>
                </div>

                {order.order_items && order.order_items.length > 0 ? (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                    <div className="space-y-3">
                      {order.order_items.map((item) => {
                        console.log(`[v0] Rendering item ${item.id}:`, {
                          product_id: item.product_id,
                          quantity: item.quantity,
                          price: item.price,
                          products: item.products,
                          product_name: item.products?.name,
                          has_image_urls: !!item.products?.image_urls,
                          image_urls_length: item.products?.image_urls?.length || 0,
                          has_image_url: !!item.products?.image_url,
                        })

                        return (
                          <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                            <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                              <Image
                                src={
                                  (item.products?.image_urls && item.products.image_urls.length > 0
                                    ? item.products.image_urls[0]
                                    : item.products?.image_url) ||
                                  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+CjxjaXJjbGUgY3g9IjI2IiBjeT0iMjYiIHI9IjIiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTIwIDM2TDI4IDI4TDM2IDM2TDQ0IDI4VjQ0SDIwVjM2WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K"
                                }
                                alt={item.products?.name || "Product"}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                  e.target.src =
                                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+CjxjaXJjbGUgY3g9IjI2IiBjeT0iMjYiIHI9IjIiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTIwIDM2TDI4IDI4TDM2IDM2TDQ0IDI4VjQ0SDIwVjM2WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K"
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{item.products?.name || "Product"}</p>
                              <p className="text-sm text-gray-500">
                                Quantity: {item.quantity} × ৳{item.price?.toFixed(2) || "0.00"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">
                                ৳{((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Order Summary</h4>
                    <p className="text-gray-600 text-sm">
                      Order ID: {order.id}
                      <br />
                      Total: ৳{order.total_amount?.toFixed(2) || "0.00"}
                      <br />
                      Status: {order.status || "pending"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
