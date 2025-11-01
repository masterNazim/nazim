import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function DELETE(request, { params }) {
    try {
        const { id } = params

        const { error } = await supabaseAdmin.from("contact_messages").delete().eq("id", id)

        if (error) {
            console.error("Database error:", error)
            return Response.json(
                {
                    success: false,
                    error: "Failed to delete message",
                },
                { status: 500 },
            )
        }

        return Response.json({
            success: true,
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

export async function PATCH(request, { params }) {
    try {
        const { id } = params
        const { is_read } = await request.json()

        const { error } = await supabaseAdmin.from("contact_messages").update({ is_read }).eq("id", id)

        if (error) {
            console.error("Database error:", error)
            return Response.json(
                {
                    success: false,
                    error: "Failed to update message",
                },
                { status: 500 },
            )
        }

        return Response.json({
            success: true,
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
