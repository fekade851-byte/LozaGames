const CACHE_NAME = 'loza-games-v4'; // Incremented version to force update
const CACHE_VERSION = 'v4';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Cache configuration
const CACHE_FILES = {
  static: [
    '/',
    '/index.html',
    '/assets/index-CHKBdGBU.css',
    '/assets/index-GrIU3NQ6.js',
    '/manifest.json',
    '/register-sw.js',
    // Icons
    '/icon/icon-192x192.png',
    '/icon/icon-512x512.png',
    '/icon/apple-touch-icon.png',
    '/icon/favicon.ico'
  ],
  videos: [
    // Video posters
    '/videos/black-poster.jpg',
    '/videos/blue-poster.jpg',
    '/videos/green-poster.jpg',
    '/videos/pink-poster.jpg',
    '/videos/purple-poster.jpg',
    '/videos/red-poster.jpg',
    '/videos/white-poster.jpg',
    '/videos/yellow-poster.jpg',
    '/videos/closing-poster.jpg',
    '/videos/intro-poster.jpg',
    // WebM videos
    '/videos/black.webm',
    '/videos/blue.webm',
    '/videos/green.webm',
    '/videos/pink.webm',
    '/videos/purple.webm',
    '/videos/red.webm',
    '/videos/white.webm',
    '/videos/yellow.webm',
    '/videos/closing.webm',
    '/videos/intro.webm',
    // MP4 fallbacks
    '/videos/black_optimized.mp4',
    '/videos/blue_optimized.mp4',
    '/videos/green_optimized.mp4',
    '/videos/pink_optimized.mp4',
    '/videos/purple_optimized.mp4',
    '/videos/red_optimized.mp4',
    '/videos/white_optimized.mp4',
    '/videos/yellow_optimized.mp4',
    '/videos/closing_optimized.mp4',
    '/videos/intro_optimized.mp4'
  ]
};

// Cache all static assets first, then videos
const urlsToCache = [...CACHE_FILES.static, ...CACHE_FILES.videos];

// Cache these with network-first strategy
const networkFirstResources = [
  /\/videos\/.*\.(mp4|webm|ogg)/,
  /\/api\//
];

// Cache these with cache-first strategy
const cacheFirstResources = [
  /\/assets\/.*\.(js|css|woff2?|ttf|eot)/,
  /\/icon\/.*\.(png|svg|ico)/
];

// Install event - cache core assets
self.addEventListener('install', event => {
  // Skip waiting to activate the new service worker immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching static assets...');
      // Cache static assets first
      return cache.addAll(CACHE_FILES.static);
    })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle video requests with cache-first strategy
  if (url.pathname.includes('/videos/')) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        // Return cached response if available
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise fetch from network, cache and return
        return fetch(request).then(response => {
          // Only cache valid responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          // Cache the response
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
          
          return response;
        }).catch(error => {
          console.error('Fetch failed:', error);
          // Return a fallback response if both cache and network fail
          return new Response('Video not available', {
            status: 404,
            statusText: 'Not Found'
          });
        });
      })
    );
    return;
  }
  
  // For all other requests, try network first
  event.respondWith(
    fetch(request)
      .then(response => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone the response
        const responseToCache = response.clone();
        
        // Cache the response
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        // If network fails, try to get it from the cache
        return caches.match(request);
      })
  );
});

// Clean up old caches
const cleanOldCaches = async () => {
  const keys = await caches.keys();
  return Promise.all(
    keys.map(key => {
      if (key !== CACHE_NAME) {
        console.log('Removing old cache:', key);
        return caches.delete(key);
      }
    })
  );
};

// Clean up expired cache entries
const cleanExpiredCache = async (cache) => {
  const requests = await cache.keys();
  const now = Date.now();
  
  for (const request of requests) {
    const response = await cache.match(request);
    if (!response) continue;
    
    const date = response.headers.get('date');
    if (date && (now - new Date(date).getTime() > CACHE_TTL)) {
      await cache.delete(request);
    }
  }
};

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      cleanOldCaches(),
      self.clients.claim()
    ])
  );
});

// Check if request should use network first strategy
const useNetworkFirst = (request) => {
  return networkFirstResources.some(pattern => 
    pattern.test(request.url)
  );
};

// Check if request should use cache first strategy
const useCacheFirst = (request) => {
  return cacheFirstResources.some(pattern => 
    pattern.test(request.url)
  );
};

// Network first strategy
const networkFirst = async (request) => {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    
    // Only cache successful responses
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || Response.error();
  }
};

// Cache first strategy
const cacheFirst = async (request) => {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Update cache in the background
    fetchAndCache(request);
    return cachedResponse;
  }
  return fetchAndCache(request);
};

// Fetch and cache response
const fetchAndCache = async (request) => {
  const response = await fetch(request);
  
  // Only cache successful responses
  if (response.status === 200) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  
  return response;
};

// Main fetch handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || 
      request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Handle different caching strategies
  if (useNetworkFirst(request)) {
    event.respondWith(networkFirst(request));
  } else if (useCacheFirst(request)) {
    event.respondWith(cacheFirst(request));
  } else {
    // Default: network first with cache fallback
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(request))
        .catch(() => {
          if (request.headers.get('accept').includes('text/html')) {
            return caches.match('/offline.html');
          }
          return Response.error();
        })
    );
  }
});
