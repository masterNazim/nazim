"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, ShoppingCart, User, Settings, ChevronDown, Search } from "lucide-react"
import { useSupabase } from "@/lib/supabase-provider"
import { useCart } from "@/lib/cart-context"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState(null)
  const [allCategories, setAllCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState(null)
  const pathname = usePathname()
  const { supabase } = useSupabase()
  const { cartItems } = useCart()
  const accountMenuRef = useRef(null)
  const megaMenuRef = useRef(null)
  const megaMenuTriggerRef = useRef(null)
  const searchInputRef = useRef(null)
  const router = useRouter()
  const hoverTimeoutRef = useRef(null)

  // Simplified category fetching without complex caching
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true)
        setCategoriesError(null)

        // Direct fetch without caching
        const response = await fetch("/api/categories", {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (result.success) {
          setAllCategories(result.data.map((cat) => cat.name))
        } else {
          throw new Error(result.error || "Failed to fetch categories")
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
        setCategoriesError(error.message)
        // Set empty array on error to prevent infinite loading
        setAllCategories([])
      } finally {
        setCategoriesLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Retry fetching categories if failed
  const retryFetchCategories = async () => {
    setCategoriesLoading(true)
    setCategoriesError(null)
    try {
      const response = await fetch("/api/categories", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setAllCategories(result.data.map((cat) => cat.name))
      } else {
        throw new Error(result.error || "Failed to fetch categories")
      }
    } catch (error) {
      console.error("Error retrying categories:", error)
      setCategoriesError(error.message)
      setAllCategories([])
    } finally {
      setCategoriesLoading(false)
    }
  }

  // Category groups for mobile menu
  const categoryGroups = {
    "Living Room": "/products?category=Living%20Room%20Set",
    Dining: "/products?category=Dining%20Table",
    Bedroom: "/products?category=Bedroom%20Set",
    Office: "/products?category=Office%20Desk",
    Storage: "/products?category=storage",
    Restaurant: "/products?category=restaurant",
    Industrial: "/products?category=industrial",
    Interior: "/products?category=interior",
    "Kitchen & Bath": "/products?category=kitchen-bath",
  }

  // Complete categories with subcategories based on your image
  const getMainCategories = () => {
    if (categoriesLoading || allCategories.length === 0) {
      // Return default structure while loading
      return {
        "Living Room": {
          href: "/products?category=living-room",
          subcategories: [],
        },
        Dining: {
          href: "/products?category=dining",
          subcategories: [],
        },
        Bedroom: {
          href: "/products?category=bedroom",
          subcategories: [],
        },
      }
    }

    // Group categories dynamically
    const grouped = {}

    allCategories.forEach((categoryName) => {
      // Determine which group this category belongs to
      let groupName = "Other"

      if (
        categoryName.toLowerCase().includes("living") ||
        categoryName.toLowerCase().includes("sofa") ||
        categoryName.toLowerCase().includes("center table") ||
        categoryName.toLowerCase().includes("tv cabinet") ||
        categoryName.toLowerCase().includes("display cabinet") ||
        categoryName.toLowerCase().includes("shelf") ||
        categoryName.toLowerCase().includes("carpet") ||
        categoryName.toLowerCase().includes("lamp") ||
        categoryName.toLowerCase().includes("light") ||
        categoryName.toLowerCase().includes("chandelier") ||
        categoryName.toLowerCase().includes("arm chair") ||
        categoryName.toLowerCase().includes("end table")
      ) {
        groupName = "Living Room"
      } else if (categoryName.toLowerCase().includes("dining") || categoryName.toLowerCase().includes("dinner wagon")) {
        groupName = "Dining"
      } else if (categoryName.toLowerCase().includes("bed") || categoryName.toLowerCase().includes("dressing table")) {
        groupName = "Bedroom"
      } else if (
        categoryName.toLowerCase().includes("office") ||
        categoryName.toLowerCase().includes("desk") ||
        categoryName.toLowerCase().includes("conference") ||
        categoryName.toLowerCase().includes("work station") ||
        categoryName.toLowerCase().includes("visitor chair") ||
        categoryName.toLowerCase().includes("break room") ||
        categoryName.toLowerCase().includes("study table")
      ) {
        groupName = "Office"
      } else if (
        categoryName.toLowerCase().includes("cabinet") ||
        categoryName.toLowerCase().includes("book shelf") ||
        categoryName.toLowerCase().includes("shoe rack") ||
        categoryName.toLowerCase().includes("store cabinet")
      ) {
        groupName = "Storage"
      } else if (
        categoryName.toLowerCase().includes("restaurant") ||
        categoryName.toLowerCase().includes("reception") ||
        categoryName.toLowerCase().includes("bar stool") ||
        categoryName.toLowerCase().includes("cash counter")
      ) {
        groupName = "Restaurant"
      } else if (
        categoryName.toLowerCase().includes("industrial") ||
        categoryName.toLowerCase().includes("pu flooring") ||
        categoryName.toLowerCase().includes("lab clear coat")
      ) {
        groupName = "Industrial"
      } else if (
        categoryName.toLowerCase().includes("interior") ||
        categoryName.toLowerCase().includes("consultation") ||
        categoryName.toLowerCase().includes("project execution") ||
        categoryName.toLowerCase().includes("epoxy services") ||
        categoryName.toLowerCase().includes("portable partition")
      ) {
        groupName = "Interior"
      } else if (
        categoryName.toLowerCase().includes("kitchen") ||
        categoryName.toLowerCase().includes("counter top") ||
        categoryName.toLowerCase().includes("wash basin")
      ) {
        groupName = "Kitchen & Bath"
      }

      if (!grouped[groupName]) {
        grouped[groupName] = {
          href: `/products?category=${encodeURIComponent(groupName.toLowerCase())}`,
          subcategories: [],
        }
      }

      grouped[groupName].subcategories.push({
        name: categoryName,
        href: `/products?category=${encodeURIComponent(categoryName)}`,
      })
    })

    return grouped
  }

  const mainCategories = getMainCategories()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        setUser(session?.user || null)

        if (session?.user) {
          // Check if user is admin
          const { data, error } = await supabase.from("users").select("is_admin").eq("id", session.user.id).single()

          if (!error && data) {
            setIsAdmin(data.is_admin)
          }
        }
      } catch (error) {
        console.error("Error getting user:", error)
      }
    }

    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null)

      if (session?.user) {
        // Check if user is admin
        const { data, error } = await supabase.from("users").select("is_admin").eq("id", session.user.id).single()

        if (!error && data) {
          setIsAdmin(data.is_admin)
        }
      } else {
        setIsAdmin(false)
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setIsAccountMenuOpen(false)
      }

      // Close mega menu when clicking outside, but not when clicking the trigger
      if (
        megaMenuRef.current &&
        !megaMenuRef.current.contains(event.target) &&
        megaMenuTriggerRef.current &&
        !megaMenuTriggerRef.current.contains(event.target)
      ) {
        setIsMegaMenuOpen(false)
        setHoveredCategory(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Close mega menu when route changes
  useEffect(() => {
    setIsMegaMenuOpen(false)
    setIsMenuOpen(false)
    setHoveredCategory(null)
  }, [pathname])

  // Focus search input when search box opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const toggleAccountMenu = () => {
    setIsAccountMenuOpen(!isAccountMenuOpen)
  }

  const handleProductsHover = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setIsMegaMenuOpen(true)
    setHoveredCategory(Object.keys(mainCategories)[0]) // Set first category as default
  }

  const handleProductsLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsMegaMenuOpen(false)
      setHoveredCategory(null)
    }, 150) // Small delay to allow moving to dropdown
  }

  const handleDropdownEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
  }

  const handleDropdownLeave = () => {
    setIsMegaMenuOpen(false)
    setHoveredCategory(null)
  }

  const handleCategoryHover = (categoryName) => {
    setHoveredCategory(categoryName)
  }

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
      setSearchQuery("")
    }
  }

  // Modified navigation links: removed Rooms and New Arrival
  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Products", href: "/products", hasDropdown: true },
    // Removed "Rooms" and "New Arrival" links
    { name: "Interior", href: "/interior" },
    { name: "Epoxy Services", href: "/epoxy-services" },
    { name: "Resellers", href: "/resellers" },
  ]

  return (
    <div className="fixed w-full z-50 flex justify-center mt-3 px-4">
      <header
        className={`w-full max-w-[1440px] rounded-full transition-all duration-300 ${
          isScrolled ? "bg-white shadow-md" : "bg-white/70 backdrop-blur-md"
        } py-2 px-4`}
      >
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="Eight Hands Work" width={130} height={52} className="h-10 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {navLinks.map((link) =>
              link.hasDropdown ? (
                <div
                  className="relative"
                  key={link.name}
                  ref={megaMenuTriggerRef}
                  onMouseEnter={handleProductsHover}
                  onMouseLeave={handleProductsLeave}
                >
                  <Link
                    href={link.href}
                    className={`flex items-center text-base font-medium hover:text-amber-500 transition-colors ${
                      pathname.startsWith(link.href) ? "text-amber-500" : ""
                    }`}
                  >
                    {link.name}
                    <ChevronDown
                      className={`ml-1 h-4 w-4 transition-transform ${isMegaMenuOpen ? "rotate-180" : ""}`}
                    />
                  </Link>
                </div>
              ) : (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-base font-medium hover:text-amber-500 transition-colors ${pathname === link.href ? "text-amber-500" : ""}`}
                >
                  {link.name}
                </Link>
              ),
            )}

            {isAdmin && (
              <Link
                href="/admin"
                className={`text-base font-medium text-amber-500 hover:text-amber-600 transition-colors flex items-center`}
              >
                <Settings className="h-4 w-4 mr-1" />
                Admin
              </Link>
            )}
          </nav>

          <div className="hidden md:flex items-center space-x-5">
            {/* Search Icon */}
            <button onClick={toggleSearch} className="relative">
              <Search className="h-5 w-5" />
            </button>

            <Link href="/cart" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-xs rounded-full h-4.5 w-4.5 flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative" ref={accountMenuRef}>
                <button onClick={toggleAccountMenu} aria-label="Account menu">
                  <User className="h-5 w-5 fill-black" />
                </button>
                {isAccountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link
                      href="/account"
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsAccountMenuOpen(false)}
                    >
                      My Account
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsAccountMenuOpen(false)}
                    >
                      My Orders
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="block px-3 py-2 text-sm font-medium text-amber-500 hover:bg-amber-50"
                        onClick={() => setIsAccountMenuOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut()
                        setIsAccountMenuOpen(false)
                        router.push("/")
                      }}
                      className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" aria-label="Login">
                <User className="h-5 w-5" />
              </Link>
            )}
          </div>

          <button className="md:hidden" onClick={toggleMenu}>
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Search overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
          <div className="bg-white rounded-lg w-full max-w-xl mx-4 overflow-hidden">
            <form onSubmit={handleSearch} className="flex items-center p-4">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for products..."
                className="flex-1 p-2 border-b-2 border-gray-200 focus:border-amber-500 outline-none text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="ml-4 text-amber-500 hover:text-amber-600">
                <Search className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Custom Dropdown Menu for Products (Desktop only) - Made transparent */}
      {isMegaMenuOpen && (
        <div
          ref={megaMenuRef}
          className="fixed left-1/2 transform -translate-x-1/2 top-20 z-40 hidden md:block"
          onMouseEnter={handleDropdownEnter}
          onMouseLeave={handleDropdownLeave}
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl border border-gray-200/50 w-[1000px] p-6">
            {categoriesLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500 mb-2"></div>
                  <p className="text-sm text-gray-500">Loading categories...</p>
                </div>
              </div>
            ) : categoriesError ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-center">
                  <p className="text-red-500 mb-2">Failed to load categories</p>
                  <p className="text-sm text-gray-500 mb-3">{categoriesError}</p>
                  <button
                    onClick={retryFetchCategories}
                    className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : allCategories.length === 0 ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-center">
                  <p className="text-gray-500 mb-2">No categories found</p>
                  <button
                    onClick={retryFetchCategories}
                    className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex">
                {/* Main Categories Column */}
                <div className="w-1/3 pr-4 border-r border-gray-200/50">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Categories</h3>
                  <ul className="space-y-2">
                    {Object.entries(mainCategories).map(([categoryName, categoryData]) => (
                      <li key={categoryName}>
                        <Link
                          href={categoryData.href}
                          className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            hoveredCategory === categoryName
                              ? "bg-amber-50/80 text-amber-600"
                              : "text-gray-700 hover:bg-gray-50/80"
                          }`}
                          onMouseEnter={() => handleCategoryHover(categoryName)}
                        >
                          {categoryName}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Subcategories Column */}
                <div className="w-2/3 pl-4">
                  {hoveredCategory && mainCategories[hoveredCategory] && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">{hoveredCategory}</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {mainCategories[hoveredCategory].subcategories.map((subcategory) => (
                          <Link
                            key={subcategory.name}
                            href={subcategory.href}
                            className="block px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-amber-50/70 hover:text-amber-600 transition-colors"
                          >
                            {subcategory.name}
                          </Link>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200/50">
                        <Link
                          href={mainCategories[hoveredCategory].href}
                          className="inline-block px-4 py-2 bg-amber-500/90 text-white rounded-md text-sm font-medium hover:bg-amber-600/90 transition-colors"
                        >
                          View All {hoveredCategory}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* View All Products Button */}
            <div className="mt-6 pt-4 border-t border-gray-200/50 text-center">
              <Link
                href="/products"
                className="inline-block px-6 py-2 bg-gray-100/80 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200/80 transition-colors"
              >
                View All Products
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 bg-white z-50 transition-transform duration-300 ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold">Menu</h2>
          <button onClick={closeMenu} className="p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-56px)]">
          {/* Search in mobile menu */}
          <div className="p-4 border-b">
            <form onSubmit={handleSearch} className="flex items-center">
              <input
                type="text"
                placeholder="Search for products..."
                className="flex-1 p-2 text-sm border rounded-l-md border-gray-300 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="bg-amber-500 text-white p-2 rounded-r-md">
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>

          <nav className="p-4">
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className={`block py-2 text-sm ${pathname === link.href || (link.hasDropdown && pathname.startsWith(link.href)) ? "text-amber-500 font-medium" : ""}`}
                    onClick={closeMenu}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}

              {/* Product Categories Section */}
              <li className="pt-3">
                <h3 className="text-gray-500 uppercase text-xs font-medium mb-2">PRODUCT CATEGORIES</h3>
                <ul className="space-y-2">
                  {Object.entries(categoryGroups).map(([name, href]) => (
                    <li key={name}>
                      <Link href={href} className="block py-1.5 text-sm text-gray-700" onClick={closeMenu}>
                        {name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>

              <li className="pt-3">
                <Link href="/cart" className="flex items-center py-2" onClick={closeMenu}>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  <span>Cart ({cartItems.length})</span>
                </Link>
              </li>

              <li>
                {user ? (
                  <div className="space-y-2">
                    <Link href="/account" className="flex items-center py-2" onClick={closeMenu}>
                      <User className="h-5 w-5 mr-2 fill-black" />
                      <span>My Account</span>
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className="block py-2 text-sm text-amber-500" onClick={closeMenu}>
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut()
                        closeMenu()
                        router.push("/")
                      }}
                      className="block py-2 text-sm text-red-600"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link href="/login" className="flex items-center py-2" onClick={closeMenu}>
                    <User className="h-5 w-5 mr-2" />
                    <span>Login / Register</span>
                  </Link>
                )}
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  )
}
