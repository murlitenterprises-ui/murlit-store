# Performance Audit — Murlit.com

Measured 2026-10-19. Vercel sin1 → Neon ap-southeast-1.

## BEFORE — TTFB (curl, 3 runs median)

| Page              | TTFB (median) | Total (median) | Notes                        |
|-------------------|--------------|----------------|------------------------------|
| `/`               | 388 ms       | 546 ms         | SSR + DB queries             |
| `/shop`           | 323 ms       | 445 ms         | listProducts + images        |
| `/login`          | 257 ms       | 358 ms         | no DB                        |
| `/cart`           | 333 ms       | 466 ms         | session + cart queries       |
| `/account`        | 249 ms       | 249 ms         | redirect (unauthenticated)   |
| `/admin`          | 245 ms       | 245 ms         | redirect (unauthenticated)   |

## BEFORE — Server bundle sizes

| Lib               | Size    | Used by                          |
|-------------------|---------|----------------------------------|
| xlsx.mjs          | 828 KB  | admin import/export only         |
| pdf-lib.mjs       | 606 KB  | invoices (statically imported)   |
| pako+fonts.mjs    | 242 KB  | pdf-lib dependency               |
| drizzle-orm.mjs   | 142 KB  | all server fns                   |
| **Total server**  | **6.2 MB** |                               |

## BEFORE — Client bundle sizes

| File              | Size    |
|-------------------|---------|
| index (vendor)    | 290 KB  |
| styles.css        | 111 KB  |
| schemas (zod)     | 86 KB   |
| Footer            | 50 KB   |
| routes (router)   | 32 KB   |
| catalog           | 31 KB   |
| auth-client       | 31 KB   |
| **Total JS**      | **881 KB (80 files)** |

## BEFORE — Key bottlenecks identified

1. **No session cookie cache** — `auth.api.getSession()` hits DB on every server fn call (91 calls across codebase). Each adds ~50–150 ms Neon round-trip.
2. **xlsx.mjs (828 KB) statically bundled** — loaded on every cold start even for customer-facing pages. Admin-only feature.
3. **pdf-lib statically imported in invoice.ts** — `assignInvoiceNumber` static import pulls pdf-lib (606 KB + 242 KB pako) into the checkout cold-start path.
4. **Page-flip animation on ALL navigations** — 1.3 s CSS transition applied to every page change (not just home→detail).
5. **`defaultPreloadStaleTime: 0` + no `defaultPreload`** — every navigation (including back) triggers full refetch; links don't preload on hover.
6. **Sequential DB queries in `getProductBySlug`** — 5–6 serial round-trips: product → images → category → parent category → sub-category IDs → related products → related images.
7. **`getNavCategories` called on every navigation** — categories table rarely changes; no cache.
8. **No DB indexes** on slug, category_id, user_id, is_active columns — full table scans on every product/order lookup.
9. **No immutable cache headers** for hashed JS/CSS assets — browsers re-validate on every visit.
10. **Images unoptimised** — category hero images 150–275 KB JPEG; hero video 2 MB loaded eagerly.

## AFTER — changes applied

See individual sections below; re-measure after deploy.

### 1. Session cookie cache (auth.ts)
Added `session.cookieCache: { enabled: true, maxAge: 300 }` — eliminates DB round-trip for 5 min after login.

### 2. Page-flip limited to home→other
View transition only fires when navigating away from `/`; all other navigations are instant.

### 3. Router preloading + stale time
`defaultPreload: "intent"`, `defaultPreloadStaleTime: 30_000` ms — links preload on hover/focus; back/forward reuses cached data for 30 s.

### 4. Dynamic xlsx import
`import * as XLSX from "xlsx"` moved inside handler functions — removes 828 KB from cold-start bundle.

### 5. Extract assignInvoiceNumber from invoice-service
Moved number-assignment logic to `src/server/invoice-number.ts` (no pdf-lib dep) — checkout cold path no longer loads pdf-lib.

### 6. DB indexes migration (0006)
Added indexes on: `products(slug)`, `products(category_id)`, `products(is_active)`, `products(is_featured)`, `orders(user_id)`, `orders(created_at)`, `order_items(order_id)`, `cart_items(cart_id)`, `sessions(token)`, `coupon_usages(coupon_id, user_id)`, `coin_ledger(user_id)`.

### 7. Cache headers for static assets (vercel.json)
`/_assets/*` and `/images/*` served with `Cache-Control: public, max-age=31536000, immutable`.

### 8. Parallel DB queries in getProductBySlug
Product + images + category fetched in `Promise.all`; parent-category lookup inlined.

### 9. In-memory getNavCategories cache
1-minute TTL cache in `catalog.ts` — single DB query per minute instead of per request.
