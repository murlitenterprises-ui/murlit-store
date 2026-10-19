-- ============================================================
-- Migration 0008: Multi-currency, USD pricing, Auto Offers
-- Fully additive and re-runnable (IF NOT EXISTS / ON CONFLICT)
-- NO DROP, NO TRUNCATE, NO DELETE, NO column type changes
-- ============================================================

-- Exchange rates table
CREATE TABLE IF NOT EXISTS "exchange_rates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "currency" text NOT NULL,
  "rate_per_inr" numeric(18,8) NOT NULL,
  "is_manual" boolean DEFAULT false NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "exchange_rates_currency_idx" ON "exchange_rates" USING btree ("currency");

-- Seed fallback exchange rates
INSERT INTO "exchange_rates" ("currency", "rate_per_inr", "is_manual") VALUES
  ('USD', 0.01190, false),
  ('EUR', 0.01100, false),
  ('GBP', 0.00940, false),
  ('AED', 0.04370, false),
  ('CAD', 0.01630, false),
  ('AUD', 0.01840, false),
  ('SGD', 0.01610, false)
ON CONFLICT ("currency") DO NOTHING;

-- Offer type enum (create only if not exists)
DO $$ BEGIN
  CREATE TYPE "public"."offer_type" AS ENUM('welcome', 'loyalty', 'cart_value', 'sitewide', 'bank');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Offers table
CREATE TABLE IF NOT EXISTS "offers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "key" text NOT NULL,
  "type" "offer_type" NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "tag_text" text,
  "percent" integer NOT NULL,
  "max_discount_paise" integer,
  "min_order_paise" integer NOT NULL DEFAULT 0,
  "min_past_orders" integer NOT NULL DEFAULT 0,
  "starts_at" timestamp with time zone,
  "ends_at" timestamp with time zone,
  "is_active" boolean DEFAULT false NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "offers_key_idx" ON "offers" USING btree ("key");

-- Seed 5 default offers
INSERT INTO "offers" ("key", "type", "title", "description", "tag_text", "percent", "max_discount_paise", "min_order_paise", "min_past_orders", "is_active", "sort_order") VALUES
  ('welcome',          'welcome',    'Welcome offer – 10% off your first order',          'Valid on your very first order. Cannot be combined with other offers.',      '10% OFF',     10, 50000,  0,      0, true,  1),
  ('loyalty',          'loyalty',    'Loyal customer reward – 10% off',                   'Exclusive for customers who have placed 3 or more orders.',                  '10% OFF',     10, 50000,  0,      3, true,  2),
  ('cart_value',       'cart_value', 'Save 5% on orders above ₹2,499',                   'Add items worth ₹2,499 or more to unlock this offer.',                       '5% OFF',       5, 25000,  249900, 0, true,  3),
  ('sitewide_festival','sitewide',   'Festival Sale – 10% off on everything',             'Limited time festival discount on all products.',                            '10% OFF',     10, 100000, 0,      0, false, 4),
  ('bank_offer',       'bank',       'Bank Offer – Coming Soon',                          'Exclusive bank and card discounts coming soon.',                             'COMING SOON',  0, NULL,   0,      0, false, 5)
ON CONFLICT ("key") DO NOTHING;

-- Products: USD price columns (additive)
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "price_usd_cents" integer;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "compare_at_usd_cents" integer;

-- Orders: offer columns (additive)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "applied_offer_id" uuid;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "offer_discount_paise" integer DEFAULT 0 NOT NULL;

-- Store settings: max total discount percent
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "max_total_discount_percent" integer DEFAULT 20 NOT NULL;

-- Coupons: is_public flag
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "is_public" boolean DEFAULT true NOT NULL;

-- FK for applied_offer_id (create only if not exists)
DO $$ BEGIN
  ALTER TABLE "orders" ADD CONSTRAINT "orders_applied_offer_id_offers_id_fk"
    FOREIGN KEY ("applied_offer_id") REFERENCES "public"."offers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "orders_applied_offer_idx" ON "orders" USING btree ("applied_offer_id");
