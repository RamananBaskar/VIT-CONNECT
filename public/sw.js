/**
 * Service Worker for VIT Connect - Offline-First Map Assets, Network-Only API
 * - /api/* and non-GET requests ALWAYS bypass cache to prevent stale event/auth data.
 * - /data/vit_map.glb and /data/path.json use network-first with cache fallback.
 */

const CACHE_VERSION = 'v1.1.0';
const CACHE_NAME = `vit-navigator-${CACHE_VERSION}`;
const MAP_CACHE_NAME = `vit-navigator-map-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `vit-navigator-images-${CACHE_VERSION}`;

const STATIC_ASSETS = ['/', '/index.html'];
const MAP_ASSETS = ['/data/vit_map.glb', '/data/current_location.glb', '/data/path.json'];
const NETWORK_TIMEOUT = 2500;

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {})),
      caches.open(MAP_CACHE_NAME).then((cache) => cache.addAll(MAP_ASSETS).catch(() => {})),
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== MAP_CACHE_NAME &&
              cacheName !== IMAGE_CACHE_NAME &&
              cacheName.startsWith('vit-navigator-')
            ) {
              return caches.delete(cacheName);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== location.origin) {
    return;
  }

  // CRITICAL: Bypass cache completely for all API calls and non-GET requests
  if (url.pathname.startsWith('/api/') || request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // Map & path data: network-first with cache fallback
  if (
    url.pathname.includes('/data/vit_map.glb') ||
    url.pathname.includes('/data/current_location.glb') ||
    url.pathname.includes('/data/path.json')
  ) {
    event.respondWith(
      caches.open(MAP_CACHE_NAME).then((cache) =>
        fetchWithTimeout(request, NETWORK_TIMEOUT)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cache.match(request).then((cached) => cached || new Response('', { status: 503 })))
      )
    );
    return;
  }

  // Default: network-first with cache fallback
  event.respondWith(
    fetchWithTimeout(request, NETWORK_TIMEOUT)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});

async function fetchWithTimeout(request, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}
