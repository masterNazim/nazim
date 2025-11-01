"use client"

import { useEffect, useState, useRef } from "react"
import persistentAuth from "@/lib/persistent-auth"
import { authStorage } from "@/lib/auth-storage"

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const isMounted = useRef(true)
  const isInitialized = useRef(false)

  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    const initializeAuth = async () => {
      try {
        const storedAuthData = authStorage.getAuthData()
        if (storedAuthData && isMounted.current) {
          console.log("[v0] useAuth: Loading from localStorage immediately")
          setUser(storedAuthData.user)
          setProfile(storedAuthData.profile)
          setLoading(false)
          return
        }

        // Fallback to persistent auth cache
        const cachedUser = persistentAuth.getUser()
        if (cachedUser && isMounted.current) {
          setUser(cachedUser)

          // Wait for cached profile to load before setting loading false
          const cachedProfile = await persistentAuth.getProfile()
          if (isMounted.current) {
            setProfile(cachedProfile)
            authStorage.saveAuthData(cachedUser, cachedProfile)
            setLoading(false)
          }
        } else {
          if (isMounted.current) {
            setLoading(false)
          }
        }
      } catch (error) {
        console.error("[v0] useAuth initialization error:", error)
        if (isMounted.current) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const unsubscribe = persistentAuth.onAuthStateChange((event, session) => {
      if (!isMounted.current) return

      console.log("[v0] useAuth: Auth state changed:", event)

      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        // Get profile from cache or fetch if needed
        persistentAuth.getProfile().then((profileData) => {
          if (isMounted.current) {
            setProfile(profileData)
            authStorage.saveAuthData(currentUser, profileData)
          }
        })
      } else {
        setProfile(null)
        authStorage.clearAuthData()
      }

      if (isMounted.current) {
        setLoading(false)
      }
    })

    return () => {
      isMounted.current = false
      unsubscribe()
    }
  }, [])

  const signIn = async (email, password) => {
    setLoading(true)
    try {
      const result = await persistentAuth.signIn(email, password)

      if (result.data?.session && isMounted.current) {
        const currentUser = result.data.session.user
        setUser(currentUser)
        const profileData = await persistentAuth.getProfile(true)
        if (isMounted.current) {
          setProfile(profileData)
          authStorage.saveAuthData(currentUser, profileData)
        }
      }

      return result
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }

  const signUp = async (email, password, fullName) => {
    // For now, use direct Supabase call for signup
    // TODO: Move this to persistent auth system
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    return { data, error }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const result = await persistentAuth.signOut()

      if (isMounted.current) {
        setUser(null)
        setProfile(null)
        authStorage.clearAuthData()
      }

      return result
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }

  const refreshUser = async () => {
    if (!isMounted.current) return

    const currentUser = persistentAuth.getUser()
    setUser(currentUser)

    if (currentUser) {
      const profileData = await persistentAuth.getProfile(true) // Force refresh
      if (isMounted.current) {
        setProfile(profileData)
        authStorage.saveAuthData(currentUser, profileData)
      }
    }
  }

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
    isAdmin: profile?.is_admin ?? false,
  }
}
