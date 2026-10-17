import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/server/auth-helpers";
import { db, categories, products } from "@/server/db";
import { eq, isNull, asc, count, sql } from "drizzle-orm";

export const listAdminCategories = createServerFn().handler(async () => {
  await requireAdmin();
  const all = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  // Count products per category
  const counts = await db
    .select({ categoryId: products.categoryId, n: count() })
    .from(products)
    .groupBy(products.categoryId);

  const countMap = new Map(counts.map((c) => [c.categoryId, c.n]));

  const tops = all.filter((c) => !c.parentId);
  const subs = all.filter((c) => !!c.parentId);

  return tops.map((top) => ({
    ...top,
    productCount: countMap.get(top.id) ?? 0,
    children: subs
      .filter((s) => s.parentId === top.id)
      .map((s) => ({ ...s, productCount: countMap.get(s.id) ?? 0 })),
  }));
});

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  description: z.string().optional(),
  image: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  parentId: z.string().uuid().nullable().optional(),
});

export const createCategory = createServerFn()
  .validator(categorySchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const [row] = await db
      .insert(categories)
      .values({ ...data, parentId: data.parentId ?? null })
      .returning();
    return row;
  });

export const updateCategory = createServerFn()
  .validator(z.object({ id: z.string().uuid(), data: categorySchema }))
  .handler(async ({ data: { id, data } }) => {
    await requireAdmin();
    const [row] = await db
      .update(categories)
      .set({ ...data, parentId: data.parentId ?? null, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return row;
  });

export const deleteCategory = createServerFn()
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    // Block if products exist
    const [{ n }] = await db
      .select({ n: count() })
      .from(products)
      .where(eq(products.categoryId, data.id));
    if (n > 0) throw new Error(`Cannot delete: ${n} product(s) are assigned to this category`);
    await db.delete(categories).where(eq(categories.id, data.id));
    return { ok: true };
  });

export const reorderCategory = createServerFn()
  .validator(z.object({ id: z.string().uuid(), direction: z.enum(["up", "down"]) }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const cat = await db.select().from(categories).where(eq(categories.id, data.id)).limit(1);
    if (!cat.length) throw new Error("Category not found");
    const { sortOrder, parentId } = cat[0];
    const sibs = await db
      .select({ id: categories.id, sortOrder: categories.sortOrder })
      .from(categories)
      .where(parentId ? eq(categories.parentId, parentId) : isNull(categories.parentId))
      .orderBy(asc(categories.sortOrder));

    const idx = sibs.findIndex((s) => s.id === data.id);
    const swapIdx = data.direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sibs.length) return { ok: false };
    const swap = sibs[swapIdx];

    await Promise.all([
      db.update(categories).set({ sortOrder: swap.sortOrder }).where(eq(categories.id, data.id)),
      db.update(categories).set({ sortOrder: sortOrder }).where(eq(categories.id, swap.id)),
    ]);
    return { ok: true };
  });
