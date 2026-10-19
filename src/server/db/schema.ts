import {
  pgTable, pgEnum,
  uuid, text, integer, boolean, jsonb, timestamp, uniqueIndex, index, numeric,
} from "drizzle-orm/pg-core";

// ─── Helpers ────────────────────────────────────────────────────────────────

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

// ─── Enums ──────────────────────────────────────────────────────────────────

export const orderStatusEnum = pgEnum("order_status", [
  "pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded",
]);

export const paymentMethodEnum = pgEnum("payment_method", ["razorpay", "cod"]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending", "paid", "failed", "refunded",
]);

export const taxTypeEnum = pgEnum("tax_type", ["CGST_SGST", "IGST"]);

export const userRoleEnum = pgEnum("user_role", ["customer", "admin"]);

export const couponTypeEnum = pgEnum("coupon_type", ["percent", "flat"]);

export const coinLedgerTypeEnum = pgEnum("coin_ledger_type", ["earn", "spend", "reverse", "expire", "admin_adjust"]);

export const enquiryTypeEnum = pgEnum("enquiry_type", ["custom", "bulk", "contact"]);

export const offerTypeEnum = pgEnum("offer_type", ["welcome", "loyalty", "cart_value", "sitewide", "bank"]);

export const enquiryStatusEnum = pgEnum("enquiry_status", [
  "new", "in_progress", "closed",
]);

// ─── Categories ──────────────────────────────────────────────────────────────

export const categories = pgTable("categories", {
  id:          uuid("id").primaryKey().defaultRandom(),
  name:        text("name").notNull(),
  slug:        text("slug").notNull(),
  image:       text("image"),
  description: text("description"),
  sortOrder:   integer("sort_order").notNull().default(0),
  isActive:    boolean("is_active").notNull().default(true),
  parentId:    uuid("parent_id"), // null = top-level, set = sub-category
  ...timestamps,
}, (t) => [
  uniqueIndex("categories_slug_idx").on(t.slug),
  index("categories_parent_idx").on(t.parentId),
]);

// ─── Products ────────────────────────────────────────────────────────────────

export const products = pgTable("products", {
  id:               uuid("id").primaryKey().defaultRandom(),
  name:             text("name").notNull(),
  slug:             text("slug").notNull(),
  shortDescription: text("short_description"),
  description:      text("description"),
  price:            integer("price").notNull(),       // paise
  mrp:              integer("mrp"),                   // paise, nullable
  sku:              text("sku").notNull(),
  stock:            integer("stock").notNull().default(0),
  isActive:         boolean("is_active").notNull().default(true),
  isFeatured:       boolean("is_featured").notNull().default(false),
  badge:            text("badge"),
  categoryId:       uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  tags:             text("tags").array().notNull().default([]),
  occasions:        text("occasions").array().notNull().default([]),
  materials:        text("materials"),
  weight:           text("weight"),
  dimensions:       text("dimensions"),
  hsnCode:          text("hsn_code"),
  gstRate:          integer("gst_rate").notNull().default(5), // 0 | 5 | 12 | 18
  priceIncludesGst: boolean("price_includes_gst").notNull().default(true),
  seoTitle:         text("seo_title"),
  seoDescription:   text("seo_description"),
  // USD pricing (optional fixed price)
  priceUsdCents:    integer("price_usd_cents"),         // null = use exchange rate
  compareAtUsdCents: integer("compare_at_usd_cents"),   // null = use exchange rate
  ...timestamps,
}, (t) => [
  uniqueIndex("products_slug_idx").on(t.slug),
  uniqueIndex("products_sku_idx").on(t.sku),
  index("products_category_idx").on(t.categoryId),
  index("products_active_idx").on(t.isActive),
  index("products_featured_idx").on(t.isFeatured),
  index("products_active_category_idx").on(t.isActive, t.categoryId),
  index("products_active_featured_idx").on(t.isActive, t.isFeatured),
  index("products_active_created_idx").on(t.isActive, t.createdAt),
]);

// ─── Product Images ───────────────────────────────────────────────────────────

export const productImages = pgTable("product_images", {
  id:        uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  url:       text("url").notNull(),
  publicId:  text("public_id"),
  alt:       text("alt"),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
}, (t) => [
  index("product_images_product_idx").on(t.productId),
]);

// ─── Better Auth tables ───────────────────────────────────────────────────────
// Compatible with Better Auth's Drizzle adapter (camelCase JS, snake_case DB)

export const users = pgTable("users", {
  id:            text("id").primaryKey(),
  name:          text("name").notNull(),
  email:         text("email").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image:         text("image"),
  // Use text (not pgEnum) so Better Auth's Drizzle adapter can read/write it without enum casting issues
  role:          text("role").notNull().default("customer"),
  phone:         text("phone"),
  referralCode:  text("referral_code"),  // unique, generated lazily
  referredBy:    text("referred_by"),    // userId of the referrer
  ...timestamps,
}, (t) => [
  uniqueIndex("users_email_idx").on(t.email),
  uniqueIndex("users_referral_code_idx").on(t.referralCode),
]);

export const sessions = pgTable("sessions", {
  id:        text("id").primaryKey(),
  userId:    text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token:     text("token").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  ...timestamps,
}, (t) => [
  uniqueIndex("sessions_token_idx").on(t.token),
  index("sessions_user_idx").on(t.userId),
]);

export const accounts = pgTable("accounts", {
  id:                   text("id").primaryKey(),
  userId:               text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId:            text("account_id").notNull(),
  providerId:           text("provider_id").notNull(),
  accessToken:          text("access_token"),
  refreshToken:         text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt:timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope:                text("scope"),
  idToken:              text("id_token"),
  password:             text("password"),
  ...timestamps,
}, (t) => [
  index("accounts_user_idx").on(t.userId),
]);

export const verifications = pgTable("verifications", {
  id:         text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value:      text("value").notNull(),
  expiresAt:  timestamp("expires_at", { withTimezone: true }).notNull(),
  ...timestamps,
}, (t) => [
  index("verifications_identifier_idx").on(t.identifier),
]);

// ─── Addresses ────────────────────────────────────────────────────────────────

export const addresses = pgTable("addresses", {
  id:         uuid("id").primaryKey().defaultRandom(),
  userId:     text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name:       text("name").notNull(),
  phone:      text("phone").notNull(),
  line1:      text("line1").notNull(),
  line2:      text("line2"),
  city:       text("city").notNull(),
  state:      text("state").notNull(),
  stateCode:  text("state_code").notNull(),
  pincode:    text("pincode").notNull(),
  isDefault:  boolean("is_default").notNull().default(false),
  ...timestamps,
}, (t) => [
  index("addresses_user_idx").on(t.userId),
]);

// ─── Cart ─────────────────────────────────────────────────────────────────────

export const carts = pgTable("carts", {
  id:         uuid("id").primaryKey().defaultRandom(),
  userId:     text("user_id").references(() => users.id, { onDelete: "cascade" }),
  sessionKey: text("session_key"), // for guest carts
  ...timestamps,
}, (t) => [
  index("carts_user_idx").on(t.userId),
  index("carts_session_idx").on(t.sessionKey),
]);

export const cartItems = pgTable("cart_items", {
  id:        uuid("id").primaryKey().defaultRandom(),
  cartId:    uuid("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  qty:       integer("qty").notNull().default(1),
  ...timestamps,
}, (t) => [
  index("cart_items_cart_idx").on(t.cartId),
]);

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export const wishlistItems = pgTable("wishlist_items", {
  id:        uuid("id").primaryKey().defaultRandom(),
  userId:    text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  ...timestamps,
}, (t) => [
  index("wishlist_user_idx").on(t.userId),
]);

// ─── Orders ───────────────────────────────────────────────────────────────────

export const orders = pgTable("orders", {
  id:               uuid("id").primaryKey().defaultRandom(),
  orderNumber:      text("order_number").notNull(),
  userId:           text("user_id").references(() => users.id, { onDelete: "set null" }), // null = guest
  email:            text("email").notNull(),
  phone:            text("phone").notNull(),
  status:           orderStatusEnum("status").notNull().default("pending"),
  paymentMethod:    paymentMethodEnum("payment_method").notNull(),
  paymentStatus:    paymentStatusEnum("payment_status").notNull().default("pending"),
  razorpayOrderId:  text("razorpay_order_id"),
  razorpayPaymentId:text("razorpay_payment_id"),
  // All amounts in paise
  subtotal:         integer("subtotal").notNull(),
  shipping:         integer("shipping").notNull().default(0),
  discount:         integer("discount").notNull().default(0),
  taxableAmount:    integer("taxable_amount").notNull(),
  cgst:             integer("cgst").notNull().default(0),
  sgst:             integer("sgst").notNull().default(0),
  igst:             integer("igst").notNull().default(0),
  total:            integer("total").notNull(),
  taxType:          taxTypeEnum("tax_type").notNull(),
  placeOfSupplyState: text("place_of_supply_state").notNull(),
  customerGstin:    text("customer_gstin"),
  shippingAddress:  jsonb("shipping_address").notNull(), // snapshot
  invoiceNumber:    text("invoice_number"),
  invoiceDate:      timestamp("invoice_date", { withTimezone: true }),
  couponCode:         text("coupon_code"),
  couponDiscount:     integer("coupon_discount").notNull().default(0),     // paise
  coinsUsed:          integer("coins_used").notNull().default(0),           // number of coins
  coinsValue:         integer("coins_value").notNull().default(0),          // paise value
  referralDiscount:   integer("referral_discount").notNull().default(0),   // paise
  appliedOfferId:     uuid("applied_offer_id"),                              // FK to offers
  offerDiscountPaise: integer("offer_discount_paise").notNull().default(0), // paise
  ...timestamps,
}, (t) => [
  uniqueIndex("orders_order_number_idx").on(t.orderNumber),
  uniqueIndex("orders_invoice_number_idx").on(t.invoiceNumber),
  index("orders_user_idx").on(t.userId),
  index("orders_status_idx").on(t.status),
  index("orders_created_at_idx").on(t.createdAt),
  index("orders_applied_offer_idx").on(t.appliedOfferId),
]);

// ─── Order Items ──────────────────────────────────────────────────────────────

export const orderItems = pgTable("order_items", {
  id:           uuid("id").primaryKey().defaultRandom(),
  orderId:      uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId:    uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  // Snapshots — preserved even if product is later edited/deleted
  name:         text("name").notNull(),
  sku:          text("sku").notNull(),
  image:        text("image"),
  price:        integer("price").notNull(),       // paise at time of order
  qty:          integer("qty").notNull(),
  hsnCode:      text("hsn_code"),
  gstRate:      integer("gst_rate").notNull(),
  taxableValue: integer("taxable_value").notNull(),
  taxAmount:    integer("tax_amount").notNull(),
  ...timestamps,
}, (t) => [
  index("order_items_order_idx").on(t.orderId),
]);

// ─── Store Settings (single row) ─────────────────────────────────────────────

export const storeSettings = pgTable("store_settings", {
  id:                 uuid("id").primaryKey().defaultRandom(),
  legalName:          text("legal_name").notNull(),
  gstin:              text("gstin"),
  registeredAddress:  text("registered_address"),
  addressLine1:       text("address_line1"),
  addressLine2:       text("address_line2"),
  city:               text("city"),
  pincode:            text("pincode"),
  phone:              text("phone"),
  businessEmail:      text("business_email"),
  state:              text("state").notNull(),
  stateCode:          text("state_code").notNull(),
  invoicePrefix:      text("invoice_prefix").notNull().default("MUR"),
  nextInvoiceNumber:  integer("next_invoice_number").notNull().default(1),
  currentFy:          text("current_fy").notNull().default("2025-26"), // e.g. "2026-27"
  pricesIncludeGst:   boolean("prices_include_gst").notNull().default(true),
  freeShippingAbove:  integer("free_shipping_above").notNull().default(50000), // paise
  shippingFee:        integer("shipping_fee").notNull().default(9900),          // paise
  codEnabled:               boolean("cod_enabled").notNull().default(true),
  whatsappNumber:           text("whatsapp_number"),
  supportEmail:             text("support_email"),
  // Refer & Earn settings
  referralEnabled:          boolean("referral_enabled").notNull().default(true),
  referralCoinReward:       integer("referral_coin_reward").notNull().default(100),      // coins earned by referrer
  referralWelcomeDiscount:  integer("referral_welcome_discount").notNull().default(5000), // paise (₹50)
  coinValuePaise:           integer("coin_value_paise").notNull().default(100),           // paise per coin (₹1)
  maxCoinsPctPerOrder:      integer("max_coins_pct_per_order").notNull().default(20),     // % of order value
  coinExpiryDays:           integer("coin_expiry_days").notNull().default(365),
  maxTotalDiscountPercent:  integer("max_total_discount_percent").notNull().default(20),
  ...timestamps,
});

// ─── Order History ────────────────────────────────────────────────────────────

export const orderHistory = pgTable("order_history", {
  id:             uuid("id").primaryKey().defaultRandom(),
  orderId:        uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  status:         orderStatusEnum("status").notNull(),
  note:           text("note"),
  courier:        text("courier"),
  trackingNumber: text("tracking_number"),
  trackingUrl:    text("tracking_url"),
  createdBy:      text("created_by"), // userId of admin or "system"
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("order_history_order_idx").on(t.orderId),
]);

// ─── Coupons ──────────────────────────────────────────────────────────────────

export const coupons = pgTable("coupons", {
  id:          uuid("id").primaryKey().defaultRandom(),
  code:        text("code").notNull(),
  type:        couponTypeEnum("type").notNull(),
  value:       integer("value").notNull(),      // % or paise flat
  minOrder:    integer("min_order").notNull().default(0),  // paise
  maxDiscount: integer("max_discount"),         // paise cap (for percent type)
  startsAt:    timestamp("starts_at", { withTimezone: true }),
  endsAt:      timestamp("ends_at", { withTimezone: true }),
  usageLimit:  integer("usage_limit"),
  usedCount:   integer("used_count").notNull().default(0),
  isActive:    boolean("is_active").notNull().default(true),
  perUserLimit: integer("per_user_limit"),           // null = unlimited
  firstOrderOnly: boolean("first_order_only").notNull().default(false),
  description: text("description"),
  isPublic:    boolean("is_public").notNull().default(true),
  ...timestamps,
}, (t) => [
  uniqueIndex("coupons_code_idx").on(t.code),
]);

// ─── Enquiries ────────────────────────────────────────────────────────────────

export const enquiries = pgTable("enquiries", {
  id:      uuid("id").primaryKey().defaultRandom(),
  type:    enquiryTypeEnum("type").notNull(),
  name:    text("name").notNull(),
  phone:   text("phone"),
  email:   text("email"),
  message: text("message"),
  details: jsonb("details"),
  status:  enquiryStatusEnum("status").notNull().default("new"),
  ...timestamps,
}, (t) => [
  index("enquiries_type_idx").on(t.type),
  index("enquiries_status_idx").on(t.status),
]);

// ─── Newsletter Subscribers ───────────────────────────────────────────────────

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id:    uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  ...timestamps,
}, (t) => [
  uniqueIndex("newsletter_email_idx").on(t.email),
]);

// ─── Coupon Usages ────────────────────────────────────────────────────────────

export const couponUsages = pgTable("coupon_usages", {
  id:       uuid("id").primaryKey().defaultRandom(),
  couponId: uuid("coupon_id").notNull().references(() => coupons.id, { onDelete: "cascade" }),
  userId:   text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orderId:  uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("coupon_usages_coupon_idx").on(t.couponId),
  index("coupon_usages_user_idx").on(t.userId),
]);

// ─── Coin Ledger ──────────────────────────────────────────────────────────────

export const coinLedger = pgTable("coin_ledger", {
  id:        uuid("id").primaryKey().defaultRandom(),
  userId:    text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type:      coinLedgerTypeEnum("type").notNull(),
  amount:    integer("amount").notNull(), // +ve = credit, -ve = debit
  reason:    text("reason").notNull(),
  orderId:   uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("coin_ledger_user_idx").on(t.userId),
  index("coin_ledger_order_idx").on(t.orderId),
]);

// ─── Reviews ──────────────────────────────────────────────────────────────────

// ─── Exchange Rates ───────────────────────────────────────────────────────────

export const exchangeRates = pgTable("exchange_rates", {
  id:         uuid("id").primaryKey().defaultRandom(),
  currency:   text("currency").notNull(),      // "USD", "EUR", etc.
  ratePerInr: numeric("rate_per_inr", { precision: 18, scale: 8 }).notNull(),
  isManual:   boolean("is_manual").notNull().default(false),
  updatedAt:  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("exchange_rates_currency_idx").on(t.currency),
]);

// ─── Offers ───────────────────────────────────────────────────────────────────

export const offers = pgTable("offers", {
  id:               uuid("id").primaryKey().defaultRandom(),
  key:              text("key").notNull(),          // unique slug e.g. "welcome"
  type:             offerTypeEnum("type").notNull(),
  title:            text("title").notNull(),
  description:      text("description"),
  tagText:          text("tag_text"),               // e.g. "10% OFF"
  percent:          integer("percent").notNull(),
  maxDiscountPaise: integer("max_discount_paise"),  // null = no cap
  minOrderPaise:    integer("min_order_paise").notNull().default(0),
  minPastOrders:    integer("min_past_orders").notNull().default(0),
  startsAt:         timestamp("starts_at", { withTimezone: true }),
  endsAt:           timestamp("ends_at", { withTimezone: true }),
  isActive:         boolean("is_active").notNull().default(false),
  sortOrder:        integer("sort_order").notNull().default(0),
  ...timestamps,
}, (t) => [
  uniqueIndex("offers_key_idx").on(t.key),
]);

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const reviews = pgTable("reviews", {
  id:         uuid("id").primaryKey().defaultRandom(),
  productId:  uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  userId:     text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating:     integer("rating").notNull(),
  title:      text("title"),
  body:       text("body"),
  isApproved: boolean("is_approved").notNull().default(false),
  ...timestamps,
}, (t) => [
  index("reviews_product_idx").on(t.productId),
  index("reviews_user_idx").on(t.userId),
]);
