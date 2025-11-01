"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Header from "./header"
import Footer from "./footer"
import ClientWhatsAppChat from "@/components/client-whatsapp-chat"

export default function ConditionalLayout({ children }) {
    const pathname = usePathname()
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    if (!isClient) {
        return <>{children}</>
    }

    const isAdminRoute = pathname?.startsWith("/admin")

    return (
        <>
            {!isAdminRoute && <Header />}
            {children}
            {!isAdminRoute && <Footer />}
            {!isAdminRoute && <ClientWhatsAppChat />}
        </>
    )
}
