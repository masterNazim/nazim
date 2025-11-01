"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { signIn, signUp } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  })

  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    fullName: "",
    confirmPassword: "",
  })

  const handleSignIn = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await signIn(signInData.email, signInData.password)

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password. Please check your credentials.")
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Please check your email and confirm your account before signing in.")
        } else {
          toast.error(error.message)
        }
      } else {
        toast.success("Welcome back!")

        const redirectTo = searchParams.get("redirect")

        if (redirectTo) {
          router.push(redirectTo)
        } else if (data?.user) {
          // Wait a moment for the profile to be cached by the persistent auth system
          setTimeout(async () => {
            try {
              const { createClient } = await import("@supabase/supabase-js")
              const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
              )

              // Set the session for this request
              await supabase.auth.setSession({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
              })

              const { data: profile } = await supabase
                .from("profiles")
                .select("is_admin")
                .eq("id", data.user.id)
                .single()

              if (profile?.is_admin) {
                router.push("/admin")
              } else {
                router.push("/")
              }
            } catch (profileError) {
              console.error("[v0] Profile check error:", profileError)
              // Fallback to home page if profile check fails
              router.push("/")
            }
          }, 100)
        } else {
          router.push("/")
        }
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()

    if (signUpData.password !== signUpData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await signUp(signUpData.email, signUpData.password, signUpData.fullName)

      if (error) {
        toast.error(error.message)
      } else {
        if (data.user && !data.user.email_confirmed_at) {
          toast.success("Account created! Please check your email to confirm your account before signing in.")
        } else {
          toast.success("Account created successfully!")
          const redirectTo = searchParams.get("redirect")
          router.push(redirectTo || "/")
        }
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-800 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">8H</span>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to EightHand</CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    value={signInData.email}
                    onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={isLoading}>
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <Input
                    type="text"
                    value={signUpData.fullName}
                    onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      placeholder="Create a password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Confirm Password</label>
                  <Input
                    type="password"
                    value={signUpData.confirmPassword}
                    onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                    placeholder="Confirm your password"
                    required
                  />
                </div>

                <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
