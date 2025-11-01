import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request, { params }) {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    get(name) {
                        return cookieStore.get(name)?.value
                    },
                },
            },
        )

        const { data, error } = await supabase.from("homepage_images").select("*").eq("id", params.id).single()

        if (error) {
            console.error("Database error:", error)
            return NextResponse.json({ error: "Image not found" }, { status: 404 })
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error("Server error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function PUT(request, { params }) {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    get(name) {
                        return cookieStore.get(name)?.value
                    },
                },
            },
        )

        const body = await request.json()
        const { title, description, image_url, room_type, display_order, is_active } = body

        const { data, error } = await supabase
            .from("homepage_images")
            .update({
                title,
                description,
                image_url,
                room_type,
                display_order: Number.parseInt(display_order) || 0,
                is_active,
            })
            .eq("id", params.id)
            .select()

        if (error) {
            console.error("Database error:", error)
            return NextResponse.json({ error: "Failed to update image" }, { status: 500 })
        }

        return NextResponse.json(data[0])
    } catch (error) {
        console.error("Server error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE(request, { params }) {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    get(name) {
                        return cookieStore.get(name)?.value
                    },
                },
            },
        )

        const { error } = await supabase.from("homepage_images").delete().eq("id", params.id)

        if (error) {
            console.error("Database error:", error)
            return NextResponse.json({ error: "Failed to delete image" }, { status: 500 })
        }

        return NextResponse.json({ message: "Image deleted successfully" })
    } catch (error) {
        console.error("Server error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
