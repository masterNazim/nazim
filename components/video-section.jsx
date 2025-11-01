"use client"

import { useState, useEffect } from "react"
import { Play } from "lucide-react"

export default function VideoSection() {
  const [activeVideo, setActiveVideo] = useState(null)
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const response = await fetch("/api/admin/videos")
      const result = await response.json()

      if (result.success) {
        // Filter active videos and limit to 3
        const activeVideos = result.data.filter((video) => video.is_active).slice(0, 3)
        setVideos(activeVideos)
      }
    } catch (error) {
      console.error("Error fetching videos:", error)
      // Fallback to default videos if API fails
      setVideos([
        {
          id: 1,
          title: "Craftsmanship Excellence",
          description: "Watch our skilled artisans create beautiful furniture pieces",
          youtube_id: "dQw4w9WgXcQ", // Example YouTube ID
        },
        {
          id: 2,
          title: "Room Transformation",
          description: "See how our furniture transforms living spaces",
          youtube_id: "dQw4w9WgXcQ", // Example YouTube ID
        },
        {
          id: 3,
          title: "Behind the Scenes",
          description: "Get an inside look at our manufacturing process",
          youtube_id: "dQw4w9WgXcQ", // Example YouTube ID
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  // Function to get YouTube thumbnail URL with better fallback for Shorts
  const getYouTubeThumbnail = (youtubeId) => {
    if (!youtubeId) return "/placeholder.svg"
    // For Shorts, maxresdefault might not exist, so we'll handle fallback in onError
    return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
  }

  // Enhanced function to extract YouTube ID from various formats including Shorts
  const extractYouTubeId = (url) => {
    const patterns = [
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/,
      /youtube\.com\/shorts\/([^"&?/\s]{11})/,
      /youtu\.be\/([^"&?/\s]{11})/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }

    return url
  }

  if (loading) {
    return (
      <section className="py-12 md:py-16 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-medium text-center mb-8 md:mb-12">WATCH OUR STORY</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-video bg-gray-200 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 md:py-16 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-medium text-center mb-8 md:mb-12">WATCH OUR STORY</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
          {videos.map((video, index) => (
            <div
              key={video.id}
              className="group relative overflow-hidden rounded-2xl shadow-lg bg-gray-100 cursor-pointer transform transition-all duration-700 hover:scale-105"
              onClick={() => setActiveVideo(video)}
            >
              <div className="aspect-video relative">
                <img
                  src={getYouTubeThumbnail(video.youtube_id)}
                  alt={video.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  onError={(e) => {
                    // Enhanced fallback chain for better thumbnail support
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

                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center transition-all duration-700 group-hover:bg-opacity-20">
                  <div className="bg-white bg-opacity-90 rounded-full p-4 transform transition-all duration-700 group-hover:scale-110 group-hover:bg-opacity-100">
                    <Play className="w-8 h-8 text-gray-800 ml-1" fill="currentColor" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Video Modal */}
        {activeVideo && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 max-w-4xl w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">{activeVideo.title}</h3>
                <button
                  onClick={() => setActiveVideo(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl transition-colors duration-300"
                >
                  ×
                </button>
              </div>
              <div className="aspect-video bg-gray-200 rounded">
                {activeVideo.youtube_id ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${activeVideo.youtube_id}?autoplay=1&rel=0`}
                    title={activeVideo.title}
                    className="w-full h-full rounded"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-gray-600">No video available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
