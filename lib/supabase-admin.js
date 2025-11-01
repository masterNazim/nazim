import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
}

const effectiveKey = supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseServiceKey) {
  console.warn(
    "[v0] ⚠️  Service role key not found. Using anon key - some admin operations may fail due to RLS policies.",
  )
}

if (typeof window !== "undefined" && supabaseServiceKey) {
  throw new Error("Supabase admin client with service role key cannot be used on the client side")
}

export const supabaseAdmin = createClient(supabaseUrl, effectiveKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: "public",
  },
  global: {
    headers: {
      "x-client-info": "eighthand-furniture-admin@1.0.0",
    },
  },
  pooler: {
    connectionString: supabaseUrl,
    max: 10, // Smaller pool for admin operations
    idleTimeoutMillis: 60000, // Keep admin connections longer
    connectionTimeoutMillis: 60000, // Longer timeout for admin operations
  },
})

const ADMIN_TIMEOUT = Number.parseInt(process.env.SUPABASE_ADMIN_TIMEOUT) || 60000 // Increased from 15s to 60s
const ADMIN_MAX_RETRIES = 3 // Increased from 2 to 3

export async function safeAdminQuery(queryFn, options = {}) {
  const { maxRetries = ADMIN_MAX_RETRIES, timeout = ADMIN_TIMEOUT } = options
  let lastError = null
  let abortController = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      abortController = new AbortController()

      console.log(`[v0] Admin query attempt ${attempt + 1}/${maxRetries + 1} with ${timeout}ms timeout`)

      const result = await Promise.race([
        queryFn(abortController.signal),
        new Promise((_, reject) =>
          setTimeout(() => {
            abortController?.abort()
            reject(new Error(`Admin query timeout after ${timeout}ms`))
          }, timeout),
        ),
      ])

      console.log(`[v0] Admin query successful on attempt ${attempt + 1}`)
      return result
    } catch (error) {
      console.error(`[v0] Admin query attempt ${attempt + 1} failed:`, error.message)
      lastError = error

      if (attempt < maxRetries && isAdminRetryableError(error)) {
        const delay = 2000 * (attempt + 1) // Longer delays for admin operations
        console.log(`[v0] Retrying admin query in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    } finally {
      if (abortController) {
        abortController.abort()
      }
    }
  }

  console.error("[v0] All admin query attempts failed:", lastError?.message)
  throw lastError
}

function isAdminRetryableError(error) {
  if (!error) return false
  const errorMessage = error.message?.toLowerCase() || ""
  const errorCode = error.code || ""

  return (
    errorMessage.includes("network") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("connection") ||
    errorMessage.includes("temporary") ||
    errorMessage.includes("unavailable") ||
    errorMessage.includes("busy") ||
    error.name === "AbortError" ||
    errorCode === "08000" || // Connection exception
    errorCode === "08003" || // Connection does not exist
    errorCode === "08006" || // Connection failure
    errorCode === "57014" || // Query cancelled
    errorCode === "53300" // Too many connections
  )
}

export async function checkAdminConnection() {
  try {
    const abortController = new AbortController()

    const { error } = await Promise.race([
      supabaseAdmin.from("categories").select("id").limit(1).abortSignal(abortController.signal).maybeSingle(),
      new Promise(
        (_, reject) =>
          setTimeout(() => {
            abortController.abort()
            reject(new Error("Admin connection check timeout"))
          }, 10000), // Increased timeout for connection check
      ),
    ])

    if (error) {
      console.warn("[v0] Admin connection check failed:", error.message)
      return false
    }

    console.log("[v0] Admin connection healthy")
    return true
  } catch (error) {
    console.error("[v0] Admin connection error:", error.message)
    return false
  }
}
