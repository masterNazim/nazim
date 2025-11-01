"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Star,
  MessageSquare,
  Check,
  X,
  Eye,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
} from "lucide-react"
import { supabase, safeQuery } from "@/lib/supabase"
import { supabaseAdmin, safeAdminQuery } from "@/lib/supabase-admin"
import { toast } from "sonner"

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pending")
  const [selectedReview, setSelectedReview] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)
  const timeoutRef = useRef(null)
  const abortControllerRef = useRef(null)

  useEffect(() => {
    fetchReviews()

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("Admin: Fetching all reviews...")

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      if (!currentUser) {
        throw new Error("No authenticated user found")
      }

      const { data: profile } = await safeQuery(
        async (signal) =>
          supabase.from("profiles").select("is_admin").eq("id", currentUser.id).single().abortSignal(signal),
        { timeout: 10000 },
      )

      if (!profile?.is_admin) {
        throw new Error("Access denied: Admin privileges required")
      }

      console.log("Admin access verified for user:", currentUser.id)

      const data = await safeAdminQuery(
        async (signal) => {
          // Try RPC function first
          try {
            const { data: rpcData, error: rpcError } = await supabaseAdmin
              .rpc("get_all_reviews_for_admin")
              .abortSignal(signal)

            if (!rpcError && rpcData) {
              return rpcData
            }
            console.warn("Admin RPC failed, trying direct query:", rpcError?.message)
          } catch (rpcErr) {
            console.warn("RPC function not available, using direct query")
          }

          // Fallback to direct query with joins
          const { data: fallbackData, error: fallbackError } = await supabaseAdmin
            .from("reviews")
            .select(`
              *,
              profiles (
                full_name,
                email
              ),
              products (
                name,
                image_url,
                image_urls
              )
            `)
            .order("created_at", { ascending: false })
            .abortSignal(signal)

          if (fallbackError) {
            // Final fallback to regular client
            const { data: regularData, error: regularError } = await supabase
              .from("reviews")
              .select(`
                *,
                profiles (
                  full_name,
                  email
                ),
                products (
                  name,
                  image_url,
                  image_urls
                )
              `)
              .order("created_at", { ascending: false })
              .abortSignal(signal)

            if (regularError) throw regularError
            return regularData
          }

          return fallbackData
        },
        {
          maxRetries: 2,
          timeout: 50000, // Increased timeout to 50 seconds for complex review queries
        },
      )

      const normalizedData = (data || []).map((review) => ({
        ...review,
        user_name: review.profiles?.full_name || "Anonymous User",
        user_email: review.profiles?.email || null,
        product_name: review.products?.name || "Unknown Product",
        product_image: review.products?.image_urls?.[0] || review.products?.image_url || "/placeholder.jpg",
      }))

      console.log("Admin: Reviews fetched successfully:", normalizedData?.length || 0)
      setReviews(normalizedData || [])
    } catch (error) {
      console.error("Error fetching reviews:", error)
      const isAbortError = error.name === "AbortError"
      const errorMessage = isAbortError
        ? "Request was cancelled or timed out. Please try again."
        : `Failed to load reviews: ${error.message}`

      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveReview = async (reviewId) => {
    setActionLoading(true)
    try {
      console.log("Approving review:", reviewId)

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      if (!currentUser) {
        throw new Error("No authenticated user found")
      }

      console.log("Current admin user:", currentUser.id)

      await safeAdminQuery(
        async (signal) => {
          // Try RPC function first
          try {
            const { data: approvalResult, error: approvalError } = await supabaseAdmin
              .rpc("approve_review_with_logging", {
                review_id_param: reviewId,
                admin_user_id: currentUser.id,
              })
              .abortSignal(signal)

            if (!approvalError) {
              return approvalResult
            }
            console.warn("RPC approval failed, using direct update:", approvalError.message)
          } catch (rpcErr) {
            console.warn("RPC function not available, using direct update")
          }

          // Fallback to direct update
          const { error: directError } = await supabaseAdmin
            .from("reviews")
            .update({
              is_approved: true,
              approved_at: new Date().toISOString(),
              approved_by: currentUser.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", reviewId)
            .abortSignal(signal)

          if (directError) {
            // Final fallback to regular client
            const { error: fallbackError } = await supabase
              .from("reviews")
              .update({
                is_approved: true,
                approved_at: new Date().toISOString(),
                approved_by: currentUser.id,
                updated_at: new Date().toISOString(),
              })
              .eq("id", reviewId)
              .abortSignal(signal)

            if (fallbackError) throw fallbackError
          }
        },
        {
          maxRetries: 1,
          timeout: 20000, // Reasonable timeout for approval operations
        },
      )

      console.log("Review approved successfully")
      toast.success("Review approved successfully")
      fetchReviews()
    } catch (error) {
      console.error("Error approving review:", error)
      const errorMessage = error.message.includes("timeout")
        ? "Approval timed out. Please try again."
        : `Failed to approve review: ${error.message}`
      toast.error(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectReview = async (reviewId) => {
    setActionLoading(true)
    try {
      console.log("Rejecting review:", reviewId)

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      if (!currentUser) {
        throw new Error("No authenticated user found")
      }

      await safeAdminQuery(
        async (signal) => {
          const { error } = await supabaseAdmin
            .from("reviews")
            .update({
              is_approved: false,
              approved_at: null,
              approved_by: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", reviewId)
            .abortSignal(signal)

          if (error) {
            // Fallback to regular client
            const { error: fallbackError } = await supabase
              .from("reviews")
              .update({
                is_approved: false,
                approved_at: null,
                approved_by: null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", reviewId)
              .abortSignal(signal)

            if (fallbackError) throw fallbackError
          }
        },
        {
          maxRetries: 1,
          timeout: 15000,
        },
      )

      console.log("Review rejected successfully")
      toast.success("Review rejected successfully")
      fetchReviews()
    } catch (error) {
      console.error("Error rejecting review:", error)
      const errorMessage = error.message.includes("timeout")
        ? "Rejection timed out. Please try again."
        : `Failed to reject review: ${error.message}`
      toast.error(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteReview = async (reviewId) => {
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      return
    }

    setActionLoading(true)
    try {
      console.log("Deleting review:", reviewId)

      await safeAdminQuery(
        async (signal) => {
          const { error } = await supabaseAdmin.from("reviews").delete().eq("id", reviewId).abortSignal(signal)

          if (error) {
            // Fallback to regular client
            const { error: fallbackError } = await supabase
              .from("reviews")
              .delete()
              .eq("id", reviewId)
              .abortSignal(signal)

            if (fallbackError) throw fallbackError
          }
        },
        {
          maxRetries: 1,
          timeout: 15000,
        },
      )

      console.log("Review deleted successfully")
      toast.success("Review deleted successfully")
      fetchReviews()
    } catch (error) {
      console.error("Error deleting review:", error)
      const errorMessage = error.message.includes("timeout")
        ? "Delete timed out. Please try again."
        : "Failed to delete review"
      toast.error(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    fetchReviews()
  }

  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
        ))}
      </div>
    )
  }

  const getStatusBadge = (isApproved) => {
    if (isApproved === true) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      )
    } else if (isApproved === false) {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          <X className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
    }
  }

  const filterReviews = (status) => {
    switch (status) {
      case "pending":
        return reviews.filter((review) => review.is_approved === false || review.is_approved === null)
      case "approved":
        return reviews.filter((review) => review.is_approved === true)
      case "all":
        return reviews
      default:
        return reviews
    }
  }

  const ReviewCard = ({ review }) => (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <Image
                src={review.products?.image_urls?.[0] || review.products?.image_url || "/placeholder.jpg"}
                alt={review.products?.name || "Product"}
                width={60}
                height={60}
                className="object-cover rounded border"
                onError={(e) => {
                  e.target.src = "/placeholder.jpg"
                }}
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-medium text-gray-900">{review.products?.name || "Unknown Product"}</h3>
                {getStatusBadge(review.is_approved)}
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{review.profiles?.full_name || "Anonymous"}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 mb-3">
                {renderStars(review.rating)}
                <span className="text-sm text-gray-600">({review.rating}/5)</span>
              </div>

              {review.title && <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>}

              <p className="text-gray-700 mb-3 line-clamp-3">{review.comment}</p>

              {review.image_urls && review.image_urls.length > 0 && (
                <div className="flex space-x-2 mb-3">
                  {review.image_urls.slice(0, 3).map((imageUrl, index) => (
                    <Image
                      key={index}
                      src={imageUrl || "/placeholder.svg"}
                      alt={`Review image ${index + 1}`}
                      width={50}
                      height={50}
                      className="object-cover rounded border"
                      onError={(e) => {
                        e.target.style.display = "none"
                      }}
                    />
                  ))}
                  {review.image_urls.length > 3 && (
                    <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-600">
                      +{review.image_urls.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setSelectedReview(review)}>
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Review Details</DialogTitle>
                  <DialogDescription>Detailed information about the customer review.</DialogDescription>
                </DialogHeader>
                {selectedReview && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Product</label>
                        <p className="font-medium">{selectedReview.products?.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Customer</label>
                        <p className="font-medium">{selectedReview.profiles?.full_name || "Anonymous User"}</p>
                        <p className="text-sm text-gray-600">{selectedReview.profiles?.email || "No email"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Rating</label>
                        <div className="flex items-center space-x-2">
                          {renderStars(selectedReview.rating)}
                          <span>({selectedReview.rating}/5)</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Date</label>
                        <p>{new Date(selectedReview.created_at).toLocaleString()}</p>
                      </div>
                    </div>

                    {selectedReview.title && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Title</label>
                        <p className="font-medium">{selectedReview.title}</p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-600">Review</label>
                      <p className="mt-1">{selectedReview.comment}</p>
                    </div>

                    {selectedReview.image_urls && selectedReview.image_urls.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Images</label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {selectedReview.image_urls.map((imageUrl, index) => (
                            <Image
                              key={index}
                              src={imageUrl || "/placeholder.svg"}
                              alt={`Review image ${index + 1}`}
                              width={150}
                              height={150}
                              className="object-cover rounded border"
                              onError={(e) => {
                                e.target.style.display = "none"
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {(review.is_approved === false || review.is_approved === null) && (
              <Button
                size="sm"
                onClick={() => {
                  console.log("Approve button clicked for review:", review.id)
                  console.log("Review current status:", review.is_approved)
                  handleApproveReview(review.id)
                }}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-1" />
                {actionLoading ? "Approving..." : "Approve"}
              </Button>
            )}

            {review.is_approved === true && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  console.log("Reject button clicked for review:", review.id)
                  console.log("Review current status:", review.is_approved)
                  handleRejectReview(review.id)
                }}
                disabled={actionLoading}
              >
                <X className="h-4 w-4 mr-1" />
                {actionLoading ? "Rejecting..." : "Reject"}
              </Button>
            )}

            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDeleteReview(review.id)}
              disabled={actionLoading}
            >
              <X className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Reviews Management</h1>
        </div>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
          <p className="text-sm text-gray-500 mt-2">This may take up to 50 seconds for complex queries</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to Load Reviews</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRetry} variant="outline" className="flex items-center bg-transparent">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const pendingReviews = filterReviews("pending")
  const approvedReviews = filterReviews("approved")
  const allReviews = filterReviews("all")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reviews Management</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MessageSquare className="h-4 w-4" />
            <span>{allReviews.length} Total Reviews</span>
          </div>
          <Button onClick={fetchReviews} variant="outline" className="flex items-center bg-transparent">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{pendingReviews.length}</p>
                <p className="text-sm text-gray-600">Pending Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{approvedReviews.length}</p>
                <p className="text-sm text-gray-600">Approved Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{allReviews.length}</p>
                <p className="text-sm text-gray-600">Total Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Pending ({pendingReviews.length})</span>
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Approved ({approvedReviews.length})</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>All ({allReviews.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingReviews.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Reviews</h3>
                <p className="text-gray-600">All reviews have been processed.</p>
              </CardContent>
            </Card>
          ) : (
            pendingReviews.map((review) => <ReviewCard key={review.id} review={review} />)
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedReviews.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Approved Reviews</h3>
                <p className="text-gray-600">No reviews have been approved yet.</p>
              </CardContent>
            </Card>
          ) : (
            approvedReviews.map((review) => <ReviewCard key={review.id} review={review} />)
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {allReviews.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews</h3>
                <p className="text-gray-600">No reviews have been submitted yet.</p>
              </CardContent>
            </Card>
          ) : (
            allReviews.map((review) => <ReviewCard key={review.id} review={review} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
