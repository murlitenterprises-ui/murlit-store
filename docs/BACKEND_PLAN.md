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

### ✅ Phase 3 — Auth (done)
- Better Auth 1.7.7: email/password + Google OAuth (Google conditional on env vars)
- Schema: `role` changed from pgEnum to text for BA adapter compat; `phone` column added to users; migration applied
- `src/server/auth.ts` — Better Auth instance with Drizzle adapter, rate limiting, cookie prefix
- `src/routes/api/auth/$.ts` — catch-all API route for Better Auth
- `src/lib/auth-client.ts` — Better Auth React client with `signIn`, `signUp`, `signOut`, `useSession`
- `src/server/auth-helpers.ts` — `getSessionUser`, `requireUser`, `requireAdmin` server-only helpers
- `src/fns/auth.ts` — `getCurrentUser` server function for use in route loaders
- Auth pages: `/login`, `/signup`, `/forgot-password`, `/reset-password`
- `/account` page — tabs: Profile, Addresses, My Orders, Wishlist, Security
- `src/fns/addresses.ts` — server functions: listAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress
- `src/lib/india-states.ts` — all 28 states + UTs with 2-letter codes
- `/admin` page — role guard (non-admin redirected to /)
- Header updated: auth-aware user menu, DB nav categories with static fallback
- `src/server/db/make-admin.ts` — CLI script to promote a user to admin
- `make-admin` npm script added to package.json

### ✅ Phase 4A — Admin Panel core (done)
- `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/account` — Header + Footer added
- Admin layout route (`src/routes/admin.tsx`): maroon sidebar, mobile hamburger/drawer, route guard via `beforeLoad` (redirects non-admin to `/`)
- Dashboard (`/admin`): stat cards — total/active products, out-of-stock, low-stock, customers, categories
- Products CRUD (`/admin/products`):
  - Paginated list with search, category/status/stock filters, bulk activate/deactivate/delete
  - New product form (`/admin/products/new`) with Cloudinary image upload (drag-and-drop, reorder, alt text), all fields: name, slug, SKU, price/MRP (₹ input, auto-convert to paise), stock, category (parent → sub dropdowns), description, tags, occasions, attributes, GST/HSN, SEO title/description, active/featured toggles
  - Edit product (`/admin/products/:id/edit`)
  - Inline active/featured toggles + soft delete
- Categories CRUD (`/admin/categories`): tree table, inline create/edit form, Cloudinary image upload, reorder (up/down), delete (blocked if products exist)
- Settings (`/admin/settings`): upsert `store_settings` row
- Cloudinary signed upload: HMAC-SHA1 server-side signature via `src/fns/admin/upload.ts`; client POSTs directly to Cloudinary (secret never in browser)
- `src/lib/cloudinary.ts`: `clImg()` helper inserts `f_auto,q_auto,w_N,c_fill` transforms
- `@utility inp` / `@utility err` shorthand Tailwind utilities in `src/styles.css`
- Playwright integration test (temp `pw-admin-test.mjs`, deleted after pass): login, dashboard, categories, new product, edit, /shop, settings, 390px mobile, customer-denied-admin

### ✅ Phase 4B — Excel/CSV bulk product import and export (done)
- `/admin/products/import` page with 3-stage flow: upload → preview → done
- "Download Template" button: .xlsx with Products sheet (header + 2 example rows), Categories sheet, Help sheet
- Upload .xlsx / .xls / .csv (max 2 MB, max 1 000 rows); file parsed server-side via SheetJS
- Preview table: each row shows "New" / "Update" (matched by SKU) or "Error" badge with per-row messages
  - Update rows: name / category / price not required (only sku); GST + MRP validations still apply
  - Image URL validation skipped for update rows (existing images stay in DB)
- "Import N valid rows" button → `executeImport` server fn; creates new products (auto-slug) or updates existing; returns `{ created, updated, skipped, warnings }`
- Import summary card with "Download Error Report" (.xlsx) and "Import Another File"
- "Export products" button on products list → .xlsx in same template format (all columns)
- `exportProducts` / `generateErrorReport` / `downloadTemplate` / `previewImport` / `executeImport` — all in `src/fns/admin/import-export.ts`
- "Import from Excel" link + "Export" button added to `/admin/products` list header
- `xlsx@0.18.5` added to dependencies
- Playwright E2E tests: template download, upload/preview (3 new + 1 update + 2 error), import, verify in admin, export, re-import (0 new, 0 errors), non-admin blocked, error report download — all pass

### ✅ Phase 5 — Cart, Wishlist, Checkout, GST, Razorpay + COD
- Real DB-backed cart: guest via `murlit_cart` httpOnly cookie (90-day, sessionKey), user cart via userId; merge on login
- `src/fns/cart.ts`: resolveCart, getCartItems, getCart, addToCart, updateQty, removeItem, clearCart, mergeGuestCart, getCartCount
- Wishlist (login required): `src/fns/wishlist.ts` — getWishlist, toggleWishlist, isWishlisted, removeFromWishlist, getWishlistCount
- Cart UI: `/cart` route with qty +/-, remove, subtotal; badge count in Header; CartProvider in `__root.tsx`
- Wishlist UI: `/wishlist` route; heart buttons on ProductCard and product page
- Checkout: `/checkout` — saved/new addresses, GSTIN field for B2B, payment method selection
- GST: `computeItemGst()` pure helper — priceIncludesGst back-calculates taxable; same state → CGST+SGST; different state → IGST
- `getCheckoutSummary({ shippingStateCode })` — server-authoritative full breakdown
- Orders: `placeOrder()` re-validates stock+active from DB, creates `orders` + `order_items`, order number `MUR-100001`+
- COD: reduces stock + clears cart immediately on placeOrder
- Razorpay: `createRazorpayOrder()` via Basic auth; `verifyRazorpayPayment()` with HMAC-SHA256 timingSafeEqual; reduces stock + clears cart on verify
- Razorpay webhook: `server/routes/api/razorpay/webhook.post.ts` — HMAC-SHA256 signature verify, `payment.captured` reduces stock + clears cart
- Order success page: `/order/$orderNumber` with status, GST breakdown, delivery address, WhatsApp contact
- `codEnabled` column added to `store_settings` via migration `0002_panoramic_power_pack.sql`
- Build: ✅ `bun run build` passes

### ✅ Phase 6 — Orders, Invoicing, Enquiries, Customers, Emails
- Customer "My Orders" page + order detail with timeline, invoice download, cancel
- Admin order management: list (filter/search/date range), detail view, status flow (confirmed→packed→shipped→delivered), courier+tracking for shipped, COD payment mark, cancel (restores stock), order history timeline
- Sequential invoice numbers per Indian financial year: `MUR/2026-27/0001` (prefix/FY/4-digit)
- GST-compliant PDF invoice via `pdf-lib` (server-only `src/server/invoice-service.ts`): seller block with structured address fields (falls back to `registeredAddress`), buyer/shipping block, line items with CGST+SGST/IGST breakdown, total in words (`inrInWords`)
- Admin Settings: 6 new business-detail fields (`addressLine1`, `addressLine2`, `city`, `pincode`, `phone`, `businessEmail`); GSTIN cross-validated against state GST code (Rajasthan=08); warning banner on dashboard + settings when any invoice-required field is missing; migration `0004_noisy_joystick.sql`
- Enquiries: contact/bulk/custom forms wired to `enquiries` table with Zod validation, honeypot, in-memory rate limit (3/IP/10min); `/admin/enquiries` — paginated list, type/status filters, inline message view, status update
- Newsletter: footer subscribe form → `newsletter_subscribers`; duplicate email returns friendly "already subscribed" message
- Admin Customers (`/admin/customers`): searchable paginated list (name/email/phone/joined/orders/spent); detail view (orders + saved addresses)
- Emails via Resend (`fetch`, never SDK): order confirmation with PDF attachment, admin new-order alert, order shipped (courier+tracking), order cancelled, password reset (replaces TODO in auth.ts); all silent/fallback if `RESEND_API_KEY` not set; `.env.example` updated with `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- Test user `cs-1792127247392@example.com` deleted from DB
- Build: ✅ `bun run build` passes

### ✅ Phase 7 — PWA (done)
- `public/manifest.webmanifest` — name "Murlit", short_name "Murlit", theme #7c1d1d, background #fdf6ee
- `public/sw.js` — cache-first for static assets; NEVER caches /api, /admin, /account, /checkout, /cart
- `public/offline.html` — branded offline fallback page
- Service worker registered in `__root.tsx` via inline script on `window.load`
- Manifest linked in `<head>` + `apple-touch-icon` meta; site is installable on Android Chrome

### ✅ Phase 8 — Security & Production (done)
- **Legal pages**: `/privacy-policy`, `/terms`, `/refund-policy`, `/shipping-policy` — all pull business details from `store_settings` server-side; Footer links updated
- **Vercel build**: `NITRO_PRESET=vercel vite build` targets Vercel serverless. `build:vercel` npm script + `vercel.json` with install/build commands and security headers. Nitro outputs to `.vercel/output/`.
- **Auth**: `trustedOrigins` in production now includes `BETTER_AUTH_URL` + comma-separated `TRUSTED_ORIGINS` env var (for `murlit.com`, `www.murlit.com`, `murlit-store.vercel.app`)
- **Security**:
  - SheetJS upgraded from `xlsx@0.18.5` (vulnerable) to `xlsx@0.20.3` official tarball
  - Order number race fixed: uses `crypto.randomBytes(4)` → `PREFIX-YYYYMM-XXXXXXXX` (no COUNT(*) race)
  - All admin server functions call `requireAdmin()`; all customer order/invoice functions check ownership via `eq(orders.userId, user.id)`
  - Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) added via Nitro middleware (`server/middleware/security-headers.ts`) and `vercel.json`
  - `bun run build` passes ✅
- **docs/DEPLOY.md**: full Vercel settings + env var reference with required/optional distinction
