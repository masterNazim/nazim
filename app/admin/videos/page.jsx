"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Plus, Edit, Trash2, Video, Eye, EyeOff, Save, X } from "lucide-react"

export const dynamic = "force-dynamic"

export default function AdminVideosPage() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingVideo, setEditingVideo] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    youtube_id: "",
    display_order: 1,
    is_active: true,
  })

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/videos")
      const result = await response.json()

      if (!result.success) throw new Error(result.error)
      setVideos(result.data || [])
    } catch (error) {
      console.error("Error fetching videos:", error)
      toast.error("Failed to fetch videos")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title || !formData.youtube_id) {
      toast.error("Title and YouTube ID are required")
      return
    }

    try {
      const url = editingVideo ? `/api/admin/videos/${editingVideo.id}` : "/api/admin/videos"
      const method = editingVideo ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      toast.success(editingVideo ? "Video updated successfully" : "Video created successfully")
      setEditingVideo(null)
      setShowAddForm(false)
      setFormData({
        title: "",
        description: "",
        youtube_id: "",
        display_order: 1,
        is_active: true,
      })
      fetchVideos()
    } catch (error) {
      console.error("Error saving video:", error)
      toast.error("Failed to save video")
    }
  }

  const handleEdit = (video) => {
    setEditingVideo(video)
    setFormData({
      title: video.title,
      description: video.description || "",
      youtube_id: video.youtube_id,
      display_order: video.display_order,
      is_active: video.is_active,
    })
    setShowAddForm(true)
  }

  const handleDelete = async (videoId) => {
    if (!confirm("Are you sure you want to delete this video?")) return

    try {
      const response = await fetch(`/api/admin/videos/${videoId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      toast.success("Video deleted successfully")
      fetchVideos()
    } catch (error) {
      console.error("Error deleting video:", error)
      toast.error("Failed to delete video")
    }
  }

  const toggleActive = async (video) => {
    try {
      const response = await fetch(`/api/admin/videos/${video.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...video,
          is_active: !video.is_active,
        }),
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      toast.success(`Video ${video.is_active ? "deactivated" : "activated"} successfully`)
      fetchVideos()
    } catch (error) {
      console.error("Error toggling video status:", error)
      toast.error("Failed to update video status")
    }
  }

  const extractYouTubeId = (url) => {
    // Enhanced regex to handle all YouTube URL formats including Shorts
    const patterns = [
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/,
      /youtube\.com\/shorts\/([^"&?/\s]{11})/,
      /youtu\.be\/([^"&?/\s]{11})/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }

    // If no pattern matches, assume it's already a video ID
    return url.length === 11 ? url : null
  }

  const handleYouTubeUrlChange = (value) => {
    const youtubeId = extractYouTubeId(value)
    setFormData({ ...formData, youtube_id: youtubeId || value })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Video Management</h1>
        <Button onClick={() => setShowAddForm(true)} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Video
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingVideo ? "Edit Video" : "Add New Video"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Video title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Display Order</label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: Number.parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Video description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">YouTube URL or ID *</label>
                <Input
                  value={formData.youtube_id}
                  onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=VIDEO_ID or just VIDEO_ID"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">You can paste the full YouTube URL (including Shorts), or just the video ID. Thumbnail will be automatically loaded from YouTube.</p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is_active" className="text-sm font-medium">
                  Active (visible on website)
                </label>
              </div>

              <div className="flex space-x-2">
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                  <Save className="h-4 w-4 mr-2" />
                  {editingVideo ? "Update Video" : "Create Video"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingVideo(null)
                    setFormData({
                      title: "",
                      description: "",
                      youtube_id: "",
                      display_order: 1,
                      is_active: true,
                    })
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Videos List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <Card key={video.id} className={`${!video.is_active ? "opacity-60" : ""}`}>
            <CardContent className="p-4">
              <div className="aspect-video bg-gray-100 rounded-lg mb-4 relative overflow-hidden">
                {video.youtube_id ? (
                  <img
                    src={`https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Enhanced fallback chain for admin thumbnails
                      if (e.target.src.includes('maxresdefault')) {
                        e.target.src = `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`
                      } else if (e.target.src.includes('hqdefault')) {
                        e.target.src = `https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`
                      } else if (e.target.src.includes('mqdefault')) {
                        e.target.src = `https://img.youtube.com/vi/${video.youtube_id}/default.jpg`
                      } else {
                        e.target.src = "/placeholder.svg"
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={video.is_active ? "default" : "secondary"}>Order {video.display_order}</Badge>
                </div>
              </div>

              <h3 className="font-semibold text-lg mb-2">{video.title}</h3>
              {video.description && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{video.description}</p>}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant={video.is_active ? "default" : "secondary"}>
                    {video.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(video)}
                    title={video.is_active ? "Deactivate" : "Activate"}
                  >
                    {video.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(video)} title="Edit">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(video.id)}
                    className="text-red-600 hover:text-red-700"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {video.youtube_id && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-500">YouTube ID: {video.youtube_id}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {videos.length === 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-8 text-center">
                <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No videos found</h3>
                <p className="text-gray-500 mb-4">Get started by adding your first video</p>
                <Button onClick={() => setShowAddForm(true)} className="bg-amber-600 hover:bg-amber-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Video
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
