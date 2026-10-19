// Murlit Service Worker — caches Vite-hashed assets only.
// NEVER caches HTML navigations, /api, /admin, /account, /checkout, /cart, or auth requests.
// Cache name bumped to v2 — old caches (v1) are deleted on activate.

const CACHE_NAME = "murlit-static-v2";

// On install: claim immediately, no pre-caching of non-hashed files
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// On activate: delete every cache that is not the current version
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

// Fetch strategy:
//   • Navigations → pure network-first (no cache fallback for HTML)
//   • /assets/** (Vite content-hashed) → cache-first (immutable)
//   • Everything else → network-only (images, videos, api, etc.)
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const { pathname } = new URL(request.url);

  // Navigations: always fetch from network; never serve stale HTML
  if (request.mode === "navigate") {
    event.respondWith(fetch(request));
    return;
  }

  // Vite-hashed assets: safe to cache forever (filenames change on every build)
  if (pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      })
    );
  }
  // All other requests (images, videos, api, etc.) go straight to network
});
