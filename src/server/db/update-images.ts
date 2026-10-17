// Idempotent one-off script: update category and product image URLs to /images/*.jpg
// Run: bun src/server/db/update-images.ts   (or node --env-file=.env …)
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

// Category slug → image
const CAT_IMAGES: Record<string, string> = {
  "pooja-rituals":            "/images/poojakit.jpg",
  "wedding-essentials":       "/images/wedding.jpg",
  "wedding-decor-gifting":    "/images/hamper.jpg",
  "crochet":                  "/images/crochet.jpg",
  "mala-accessories-handmade":"/images/mala.jpg",
};

// SKU → image
const SKU_IMAGES: Record<string, string> = {
  p1:  "/images/poojakit.jpg",
  p2:  "/images/wedding.jpg",
  p3:  "/images/hero.jpg",
  p4:  "/images/mala.jpg",
  p5:  "/images/crochet.jpg",
  p6:  "/images/hamper.jpg",
  p7:  "/images/diwali.jpg",
  p8:  "/images/hamper.jpg",
  p9:  "/images/haldi.jpg",
  p10: "/images/crochet.jpg",
  p11: "/images/poojakit.jpg",
  p12: "/images/mala.jpg",
};

async function run() {
  console.log("Updating category images…");
  for (const [slug, image] of Object.entries(CAT_IMAGES)) {
    await db.update(schema.categories).set({ image }).where(eq(schema.categories.slug, slug));
    console.log(`  ✓ ${slug}`);
  }

  console.log("Updating product images and upserting product_images rows…");
  for (const [sku, imageUrl] of Object.entries(SKU_IMAGES)) {
    // Get the product id
    const [prod] = await db.select({ id: schema.products.id })
      .from(schema.products).where(eq(schema.products.sku, sku)).limit(1);
    if (!prod) { console.warn(`  ⚠ product not found: ${sku}`); continue; }

    // Update product image (we store it as the first product_images row, not on the product row directly)
    // Upsert into product_images: check if a row with sortOrder=0 exists
    const existing = await db.select({ id: schema.productImages.id })
      .from(schema.productImages)
      .where(eq(schema.productImages.productId, prod.id))
      .limit(1);

    if (existing.length) {
      await db.update(schema.productImages).set({ url: imageUrl })
        .where(eq(schema.productImages.id, existing[0].id));
    } else {
      await db.insert(schema.productImages).values({
        productId: prod.id, url: imageUrl, sortOrder: 0,
      });
    }
    console.log(`  ✓ ${sku}`);
  }

  console.log("Done!");
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
