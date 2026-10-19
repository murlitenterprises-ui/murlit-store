-- Composite indexes for common product query patterns
-- is_active + category_id: category pages
CREATE INDEX IF NOT EXISTS "products_active_category_idx" ON "products" ("is_active","category_id");
-- is_active + is_featured: home page featured products
CREATE INDEX IF NOT EXISTS "products_active_featured_idx" ON "products" ("is_active","is_featured");
-- is_active + created_at: newest sort
CREATE INDEX IF NOT EXISTS "products_active_created_idx" ON "products" ("is_active","created_at");
