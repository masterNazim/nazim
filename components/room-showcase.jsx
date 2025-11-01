"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"
import { supabase } from "@/lib/supabase"

// Add this function before the RoomShowcase component
const mapInteriorCategoryToGalleryCategory = (interiorType) => {
  switch (interiorType) {
    case "Office Space":
      return "office_space";
    case "Hotel Space":
      return "hotel_space";
    case "Residential Space":
      return "residential";
    case "Commercial Space":
      return "commercial_space";
    default:
      return "all";
  }
}

export default function RoomShowcase() {
  const [currentImages, setCurrentImages] = useState([0, 0, 0, 0])
  const [currentInteriorImages, setCurrentInteriorImages] = useState([0, 0, 0, 0])
  const [isAutoPlay, setIsAutoPlay] = useState([true, true, true, true])
  const [isInteriorAutoPlay, setIsInteriorAutoPlay] = useState([true, true, true, true])
  const [roomImages, setRoomImages] = useState({
    "Living Room": [],
    Bedroom: [],
    "Dining Room": [],
    "Kids Room": [],
  })
  const [interiorImages, setInteriorImages] = useState({
    "Office Space": [],
    "Hotel Space": [],
    "Residential Space": [],
    "Commercial Space": [],
  })
  const [loading, setLoading] = useState(true)

  // Fetch homepage images from database with real-time updates
  const fetchHomepageImages = useCallback(async () => {
    try {
      console.log("[RoomShowcase] Fetching homepage images...")
      // Direct Supabase query to ensure fresh data
      const { data: images, error } = await supabase
        .from('homepage_images')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) {
        throw error
      }

      if (images && images.length > 0) {
        console.log("[RoomShowcase] Fetched images:", images.length)

        // Process room images with multiple images support
        const newRoomImages = {
          "Living Room": images.filter(
            (img) => img.room_type === "Living Room" && img.is_active && img.display_order === 1,
          ),
          Bedroom: images.filter(
            (img) => img.room_type === "Bedroom" && img.is_active && img.display_order === 2
          ),
          "Dining Room": images.filter(
            (img) => img.room_type === "Dining Room" && img.is_active && img.display_order === 3,
          ),
          "Kids Room": images.filter(
            (img) => img.room_type === "Kids Room" && img.is_active && img.display_order === 4,
          ),
        }

        const newInteriorImages = {
          "Office Space": images.filter(
            (img) => img.room_type === "Interior Design Collections" && img.is_active &&
              (img.display_order === 5 || img.name === "Office Space" || img.title === "Office Space")
          ),
          "Hotel Space": images.filter(
            (img) => img.room_type === "Interior Design Collections" && img.is_active && img.display_order === 6,
          ),
          "Residential Space": images.filter(
            (img) => img.room_type === "Interior Design Collections" && img.is_active && img.display_order === 7,
          ),
          "Commercial Space": images.filter(
            (img) => img.room_type === "Interior Design Collections" && img.is_active && img.display_order === 8,
          ),
        }

        console.log("[RoomShowcase] Processed room images:", newRoomImages)
        console.log("[RoomShowcase] Processed interior images:", newInteriorImages)

        setRoomImages(newRoomImages)
        setInteriorImages(newInteriorImages)
      }
    } catch (error) {
      console.error("[RoomShowcase] Error fetching homepage images:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch and set up real-time subscription
  useEffect(() => {
    fetchHomepageImages()

    // Set up real-time subscription for homepage_images table
    const homepageImagesChannel = supabase
      .channel('homepage-images-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'homepage_images' },
        (payload) => {
          console.log('[RoomShowcase] Homepage images changed:', payload)
          fetchHomepageImages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(homepageImagesChannel)
    }
  }, [fetchHomepageImages])

  // Visibility change listener for data refresh when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("[RoomShowcase] Tab became visible, refreshing data...")
        fetchHomepageImages()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchHomepageImages])

  // Process rooms data with multiple images
  const rooms = useMemo(
    () => [
      {
        name: "Living Room",
        images:
          roomImages["Living Room"].length > 0 && roomImages["Living Room"][0].image_urls
            ? roomImages["Living Room"][0].image_urls
            : roomImages["Living Room"].length > 0
              ? [roomImages["Living Room"][0].image_url]
              : [
                "https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
                "https://images.pexels.com/photos/276583/pexels-photo-276583.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
              ],
        mainCategory: "Living Room",
        subCategory: "Living Room Set",
        //description: roomImages["Living Room"][0]?.description || "Elegant and comfortable living room furniture for your home",
        title: roomImages["Living Room"][0]?.title || "Living Room",
      },
      {
        name: "Bedroom",
        images:
          roomImages["Bedroom"].length > 0 && roomImages["Bedroom"][0].image_urls
            ? roomImages["Bedroom"][0].image_urls
            : roomImages["Bedroom"].length > 0
              ? [roomImages["Bedroom"][0].image_url]
              : [
                "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
                "https://images.pexels.com/photos/3773575/pexels-photo-3773575.png?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
              ],
        mainCategory: "Bedroom",
        subCategory: "Bedroom Set",
        //description: roomImages["Bedroom"][0]?.description || "Stylish bedroom furniture for a peaceful night's sleep",
        title: roomImages["Bedroom"][0]?.title || "Bedroom",
      },
      {
        name: "Dining Room",
        images:
          roomImages["Dining Room"].length > 0 && roomImages["Dining Room"][0].image_urls
            ? roomImages["Dining Room"][0].image_urls
            : roomImages["Dining Room"].length > 0
              ? [roomImages["Dining Room"][0].image_url]
              : [
                "https://images.pexels.com/photos/1080696/pexels-photo-1080696.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
                "https://images.pexels.com/photos/1395967/pexels-photo-1395967.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
              ],
        mainCategory: "Dining",
        subCategory: "Dining Table",
        //description: roomImages["Dining Room"][0]?.description || "Beautiful dining sets for memorable family gatherings",
        title: roomImages["Dining Room"][0]?.title || "Dining Room",
      },
      {
        name: "Kid's Room",
        images:
          roomImages["Kids Room"].length > 0 && roomImages["Kids Room"][0].image_urls
            ? roomImages["Kids Room"][0].image_urls
            : roomImages["Kids Room"].length > 0
              ? [roomImages["Kids Room"][0].image_url]
              : [
                "https://images.pexels.com/photos/3932929/pexels-photo-3932929.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
                "https://images.pexels.com/photos/3932930/pexels-photo-3932930.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
              ],
        mainCategory: "Bedroom",
        subCategory: "Kids Furniture",
        // description: roomImages["Kids Room"][0]?.description || "Colorful and functional furniture for children's rooms",
        title: roomImages["Kids Room"][0]?.title || "Kid's Room",
      },
    ],
    [roomImages],
  )

  const interiorDesigns = useMemo(
    () => [
      {
        name: "Office Space",
        images:
          interiorImages["Office Space"].length > 0 && interiorImages["Office Space"][0].image_urls
            ? interiorImages["Office Space"][0].image_urls
            : interiorImages["Office Space"].length > 0
              ? [interiorImages["Office Space"][0].image_url]
              : ["/intorior/img1.jpg"],
        mainCategory: "Office",
        subCategory: "Office Desk",
        //description: interiorImages["Office Space"][0]?.description || "Professional office designs for productivity and comfort",
        title: interiorImages["Office Space"][0]?.title || "Office Space",
      },
      {
        name: "Hotel Space",
        images:
          interiorImages["Hotel Space"].length > 0 && interiorImages["Hotel Space"][0].image_urls
            ? interiorImages["Hotel Space"][0].image_urls
            : interiorImages["Hotel Space"].length > 0
              ? [interiorImages["Hotel Space"][0].image_url]
              : ["/intorior/img2.jpg"],
        mainCategory: "Interior",
        subCategory: "Hotel Interior",
        // description: interiorImages["Hotel Space"][0]?.description || "Welcoming public spaces that bring people together",
        title: interiorImages["Hotel Space"][0]?.title || "Hotel Space",
      },
      {
        name: "Residential Space",
        images:
          interiorImages["Residential Space"].length > 0 && interiorImages["Residential Space"][0].image_urls
            ? interiorImages["Residential Space"][0].image_urls
            : interiorImages["Residential Space"].length > 0
              ? [interiorImages["Residential Space"][0].image_url]
              : ["/intorior/img3.jpg"],
        mainCategory: "Interior",
        subCategory: "Residential Interior",
        // description: interiorImages["Residential Space"][0]?.description || "Beautiful living spaces designed for comfort and style",
        title: interiorImages["Residential Space"][0]?.title || "Residential Space",
      },
      {
        name: "Commercial Space",
        images:
          interiorImages["Commercial Space"].length > 0 && interiorImages["Commercial Space"][0].image_urls
            ? interiorImages["Commercial Space"][0].image_urls
            : interiorImages["Commercial Space"].length > 0
              ? [interiorImages["Commercial Space"][0].image_url]
              : ["/intorior/img4.jpg"],
        mainCategory: "Restaurant",
        subCategory: "Restaurant Furniture",
        // description: interiorImages["Commercial Space"][0]?.description || "Functional and attractive commercial environments",
        title: interiorImages["Commercial Space"][0]?.title || "Commercial Space",
      },
    ],
    [interiorImages],
  )

  // Auto slideshow for room images
  useEffect(() => {
    const intervals = rooms.map((room, roomIndex) => {
      if (!isAutoPlay[roomIndex] || room.images.length <= 1) return null

      const randomInterval = 4000 + Math.random() * 2000
      return setInterval(() => {
        setCurrentImages((prev) => {
          const newImages = [...prev]
          newImages[roomIndex] = (newImages[roomIndex] + 1) % room.images.length
          return newImages
        })
      }, randomInterval)
    })

    return () => {
      intervals.forEach((interval) => interval && clearInterval(interval))
    }
  }, [rooms, isAutoPlay])

  // Auto slideshow for interior images
  useEffect(() => {
    const interiorIntervals = interiorDesigns.map((design, designIndex) => {
      if (!isInteriorAutoPlay[designIndex] || design.images.length <= 1) return null

      const randomInterval = 5000 + Math.random() * 2000
      return setInterval(() => {
        setCurrentInteriorImages((prev) => {
          const newImages = [...prev]
          newImages[designIndex] = (newImages[designIndex] + 1) % design.images.length
          return newImages
        })
      }, randomInterval)
    })

    return () => {
      interiorIntervals.forEach((interval) => interval && clearInterval(interval))
    }
  }, [interiorDesigns, isInteriorAutoPlay])

  // Navigation functions for room images
  const prevImage = useCallback((roomIndex) => {
    setCurrentImages((prev) => {
      const newImages = [...prev]
      newImages[roomIndex] = (newImages[roomIndex] - 1 + rooms[roomIndex].images.length) % rooms[roomIndex].images.length
      return newImages
    })
  }, [rooms])

  const nextImage = useCallback((roomIndex) => {
    setCurrentImages((prev) => {
      const newImages = [...prev]
      newImages[roomIndex] = (newImages[roomIndex] + 1) % rooms[roomIndex].images.length
      return newImages
    })
  }, [rooms])

  // Navigation functions for interior images
  const prevInteriorImage = useCallback((interiorIndex) => {
    setCurrentInteriorImages((prev) => {
      const newImages = [...prev]
      newImages[interiorIndex] = (newImages[interiorIndex] - 1 + interiorDesigns[interiorIndex].images.length) % interiorDesigns[interiorIndex].images.length
      return newImages
    })
  }, [interiorDesigns])

  const nextInteriorImage = useCallback((interiorIndex) => {
    setCurrentInteriorImages((prev) => {
      const newImages = [...prev]
      newImages[interiorIndex] = (newImages[interiorIndex] + 1) % interiorDesigns[interiorIndex].images.length
      return newImages
    })
  }, [interiorDesigns])

  // Toggle autoplay
  const toggleAutoPlay = (roomIndex) => {
    setIsAutoPlay(prev => {
      const newAutoPlay = [...prev]
      newAutoPlay[roomIndex] = !newAutoPlay[roomIndex]
      return newAutoPlay
    })
  }

  const toggleInteriorAutoPlay = (interiorIndex) => {
    setIsInteriorAutoPlay(prev => {
      const newAutoPlay = [...prev]
      newAutoPlay[interiorIndex] = !newAutoPlay[interiorIndex]
      return newAutoPlay
    })
  }

  if (loading) {
    return (
      <section className="py-8 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-8 md:py-16 bg-gray-50 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-medium">EXPLORE OUR ROOM COLLECTIONS</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-8">
          {rooms.map((room, roomIndex) => (
            <div
              key={`${room.name}-${roomIndex}`}
              className="group relative overflow-hidden rounded-2xl shadow-lg h-36 sm:h-48 md:h-80 border border-gray-100"
            >
              <div className="relative w-full h-full">
                {/* Multiple Images Slideshow */}
                {room.images.map((image, imageIndex) => (
                  <div
                    key={`${imageIndex}-${image}`}
                    className={`absolute inset-0 transition-all duration-1000 ease-in-out ${currentImages[roomIndex] === imageIndex ? "opacity-100 scale-100" : "opacity-0 scale-105"
                      }`}
                  >
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`${room.title} - View ${imageIndex + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover rounded-2xl transition-transform duration-1000 ease-in-out"
                      priority={imageIndex === 0}
                      unoptimized={image?.includes('supabase') || image?.includes('pexels')}
                    />
                  </div>
                ))}

                {/* Image Counter */}
                {room.images.length > 1 && (
                  <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full z-20">
                    {currentImages[roomIndex] + 1} / {room.images.length}
                  </div>
                )}

                {/* Autoplay Toggle */}
                {room.images.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      toggleAutoPlay(roomIndex)
                    }}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 z-20 transition-colors"
                    title={isAutoPlay[roomIndex] ? "Pause slideshow" : "Play slideshow"}
                  >
                    {isAutoPlay[roomIndex] ? <Pause size={12} /> : <Play size={12} />}
                  </button>
                )}

                {/* Navigation Dots */}
                {room.images.length > 1 && (
                  <div className="absolute bottom-1 md:bottom-4 left-0 right-0 flex justify-center space-x-1 md:space-x-2 z-10">
                    {room.images.map((_, imageIndex) => (
                      <button
                        key={imageIndex}
                        className={`rounded-full transition-all duration-500 ease-in-out ${currentImages[roomIndex] === imageIndex
                          ? "bg-white w-2 h-2 md:w-4 md:h-2"
                          : "bg-white/50 w-1 h-1 md:w-2 md:h-2"
                          }`}
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentImages((prev) => {
                            const newImages = [...prev]
                            newImages[roomIndex] = imageIndex
                            return newImages
                          })
                        }}
                        aria-label={`View image ${imageIndex + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Navigation Arrows */}
                {room.images.length > 1 && (
                  <>
                    <button
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block"
                      onClick={(e) => {
                        e.preventDefault()
                        prevImage(roomIndex)
                      }}
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={20} />
                    </button>

                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block"
                      onClick={(e) => {
                        e.preventDefault()
                        nextImage(roomIndex)
                      }}
                      aria-label="Next image"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>

              <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-all duration-700 rounded-2xl">
                <Link
                  href={`/products?category=${encodeURIComponent(room.mainCategory)}`}
                  className="absolute inset-0 flex flex-col items-center justify-center text-white p-2 md:p-6 z-5"
                >
                  <div className="bg-white/80 backdrop-blur-sm text-gray-900 py-1 px-3 md:py-2 md:px-6 rounded-xl mb-1 md:mb-3 transform transition-all duration-500 group-hover:scale-105">
                    <h3 className="text-sm md:text-xl font-bold">{room.title}</h3>
                  </div>

                  <p className="text-center text-white text-shadow hidden md:block max-w-xs transition-all duration-500 group-hover:text-gray-100">
                    {room.description}
                  </p>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Interior Design Section with Enhanced Slideshow */}
        <div className="mt-8 md:mt-16">
          <h2 className="text-2xl font-medium text-center mb-8">INTERIOR PROJECTS</h2>

          <div className="w-full -mx-4 px-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 overflow-hidden">
              {interiorDesigns.map((design, designIndex) => (
                <div
                  key={`${design.name}-${designIndex}`}
                  className="group relative overflow-hidden h-80 md:h-[500px] border-r last:border-r-0 border-white/10"
                >
                  <div className="relative w-full h-full">
                    {/* Multiple Images for Interior */}
                    {design.images.map((image, imageIndex) => (
                      <div
                        key={`${imageIndex}-${image}`}
                        className={`absolute inset-0 transition-all duration-1000 ease-in-out ${currentInteriorImages[designIndex] === imageIndex ? "opacity-100 scale-100" : "opacity-0 scale-105"
                          }`}
                      >
                        <Image
                          src={image || "/placeholder.svg"}
                          alt={`${design.title} - View ${imageIndex + 1}`}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                          priority={imageIndex === 0}
                          unoptimized={image?.includes('supabase') || image?.includes('pexels')}
                        />
                      </div>
                    ))}

                    {/* Interior Image Counter */}
                    {design.images.length > 1 && (
                      <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full z-20">
                        {currentInteriorImages[designIndex] + 1} / {design.images.length}
                      </div>
                    )}

                    {/* Interior Autoplay Toggle */}
                    {design.images.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          toggleInteriorAutoPlay(designIndex)
                        }}
                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 z-20 transition-colors"
                        title={isInteriorAutoPlay[designIndex] ? "Pause slideshow" : "Play slideshow"}
                      >
                        {isInteriorAutoPlay[designIndex] ? <Pause size={12} /> : <Play size={12} />}
                      </button>
                    )}

                    {/* Interior Navigation */}
                    {design.images.length > 1 && (
                      <>
                        <button
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          onClick={(e) => {
                            e.preventDefault()
                            prevInteriorImage(designIndex)
                          }}
                          aria-label="Previous image"
                        >
                          <ChevronLeft size={16} />
                        </button>

                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          onClick={(e) => {
                            e.preventDefault()
                            nextInteriorImage(designIndex)
                          }}
                          aria-label="Next image"
                        >
                          <ChevronRight size={16} />
                        </button>

                        {/* Interior Navigation Dots */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-1 z-10">
                          {design.images.map((_, imageIndex) => (
                            <button
                              key={imageIndex}
                              className={`rounded-full transition-all duration-500 ease-in-out ${currentInteriorImages[designIndex] === imageIndex
                                ? "bg-white w-3 h-3"
                                : "bg-white/50 w-2 h-2"
                                }`}
                              onClick={(e) => {
                                e.preventDefault()
                                setCurrentInteriorImages((prev) => {
                                  const newImages = [...prev]
                                  newImages[designIndex] = imageIndex
                                  return newImages
                                })
                              }}
                              aria-label={`View image ${imageIndex + 1}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-700">
                    <Link
                      href={`/gallery?category=${encodeURIComponent(
                        design.name === "Office Space" ? "Office" :
                          design.name === "Hotel Space" ? "Hotel" :
                            design.name === "Residential Space" ? "Residential" :
                              design.name === "Commercial Space" ? "Commercial" :
                                design.mainCategory
                      )}`}
                      className="absolute inset-0 flex items-end justify-start text-white p-4 md:p-8 z-5"
                    >
                      <h3 className="text-lg md:text-2xl font-thin text-white drop-shadow-2xl">{design.title}</h3>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
