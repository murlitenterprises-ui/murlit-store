// Server-only — never import from client code
import { db, categories, products, productImages } from "../db";
import { eq, and, ilike, or, asc, desc, gte, lte, sql, isNull } from "drizzle-orm";
export type { CategoryTree, ProductRow } from "@/lib/catalog-types";
import type { CategoryTree, ProductRow } from "@/lib/catalog-types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function attachImages(rows: Omit<ProductRow, "imageUrl">[]): Promise<ProductRow[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  // Fetch first image for each product
  const imgs = await db
    .select({ productId: productImages.productId, url: productImages.url })
    .from(productImages)
    .where(
      ids.length === 1
        ? eq(productImages.productId, ids[0])
        : sql`${productImages.productId} = ANY(ARRAY[${sql.raw(ids.map((id) => `'${id}'`).join(","))}]::uuid[])`
    )
    .orderBy(asc(productImages.sortOrder));

  const imgMap = new Map<string, string>();
  for (const img of imgs) {
    if (!imgMap.has(img.productId)) imgMap.set(img.productId, img.url);
  }

  return rows.map((r) => ({ ...r, imageUrl: imgMap.get(r.id) ?? null }));
}

// ─── Queries ──────────────────────────────────────────────────────────────────

let _navCatsCache: { data: CategoryTree[]; expiresAt: number } | null = null;

export async function getNavCategories(): Promise<CategoryTree[]> {
  if (_navCatsCache && Date.now() < _navCatsCache.expiresAt) {
    return _navCatsCache.data;
  }

  const all = await db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder));

  const tops = all.filter((c) => c.parentId === null);
  const subs = all.filter((c) => c.parentId !== null);

  const result = tops.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    image: t.image,
    description: t.description,
    sortOrder: t.sortOrder,
    children: subs
      .filter((s) => s.parentId === t.id)
      .map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        image: s.image,
        sortOrder: s.sortOrder,
      })),
  }));

  _navCatsCache = { data: result, expiresAt: Date.now() + 60_000 }; // 1-minute TTL
  return result;
}

export async function getCategoryBySlug(slug: string): Promise<CategoryTree | null> {
  const all = await db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder));

  const top = all.find((c) => c.slug === slug && c.parentId === null);
  if (!top) return null;

  const children = all
    .filter((c) => c.parentId === top.id)
    .map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      image: s.image,
      sortOrder: s.sortOrder,
    }));

  return {
    id: top.id,
    name: top.name,
    slug: top.slug,
    image: top.image,
    description: top.description,
    sortOrder: top.sortOrder,
    children,
  };
}

export async function listProducts(opts: {
  categorySlug?: string;
  subSlug?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  badge?: string;
  featured?: boolean;
  sort?: "featured" | "newest" | "price_asc" | "price_desc" | "name";
  page?: number;
  pageSize?: number;
}): Promise<{ items: ProductRow[]; total: number }> {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 24;
  const offset = (page - 1) * pageSize;

  // Resolve category id from slug if provided
  let categoryId: string | null = null;
  let subCategoryId: string | null = null;

  if (opts.categorySlug) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, opts.categorySlug))
      .limit(1);
    categoryId = cat?.id ?? null;
  }

  if (opts.subSlug) {
    const [sub] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, opts.subSlug))
      .limit(1);
    subCategoryId = sub?.id ?? null;
  }

  // Build where conditions
  const where: ReturnType<typeof and>[] = [
    eq(products.isActive, true) as any,
  ];

  // Category filter: if subCategoryId exists use it, else use top-level categoryId
  if (subCategoryId) {
    where.push(eq(products.categoryId, subCategoryId) as any);
  } else if (categoryId) {
    // Get all sub-category ids under this top-level category
    const subs = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.parentId, categoryId));
    const subIds = subs.map((s) => s.id);

    if (subIds.length > 0) {
      // products directly in top-level category OR in any sub-category
      where.push(
        sql`(${products.categoryId} = ${categoryId} OR ${products.categoryId} = ANY(ARRAY[${sql.raw(subIds.map((id) => `'${id}'`).join(","))}]::uuid[]))` as any
      );
    } else {
      where.push(eq(products.categoryId, categoryId) as any);
    }
  }

  if (opts.q) {
    const q = `%${opts.q}%`;
    where.push(
      or(ilike(products.name, q), ilike(products.description, q)) as any
    );
  }

  if (opts.minPrice !== undefined) {
    where.push(gte(products.price, opts.minPrice) as any);
  }

  if (opts.maxPrice !== undefined) {
    where.push(lte(products.price, opts.maxPrice) as any);
  }

  if (opts.inStock) {
    where.push(gte(products.stock, 1) as any);
  }

  if (opts.badge) {
    where.push(eq(products.badge, opts.badge) as any);
  }

  if (opts.featured !== undefined) {
    where.push(eq(products.isFeatured, opts.featured) as any);
  }

  const whereClause = where.length > 1 ? and(...where) : where[0];

  // Sort
  type SortExpr = ReturnType<typeof asc>;
  let orderBy: SortExpr[];
  switch (opts.sort) {
    case "price_asc":  orderBy = [asc(products.price)]; break;
    case "price_desc": orderBy = [desc(products.price)]; break;
    case "newest":     orderBy = [desc(products.createdAt)]; break;
    case "name":       orderBy = [asc(products.name)]; break;
    default:           orderBy = [desc(products.isFeatured), asc(products.name)]; break;
  }

  const [rows, [{ count }]] = await Promise.all([
    db
      .select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        shortDescription: products.shortDescription,
        description: products.description,
        price: products.price,
        mrp: products.mrp,
        sku: products.sku,
        stock: products.stock,
        isActive: products.isActive,
        isFeatured: products.isFeatured,
        badge: products.badge,
        categoryId: products.categoryId,
        tags: products.tags,
        occasions: products.occasions,
        materials: products.materials,
        weight: products.weight,
        dimensions: products.dimensions,
        hsnCode: products.hsnCode,
        gstRate: products.gstRate,
        createdAt: products.createdAt,
      })
      .from(products)
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(whereClause),
  ]);

  const items = await attachImages(rows);
  return { items, total: count };
}

export async function getProductBySlug(slug: string) {
  const [prod] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.isActive, true)))
    .limit(1);

  if (!prod) return null;

  // Fetch images + category in parallel
  const [imgs, catRow] = await Promise.all([
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, prod.id))
      .orderBy(asc(productImages.sortOrder)),
    prod.categoryId
      ? db
          .select({ id: categories.id, name: categories.name, slug: categories.slug, parentId: categories.parentId })
          .from(categories)
          .where(eq(categories.id, prod.categoryId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
  ]);

  const cat = catRow;

  // Resolve top-level category + sub-category IDs in one query
  let topCategoryId: string | null = null;
  if (cat) {
    if (cat.parentId === null) {
      topCategoryId = cat.id;
    } else {
      topCategoryId = cat.parentId;
    }
  }

  // Fetch all categories once to get siblings — reuse for both sub-id lookup and related
  let related: ProductRow[] = [];
  if (topCategoryId) {
    const subIds = (
      await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.parentId, topCategoryId))
    ).map((s) => s.id);

    const relWhere = subIds.length > 0
      ? and(
          eq(products.isActive, true),
          sql`${products.id} != ${prod.id}`,
          sql`(${products.categoryId} = ${topCategoryId} OR ${products.categoryId} = ANY(ARRAY[${sql.raw(subIds.map((id) => `'${id}'`).join(","))}]::uuid[]))`
        )
      : and(eq(products.isActive, true), sql`${products.id} != ${prod.id}`, eq(products.categoryId, topCategoryId));

    const relRows = await db
      .select({
        id: products.id, slug: products.slug, name: products.name,
        shortDescription: products.shortDescription, description: products.description,
        price: products.price, mrp: products.mrp, sku: products.sku, stock: products.stock,
        isActive: products.isActive, isFeatured: products.isFeatured, badge: products.badge,
        categoryId: products.categoryId, tags: products.tags, occasions: products.occasions,
        materials: products.materials, weight: products.weight, dimensions: products.dimensions,
        hsnCode: products.hsnCode, gstRate: products.gstRate, createdAt: products.createdAt,
      })
      .from(products)
      .where(relWhere)
      .limit(8);
    related = await attachImages(relRows);
  }

  return {
    ...prod,
    images: imgs,
    imageUrl: imgs[0]?.url ?? null,
    category: cat,
    related,
  };
}

export async function searchProducts(q: string, limit = 8): Promise<ProductRow[]> {
  const pattern = `%${q}%`;
  const rows = await db
    .select({
      id: products.id, slug: products.slug, name: products.name,
      shortDescription: products.shortDescription, description: products.description,
      price: products.price, mrp: products.mrp, sku: products.sku, stock: products.stock,
      isActive: products.isActive, isFeatured: products.isFeatured, badge: products.badge,
      categoryId: products.categoryId, tags: products.tags, occasions: products.occasions,
      materials: products.materials, weight: products.weight, dimensions: products.dimensions,
      hsnCode: products.hsnCode, gstRate: products.gstRate, createdAt: products.createdAt,
    })
    .from(products)
    .where(
      and(
        eq(products.isActive, true),
        or(ilike(products.name, pattern), ilike(products.description, pattern))
      )
    )
    .limit(limit);

  return attachImages(rows);
}
