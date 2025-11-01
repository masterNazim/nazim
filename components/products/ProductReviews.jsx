'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Star, MessageSquare, Camera, X, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase, safeQuery, ensureUserProfile } from '@/lib/supabase'
import { toast } from 'sonner'

export default function ProductReviews({ productId }) {
  console.log('ProductReviews component rendered with productId:', productId)
  
  const [reviews, setReviews] = useState([])
  const [reviewStats, setReviewStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()

  // Review form state
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [reviewImages, setReviewImages] = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)

  console.log('=== COMPONENT STATE DEBUG ===')
  console.log('User exists:', !!user)
  console.log('User ID:', user?.id)
  console.log('Show modal:', showReviewModal)
  console.log('Reviews count:', reviews.length)
  console.log('Loading:', loading)

  // Define fetch functions with useCallback to prevent unnecessary re-renders
  const fetchReviews = useCallback(async () => {
    try {
      console.log('Fetching reviews for product:', productId)
      
      // Use the function that matches your schema
      let { data, error } = await supabase.rpc('get_product_reviews_public', {
        product_id_param: productId
      })

      if (error) {
        console.warn('Function query failed, trying direct query:', error)
        
        // Fallback to direct query
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('reviews')
          .select(`
            *,
            profiles (
              full_name,
              email
            )
          `)
          .eq('product_id', productId)
          .eq('is_approved', true)
          .order('created_at', { ascending: false })
        
        if (fallbackError) {
          console.error('Error fetching reviews:', fallbackError)
          toast.error(`Failed to load reviews: ${fallbackError.message || 'Unknown error'}`)
          return
        }
        
        // Transform fallback data
        data = fallbackData.map(review => ({
          ...review,
          user_name: review.profiles?.full_name || 'Anonymous User',
          user_email: review.profiles?.email || null
        }))
      }
      
      console.log('Reviews fetched successfully:', data?.length || 0)
      setReviews(data || [])
    } catch (error) {
      console.error('Error fetching reviews:', error.message || error)
      toast.error(`Failed to load reviews: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }, [productId])

  const fetchReviewStats = useCallback(async () => {
    try {
      console.log('Fetching review stats for product:', productId)
      
      // Calculate stats manually since view might not exist
      const { data: reviewData, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', productId)
        .eq('is_approved', true)

      if (error) {
        console.error('Error fetching review stats:', error)
        return
      }
      
      if (reviewData && reviewData.length > 0) {
        const totalReviews = reviewData.length
        const averageRating = reviewData.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        
        const stats = {
          total_reviews: totalReviews,
          average_rating: averageRating,
          five_star_count: reviewData.filter(r => r.rating === 5).length,
          four_star_count: reviewData.filter(r => r.rating === 4).length,
          three_star_count: reviewData.filter(r => r.rating === 3).length,
          two_star_count: reviewData.filter(r => r.rating === 2).length,
          one_star_count: reviewData.filter(r => r.rating === 1).length
        }
        
        setReviewStats(stats)
        console.log('Review stats calculated:', stats)
      } else {
        setReviewStats(null)
      }
    } catch (error) {
      console.error('Error fetching review stats:', error.message || error)
    }
  }, [productId])
  
  // Fetch reviews and stats
  useEffect(() => {
    fetchReviews()
    fetchReviewStats()
  }, [fetchReviews, fetchReviewStats])

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return []
    
    setUploadingImages(true)
    const uploadedUrls = []

    try {
      console.log('Uploading review images:', files.length)
      
      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `reviews/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        console.log('Uploading file:', fileName)
        
        // Upload to productimage bucket (since review bucket might not exist)
        const { data, error } = await supabase.storage
          .from('productimage')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          console.error('Upload error:', error)
          console.warn(`Skipping image ${file.name} due to upload error`)
          continue
        }

        const { data: { publicUrl } } = supabase.storage
          .from('productimage')
          .getPublicUrl(fileName)

        uploadedUrls.push(publicUrl)
        console.log('Image uploaded successfully:', publicUrl)
      }
      
      console.log(`Successfully uploaded ${uploadedUrls.length} of ${files.length} images`)
      return uploadedUrls
    } catch (error) {
      console.error('Error uploading images:', error)
      console.warn('Image upload failed, continuing without images')
      return []
    } finally {
      setUploadingImages(false)
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    
    console.log('=== REVIEW SUBMISSION DEBUG ===')
    console.log('User:', user)
    console.log('Rating:', rating)
    console.log('Comment:', comment)
    console.log('Title:', title)
    console.log('Images:', reviewImages)
    
    if (!user) {
      console.log('ERROR: No user found')
      toast.error('Please sign in to submit a review')
      return
    }

    if (rating === 0) {
      console.log('ERROR: No rating selected')
      toast.error('Please select a rating')
      return
    }

    if (!comment.trim()) {
      console.log('ERROR: No comment provided')
      toast.error('Please write a review comment')
      return
    }

    setSubmitting(true)
    console.log('Starting review submission process...')

    try {
      console.log('Starting review submission...')
      
      // Ensure user profile exists
      console.log('Ensuring user profile exists...')
      const profileExists = await ensureUserProfile(user)
      if (!profileExists) {
        throw new Error('Failed to create or verify user profile')
      }
      console.log('User profile verified')
      
      // Upload images if any (but don't fail if upload fails)
      let imageUrls = []
      if (reviewImages.length > 0) {
        console.log('Uploading review images...')
        try {
          imageUrls = await handleImageUpload(reviewImages)
        } catch (uploadError) {
          console.warn('Image upload failed, continuing without images:', uploadError)
        }
        console.log('Images uploaded:', imageUrls.length)
      }

      // Prepare review data
      const reviewData = {
        product_id: productId,
        user_id: user.id,
        rating,
        title: title.trim() || null,
        comment: comment.trim(),
        image_urls: imageUrls.length > 0 ? imageUrls : null,
      }
      
      console.log('Submitting review:', reviewData)
      
      // Submit review
      const { data, error } = await safeQuery(async () => 
        supabase
          .from('reviews')
          .insert(reviewData)
          .select()
      )

      if (error) {
        console.error('Supabase error:', error)
        let errorMessage = 'Failed to submit review';
        
        if (error.code === '23503') {
          errorMessage = 'Invalid product or user reference';
        } else if (error.code === '23514') {
          errorMessage = 'Rating must be between 1 and 5';
        } else if (error.code === '42501') {
          errorMessage = 'Permission denied. Please ensure you are signed in.';
        } else if (error.message) {
          errorMessage += `: ${error.message}`;
        }
        
        toast.error(errorMessage);
        return;
      }

      console.log('Review submitted successfully:', data)
      toast.success('Review submitted successfully! It will be visible after admin approval.')
      
      // Reset form
      setRating(0)
      setTitle('')
      setComment('')
      setReviewImages([])
      setShowReviewModal(false)
      
      // Refresh reviews
      fetchReviews()
      fetchReviewStats()
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error('Failed to submit review: ' + (error.message || 'Unknown error'))
    } finally {
      setSubmitting(false)
      console.log('Review submission process completed')
    }
  }

  const openReviewModal = () => {
    console.log('=== OPENING REVIEW MODAL ===')
    console.log('User exists:', !!user)
    console.log('User details:', user)
    
    if (!user) {
      console.log('No user, showing error')
      toast.error('Please sign in to write a review')
      return
    }
    
    console.log('Setting showReviewModal to true')
    setShowReviewModal(true)
    console.log('Modal should now be open')
  }

  const closeReviewModal = () => {
    console.log('=== CLOSING REVIEW MODAL ===')
    setShowReviewModal(false)
    // Reset form
    setRating(0)
    setTitle('')
    setComment('')
    setReviewImages([])
  }

  const renderStars = (rating, interactive = false, onStarClick = null) => {
    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } ${
              interactive ? 'cursor-pointer hover:text-yellow-400' : ''
            }`}
            onClick={() => {
              if (interactive && onStarClick) {
                console.log('Star clicked:', i + 1)
                onStarClick(i + 1)
              }
            }}
          />
        ))}
      </div>
    )
  }

  const renderRatingDistribution = () => {
    if (!reviewStats) return null

    const total = reviewStats.total_reviews
    const ratings = [
      { stars: 5, count: reviewStats.five_star_count },
      { stars: 4, count: reviewStats.four_star_count },
      { stars: 3, count: reviewStats.three_star_count },
      { stars: 2, count: reviewStats.two_star_count },
      { stars: 1, count: reviewStats.one_star_count }
    ]

    return (
      <div className="space-y-2">
        {ratings.map(({ stars, count }) => {
          const percentage = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={stars} className="flex items-center space-x-2 text-sm">
              <span className="w-8">{stars}</span>
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-8 text-gray-600">{count}</span>
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Customer Reviews</span>
            </span>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  console.log('=== WRITE REVIEW BUTTON CLICKED ===')
                  console.log('Current user:', user)
                  console.log('Current modal state:', showReviewModal)
                  openReviewModal()
                  console.log('After openReviewModal call, modal state:', showReviewModal)
                }}
                className="bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
              >
                ✍️ Write Review
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviewStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall Rating */}
              <div className="text-center">
                <div className="text-4xl font-bold text-amber-600 mb-2">
                  {reviewStats.average_rating?.toFixed(1) || '0.0'}
                </div>
                <div className="flex justify-center mb-2">
                  {renderStars(Math.round(reviewStats.average_rating || 0))}
                </div>
                <p className="text-gray-600">
                  Based on {reviewStats.total_reviews} review{reviewStats.total_reviews !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Rating Distribution */}
              <div>
                <h4 className="font-medium mb-3">Rating Distribution</h4>
                {renderRatingDistribution()}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Reviews */}
      {reviews.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Reviews ({reviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-amber-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {review.user_name || review.profiles?.full_name || 'Anonymous User'}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            {renderStars(review.rating)}
                            <span className="text-sm text-gray-500">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {review.title && (
                        <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
                      )}
                      
                      <p className="text-gray-700 mb-3">{review.comment}</p>
                      
                      {review.image_urls && review.image_urls.length > 0 && (
                        <div className="flex space-x-2 overflow-x-auto">
                          {review.image_urls.map((imageUrl, index) => (
                            <div key={index} className="flex-shrink-0">
                              <Image
                                src={imageUrl}
                                alt={`Review image ${index + 1}`}
                                width={80}
                                height={80}
                                className="object-cover rounded border"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Modal for Writing Reviews */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Write a Review</h2>
                <button
                  onClick={() => {
                    console.log('Close button clicked')
                    closeReviewModal()
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Debug Info in Modal */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-green-50 p-3 rounded mb-4 text-sm">
                  <strong>🐛 Form Debug:</strong><br/>
                  Rating: {rating} | Title: "{title}" | Comment: "{comment}" | Images: {reviewImages.length}
                </div>
              )}

              <form onSubmit={handleSubmitReview} className="space-y-6">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-700">
                    Rating * <span className="text-amber-600">(Click stars to rate)</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    {renderStars(rating, true, (newRating) => {
                      console.log('Rating clicked:', newRating)
                      setRating(newRating)
                    })}
                    <span className="ml-2 text-sm text-gray-600">
                      {rating > 0 ? `${rating}/5` : 'Select rating'}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Review Title (Optional)
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => {
                      console.log('Title changed:', e.target.value)
                      setTitle(e.target.value)
                    }}
                    placeholder="Summarize your review"
                    maxLength={100}
                    className="w-full"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Your Review *
                  </label>
                  <Textarea
                    value={comment}
                    onChange={(e) => {
                      console.log('Comment changed:', e.target.value)
                      setComment(e.target.value)
                    }}
                    placeholder="Share your experience with this product..."
                    rows={4}
                    maxLength={1000}
                    required
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {comment.length}/1000 characters
                  </div>
                </div>

                {/* Images */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Photos (Optional)
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      max="3"
                      onChange={(e) => {
                        console.log('Images selected:', e.target.files.length)
                        setReviewImages(Array.from(e.target.files))
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                    />
                    <p className="text-xs text-gray-500">
                      Maximum 3 images, 5MB each. Supported formats: JPG, PNG, WebP
                    </p>
                    {reviewImages.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {reviewImages.map((file, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              className="w-16 h-16 object-cover rounded border"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                console.log('Removing image:', index)
                                setReviewImages(prev => prev.filter((_, i) => i !== index))
                              }}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      console.log('Cancel button clicked')
                      closeReviewModal()
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || uploadingImages || rating === 0 || !comment.trim()}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
