"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"
import { User, Mail, Calendar, ShoppingBag, LogOut, Edit, Save, X, RefreshCw, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import persistentAuth from "@/lib/persistent-auth"

export default function AccountPage() {
  const { user, signOut, loading: authLoading, refreshUser } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
  })
  const [profileState, setProfileState] = useState({
    loading: false,
    error: null,
  })
  const mountedRef = useRef(true)
  const hasLoadedProfile = useRef(false)

  const fetchProfileData = async (forceRefresh = false) => {
    if (!user || !mountedRef.current) return

    try {
      console.log("[v0] Starting profile fetch for user:", user.id)
      setProfileState({ loading: true, error: null })

      // Use persistent auth system for profile fetching
      const profileInfo = await persistentAuth.getProfile(forceRefresh)

      if (!mountedRef.current) return

      if (profileInfo) {
        const formattedProfile = {
          full_name: profileInfo.full_name || user?.email?.split("@")[0] || "",
          email: profileInfo.email || user?.email || "",
          phone: profileInfo.phone || "",
          address: profileInfo.address || "",
        }
        setProfileData(formattedProfile)
        hasLoadedProfile.current = true
        console.log("[v0] Profile fetch successful")
      } else {
        // Use default profile if none exists
        const defaultProfile = {
          full_name: user?.email?.split("@")[0] || "",
          email: user?.email || "",
          phone: "",
          address: "",
        }
        setProfileData(defaultProfile)
        hasLoadedProfile.current = true
      }

      setProfileState({ loading: false, error: null })
    } catch (error) {
      console.error("[v0] Error fetching profile:", error.message)

      if (!mountedRef.current) return

      setProfileState({
        loading: false,
        error: "Failed to load profile data. Please try again.",
      })

      toast.error("Failed to load profile data", {
        description: error.message,
        action: {
          label: "Retry",
          onClick: () => handleRetry(),
        },
      })
    }
  }

  const handleRetry = () => {
    console.log("[v0] Manual retry triggered")
    hasLoadedProfile.current = false
    fetchProfileData(true)
  }

  useEffect(() => {
    console.log("[v0] Account page useEffect triggered", { authLoading, user: !!user })

    if (authLoading) return

    if (!user) {
      router.push("/auth")
      return
    }

    // Only fetch profile once per mount
    if (!hasLoadedProfile.current) {
      fetchProfileData()
    }

    return () => {
      mountedRef.current = false
    }
  }, [user, authLoading, router])

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const handleLogout = async () => {
    try {
      setIsSaving(true)
      const { error } = await signOut()
      if (error) throw error

      toast.success("Logged out successfully")
      router.push("/")
    } catch (error) {
      toast.error("Error logging out")
      console.error("[v0] Logout error:", error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)
      console.log("[v0] Starting profile update...")

      // Use direct Supabase call for profile update
      const { createClient } = await import("@supabase/supabase-js")
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

      // Set session from persistent auth
      const accessToken = persistentAuth.getAccessToken()
      if (accessToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: persistentAuth.authState?.refresh_token,
        })
      }

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: profileData.full_name,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address,
      })

      if (error) throw error

      // Update persistent auth cache
      await persistentAuth.getProfile(true) // Force refresh cache

      toast.success("Profile updated successfully")
      setIsEditing(false)
    } catch (error) {
      console.error("[v0] Profile update error:", error.message)
      toast.error("Error updating profile: " + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const isLoading = authLoading || (profileState.loading && !hasLoadedProfile.current)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">Loading your account...</p>
          <p className="text-sm text-gray-500">This may take a few moments...</p>

          {profileState.error && (
            <div className="bg-red-50 p-4 rounded-md mb-4 mt-4">
              <div className="flex items-center text-red-800 mb-2">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>Error: {profileState.error}</span>
              </div>
              <Button variant="outline" onClick={handleRetry} className="flex items-center mx-auto bg-transparent">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        {profileState.error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">Failed to load profile: {profileState.error}</p>
              <Button variant="outline" size="sm" onClick={handleRetry} className="ml-auto bg-transparent">
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="gap-2">
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveProfile} disabled={isSaving} className="gap-2">
                      {isSaving ? (
                        "Saving..."
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="full_name"
                        value={profileData.full_name}
                        onChange={(e) => handleInputChange("full_name", e.target.value)}
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.full_name || "Not provided"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <p className="text-gray-900">{profileData.email}</p>
                      <Badge variant="secondary" className="text-xs">
                        Verified
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.phone || "Not provided"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    {isEditing ? (
                      <Input
                        id="address"
                        value={profileData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        placeholder="Enter your address"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.address || "Not provided"}</p>
                    )}
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Member since{" "}
                    {new Date(user.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 bg-transparent"
                  onClick={() => router.push("/orders")}
                >
                  <ShoppingBag className="h-4 w-4" />
                  My Orders
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 bg-transparent"
                  onClick={() => router.push("/cart")}
                >
                  <ShoppingBag className="h-4 w-4" />
                  View Cart
                </Button>
                <Separator />
                <Button
                  variant="destructive"
                  className="w-full justify-start gap-2"
                  onClick={handleLogout}
                  disabled={isSaving}
                >
                  <LogOut className="h-4 w-4" />
                  {isSaving ? "Logging out..." : "Logout"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Orders</span>
                  <Badge variant="secondary">0</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Account Status</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
