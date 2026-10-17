import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/server/auth-helpers";
import { db, products, productImages, categories } from "@/server/db";
import { eq, ilike, and, or, asc, desc, count, sql, inArray } from "drizzle-orm";

// ─── List ─────────────────────────────────────────────────────────────────────

const listSchema = z.object({
  q: z.string().optional(),
  categoryId: z.string().optional(),
  active: z.enum(["all", "active", "inactive"]).default("all"),
  stock: z.enum(["all", "in", "out"]).default("all"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const listAdminProducts = createServerFn()
  .validator(listSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const conds = [];
    if (data.q) conds.push(or(ilike(products.name, `%${data.q}%`), ilike(products.sku, `%${data.q}%`)));
    if (data.categoryId) conds.push(eq(products.categoryId, data.categoryId));
    if (data.active === "active") conds.push(eq(products.isActive, true));
    if (data.active === "inactive") conds.push(eq(products.isActive, false));
    if (data.stock === "in") conds.push(sql`${products.stock} > 0`);
    if (data.stock === "out") conds.push(sql`${products.stock} = 0`);

    const where = conds.length ? and(...conds) : undefined;
    const offset = (data.page - 1) * data.pageSize;

    const [rows, [{ total }], allCats] = await Promise.all([
      db
        .select({
          id: products.id, name: products.name, slug: products.slug,
          sku: products.sku, price: products.price, mrp: products.mrp,
          stock: products.stock, isActive: products.isActive, isFeatured: products.isFeatured,
          badge: products.badge, categoryId: products.categoryId,
        })
        .from(products)
        .where(where)
        .orderBy(desc(products.createdAt))
        .limit(data.pageSize)
        .offset(offset),
      db.select({ total: count() }).from(products).where(where),
      db.select({ id: categories.id, name: categories.name }).from(categories),
    ]);

    // Get first image for each product
    if (!rows.length) return { items: [], total: total, categories: allCats };
    const imgs = await db
      .select({ productId: productImages.productId, url: productImages.url })
      .from(productImages)
      .where(inArray(productImages.productId, rows.map((r) => r.id)))
      .orderBy(asc(productImages.sortOrder));
    const imgMap = new Map(imgs.map((i) => [i.productId, i.url]));
    const catMap = new Map(allCats.map((c) => [c.id, c.name]));

    return {
      items: rows.map((r) => ({
        ...r,
        imageUrl: imgMap.get(r.id) ?? null,
        categoryName: r.categoryId ? (catMap.get(r.categoryId) ?? null) : null,
      })),
      total: Number(total),
      categories: allCats,
    };
  });

// ─── Get single product for editing ──────────────────────────────────────────

export const getAdminProduct = createServerFn()
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const [product] = await db.select().from(products).where(eq(products.id, data.id));
    if (!product) throw new Error("Product not found");
    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, data.id))
      .orderBy(asc(productImages.sortOrder));
    return { ...product, images };
  });

// ─── Create / Update ──────────────────────────────────────────────────────────

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  price: z.number().int().min(1),     // paise
  mrp: z.number().int().min(0).optional(),
  sku: z.string().min(1),
  stock: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  badge: z.string().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).default([]),
  occasions: z.array(z.string()).default([]),
  materials: z.string().optional(),
  weight: z.string().optional(),
  dimensions: z.string().optional(),
  hsnCode: z.string().optional(),
  gstRate: z.number().int().refine((v) => [0, 5, 12, 18].includes(v)).default(5),
  priceIncludesGst: z.boolean().default(true),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  images: z.array(z.object({
    id: z.string().optional(),
    url: z.string(),
    publicId: z.string().optional(),
    alt: z.string().optional(),
    sortOrder: z.number().int(),
  })).default([]),
});

export const createProduct = createServerFn()
  .validator(productSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { images, ...productData } = data;
    const [product] = await db.insert(products).values({
      ...productData,
      mrp: productData.mrp ?? null,
      badge: productData.badge ?? null,
      categoryId: productData.categoryId ?? null,
    }).returning();
    if (images.length) {
      await db.insert(productImages).values(
        images.map((img) => ({
          productId: product.id,
          url: img.url,
          publicId: img.publicId ?? null,
          alt: img.alt ?? null,
          sortOrder: img.sortOrder,
        }))
      );
    }
    return product;
  });

export const updateProduct = createServerFn()
  .validator(z.object({ id: z.string().uuid(), data: productSchema }))
  .handler(async ({ data: { id, data } }) => {
    await requireAdmin();
    const { images, ...productData } = data;
    const [product] = await db
      .update(products)
      .set({
        ...productData,
        mrp: productData.mrp ?? null,
        badge: productData.badge ?? null,
        categoryId: productData.categoryId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    // Replace images: delete existing, insert new
    await db.delete(productImages).where(eq(productImages.productId, id));
    if (images.length) {
      await db.insert(productImages).values(
        images.map((img) => ({
          productId: id,
          url: img.url,
          publicId: img.publicId ?? null,
          alt: img.alt ?? null,
          sortOrder: img.sortOrder,
        }))
      );
    }
    return product;
  });

// ─── Toggle helpers ───────────────────────────────────────────────────────────

export const toggleProductActive = createServerFn()
  .validator(z.object({ id: z.string().uuid(), isActive: z.boolean() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    await db.update(products).set({ isActive: data.isActive, updatedAt: new Date() }).where(eq(products.id, data.id));
    return { ok: true };
  });

export const toggleProductFeatured = createServerFn()
  .validator(z.object({ id: z.string().uuid(), isFeatured: z.boolean() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    await db.update(products).set({ isFeatured: data.isFeatured, updatedAt: new Date() }).where(eq(products.id, data.id));
    return { ok: true };
  });

// ─── Soft delete ──────────────────────────────────────────────────────────────

export const deleteProduct = createServerFn()
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    // Soft delete: deactivate so existing orders stay valid
    await db
      .update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(products.id, data.id));
    return { ok: true };
  });

// ─── Bulk actions ─────────────────────────────────────────────────────────────

export const bulkProductAction = createServerFn()
  .validator(z.object({
    ids: z.array(z.string().uuid()).min(1),
    action: z.enum(["activate", "deactivate", "delete"]),
  }))
  .handler(async ({ data }) => {
    await requireAdmin();
    if (data.action === "activate") {
      await db.update(products).set({ isActive: true, updatedAt: new Date() }).where(inArray(products.id, data.ids));
    } else if (data.action === "deactivate") {
      await db.update(products).set({ isActive: false, updatedAt: new Date() }).where(inArray(products.id, data.ids));
    } else {
      // Soft delete
      await db.update(products).set({ isActive: false, updatedAt: new Date() }).where(inArray(products.id, data.ids));
    }
    return { ok: true, count: data.ids.length };
  });

// ─── All categories for form dropdowns ───────────────────────────────────────

export const getAdminCategories = createServerFn().handler(async () => {
  await requireAdmin();
  return db
    .select({ id: categories.id, name: categories.name, parentId: categories.parentId, slug: categories.slug })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
});
