// Idempotent seed — safe to run multiple times.
// Run via: bun run db:seed
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "./schema";

// ─── Inline catalog data (mirrors src/lib/menu.ts + catalog.ts) ────────────
// We use plain strings for image paths (the local asset imports are bundler
// artefacts; at runtime the seeded rows will use Cloudinary URLs in phase 4).

const PLACEHOLDER = "/assets/placeholder.jpg";

const TOP_CATEGORIES = [
  { name: "Pooja & Rituals",              slug: "pooja-rituals",               image: PLACEHOLDER, sortOrder: 1 },
  { name: "Wedding Essentials",           slug: "wedding-essentials",           image: PLACEHOLDER, sortOrder: 2 },
  { name: "Wedding Décor & Gifting",      slug: "wedding-decor-gifting",        image: PLACEHOLDER, sortOrder: 3 },
  { name: "Crochet",                      slug: "crochet",                      image: PLACEHOLDER, sortOrder: 4 },
  { name: "Mala, Accessories & Handmade", slug: "mala-accessories-handmade",    image: PLACEHOLDER, sortOrder: 5 },
];

const SUB_CATEGORIES: { parentSlug: string; name: string; slug: string; sortOrder: number }[] = [
  // Pooja & Rituals
  { parentSlug: "pooja-rituals", name: "Pooja Kits",                      slug: "pooja-kits",                 sortOrder: 1 },
  { parentSlug: "pooja-rituals", name: "Pooja Samagri",                   slug: "pooja-samagri",              sortOrder: 2 },
  { parentSlug: "pooja-rituals", name: "Pooja Chowki & Aasan",            slug: "pooja-chowki-aasan",         sortOrder: 3 },
  { parentSlug: "pooja-rituals", name: "Pooja Thali & Aarti Set",         slug: "pooja-thali-aarti-set",      sortOrder: 4 },
  { parentSlug: "pooja-rituals", name: "Kalash & Panchpatra",             slug: "kalash-panchpatra",          sortOrder: 5 },
  { parentSlug: "pooja-rituals", name: "Murti & Idols",                   slug: "murti-idols",                sortOrder: 6 },
  { parentSlug: "pooja-rituals", name: "Pooja Mandir & Singhasan",        slug: "pooja-mandir-singhasan",     sortOrder: 7 },
  { parentSlug: "pooja-rituals", name: "Diya, Batti, Dhoop & Agarbatti", slug: "diya-batti-dhoop-agarbatti", sortOrder: 8 },
  { parentSlug: "pooja-rituals", name: "Yantra & Rudraksha",              slug: "yantra-rudraksha",           sortOrder: 9 },
  // Wedding Essentials
  { parentSlug: "wedding-essentials", name: "Wedding Pooja Samagri",           slug: "wedding-pooja-samagri",       sortOrder: 1 },
  { parentSlug: "wedding-essentials", name: "Padle ka Saman",                  slug: "padle-ka-saman",              sortOrder: 2 },
  { parentSlug: "wedding-essentials", name: "Batisi ka Saman",                 slug: "batisi-ka-saman",             sortOrder: 3 },
  { parentSlug: "wedding-essentials", name: "Shagun Envelopes, Boxes & Thalis",slug: "shagun-envelopes-boxes-thalis",sortOrder: 4 },
  { parentSlug: "wedding-essentials", name: "Wedding Potli & Batua",           slug: "wedding-potli-batua",         sortOrder: 5 },
  { parentSlug: "wedding-essentials", name: "Decorative Chowki",               slug: "decorative-chowki",           sortOrder: 6 },
  { parentSlug: "wedding-essentials", name: "Wedding Thali",                   slug: "wedding-thali",               sortOrder: 7 },
  { parentSlug: "wedding-essentials", name: "Tilak, Roka & Ring Trays",        slug: "tilak-roka-ring-trays",       sortOrder: 8 },
  { parentSlug: "wedding-essentials", name: "Dulha-Dulhan Accessories",        slug: "dulha-dulhan-accessories",    sortOrder: 9 },
  { parentSlug: "wedding-essentials", name: "Bridal Accessories",              slug: "bridal-accessories",          sortOrder: 10 },
  { parentSlug: "wedding-essentials", name: "Groom Accessories",               slug: "groom-accessories",           sortOrder: 11 },
  // Wedding Décor & Gifting
  { parentSlug: "wedding-decor-gifting", name: "Fancy Nariyal",                   slug: "fancy-nariyal",               sortOrder: 1 },
  { parentSlug: "wedding-decor-gifting", name: "Dry Fruit Plates",                slug: "dry-fruit-plates",            sortOrder: 2 },
  { parentSlug: "wedding-decor-gifting", name: "Decorative Plates & Trays",       slug: "decorative-plates-trays",     sortOrder: 3 },
  { parentSlug: "wedding-decor-gifting", name: "Decorative Kalash",               slug: "decorative-kalash",           sortOrder: 4 },
  { parentSlug: "wedding-decor-gifting", name: "Welcome / Swagat Items",          slug: "welcome-swagat-items",        sortOrder: 5 },
  { parentSlug: "wedding-decor-gifting", name: "Haldi, Mehendi & Sangeet Décor",  slug: "haldi-mehendi-sangeet-decor", sortOrder: 6 },
  { parentSlug: "wedding-decor-gifting", name: "Return Gifts",                    slug: "return-gifts",                sortOrder: 7 },
  { parentSlug: "wedding-decor-gifting", name: "Gift Hampers",                    slug: "gift-hampers",                sortOrder: 8 },
  { parentSlug: "wedding-decor-gifting", name: "Dry Fruit Boxes & Mithai Boxes",  slug: "dry-fruit-mithai-boxes",      sortOrder: 9 },
  // Crochet
  { parentSlug: "crochet", name: "Crochet Flowers & Bouquets",           slug: "flowers-bouquets",            sortOrder: 1 },
  { parentSlug: "crochet", name: "Crochet Toran & Bandhanwar",           slug: "toran-bandhanwar",            sortOrder: 2 },
  { parentSlug: "crochet", name: "Crochet Jewellery",                    slug: "jewellery",                   sortOrder: 3 },
  { parentSlug: "crochet", name: "Crochet Keychains",                    slug: "keychains",                   sortOrder: 4 },
  { parentSlug: "crochet", name: "Crochet Varmala",                      slug: "varmala",                     sortOrder: 5 },
  { parentSlug: "crochet", name: "Crochet Bags & Potlis",                slug: "bags-potlis",                 sortOrder: 6 },
  { parentSlug: "crochet", name: "Crochet Hair Accessories",             slug: "hair-accessories",            sortOrder: 7 },
  { parentSlug: "crochet", name: "Laddu Gopal Crochet Poshak",           slug: "laddu-gopal-poshak",          sortOrder: 8 },
  { parentSlug: "crochet", name: "Crochet Pooja Aasan & Mats",           slug: "pooja-aasan-mats",            sortOrder: 9 },
  { parentSlug: "crochet", name: "Crochet Diya & Kalash Covers",         slug: "diya-kalash-covers",          sortOrder: 10 },
  { parentSlug: "crochet", name: "Crochet Table Mats & Coasters",        slug: "table-mats-coasters",         sortOrder: 11 },
  { parentSlug: "crochet", name: "Crochet Wall Hangings & Dreamcatchers",slug: "wall-hangings-dreamcatchers", sortOrder: 12 },
  { parentSlug: "crochet", name: "Crochet Toys & Amigurumi",             slug: "toys-amigurumi",              sortOrder: 13 },
  { parentSlug: "crochet", name: "Crochet Baby Sets & Booties",          slug: "baby-sets-booties",           sortOrder: 14 },
  { parentSlug: "crochet", name: "Crochet Cushion Covers",               slug: "cushion-covers",              sortOrder: 15 },
  { parentSlug: "crochet", name: "Crochet Bottle & Phone Covers",        slug: "bottle-phone-covers",         sortOrder: 16 },
  { parentSlug: "crochet", name: "Crochet Gift Hampers",                 slug: "gift-hampers",                sortOrder: 17 },
  { parentSlug: "crochet", name: "Custom Crochet Orders",                slug: "custom-orders",               sortOrder: 18 },
  // Mala, Accessories & Handmade
  { parentSlug: "mala-accessories-handmade", name: "Elaichi Mala",                  slug: "elaichi-mala",       sortOrder: 1 },
  { parentSlug: "mala-accessories-handmade", name: "Moti Mala",                     slug: "moti-mala",          sortOrder: 2 },
  { parentSlug: "mala-accessories-handmade", name: "Laung Mala",                    slug: "laung-mala",         sortOrder: 3 },
  { parentSlug: "mala-accessories-handmade", name: "Dry Fruit Mala",                slug: "dry-fruit-mala",     sortOrder: 4 },
  { parentSlug: "mala-accessories-handmade", name: "Bhagwan Ji Ki Mala / Chadhava", slug: "bhagwan-ji-ki-mala", sortOrder: 5 },
  { parentSlug: "mala-accessories-handmade", name: "Brooch & Bracelet",             slug: "brooch-bracelet",    sortOrder: 6 },
  { parentSlug: "mala-accessories-handmade", name: "Crochet Jewellery",             slug: "crochet-jewellery",  sortOrder: 7 },
  { parentSlug: "mala-accessories-handmade", name: "Varmala",                       slug: "varmala",            sortOrder: 8 },
  { parentSlug: "mala-accessories-handmade", name: "Keychains",                     slug: "keychains",          sortOrder: 9 },
  { parentSlug: "mala-accessories-handmade", name: "Table Tops",                    slug: "table-tops",         sortOrder: 10 },
  { parentSlug: "mala-accessories-handmade", name: "Bags",                          slug: "bags",               sortOrder: 11 },
  { parentSlug: "mala-accessories-handmade", name: "Handmade Décor",               slug: "handmade-decor",     sortOrder: 12 },
];

// Products: price in paise (₹ × 100)
const PRODUCTS = [
  { sku:"p1",  name:"Premium Wedding Pooja Kit",     slug:"premium-wedding-pooja-kit",    price:249900, mrp:299900, badge:"Best Seller",  categorySlug:"pooja-rituals",            subSlug:"pooja-kits",                   occasion:"Wedding",     description:"Complete hand-curated kit for all wedding pooja rituals, blessed and thoughtfully packed." },
  { sku:"p2",  name:"Designer Wedding Potli",        slug:"designer-wedding-potli",        price:64900,  mrp:79900,  badge:"Handcrafted",  categorySlug:"wedding-essentials",       subSlug:"wedding-potli-batua",           occasion:"Wedding",     description:"Handcrafted potli in rich fabric with zari embroidery, perfect for shagun and gifting." },
  { sku:"p3",  name:"Decorative Shagun Thali",       slug:"decorative-shagun-thali",       price:129900, mrp:null,   badge:"New Arrival",  categorySlug:"wedding-essentials",       subSlug:"shagun-envelopes-boxes-thalis", occasion:"Engagement",  description:"Beautifully decorated thali for shagun and engagement ceremonies." },
  { sku:"p4",  name:"Elaichi Mala",                  slug:"elaichi-mala",                  price:44900,  mrp:54900,  badge:"Best Seller",  categorySlug:"mala-accessories-handmade",subSlug:"elaichi-mala",                  occasion:"Wedding",     description:"Fresh elaichi mala hand-strung for puja and garland offerings." },
  { sku:"p5",  name:"Handcrafted Varmala",           slug:"handcrafted-varmala",           price:349900, mrp:null,   badge:"Handcrafted",  categorySlug:"crochet",                  subSlug:"varmala",                       occasion:"Wedding",     description:"Lush crochet varmala handcrafted with vibrant yarn and zari accents for the wedding ceremony." },
  { sku:"p6",  name:"Festive Dry Fruit Gift Box",    slug:"festive-dry-fruit-gift-box",    price:189900, mrp:219900, badge:null,           categorySlug:"wedding-decor-gifting",    subSlug:"gift-hampers",                  occasion:"Diwali",      description:"Premium assorted dry fruit gift box, ideal for festive and wedding gifting." },
  { sku:"p7",  name:"Decorative Kalash Set",         slug:"decorative-kalash-set",         price:159900, mrp:null,   badge:"New Arrival",  categorySlug:"wedding-decor-gifting",    subSlug:"decorative-kalash",             occasion:"Griha Pravesh",description:"Ornate kalash set with intricate design for auspicious occasions and décor." },
  { sku:"p8",  name:"Customized Return Gift Hamper", slug:"customized-return-gift-hamper", price:89900,  mrp:null,   badge:"Customizable", categorySlug:"wedding-decor-gifting",    subSlug:"return-gifts",                  occasion:"Wedding",     description:"Customisable return gift hamper with your branding and choice of items." },
  { sku:"p9",  name:"Haldi Ceremony Tray Set",       slug:"haldi-ceremony-tray-set",       price:114900, mrp:null,   badge:null,           categorySlug:"wedding-decor-gifting",    subSlug:"decorative-plates-trays",       occasion:"Haldi",       description:"Vibrant haldi tray set with coordinated accessories for the haldi ceremony." },
  { sku:"p10", name:"Crochet Keychain Set",          slug:"crochet-keychain-set",          price:29900,  mrp:null,   badge:"Handcrafted",  categorySlug:"crochet",                  subSlug:"keychains",                     occasion:"Rakhi",       description:"Playful handmade crochet keychains, perfect as return gifts or everyday accessories." },
  { sku:"p11", name:"Hawan Samagri Complete Kit",    slug:"hawan-samagri-complete-kit",    price:79900,  mrp:null,   badge:null,           categorySlug:"pooja-rituals",            subSlug:"pooja-samagri",                 occasion:"Hawan",       description:"Pure samagri set for hawan and home rituals, sourced from trusted suppliers." },
  { sku:"p12", name:"Moti Mala for Bhagwan Ji",      slug:"moti-mala-for-bhagwan-ji",      price:34900,  mrp:null,   badge:null,           categorySlug:"mala-accessories-handmade",subSlug:"moti-mala",                     occasion:"Navratri",    description:"Pure moti mala for deity offerings and puja decoration." },
];

export async function seed() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  console.log("🌱 Seeding database…");

  // ── 1. Top-level categories ──────────────────────────────────────────────
  console.log("  → categories…");
  const catIdBySlug: Record<string, string> = {};

  for (const c of TOP_CATEGORIES) {
    const existing = await db.select().from(schema.categories)
      .where(eq(schema.categories.slug, c.slug)).limit(1);

    if (existing.length) {
      catIdBySlug[c.slug] = existing[0].id;
    } else {
      const [row] = await db.insert(schema.categories).values({
        name: c.name, slug: c.slug, image: c.image, sortOrder: c.sortOrder, isActive: true,
      }).returning({ id: schema.categories.id });
      catIdBySlug[c.slug] = row.id;
    }
  }

  // ── 2. Sub-categories ────────────────────────────────────────────────────
  console.log("  → sub-categories…");
  const subIdBySlug: Record<string, string> = {};

  for (const s of SUB_CATEGORIES) {
    const parentId = catIdBySlug[s.parentSlug];
    if (!parentId) { console.warn(`    ⚠ parent not found: ${s.parentSlug}`); continue; }

    const key = `${s.parentSlug}/${s.slug}`;
    const existing = await db.select().from(schema.categories)
      .where(eq(schema.categories.slug, s.slug)).limit(1);

    // slug uniqueness: if the same sub-slug exists under a different parent, skip
    const match = existing.find(r => true); // take first
    if (match) {
      subIdBySlug[key] = match.id;
    } else {
      const [row] = await db.insert(schema.categories).values({
        name: s.name, slug: s.slug, image: PLACEHOLDER, sortOrder: s.sortOrder,
        isActive: true, parentId,
      }).returning({ id: schema.categories.id });
      subIdBySlug[key] = row.id;
    }
  }

  // ── 3. Products ──────────────────────────────────────────────────────────
  console.log("  → products…");

  for (const p of PRODUCTS) {
    const categoryId = catIdBySlug[p.categorySlug] ?? null;

    const existing = await db.select().from(schema.products)
      .where(eq(schema.products.sku, p.sku)).limit(1);

    if (existing.length) {
      await db.update(schema.products).set({
        name: p.name, slug: p.slug, description: p.description,
        price: p.price, mrp: p.mrp ?? undefined, badge: p.badge ?? undefined,
        categoryId, occasions: [p.occasion], stock: 10, gstRate: 5,
        isActive: true, updatedAt: new Date(),
      }).where(eq(schema.products.sku, p.sku));
    } else {
      await db.insert(schema.products).values({
        name: p.name, slug: p.slug, sku: p.sku, description: p.description,
        price: p.price, mrp: p.mrp ?? undefined, badge: p.badge ?? undefined,
        categoryId, occasions: [p.occasion], stock: 10, gstRate: 5, isActive: true,
      });
    }
  }

  // ── 4. Store settings (single row) ──────────────────────────────────────
  console.log("  → store_settings…");
  const existingSettings = await db.select().from(schema.storeSettings).limit(1);
  if (!existingSettings.length) {
    await db.insert(schema.storeSettings).values({
      legalName:         "Murlit Enterprises",
      gstin:             "",
      registeredAddress: "",
      state:             "Delhi",
      stateCode:         "07",
      invoicePrefix:     "MUR",
      nextInvoiceNumber: 1,
      pricesIncludeGst:  true,
      freeShippingAbove: 50000,  // ₹500 in paise
      shippingFee:       9900,   // ₹99 in paise
      whatsappNumber:    "",
      supportEmail:      "",
    });
  }

  console.log("✅ Seed complete!");
}

// Allow direct execution: bun src/server/db/seed.ts
seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
