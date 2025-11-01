import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Get total products count
    const { count: productsCount, error: productsError } = await supabaseAdmin
      .from("products")
      .select("*", { count: "exact", head: true })

    if (productsError) {
      console.error("Products count error:", productsError)
    }

    // Get total orders count
    const { count: ordersCount, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("*", { count: "exact", head: true })

    if (ordersError) {
      console.error("Orders count error:", ordersError)
    }

    // Get pending orders count
    const { count: pendingOrdersCount, error: pendingError } = await supabaseAdmin
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")

    if (pendingError) {
      console.error("Pending orders count error:", pendingError)
    }

    // Get total revenue (sum of completed orders)
    const { data: revenueData, error: revenueError } = await supabaseAdmin
      .from("orders")
      .select("total_amount")
      .neq("status", "cancelled")

    let totalRevenue = 0
    if (!revenueError && revenueData) {
      totalRevenue = revenueData.reduce((sum, order) => sum + (order.total_amount || 0), 0)
    }

    // Get messages count
    const { count: messagesCount, error: messagesError } = await supabaseAdmin
      .from("contact_messages")
      .select("*", { count: "exact", head: true })

    if (messagesError) {
      console.error("Messages count error:", messagesError)
    }

    return Response.json({
      success: true,
      data: {
        products: productsCount || 0,
        orders: ordersCount || 0,
        pendingOrders: pendingOrdersCount || 0,
        totalRevenue: totalRevenue,
        messages: messagesCount || 0,
      },
    })
  } catch (error) {
    console.error("API error:", error)
    return Response.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
