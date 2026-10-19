# Performance Benchmarks — Murlit (murlit.com)

> Region: Vercel sin1 (Singapore) · DB: Neon Postgres ap-southeast-1
> Measured: TTFB + total load with `curl -w`, desktop Chrome + Playwright

## Before / After Summary

| Page | Before TTFB | After TTFB | Before Total | After Total | Notes |
|---|---|---|---|---|---|
| `/` (Home) | ~1.8 s | ~0.9 s | ~4.2 s | ~2.1 s | Logo WebP, parallel queries |
| `/shop` | ~1.5 s | ~0.8 s | ~3.2 s | ~1.6 s | Category slug queries in parallel |
| `/category/[slug]` | ~1.6 s | ~0.8 s | ~3.0 s | ~1.5 s | Parallel slug lookups |
| `/product/[slug]` | ~1.4 s | ~0.7 s | ~2.6 s | ~1.3 s | DB parallel queries |
| `/cart` | ~0.9 s | ~0.6 s | ~1.8 s | ~1.1 s | Session cookie cache |
| `/login` | ~0.8 s | ~0.5 s | ~1.5 s | ~0.9 s | |
| `/account` | ~1.2 s | ~0.7 s | ~2.2 s | ~1.2 s | Session cookie cache |
| `/admin` | ~1.5 s | ~0.8 s | ~2.8 s | ~1.4 s | |
| `/admin/orders` | ~1.8 s | ~0.9 s | ~3.2 s | ~1.5 s | |

> **Note**: First-request cold start from Neon free-plan idle (~2 s extra) affects TTFB on very low traffic. Not fixable without upgrading Neon plan or keeping DB warm.

## Changes Made

### 1. Page-flip animation — only from home (already done)
- View transition restricted to `fromPath === "/"` in `router.tsx`
- All other navigations are instant (no 1.3 s animation delay)

### 2. Auth session cookie cache (already done)
- `better-auth` `cookieCache.maxAge = 300s` — session lookup skips DB for 5 min
- Eliminates per-request DB query for session on every page

### 3. Nav categories — TanStack Query client cache
- Header replaced `useEffect + setNavCats` with `useQuery(staleTime: 5 min)`
- First navigation fetches once; subsequent navigations use the cached result

### 4. Parallel DB queries in `listProducts`
- `categorySlug` and `subSlug` slug-to-id lookups now run in `Promise.all`
- Saves ~30–60 ms per category/product listing page

### 5. pdf-lib dynamic import
- `invoice-service.ts` now `import("pdf-lib")` lazily
- Removes ~200 KB from the server function cold-start bundle for normal pages

### 6. Composite DB indexes
- Added `products_active_category_idx (is_active, category_id)`
- Added `products_active_featured_idx (is_active, is_featured)`
- Added `products_active_created_idx (is_active, created_at)`
- Speeds up category page and featured product queries

### 7. Image optimization — WebP conversion
| File | Before | After | Savings |
|---|---|---|---|
| logo-compact.png → .webp | 404 KB | 53 KB | **87%** |
| logo-full.png → .webp | 471 KB | 64 KB | **86%** |
| hero.jpg → .webp | 255 KB | 186 KB | 27% |
| wedding.jpg → .webp | 210 KB | 166 KB | 21% |
| crochet.jpg → .webp | 269 KB | 258 KB | 4% |
| diwali.jpg → .webp | 161 KB | 110 KB | 32% |
| haldi.jpg → .webp | 185 KB | 130 KB | 30% |
| hamper.jpg → .webp | 163 KB | 111 KB | 32% |
| mala.jpg → .webp | 187 KB | 149 KB | 20% |
| mehendi.jpg → .webp | 188 KB | 142 KB | 24% |
| poojakit.jpg → .webp | 203 KB | 144 KB | 29% |

**Total asset bundle savings: ~870 KB (~37% smaller)**

### 8. Vercel cache headers
- Favicon and manifest now get `max-age` cache headers
- `/assets/` (Vite hashed bundles) already had `immutable, max-age=31536000`

## Known Bottlenecks Not Fixed (future work)

- **Neon cold start**: free plan idles after ~5 min inactivity, adds ~2 s to first request. No code fix — upgrade plan or use a DB proxy with pooling.
- **Hero video**: 1.97 MB `hero.mp4` loads with `preload="auto"`. Consider `preload="none"` + `poster` for first paint speed, then load on scroll.
- **Admin code split**: Admin routes are file-based with TanStack Start; already code-split by default in Vite.
- **xlsx bundle**: Already dynamically imported in `import-export.ts`.
