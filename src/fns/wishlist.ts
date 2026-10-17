import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db, wishlistItems, products, productImages } from "@/server/db";
import { eq, and, asc, inArray } from "drizzle-orm";
import { requireUser, getSessionUser } from "@/server/auth-helpers";

export const getWishlist = createServerFn().handler(async () => {
  const user = await requireUser();
  const items = await db
    .select({
      id: wishlistItems.id,
      productId: wishlistItems.productId,
      name: products.name,
      slug: products.slug,
      price: products.price,
      mrp: products.mrp,
      stock: products.stock,
      isActive: products.isActive,
      badge: products.badge,
      isFeatured: products.isFeatured,
    })
    .from(wishlistItems)
    .innerJoin(products, eq(wishlistItems.productId, products.id))
    .where(eq(wishlistItems.userId, user.id))
    .orderBy(asc(wishlistItems.createdAt));

  if (!items.length) return [];

  const productIds = items.map((i) => i.productId);
  const imgs = await db
    .select({ productId: productImages.productId, url: productImages.url })
    .from(productImages)
    .where(inArray(productImages.productId, productIds))
    .orderBy(asc(productImages.sortOrder));
  const imgMap = new Map<string, string>();
  for (const img of imgs) {
    if (!imgMap.has(img.productId)) imgMap.set(img.productId, img.url);
  }

  return items.map((item) => ({ ...item, imageUrl: imgMap.get(item.productId) ?? null }));
});

export const toggleWishlist = createServerFn()
  .validator(z.object({ productId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    const existing = await db
      .select({ id: wishlistItems.id })
      .from(wishlistItems)
      .where(and(eq(wishlistItems.userId, user.id), eq(wishlistItems.productId, data.productId)))
      .limit(1);

    if (existing.length) {
      await db.delete(wishlistItems).where(eq(wishlistItems.id, existing[0].id));
      return { wishlisted: false };
    }
    await db.insert(wishlistItems).values({ userId: user.id, productId: data.productId });
    return { wishlisted: true };
  });

export const isWishlisted = createServerFn()
  .validator(z.object({ productId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const user = await getSessionUser();
    if (!user) return false;
    const existing = await db
      .select({ id: wishlistItems.id })
      .from(wishlistItems)
      .where(and(eq(wishlistItems.userId, user.id), eq(wishlistItems.productId, data.productId)))
      .limit(1);
    return existing.length > 0;
  });

export const getWishlistCount = createServerFn().handler(async () => {
  const user = await getSessionUser();
  if (!user) return 0;
  const items = await db
    .select({ id: wishlistItems.id })
    .from(wishlistItems)
    .where(eq(wishlistItems.userId, user.id));
  return items.length;
});

export const removeFromWishlist = createServerFn()
  .validator(z.object({ itemId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    await db
      .delete(wishlistItems)
      .where(and(eq(wishlistItems.id, data.itemId), eq(wishlistItems.userId, user.id)));
    return getWishlist();
  });
