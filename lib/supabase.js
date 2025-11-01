import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("[v0] Missing Supabase environment variables")
  throw new Error("Missing required Supabase environment variables")
}

try {
  new URL(supabaseUrl)
} catch (error) {
  console.error("[v0] Invalid Supabase URL format:", supabaseUrl)
  throw new Error("Invalid Supabase URL format")
}

let supabaseInstance = null

const CONNECTION_TIMEOUT = Number.parseInt(process.env.SUPABASE_CONNECTION_TIMEOUT) || 60000
const QUERY_TIMEOUT = Number.parseInt(process.env.SUPABASE_QUERY_TIMEOUT) || 45000
const ADMIN_TIMEOUT = Number.parseInt(process.env.SUPABASE_ADMIN_TIMEOUT) || 90000

function createSupabaseClient() {
  if (supabaseInstance) {
    console.log("[v0] Reusing existing Supabase client instance")
    return supabaseInstance
  }

  console.log("[v0] Creating new Supabase client instance with URL:", supabaseUrl)

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: "pkce",
    },
    global: {
      headers: {
        "x-client-info": "eighthand-furniture@1.0.0",
      },
      fetch: (url, options = {}) => {
        console.log("[v0] Supabase fetch to:", url)
        return fetch(url, {
          ...options,
          signal: options.signal || AbortSignal.timeout(CONNECTION_TIMEOUT),
        }).catch((error) => {
          console.error("[v0] Fetch error:", error.message)
          throw error
        })
      },
    },
    db: {
      schema: "public",
    },
  })

  // Test connection only once
  supabaseInstance
    .from("categories")
    .select("count", { count: "exact", head: true })
    .then(({ error }) => {
      if (error) {
        console.error("[v0] Supabase connection test failed:", error.message)
      } else {
        console.log("[v0] Supabase connection test successful")
      }
    })
    .catch((error) => {
      console.error("[v0] Supabase connection test error:", error.message)
    })

  return supabaseInstance
}

export const supabase = createSupabaseClient()

export function getSupabaseClient() {
  return createSupabaseClient()
}

const MAX_RETRY_ATTEMPTS = 5
const BASE_RETRY_DELAY = 2000

const queryCache = new Map()
const MAX_CACHE_SIZE = 100
const CACHE_TTL = 10 * 60 * 1000

function cleanupCache() {
  if (queryCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(queryCache.entries())
    const now = Date.now()

    entries.forEach(([key, value]) => {
      if (now - value.timestamp > CACHE_TTL) {
        queryCache.delete(key)
      }
    })

    if (queryCache.size > MAX_CACHE_SIZE) {
      const sortedEntries = entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      const toRemove = sortedEntries.slice(0, queryCache.size - MAX_CACHE_SIZE)
      toRemove.forEach(([key]) => queryCache.delete(key))
    }
  }
}

export async function safeQuery(queryFn, options = {}) {
  const { maxRetries = MAX_RETRY_ATTEMPTS, timeout = QUERY_TIMEOUT, cacheKey = null, cacheTTL = CACHE_TTL } = options

  let lastError = null

  if (cacheKey) {
    cleanupCache()
    const cached = queryCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < cacheTTL) {
      console.log(`[v0] Cache hit for key: ${cacheKey}`)
      return cached.data
    } else if (cacheKey) {
      console.log(`Cache miss for key: ${cacheKey}`)
    }
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[v0] Query attempt ${attempt + 1}/${maxRetries + 1} with ${timeout}ms timeout`)

      const result = await queryFn()

      if (cacheKey && result) {
        queryCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        })
        console.log(`[v0] Cached result for key: ${cacheKey}`)
      }

      console.log(`[v0] Query successful on attempt ${attempt + 1}`)
      return result
    } catch (error) {
      lastError = error
      console.warn(`[v0] Query attempt ${attempt + 1} failed:`, error.message)

      if (attempt < maxRetries && isRetryableError(error)) {
        const delay = BASE_RETRY_DELAY * Math.pow(2, attempt) + Math.random() * 1000
        console.log(`[v0] Retrying in ${Math.round(delay)}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      } else {
        break
      }
    }
  }

  console.error(`[v0] All query attempts failed:`, lastError?.message)
  throw lastError
}

function isRetryableError(error) {
  if (!error) return false
  const errorMessage = error.message?.toLowerCase() || ""
  const errorCode = error.code || ""

  const retryablePatterns = [
    "network",
    "timeout",
    "fetch",
    "connection",
    "abort",
    "temporary",
    "unavailable",
    "econnreset",
    "enotfound",
    "etimedout",
    "econnrefused",
    "socket hang up",
    "service temporarily unavailable",
    "too many requests",
  ]

  const isRetryablePattern = retryablePatterns.some((pattern) => errorMessage.includes(pattern))

  const retryableCodes = ["PGRST301", "PGRST302", "08000", "08003", "08006", "57014", "23505"]

  return (
    isRetryablePattern ||
    retryableCodes.includes(errorCode) ||
    error.name === "AbortError" ||
    error.name === "TimeoutError" ||
    (error.status >= 500 && error.status < 600)
  )
}

export async function ensureUserProfile(user) {
  if (!user) return false

  try {
    const result = await safeQuery(
      async () => {
        const { data: existingProfile, error: fetchError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle()

        if (fetchError && fetchError.code !== "PGRST116") {
          throw fetchError
        }

        if (existingProfile) {
          return true
        }

        console.log("[v0] Creating missing profile for user:", user.id)
        const { error: insertError } = await supabase.from("profiles").insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          is_admin: false,
        })

        if (insertError) {
          throw insertError
        }

        return true
      },
      { maxRetries: 3, timeout: ADMIN_TIMEOUT / 2 },
    )

    return result
  } catch (error) {
    console.error("[v0] Error ensuring user profile:", error.message)
    return false
  }
}
