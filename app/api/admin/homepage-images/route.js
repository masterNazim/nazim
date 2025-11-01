import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
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

        const { data, error } = await supabase
            .from("homepage_images")
            .select("*")
            .order("display_order", { ascending: true })

        if (error) {
            console.error("Database error:", error)
            return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error("Server error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(request) {
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

        if (!title || !image_url || !room_type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const { data, error } = await supabase
            .from("homepage_images")
            .insert([
                {
                    title,
                    description,
                    image_url,
                    room_type,
                    display_order: Number.parseInt(display_order) || 0,
                    is_active: is_active !== false,
                },
            ])
            .select()

        if (error) {
            console.error("Database error:", error)
            return NextResponse.json({ error: "Failed to create image" }, { status: 500 })
        }

        return NextResponse.json(data[0], { status: 201 })
    } catch (error) {
        console.error("Server error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
