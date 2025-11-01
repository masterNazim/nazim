const AUTH_STORAGE_KEY = "eighthand_auth_data"
const PROFILE_STORAGE_KEY = "eighthand_profile_data"

class AuthStorage {
    // Save auth data to localStorage
    saveAuthData(user, profile) {
        try {
            const authData = {
                user: user
                    ? {
                        id: user.id,
                        email: user.email,
                        created_at: user.created_at,
                    }
                    : null,
                profile: profile || null,
                timestamp: Date.now(),
            }
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData))
            console.log("[v0] Auth data saved to localStorage:", authData)
        } catch (error) {
            console.error("[v0] Failed to save auth data:", error)
        }
    }

    // Get auth data from localStorage
    getAuthData() {
        try {
            const stored = localStorage.getItem(AUTH_STORAGE_KEY)
            if (!stored) return null

            const authData = JSON.parse(stored)

            // Check if data is less than 24 hours old
            const isExpired = Date.now() - authData.timestamp > 24 * 60 * 60 * 1000
            if (isExpired) {
                this.clearAuthData()
                return null
            }

            console.log("[v0] Auth data loaded from localStorage:", authData)
            return authData
        } catch (error) {
            console.error("[v0] Failed to load auth data:", error)
            return null
        }
    }

    // Clear auth data from localStorage
    clearAuthData() {
        try {
            localStorage.removeItem(AUTH_STORAGE_KEY)
            console.log("[v0] Auth data cleared from localStorage")
        } catch (error) {
            console.error("[v0] Failed to clear auth data:", error)
        }
    }

    // Check if user is admin from localStorage
    isAdmin() {
        const authData = this.getAuthData()
        return authData?.profile?.is_admin === true
    }

    // Get profile from localStorage
    getProfile() {
        const authData = this.getAuthData()
        return authData?.profile || null
    }

    // Get user from localStorage
    getUser() {
        const authData = this.getAuthData()
        return authData?.user || null
    }
}

export const authStorage = new AuthStorage()
