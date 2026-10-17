// Murlit Service Worker — caches static assets only.
// NEVER caches /api, /admin, /account, /checkout, /cart or auth requests.

const CACHE_NAME = "murlit-static-v1";

// Paths that must NEVER be cached (served fresh from network always)
const NEVER_CACHE = [
  "/api/",
  "/admin",
  "/account",
  "/checkout",
  "/cart",
  "/_server/",   // TanStack Start server functions
];

function shouldCache(url) {
  const { pathname } = new URL(url);
  if (NEVER_CACHE.some((prefix) => pathname.startsWith(prefix))) return false;
  return true;
}

// On install: pre-cache the offline fallback page + core static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(["/offline.html", "/favicon.png"])
    )
  );
  self.skipWaiting();
});

// On activate: delete old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy: network-first for navigation, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== "GET") return;

  const url = request.url;

  // Never intercept uncacheable paths
  if (!shouldCache(url)) return;

  const isNavigation = request.mode === "navigate";

  if (isNavigation) {
    // Navigation: try network, fall back to offline page
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/offline.html").then((r) => r ?? new Response("Offline", { status: 503 }))
      )
    );
    return;
  }

  // Static assets (images, fonts, JS, CSS): cache-first, update in background
  if (/\.(png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf|css|js)(\?.*)?$/.test(url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request).then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        }).catch(() => cached);
        return cached ?? networkFetch;
      })
    );
  }
});
