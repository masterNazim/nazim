// Simple in-memory cache for development and production
class MemoryCache {
  constructor() {
    this.cache = new Map()
    this.timers = new Map()
  }

  set(key, value, ttlSeconds = 300) {
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
    }

    // Set the value
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    })

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key)
    }, ttlSeconds * 1000)

    this.timers.set(key, timer)
  }

  get(key) {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key)
      return null
    }

    return entry.data
  }

  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
      this.timers.delete(key)
    }
    this.cache.delete(key)
  }

  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.cache.clear()
    this.timers.clear()
  }

  has(key) {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key)
      return false
    }
    
    return true
  }

  size() {
    return this.cache.size
  }
}

// Global cache instance
const cache = new MemoryCache()

// Helper function to create cache keys
export function createCacheKey(prefix, ...parts) {
  return `${prefix}:${parts.filter(Boolean).join(':')}`
}

// Helper function to add cache headers to responses
export function addCacheHeaders(response, maxAge = 300, sMaxAge = 600) {
  response.headers.set('Cache-Control', `public, max-age=${maxAge}, s-maxage=${sMaxAge}`)
  response.headers.set('Vary', 'Accept-Encoding')
  return response
}

// Cached database query wrapper
export async function cachedQuery(key, queryFn, ttlSeconds = 300) {
  // Try to get from cache first
  const cached = cache.get(key)
  if (cached) {
    console.log(`Cache hit for key: ${key}`)
    return cached
  }

  console.log(`Cache miss for key: ${key}`)
  
  try {
    // Execute the query
    const result = await queryFn()
    
    // Cache the result if successful
    if (result && !result.error) {
      cache.set(key, result, ttlSeconds)
    }
    
    return result
  } catch (error) {
    console.error(`Query failed for key: ${key}`, error)
    throw error
  }
}

// Cache invalidation helpers
export function invalidateCache(pattern) {
  const keys = Array.from(cache.cache.keys())
  const keysToDelete = keys.filter(key => key.includes(pattern))
  
  keysToDelete.forEach(key => {
    cache.delete(key)
    console.log(`Invalidated cache key: ${key}`)
  })
  
  return keysToDelete.length
}

export function invalidateAllProductCache() {
  return invalidateCache('products')
}

export function invalidateAllCategoryCache() {
  return invalidateCache('categories')
}

export default cache
