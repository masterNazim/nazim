import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const { data: collections, error: collectionsError } = await supabaseAdmin
      .from("collections")
      .select("*")
      .order("display_order", { ascending: true })

    if (collectionsError) {
      console.error("Collections database error:", collectionsError)
      return Response.json(
        {
          success: false,
          error: "Failed to fetch collections",
        },
        { status: 500 },
      )
    }

    const { data: categories, error: categoriesError } = await supabaseAdmin.from("categories").select("id, name")

    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, name, price, discount_price, image_urls, image_url")

    if (categoriesError) {
      console.error("Categories database error:", categoriesError)
    }

    if (productsError) {
      console.error("Products database error:", productsError)
    }

    const enrichedCollections = (collections || []).map((collection) => {
      const category = categories?.find((cat) => cat.id === collection.category_id)
      const product = products?.find((prod) => prod.id === collection.product_id)

      return {
        ...collection,
        categories: category || null,
        products: product || null,
      }
    })

    return Response.json({
      success: true,
      data: enrichedCollections,
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

export async function POST(request) {
  try {
    const { category_id, product_id, display_order, is_active, is_featured } = await request.json()

    if (!category_id || !product_id) {
      return Response.json(
        {
          success: false,
          error: "Category ID and Product ID are required",
        },
        { status: 400 },
      )
    }

    const { data, error } = await supabaseAdmin
      .from("collections")
      .upsert(
        {
          category_id,
          product_id,
          display_order: display_order || 1,
          is_active: is_active !== undefined ? is_active : true,
          is_featured: is_featured !== undefined ? is_featured : false,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "category_id",
        },
      )
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return Response.json(
        {
          success: false,
          error: "Failed to create/update collection",
        },
        { status: 500 },
      )
    }

    return Response.json({
      success: true,
      data,
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
