CREATE TYPE "public"."coin_ledger_type" AS ENUM('earn', 'spend', 'reverse', 'expire', 'admin_adjust');--> statement-breakpoint
CREATE TABLE "coin_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "coin_ledger_type" NOT NULL,
	"amount" integer NOT NULL,
	"reason" text NOT NULL,
	"order_id" uuid,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon_usages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"order_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "per_user_limit" integer;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "first_order_only" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "coupon_discount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "coins_used" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "coins_value" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "referral_discount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "referral_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "referral_coin_reward" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "referral_welcome_discount" integer DEFAULT 5000 NOT NULL;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "coin_value_paise" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "max_coins_pct_per_order" integer DEFAULT 20 NOT NULL;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "coin_expiry_days" integer DEFAULT 365 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referral_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referred_by" text;--> statement-breakpoint
ALTER TABLE "coin_ledger" ADD CONSTRAINT "coin_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_ledger" ADD CONSTRAINT "coin_ledger_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coin_ledger_user_idx" ON "coin_ledger" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "coin_ledger_order_idx" ON "coin_ledger" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "coupon_usages_coupon_idx" ON "coupon_usages" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "coupon_usages_user_idx" ON "coupon_usages" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_referral_code_idx" ON "users" USING btree ("referral_code");