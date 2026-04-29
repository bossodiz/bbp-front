// Service Worker for PWA
const CACHE_NAME = "pet-grooming-v2";
const PRECACHE_URLS = ["/manifest.json", "/icon-192.png", "/icon-512.png"];

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

// Fetch event - never cache HTML navigations so deploys don't serve stale shells.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request));
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isPrecachedAsset =
    requestUrl.origin === self.location.origin &&
    PRECACHE_URLS.includes(requestUrl.pathname);

  if (!isPrecachedAsset) {
    return;
  }

  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request)),
  );
});
