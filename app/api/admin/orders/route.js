import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Helper to safely parse id/status from either JSON or form-data without changing SQL
async function parseIdAndStatus(request) {
  const ct = request.headers.get('content-type') || ''
  try {
    if (ct.includes('application/json')) {
      const body = await request.json()
      return { id: body?.id, status: body?.status }
    }
    if (ct.includes('multipart/form-data') || ct.includes('application/x-www-form-urlencoded')) {
      const form = await request.formData()
      return { id: form.get('id'), status: form.get('status') }
    }
    // Fallback: try JSON once
    const body = await request.json()
    return { id: body?.id, status: body?.status }
  } catch (_) {
    return {}
  }
}

export async function GET() {
  try {
    console.log("[API] Admin Orders: Starting fetch...")
    console.log("[API] Service role available:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)

    // Test with a fresh client to rule out client configuration issues
    const testClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        }
      }
    )

    // Quick test with the fresh client
    const { data: testData, error: testError } = await testClient
      .from("orders")
      .select("id")
      .limit(1)

    console.log("[API] Fresh client test:", {
      dataCount: testData?.length || 0,
      error: testError?.message || null
    })

    // Check if we have proper service role credentials
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn("[API] ⚠️ No service role key found - this may cause issues with RLS policies")
      console.log("[API] Will attempt query with anon key, but RLS may block results")
    } else {
      console.log("[API] Service role key found, attempting to use service role")
      // Try to set role explicitly (some setups need this)
      try {
        await supabaseAdmin.rpc('set_role', { role_name: 'service_role' })
        console.log("[API] Service role set successfully")
      } catch (roleError) {
        console.log("[API] Could not set service role (this is normal for most setups):", roleError.message)
      }
    }

    // Get all orders - service role should bypass RLS automatically
    console.log("[API] Attempting orders fetch...")
    console.log("[API] Using Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log("[API] Service role key available:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.log("[API] Service role key length:", process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0)

    // Try a simple count query first to test connection
    const { data: countData, error: countError } = await supabaseAdmin
      .from("orders")
      .select("id", { count: 'exact', head: true })

    console.log("[API] Count query result:", {
      count: countData,
      error: countError?.message || null
    })

    // Try to get table info to debug further
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from("information_schema.tables")
      .select("*")
      .eq("table_name", "orders")
      .eq("table_schema", "public")

    console.log("[API] Table info query:", {
      tableExists: tableInfo?.length > 0,
      error: tableError?.message || null
    })

    // Try different approaches to fetch orders
    let orders = null
    let ordersError = null

    try {
      // First try with explicit column selection
      const result1 = await supabaseAdmin
        .from("orders")
        .select("id, user_id, status, total_amount, created_at, updated_at")
        .order("created_at", { ascending: false })

      console.log("[API] Explicit column query:", result1)

      if (result1.error) {
        console.log("[API] Explicit column query failed, trying with *")

        // If that fails, try with *
        const result2 = await supabaseAdmin
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })

        console.log("[API] Star query result:", result2)
        orders = result2.data
        ordersError = result2.error
      } else {
        orders = result1.data
        ordersError = result1.error
      }
    } catch (queryError) {
      console.log("[API] Query execution error:", queryError)
      ordersError = queryError
    }

    console.log("[API] Orders query result:", {
      ordersCount: orders?.length || 0,
      error: ordersError?.message || null,
      errorCode: ordersError?.code || null,
      errorDetails: ordersError?.details || null,
      firstOrderId: orders?.[0]?.id || null,
      actualOrders: orders?.map(o => ({ id: o.id, status: o.status, user_id: o.user_id }))
    })

    if (ordersError) {
      console.error("[API] Orders fetch error:", ordersError)
      throw new Error(`Orders fetch failed: ${ordersError.message} (Code: ${ordersError.code})`)
    }

    // Add debug logging for orders data
    console.log("[API] Raw orders data:", {
      ordersIsNull: orders === null,
      ordersIsUndefined: orders === undefined,
      ordersIsArray: Array.isArray(orders),
      ordersLength: orders?.length,
      actualOrders: orders
    })

    if (!orders || orders.length === 0) {
      console.log("[API] No orders found - checking if service role is properly configured")

      // Try a raw SQL query to bypass potential RLS issues
      try {
        console.log("[API] Attempting raw SQL query to bypass RLS...")
        const { data: rawOrders, error: rawError } = await supabaseAdmin
          .rpc('get_all_orders_admin')

        if (rawOrders && rawOrders.length > 0) {
          console.log("[API] Raw SQL found", rawOrders.length, "orders - RLS was the issue")
          return Response.json({
            success: true,
            data: rawOrders.map(order => ({
              ...order,
              profiles: null,
              order_items: []
            })),
            message: "Orders found via raw SQL - RLS bypass used"
          })
        }
      } catch (rawError) {
        console.log("[API] Raw SQL also failed:", rawError.message)
      }

      return Response.json({
        success: true,
        data: [],
        message: "No orders found",
        debug: {
          hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          usingKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service' : 'anon',
          ordersWasNull: orders === null,
          ordersWasUndefined: orders === undefined
        }
      })
    }

    console.log(`[API] Successfully fetched ${orders.length} orders`)

    // Get profiles for these orders
    const userIds = [...new Set(orders.map(order => order.user_id).filter(Boolean))]
    console.log("[API] User IDs extracted:", userIds)

    let profiles = []
    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .in("id", userIds)

      console.log("[API] Profiles query result:", {
        profilesCount: profilesData?.length || 0,
        error: profilesError?.message || null
      })

      if (profilesError) {
        console.error("[API] Profiles fetch error:", profilesError)
        // Don't throw error, just use empty profiles
      } else {
        profiles = profilesData || []
      }
    }

    console.log(`[API] Fetched ${profiles.length} profiles`)

    // Get order items
    const orderIds = orders.map(order => order.id)
    console.log("[API] Order IDs extracted:", orderIds)

    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .select("*")
      .in("order_id", orderIds)

    console.log("[API] Order items query result:", {
      itemsCount: orderItems?.length || 0,
      error: itemsError?.message || null
    })

    if (itemsError) {
      console.error("[API] Order items fetch error:", itemsError)
      // Don't throw error for order items, continue without them
      console.log("[API] Continuing without order items due to error")
    }

    console.log(`[API] Fetched ${orderItems?.length || 0} order items`)

    // Get products if we have order items
    let products = []
    if (orderItems && orderItems.length > 0) {
      const productIds = [...new Set(orderItems.map(item => item.product_id).filter(Boolean))]
      console.log("[API] Product IDs extracted:", productIds)

      if (productIds.length > 0) {
        const { data: productsData, error: productsError } = await supabaseAdmin
          .from("products")
          .select("*")
          .in("id", productIds)

        console.log("[API] Products query result:", {
          productsCount: productsData?.length || 0,
          error: productsError?.message || null
        })

        if (productsError) {
          console.error("[API] Products fetch error:", productsError)
          // Don't throw error, just use empty products
        } else {
          products = productsData || []
        }
      }
    }

    console.log(`[API] Fetched ${products.length} products`)

    // Create lookup maps
    const profilesMap = {}
    profiles.forEach(profile => {
      profilesMap[profile.id] = profile
    })

    const productsMap = {}
    products.forEach(product => {
      productsMap[product.id] = product
    })

    // Group order items by order ID
    const orderItemsMap = {}
    if (orderItems && Array.isArray(orderItems)) {
      orderItems.forEach(item => {
        if (!orderItemsMap[item.order_id]) {
          orderItemsMap[item.order_id] = []
        }

        const itemWithProduct = {
          ...item,
          products: productsMap[item.product_id] || null
        }

        orderItemsMap[item.order_id].push(itemWithProduct)
      })
    }

    console.log("[API] Order items map created with", Object.keys(orderItemsMap).length, "orders")

    // Combine everything
    const ordersWithData = orders.map(order => ({
      ...order,
      profiles: profilesMap[order.user_id] || null,
      order_items: orderItemsMap[order.id] || []
    }))

    console.log(`[API] Successfully processed ${ordersWithData.length} orders`)

    // Log sample for debugging
    if (ordersWithData.length > 0) {
      const sample = ordersWithData[0]
      console.log("[API] Sample order:", {
        id: sample.id,
        has_profile: !!sample.profiles,
        profile_name: sample.profiles?.full_name,
        items_count: sample.order_items?.length || 0,
        first_item_has_product: sample.order_items?.[0]?.products ? true : false
      })
    }

    return Response.json({
      success: true,
      data: ordersWithData,
      debug: {
        totalOrders: orders.length,
        profilesFound: profiles.length,
        orderItemsFound: orderItems?.length || 0,
        productsFound: products.length
      }
    })

  } catch (error) {
    console.error("[API] Admin orders error:", error)

    // Try a simple fallback - just return basic orders without relationships
    try {
      console.log("[API] Attempting fallback query...")
      const { data: fallbackOrders, error: fallbackError } = await supabaseAdmin
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })

      if (!fallbackError && fallbackOrders) {
        console.log("[API] Fallback successful, returning", fallbackOrders.length, "orders")
        return Response.json({
          success: true,
          data: fallbackOrders.map(order => ({
            ...order,
            profiles: null,
            order_items: []
          })),
          fallback: true
        })
      }
    } catch (fallbackErr) {
      console.error("[API] Fallback also failed:", fallbackErr)
    }

    return Response.json(
      {
        success: false,
        error: error.message || "Failed to fetch orders"
      },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const { id, status } = await parseIdAndStatus(request)

    if (!id || !status) {
      return Response.json(
        { success: false, error: "Order ID and status are required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[API] Update order error:", error)
      return Response.json(
        {
          success: false,
          error: error.message || "Failed to update order"
        },
        { status: 500 }
      )
    }

    if (!data) {
      return Response.json(
        {
          success: false,
          error: "Order not found or could not be updated"
        },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
      data
    })

  } catch (error) {
    console.error("[API] Update order error:", error)
    return Response.json(
      {
        success: false,
        error: error.message || "Failed to update order"
      },
      { status: 500 }
    )
  }
}

// Support PATCH as an alias for status updates to avoid 405 when clients use PATCH
export async function PATCH(request) {
  return PUT(request)
}

// Some hosts/proxies disallow PUT/PATCH. Accept POST and route to the same logic.
export async function POST(request) {
  return PUT(request)
}
