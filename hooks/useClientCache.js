'use client'

import { useState, useEffect, useCallback } from 'react'

class ClientCache {
  constructor() {
    this.cache = new Map()
    this.timestamps = new Map()
  }

  set(key, data, ttl = 300000) { // 5 minutes default
    this.cache.set(key, data)
    this.timestamps.set(key, Date.now() + ttl)
  }

  get(key) {
    const data = this.cache.get(key)
    const expiry = this.timestamps.get(key)

    if (!data || !expiry || Date.now() > expiry) {
      this.cache.delete(key)
      this.timestamps.delete(key)
      return null
    }

    return data
  }

  invalidate(pattern) {
    const keysToDelete = []
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key)
      this.timestamps.delete(key)
    })
    
    return keysToDelete.length
  }

  clear() {
    this.cache.clear()
    this.timestamps.clear()
  }
}

// Global client cache instance
const clientCache = new ClientCache()

export function useClientCache(key, fetchFn, options = {}) {
  const {
    ttl = 300000, // 5 minutes
    staleWhileRevalidate = true,
    retryAttempts = 3,
    retryDelay = 1000
  } = options

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isValidating, setIsValidating] = useState(false)

  const fetchData = useCallback(async (attempt = 0) => {
    try {
      if (attempt === 0) {
        setError(null)
        if (!staleWhileRevalidate || !data) {
          setLoading(true)
        } else {
          setIsValidating(true)
        }
      }

      const result = await fetchFn()
      
      // Cache the result
      clientCache.set(key, result, ttl)
      setData(result)
      setError(null)
      
    } catch (err) {
      console.error(`Cache fetch error for key ${key}:`, err)
      
      // Retry logic
      if (attempt < retryAttempts) {
        setTimeout(() => {
          fetchData(attempt + 1)
        }, retryDelay * (attempt + 1))
        return
      }
      
      setError(err.message || 'Failed to fetch data')
      
      // If we have stale data, keep it
      if (!staleWhileRevalidate || !data) {
        setData(null)
      }
    } finally {
      if (attempt === 0) {
        setLoading(false)
        setIsValidating(false)
      }
    }
  }, [key, fetchFn, ttl, retryAttempts, retryDelay, staleWhileRevalidate, data])

  const mutate = useCallback(async (newData) => {
    if (typeof newData === 'function') {
      // Optimistic update
      const updatedData = newData(data)
      setData(updatedData)
      clientCache.set(key, updatedData, ttl)
      
      try {
        // Revalidate in background
        await fetchData()
      } catch (err) {
        // Revert on error
        console.error('Mutate failed, reverting:', err)
        const cachedData = clientCache.get(key)
        if (cachedData) {
          setData(cachedData)
        }
      }
    } else {
      // Direct update
      setData(newData)
      clientCache.set(key, newData, ttl)
    }
  }, [key, data, fetchData, ttl])

  const revalidate = useCallback(() => {
    fetchData()
  }, [fetchData])

  const invalidate = useCallback(() => {
    clientCache.invalidate(key)
    setData(null)
    setError(null)
    fetchData()
  }, [key, fetchData])

  useEffect(() => {
    // Check cache first
    const cachedData = clientCache.get(key)
    if (cachedData) {
      setData(cachedData)
      setLoading(false)
      
      // Background revalidation if stale-while-revalidate
      if (staleWhileRevalidate) {
        setIsValidating(true)
        fetchData().finally(() => setIsValidating(false))
      }
    } else {
      fetchData()
    }
  }, [key, fetchData, staleWhileRevalidate])

  return {
    data,
    loading,
    error,
    isValidating,
    mutate,
    revalidate,
    invalidate
  }
}

// Hook for invalidating cache patterns
export function useCacheInvalidator() {
  const invalidatePattern = useCallback((pattern) => {
    return clientCache.invalidate(pattern)
  }, [])

  const clearCache = useCallback(() => {
    clientCache.clear()
  }, [])

  return {
    invalidatePattern,
    clearCache
  }
}

export default clientCache
