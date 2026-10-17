# Deploying Murlit to Vercel

## Vercel Project Settings

| Setting | Value |
|---|---|
| **Framework Preset** | Other (set to `null` — Nitro handles the build) |
| **Install Command** | `bun install` |
| **Build Command** | `bun run build:vercel` |
| **Output Directory** | *(leave blank — Nitro's vercel preset writes to `.vercel/output` automatically)* |

> **Note:** `bun run build:vercel` sets `NITRO_PRESET=vercel` before calling `vite build`,
> which tells Nitro to output a Vercel-compatible serverless bundle to `.vercel/output/`.
> The `/api/auth/*` (Better Auth) and `/api/razorpay/webhook` routes are handled by Nitro
> server routes in `server/routes/` and will be included automatically.

---

## Environment Variables (set in Vercel → Project → Settings → Environment Variables)

### Required

| Name | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string (`postgresql://...`). Get from Neon dashboard. |
| `BETTER_AUTH_SECRET` | Random 32-char secret for Better Auth session signing. Generate: `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | Your production URL, e.g. `https://murlit.com` or `https://murlit-store.vercel.app`. Must match the deployed domain exactly. |
| `RAZORPAY_KEY_ID` | Razorpay live API key ID (starts with `rzp_live_`). |
| `RAZORPAY_KEY_SECRET` | Razorpay live API key secret. |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name (for product image uploads). |
| `CLOUDINARY_API_KEY` | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret (used server-side for signed uploads). |
| `RESEND_API_KEY` | Resend API key for transactional emails (order confirmations, password reset). |
| `EMAIL_FROM` | Sender email address, e.g. `Murlit <orders@murlit.com>`. Must be a verified Resend domain. |

### Optional

| Name | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID. If omitted, Google Sign-In button is hidden. |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret. Required if `GOOGLE_CLIENT_ID` is set. |
| `TRUSTED_ORIGINS` | Comma-separated extra origins to trust for auth cookies, e.g. `https://murlit.com,https://www.murlit.com,https://murlit-store.vercel.app`. |
| `ADMIN_NOTIFY_EMAIL` | Email address that receives new-order notifications. Defaults to `EMAIL_FROM` if omitted. |
| `NITRO_PRESET` | Override the Nitro deployment preset. Set to `vercel` on Vercel (the `build:vercel` script sets this automatically). |

---

## Custom Domain (murlit.com)

1. In Vercel → Domains, add `murlit.com` and `www.murlit.com`.
2. Update your DNS: add the CNAME/A records Vercel gives you.
3. Set `BETTER_AUTH_URL=https://murlit.com` in Vercel env vars.
4. Set `TRUSTED_ORIGINS=https://murlit.com,https://www.murlit.com` so both the apex and www domain work with auth.
5. In the Razorpay dashboard, add `https://murlit.com` as an allowed origin/callback URL.
6. In Google Cloud Console (if using Google OAuth), add `https://murlit.com` as an authorised redirect URI: `https://murlit.com/api/auth/callback/google`.

---

## Google OAuth Setup (for Google Sign-In)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials.
2. Create an OAuth 2.0 client (Web application).
3. Authorised redirect URIs: `https://murlit.com/api/auth/callback/google` (and optionally your Vercel preview URL).
4. Copy the Client ID and Secret into Vercel env vars `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

---

## Razorpay Webhook

The webhook endpoint is `/api/razorpay/webhook` (POST).  
In the Razorpay dashboard → Webhooks, add:  
- URL: `https://murlit.com/api/razorpay/webhook`
- Events: `payment.captured`, `payment.failed`
- Secret: set a webhook secret and add it as `RAZORPAY_WEBHOOK_SECRET` env var (if your webhook handler verifies it).

---

## Database Migrations

Run migrations from your local machine before going live (or add a post-deploy hook):

```sh
bun run db:migrate
```

The `DATABASE_URL` must be set in your `.env` locally or passed as an environment variable.
