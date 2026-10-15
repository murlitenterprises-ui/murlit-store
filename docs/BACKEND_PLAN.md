# Murlit Backend Plan

## Stack

| Layer | Choice |
|---|---|
| Framework | TanStack Start (server functions + server routes on Node — no separate Express) |
| Database | Neon Postgres via `@neondatabase/serverless` + Drizzle ORM |
| Migrations | drizzle-kit |
| Auth | Better Auth — email/password + Google only; roles: `customer` \| `admin` |
| Images | Cloudinary |
| Payments | Razorpay + Cash on Delivery |
| Emails | Resend |
| Validation | Zod |
| Data fetching | TanStack Query |
| Hosting | Vercel |
| PWA | Phase 7 |

**Money:** all amounts stored as integers in **paise**. India GST invoicing required.

---

## Phases

### ✅ Phase 1 — Foundation (current)
- Neon Postgres + Drizzle schema (all tables)
- Seed script: categories, sub-categories, and products from existing `menu.ts` / `catalog.ts`
- One `store_settings` placeholder row
- DB client (`src/server/db/index.ts`) — server-only
- `drizzle.config.ts` + package.json scripts: `db:generate`, `db:migrate`, `db:studio`, `db:seed`
- `.env.example` with `DATABASE_URL=`
- `docs/BACKEND_PLAN.md` (this file)

### ✅ Phase 2 — Frontend reads from DB (done)
- Shop page, category pages, and product detail page read products/categories from Neon via server functions
- Search (header dropdown + shop page), filters (category, price, in-stock), sorting (featured/newest/price/name)
- `src/server/queries/catalog.ts` — Drizzle query functions
- `src/server/functions/catalog.ts` — TanStack Start `createServerFn` wrappers
- `src/lib/format.ts` — `inrFromPaise`, `discountPct`
- `src/server/db/update-images.ts` — one-off idempotent script to set /images/*.jpg URLs on DB rows
- Product images copied to `public/images/`
- `src/routes/product.$slug.tsx` — new product detail page with gallery, tabs, related products
- ProductCard updated to DB shape with `/product/$slug` links
- Note: Occasions section still uses static data (DB table to be added in a future phase).

### Phase 3 — Auth
- Better Auth: email/password + Google OAuth
- `/account` page for customers
- Admin role guard middleware
- Session management (Better Auth Drizzle adapter)

### Phase 4 — Admin Panel (`/admin`, admin-only)
- Dashboard (order counts, revenue)
- Products CRUD with multiple image upload (Cloudinary)
- Categories & sub-categories CRUD (replaces hardcoded `menu.ts`)
- Store GST settings page (edit `store_settings`)
- Excel/CSV bulk product import:
  - Downloadable template
  - Upload → preview with row-level validation errors
  - Import: creates new products + updates existing by SKU
  - Image URLs optional
- HSN + GST rate fields in product form and import template

### Phase 5 — Cart, Wishlist & Checkout
- Cart: guest (localStorage) + logged-in (DB), merged on login
- Wishlist (logged-in users)
- Checkout with saved/new addresses
- Razorpay integration + Cash on Delivery
- GST calculation per line:
  - Store state == shipping state → CGST + SGST (split equally)
  - Store state != shipping state → IGST
- Optional customer GSTIN for B2B orders
- Coupon code support

### Phase 6 — Orders & Invoicing
- Customer "My Orders" page + order tracking
- Admin order management (status updates)
- Sequential invoice numbers per financial year (e.g. `MUR/2026-27/0001`)
- Downloadable GST-compliant PDF invoice
- Order emails via Resend
- Custom-order, bulk/B2B, contact, and newsletter forms saved to DB → visible in admin

### Phase 7 — PWA
- `manifest.json`, icons
- Service worker with offline fallback
- Install prompt

### Phase 8 — Security & Production
- Auth checks on every admin/server function
- Input validation (Zod) at all boundaries
- Rate limiting on forms and auth endpoints
- Performance audit
- Vercel production deploy
