-- Guest Checkout Migration (additive only — safe to run multiple times)

-- Add guest checkout tracking columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_guest_checkout boolean NOT NULL DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_account_created boolean NOT NULL DEFAULT false;

-- Add COD limit for guests to store_settings (default ₹10,000 = 1,000,000 paise)
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS cod_max_guest_order_paise integer NOT NULL DEFAULT 1000000;

-- Guest order tokens: lets an existing-email guest view their order via a 7-day signed link
CREATE TABLE IF NOT EXISTS guest_order_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  token       text NOT NULL,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS guest_order_tokens_token_idx ON guest_order_tokens(token);
CREATE        INDEX IF NOT EXISTS guest_order_tokens_order_idx ON guest_order_tokens(order_id);

-- Guest rate limits: throttle order placement by IP and phone number
CREATE TABLE IF NOT EXISTS guest_rate_limits (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key          text NOT NULL,         -- IP address or phone number
  endpoint     text NOT NULL,         -- e.g. 'placeOrder', 'placeOrder_phone'
  count        integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS guest_rate_limits_key_idx ON guest_rate_limits(key, endpoint);
