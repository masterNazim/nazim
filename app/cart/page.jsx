"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/hooks/useAuth"
import { supabase, safeQuery, ensureUserProfile } from "@/lib/supabase"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, clearCart, getCartTotal, getCartItemsCount, refreshCartStock } =
    useCart()
  const { user, loading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [shippingAddress, setShippingAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [profileLoading, setProfileLoading] = useState(false)
  const timeoutRef = useRef(null)
  const hasLoadedProfile = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    const fetchProfile = async () => {
      if (!user || hasLoadedProfile.current || authLoading) return

      hasLoadedProfile.current = true

      if (!mountedRef.current) return
      setProfileLoading(true)

      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setProfileLoading(false)
          console.log("[v0] Profile loading timed out")
        }
      }, 12000)

      try {
        console.log("[v0] Fetching profile data for cart")
        if (!user?.id) {
          throw new Error("User ID not available")
        }

        const { data, error } = await safeQuery(
          async () => supabase.from("profiles").select("phone, address").eq("id", user.id).single(),
          { maxRetries: 2, timeout: 10000 },
        )

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        if (error && error.code !== "PGRST116") {
          // Ignore "not found" errors
          throw error
        }

        if (data && mountedRef.current) {
          setPhone(data.phone || "")
          setShippingAddress(data.address || "")
          console.log("[v0] Profile data loaded successfully")
        }
      } catch (error) {
        console.error("[v0] Error fetching profile:", error)
        if (mountedRef.current && !error.message?.includes("User ID not available")) {
          const errorMessage = error.message?.includes("timeout")
            ? "Profile loading timed out. Please try again."
            : "Failed to load profile data"
          toast.error(errorMessage)
        }
      } finally {
        if (mountedRef.current) {
          setProfileLoading(false)
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }

    if (!authLoading && user) {
      const timer = setTimeout(fetchProfile, 100)
      return () => clearTimeout(timer)
    }

    return () => {
      mountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [user, authLoading])

  useEffect(() => {
    if (refreshCartStock) {
      refreshCartStock()
    }
  }, [refreshCartStock])

  const handleCheckout = async () => {
    if (!user) {
      toast.error("Please sign in to checkout")
      return
    }

    if (cartItems.length === 0) {
      toast.error("Your cart is empty")
      return
    }

    if (!shippingAddress.trim()) {
      toast.error("Please enter your shipping address")
      return
    }
    if (!phone.trim()) {
      toast.error("Please enter your phone number")
      return
    }

    if (!mountedRef.current) return
    setIsLoading(true)

    const checkoutTimeout = setTimeout(() => {
      if (mountedRef.current) {
        setIsLoading(false)
        toast.error("Checkout process timed out. Please try again.")
      }
    }, 45000)

    try {
      console.log("[v0] Ensuring user profile exists...")
      let profileExists
      try {
        profileExists = await safeQuery(async () => await ensureUserProfile(user), { maxRetries: 2, timeout: 12000 })
      } catch (error) {
        throw new Error("Failed to ensure user profile: " + error.message)
      }
      if (!profileExists) {
        throw new Error("Failed to create or verify user profile")
      }
      console.log("[v0] User profile verified")

      console.log("[v0] Updating profile...")
      const { error: profileUpdateError } = await safeQuery(
        async () => supabase.from("profiles").update({ phone, address: shippingAddress }).eq("id", user.id),
        { maxRetries: 2, timeout: 12000 },
      )
      if (profileUpdateError) {
        console.error("[v0] Profile update error:", profileUpdateError)
        throw new Error(`Failed to update profile: ${profileUpdateError.message}`)
      }
      console.log("[v0] Profile updated successfully")

      console.log("[v0] Validating stock and creating order...")

      // First, validate all items have sufficient stock
      for (const item of cartItems) {
        const { data: product, error } = await supabase.from("products").select("stock").eq("id", item.id).single()

        if (error) {
          throw new Error(`Failed to check stock for ${item.name}`)
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.name}. Only ${product.stock} available.`)
        }
      }

      console.log("[v0] Deducting stock...")
      const stockDeductionResults = []

      for (const item of cartItems) {
        const { data: currentProduct, error: fetchError } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.id)
          .single()

        if (fetchError || !currentProduct) {
          // Rollback any successful stock deductions
          for (const rollbackItem of stockDeductionResults) {
            await supabase
              .from("products")
              .update({ stock: rollbackItem.originalStock })
              .eq("id", rollbackItem.product_id)
              .catch((err) => console.error("Rollback error:", err))
          }
          throw new Error(`Failed to fetch current stock for ${item.name}`)
        }

        const newStock = currentProduct.stock - item.quantity
        if (newStock < 0) {
          // Rollback any successful stock deductions
          for (const rollbackItem of stockDeductionResults) {
            await supabase
              .from("products")
              .update({ stock: rollbackItem.originalStock })
              .eq("id", rollbackItem.product_id)
              .catch((err) => console.error("Rollback error:", err))
          }
          throw new Error(`Insufficient stock for ${item.name}. Only ${currentProduct.stock} available.`)
        }

        const { error: stockError } = await supabase.from("products").update({ stock: newStock }).eq("id", item.id)

        if (stockError) {
          console.error("[v0] Stock deduction error:", stockError)
          // Rollback any successful stock deductions
          for (const rollbackItem of stockDeductionResults) {
            await supabase
              .from("products")
              .update({ stock: rollbackItem.originalStock })
              .eq("id", rollbackItem.product_id)
              .catch((err) => console.error("Rollback error:", err))
          }
          throw new Error(`Failed to deduct stock for ${item.name}: ${stockError.message}`)
        }

        stockDeductionResults.push({
          product_id: item.id,
          quantity: item.quantity,
          originalStock: currentProduct.stock,
        })
      }
      console.log("[v0] Stock deducted successfully")

      // Create order after successful stock deduction
      const { data: order, error: orderError } = await safeQuery(
        async () =>
          supabase
            .from("orders")
            .insert({
              user_id: user.id,
              total_amount: getCartTotal(),
              shipping_address: shippingAddress,
              status: "processing",
            })
            .select()
            .single(),
        { maxRetries: 2, timeout: 15000 },
      )

      if (orderError) {
        console.error("[v0] Order creation error:", orderError)
        for (const rollbackItem of stockDeductionResults) {
          await supabase
            .from("products")
            .update({ stock: rollbackItem.originalStock })
            .eq("id", rollbackItem.product_id)
            .catch((err) => console.error("Rollback error:", err))
        }
        throw new Error(`Failed to create order: ${orderError.message}`)
      }
      console.log("[v0] Order created:", order.id)

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }))

      console.log("[v0] Creating order items...")
      const { error: itemsError } = await safeQuery(async () => supabase.from("order_items").insert(orderItems), {
        maxRetries: 2,
        timeout: 15000,
      })

      if (itemsError) {
        console.error("[v0] Order items creation error:", itemsError)
        for (const rollbackItem of stockDeductionResults) {
          await supabase
            .from("products")
            .update({ stock: rollbackItem.originalStock })
            .eq("id", rollbackItem.product_id)
            .catch((err) => console.error("Rollback error:", err))
        }
        await supabase
          .from("orders")
          .delete()
          .eq("id", order.id)
          .catch((err) => console.error("Order deletion error:", err))
        throw new Error(`Failed to create order items: ${itemsError.message}`)
      }
      console.log("[v0] Order items created")

      clearTimeout(checkoutTimeout)

      clearCart()
      toast.success("Order placed successfully!")

      window.location.href = "/orders"
    } catch (error) {
      console.error("[v0] Error placing order:", error)
      if (mountedRef.current) {
        const errorMessage = error.message?.includes("timeout")
          ? "Checkout timed out. Please try again."
          : `Failed to place order: ${error.message || "Unknown error"}. Please check console for details.`
        toast.error(errorMessage)
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
      clearTimeout(checkoutTimeout)
      console.log("[v0] Checkout process completed")
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-4">Please sign in to view your cart</p>
            <Link href="/auth">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-4">Add some furniture to get started</p>
            <Link href="/products">
              <Button className="w-full">Browse Products</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                      <Image
                        src={
                          item.image_urls?.[0] ||
                          item.primary_image ||
                          item.image_url ||
                          "/placeholder.svg?height=80&width=80"
                        }
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p className="text-amber-600 font-medium">৳{item.price.toFixed(2)}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold">৳{(item.price * item.quantity).toFixed(2)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-700 mt-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal ({getCartItemsCount()} items)</span>
                  <span>৳{getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>৳{getCartTotal().toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address">Shipping Address *</Label>
                      <Textarea
                        id="address"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="Enter your complete shipping address..."
                        className="min-h-[100px]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={isLoading || !shippingAddress.trim() || !phone.trim()}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                    size="lg"
                  >
                    {isLoading ? "Processing..." : "Place Order"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
