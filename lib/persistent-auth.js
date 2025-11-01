import { getSupabaseClient } from "./supabase.js"

class PersistentAuth {
  constructor() {
    this.isInitialized = false
    this.authState = null
    this.profile = null
    this.listeners = new Set()
    this.sessionKey = "eighthand_auth_session"
    this.profileKey = "eighthand_user_profile"
    this.lastRefresh = "eighthand_last_refresh"
    this.refreshPromise = null
    this.profilePromise = null

    // Prevent multiple initializations
    if (typeof window !== "undefined") {
      this.restoreSession()
    }
  }

  // Restore session from localStorage
  restoreSession() {
    try {
      const savedSession = localStorage.getItem(this.sessionKey)
      const savedProfile = localStorage.getItem(this.profileKey)
      const lastRefresh = localStorage.getItem(this.lastRefresh)

      if (savedSession) {
        this.authState = JSON.parse(savedSession)
        console.log("[v0] Restored auth session from cache")
      }

      if (savedProfile) {
        this.profile = JSON.parse(savedProfile)
        console.log("[v0] Restored profile from cache")
      }

      // Check if session needs refresh (every 30 minutes)
      const now = Date.now()
      const lastRefreshTime = lastRefresh ? Number.parseInt(lastRefresh) : 0
      const thirtyMinutes = 30 * 60 * 1000

      if (this.authState && now - lastRefreshTime > thirtyMinutes) {
        console.log("[v0] Session needs refresh, refreshing silently...")
        this.silentRefresh()
      }
    } catch (error) {
      console.error("[v0] Error restoring session:", error)
      this.clearSession()
    }
  }

  // Save session to localStorage
  saveSession(session, profile = null) {
    try {
      if (session) {
        localStorage.setItem(this.sessionKey, JSON.stringify(session))
        localStorage.setItem(this.lastRefresh, Date.now().toString())
        this.authState = session
      }

      if (profile) {
        localStorage.setItem(this.profileKey, JSON.stringify(profile))
        this.profile = profile
      }

      this.notifyListeners()
    } catch (error) {
      console.error("[v0] Error saving session:", error)
    }
  }

  // Clear session from localStorage
  clearSession() {
    localStorage.removeItem(this.sessionKey)
    localStorage.removeItem(this.profileKey)
    localStorage.removeItem(this.lastRefresh)
    this.authState = null
    this.profile = null
    this.notifyListeners()
  }

  // Silent refresh without triggering auth state changes
  async silentRefresh() {
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = this.performSilentRefresh()
    const result = await this.refreshPromise
    this.refreshPromise = null
    return result
  }

  async performSilentRefresh() {
    try {
      if (!this.authState?.refresh_token) {
        return false
      }

      const supabase = getSupabaseClient()

      const { data, error } = await supabase.auth.setSession({
        access_token: this.authState.access_token,
        refresh_token: this.authState.refresh_token,
      })

      if (error) {
        console.error("[v0] Silent refresh failed:", error)
        this.clearSession()
        return false
      }

      if (data.session) {
        this.saveSession(data.session)
        console.log("[v0] Silent refresh successful")
        return true
      }

      return false
    } catch (error) {
      console.error("[v0] Silent refresh error:", error)
      this.clearSession()
      return false
    }
  }

  // Get current user with caching
  getUser() {
    return this.authState?.user || null
  }

  // Get profile with caching
  async getProfile(forceRefresh = false) {
    const user = this.getUser()
    console.log("[v0] getProfile called - user:", user ? "exists" : "null", "forceRefresh:", forceRefresh)

    if (!user) {
      console.log("[v0] getProfile: No user found, returning null")
      return null
    }

    // Return cached profile if available and not forcing refresh
    if (this.profile && !forceRefresh) {
      console.log("[v0] getProfile: Returning cached profile:", this.profile)
      return this.profile
    }

    // Prevent multiple concurrent profile fetches
    if (this.profilePromise) {
      console.log("[v0] getProfile: Profile fetch already in progress, waiting...")
      return this.profilePromise
    }

    console.log("[v0] getProfile: Starting fresh profile fetch for user ID:", user.id)
    this.profilePromise = this.fetchProfile(user.id)
    const profile = await this.profilePromise
    this.profilePromise = null
    console.log("[v0] getProfile: Profile fetch completed:", profile)
    return profile
  }

  async fetchProfile(userId) {
    try {
      console.log("[v0] fetchProfile: Starting fetch for user ID:", userId)
      const supabase = getSupabaseClient()

      if (this.authState) {
        console.log("[v0] fetchProfile: Setting session with access token")
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: this.authState.access_token,
          refresh_token: this.authState.refresh_token,
        })

        if (sessionError) {
          console.error("[v0] fetchProfile: Session set error:", sessionError)
          return null
        }
      } else {
        console.log("[v0] fetchProfile: No auth state available")
      }

      console.log("[v0] fetchProfile: Querying profiles table...")
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email, phone, address, is_admin")
        .eq("id", userId)
        .single()

      if (error) {
        console.error("[v0] fetchProfile: Database query error:", error)
        if (error.code === "PGRST116") {
          console.log("[v0] fetchProfile: Profile doesn't exist, creating one...")
          return await this.createProfile(userId)
        }
        return null
      }

      console.log("[v0] fetchProfile: Successfully fetched profile:", data)
      this.saveSession(this.authState, data)
      return data
    } catch (error) {
      console.error("[v0] fetchProfile: Unexpected error:", error)
      return null
    }
  }

  async createProfile(userId) {
    try {
      console.log("[v0] createProfile: Creating profile for user ID:", userId)
      const supabase = getSupabaseClient()

      const { data: userData } = await supabase.auth.getUser()
      const email = userData?.user?.email || ""

      const { data, error } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          email: email,
          full_name: "",
          phone: "",
          address: "",
          is_admin: false,
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] createProfile: Failed to create profile:", error)
        return null
      }

      console.log("[v0] createProfile: Successfully created profile:", data)
      this.saveSession(this.authState, data)
      return data
    } catch (error) {
      console.error("[v0] createProfile: Unexpected error:", error)
      return null
    }
  }

  // Sign in and cache session
  async signIn(email, password) {
    try {
      const supabase = getSupabaseClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      if (data.session) {
        this.saveSession(data.session)
        // Fetch profile after successful sign in
        await this.getProfile(true)
      }

      return { data, error: null }
    } catch (error) {
      console.error("[v0] Sign in error:", error)
      return { data: null, error }
    }
  }

  // Sign out and clear cache
  async signOut() {
    try {
      const supabase = getSupabaseClient()

      if (this.authState) {
        await supabase.auth.setSession({
          access_token: this.authState.access_token,
          refresh_token: this.authState.refresh_token,
        })
        await supabase.auth.signOut()
      }

      this.clearSession()
      return { error: null }
    } catch (error) {
      console.error("[v0] Sign out error:", error)
      this.clearSession() // Clear anyway
      return { error }
    }
  }

  // Add auth state listener
  onAuthStateChange(callback) {
    this.listeners.add(callback)

    // Immediately call with current state
    callback(this.authState ? "SIGNED_IN" : "SIGNED_OUT", this.authState)

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback)
    }
  }

  // Notify all listeners
  notifyListeners() {
    const event = this.authState ? "SIGNED_IN" : "SIGNED_OUT"
    this.listeners.forEach((callback) => {
      try {
        callback(event, this.authState)
      } catch (error) {
        console.error("[v0] Auth listener error:", error)
      }
    })
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.authState?.user
  }

  // Get access token
  getAccessToken() {
    return this.authState?.access_token || null
  }
}

// Create singleton instance
const persistentAuth = new PersistentAuth()

export default persistentAuth
