import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// Helper function to check admin access
async function checkAdminAccess() {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
    },
  })

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Unauthorized", status: 401 }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (profileError || !profile?.is_admin) {
    return { error: "Admin access required", status: 403 }
  }

  return { supabase, user }
}

// PATCH - Toggle featured status (admin)
export async function PATCH(request, { params }) {
  try {
    const adminCheck = await checkAdminAccess()
    if (adminCheck.error) {
      return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status })
    }

    const { supabase } = adminCheck
    const body = await request.json()
    const { featured } = body

    const { data, error } = await supabase
      .from("interior_gallery")
      .update({ featured })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating featured status:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Featured toggle API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
