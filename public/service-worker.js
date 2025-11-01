// Service Worker for offline support and caching
const CACHE_NAME = 'eight-hands-work-v1'
const STATIC_CACHE_NAME = 'static-cache-v1'
const DYNAMIC_CACHE_NAME = 'dynamic-cache-v1'

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/logo.png',
  '/favicon.ico',
  '/about',
  '/contact',
  '/interior',
  '/epoxy-services',
  '/resellers'
]

// API routes to cache
const API_ROUTES = [
  '/api/categories'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets...')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker: Static assets cached successfully')
        self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('Service Worker: Activated successfully')
      self.clients.claim()
    })
  )
})

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event
  const { url, method } = request
  
  // Only handle GET requests
  if (method !== 'GET') return
  
  // Skip chrome-extension requests
  if (url.startsWith('chrome-extension://')) return
  
  // Handle API requests
  if (url.includes('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }
  
  // Handle static assets
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request))
    return
  }
  
  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request))
    return
  }
  
  // Default: network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone()
          caches.open(DYNAMIC_CACHE_NAME)
            .then((cache) => cache.put(request, responseClone))
        }
        return response
      })
      .catch(() => {
        return caches.match(request)
      })
  )
})

// Handle API requests - cache first, then network
async function handleApiRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME)
  const cachedResponse = await cache.match(request)
  
  // Skip caching for products API to ensure fresh data
  if (request.url.includes('/api/products') || request.url.includes('/api/admin/products')) {
    try {
      console.log('Service Worker: Fetching fresh products data:', request.url)
      return await fetch(request)
    } catch (error) {
      console.log('Service Worker: Network failed for products, serving from cache:', request.url)
      return cachedResponse || new Response(JSON.stringify({ 
        error: 'Network unavailable',
        offline: true 
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  // Return cached response if available and not too old (for other APIs)
  if (cachedResponse) {
    const cachedDate = new Date(cachedResponse.headers.get('date'))
    const now = new Date()
    const fiveMinutes = 5 * 60 * 1000
    
    if (now - cachedDate < fiveMinutes) {
      console.log('Service Worker: Serving API response from cache:', request.url)
      return cachedResponse
    }
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.status === 200) {
      console.log('Service Worker: Caching API response:', request.url)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Network failed, serving from cache:', request.url)
    return cachedResponse || new Response(JSON.stringify({ 
      error: 'Network unavailable',
      offline: true 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Handle static assets - cache first
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Failed to fetch static asset:', request.url)
    return new Response('Asset not available offline', { status: 404 })
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request)
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Navigation failed, serving offline page')
    return caches.match('/offline.html') || new Response('Offline', { status: 503 })
  }
}

// Helper function to check if URL is a static asset
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2']
  return staticExtensions.some(ext => url.includes(ext))
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  console.log('Service Worker: Running background sync')
  
  // Sync any offline actions stored in IndexedDB
  // This could include form submissions, cart updates, etc.
  
  try {
    // Example: Sync cart data
    const cache = await caches.open(DYNAMIC_CACHE_NAME)
    // Implement your sync logic here
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error)
  }
}

// Push notifications (if needed)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('Eight Hands Work', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  event.waitUntil(
    clients.openWindow('/')
  )
})

console.log('Service Worker: Loaded successfully')
