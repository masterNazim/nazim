"use client"

import { createClient } from "@supabase/supabase-js"

// Enhanced Supabase client with automatic session management
class SupabaseAuthManager {
  constructor() {
    this.client = null
    this.lastActivity = Date.now()
    this.refreshTimer = null
    this.isRefreshing = false // prevent concurrent refresh attempts
    this.refreshPromise = null // store ongoing refresh promise
    this.initializeClient()
    this.setupActivityTracking()
  }

  initializeClient() {
    this.client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: "pkce",
      },
      realtime: {
        params: {
          eventsPerSecond: 2,
        },
      },
    })

    // Listen for auth state changes
    this.client.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] Auth state changed:", event, session ? "Session exists" : "No session")

      if (event === "SIGNED_IN" && session) {
        console.log("[v0] User signed in, starting session management")
        this.startSessionManagement()
        this.isRefreshing = false // reset refresh state on sign in
      } else if (event === "SIGNED_OUT") {
        console.log("[v0] User signed out, stopping session management")
        this.stopSessionManagement()
        this.isRefreshing = false // reset refresh state on sign out
      } else if (event === "TOKEN_REFRESHED" && session) {
        console.log("[v0] Token refreshed successfully")
        this.lastActivity = Date.now()
        this.isRefreshing = false // reset refresh state after successful refresh
        this.refreshPromise = null // clear refresh promise
      }
    })
  }

  setupActivityTracking() {
    // Track user activity to know when to refresh sessions
    const trackActivity = () => {
      this.lastActivity = Date.now()
    }

    if (typeof window !== "undefined") {
      ;["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"].forEach((event) => {
        document.addEventListener(event, trackActivity, { passive: true })
      })

      // Track page visibility changes
      document.addEventListener("visibilitychange", async () => {
        if (!document.hidden) {
          console.log("[v0] Page became visible, checking session...")
          await this.ensureValidSession()
        }
      })
    }
  }

  startSessionManagement() {
    this.stopSessionManagement() // Clear any existing timer

    this.refreshTimer = setInterval(
      async () => {
        await this.ensureValidSession()
      },
      5 * 60 * 1000,
    )
  }

  stopSessionManagement() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  async ensureValidSession() {
    if (this.isRefreshing && this.refreshPromise) {
      console.log("[v0] Session refresh already in progress, waiting...")
      return await this.refreshPromise
    }

    try {
      const {
        data: { session },
        error,
      } = await this.client.auth.getSession()

      if (error) {
        console.warn("[v0] Error getting session:", error)
        return false
      }

      if (!session) {
        console.log("[v0] No active session")
        return true // No session is fine for anonymous access
      }

      // Check if session is close to expiring (within 10 minutes)
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = session.expires_at
      const timeUntilExpiry = expiresAt - now

      console.log(`[v0] Session expires in ${Math.floor(timeUntilExpiry / 60)} minutes`)

      if (timeUntilExpiry < 600) {
        // increased to 10 minutes for earlier refresh
        if (this.isRefreshing) {
          console.log("[v0] Refresh already in progress")
          return await this.refreshPromise
        }

        console.log("[v0] Session expiring soon, refreshing...")
        this.isRefreshing = true

        this.refreshPromise = this.client.auth.refreshSession()
        const { error: refreshError } = await this.refreshPromise

        if (refreshError) {
          console.error("[v0] Failed to refresh session:", refreshError)
          this.isRefreshing = false
          this.refreshPromise = null
          return false
        }

        console.log("[v0] Session refreshed successfully")
        this.isRefreshing = false
        this.refreshPromise = null
      }

      return true
    } catch (error) {
      console.error("[v0] Error ensuring valid session:", error)
      this.isRefreshing = false
      this.refreshPromise = null
      return false
    }
  }

  // Safe query wrapper that handles auth sessions
  async safeQuery(queryFn, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt === 0) {
          const sessionValid = await this.ensureValidSession()
          if (!sessionValid) {
            console.log("[v0] Session invalid, skipping query")
            throw new Error("Invalid session")
          }
        }

        // Execute the query
        const result = await queryFn(this.client)
        return result
      } catch (error) {
        console.warn(`[v0] Query attempt ${attempt + 1} failed:`, error)

        if (this.isAuthError(error) && attempt < retries && !this.isRefreshing) {
          console.log("[v0] Auth error detected, will retry after delay...")

          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 2000))
        } else if (attempt === retries) {
          throw error
        }
      }
    }
  }

  isAuthError(error) {
    const errorMessage = error?.message?.toLowerCase() || ""
    const errorCode = error?.code || ""

    return (
      errorMessage.includes("jwt") ||
      errorMessage.includes("token") ||
      errorMessage.includes("session") ||
      errorMessage.includes("authentication") ||
      errorMessage.includes("unauthorized") ||
      errorCode === "PGRST301" ||
      errorCode === "PGRST302"
    )
  }

  // Get the managed client
  getClient() {
    return this.client
  }

  // Create a fresh client for API routes (no session persistence)
  createFreshClient() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  }
}

// Global instance
const authManager = new SupabaseAuthManager()

// Export the managed client and utilities
export const supabase = authManager.getClient()
export const safeQuery = (queryFn, retries) => authManager.safeQuery(queryFn, retries)
export const createFreshClient = () => authManager.createFreshClient()
export const ensureValidSession = () => authManager.ensureValidSession()

export default authManager
