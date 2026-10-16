import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequest, setCookie, getCookie } from "@tanstack/react-start/server";
import { db, carts, cartItems, products, productImages } from "@/server/db";
import { eq, and, asc, inArray } from "drizzle-orm";
import { getSessionUser } from "@/server/auth-helpers";

const CART_COOKIE = "murlit_cart";
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 90, // 90 days
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function resolveCart(): Promise<{ cartId: string; userId: string | null }> {
  const user = await getSessionUser();
  const userId = user?.id ?? null;

  if (userId) {
    // Get or create user cart
    const existing = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1);
    if (existing.length) return { cartId: existing[0].id, userId };
    const [newCart] = await db.insert(carts).values({ userId }).returning({ id: carts.id });
    return { cartId: newCart.id, userId };
  }

  // Guest cart via cookie
  const req = getRequest();
  const cookieHeader = req?.headers.get("cookie") ?? "";
  const cookieMatch = cookieHeader.match(new RegExp(`(?:^|; )${CART_COOKIE}=([^;]+)`));
  let sessionKey = cookieMatch?.[1] ?? null;

  if (sessionKey) {
    const existing = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.sessionKey, sessionKey))
      .limit(1);
    if (existing.length) return { cartId: existing[0].id, userId: null };
  }

  // Create new guest cart
  const key = crypto.randomUUID();
  const [newCart] = await db.insert(carts).values({ sessionKey: key }).returning({ id: carts.id });
  // Set cookie in response
  setCookie(CART_COOKIE, key, COOKIE_OPTS);
  return { cartId: newCart.id, userId: null };
}

async function getCartItems(cartId: string) {
  const items = await db
    .select({
      id: cartItems.id,
      cartId: cartItems.cartId,
      productId: cartItems.productId,
      qty: cartItems.qty,
      name: products.name,
      slug: products.slug,
      price: products.price,
      mrp: products.mrp,
      stock: products.stock,
      isActive: products.isActive,
      sku: products.sku,
      gstRate: products.gstRate,
      priceIncludesGst: products.priceIncludesGst,
      hsnCode: products.hsnCode,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.cartId, cartId))
    .orderBy(asc(cartItems.createdAt));

  if (!items.length) return [];

  // Get primary images
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

  return items.map((item) => ({
    ...item,
    imageUrl: imgMap.get(item.productId) ?? null,
    // Cap displayed qty to actual stock
    qty: Math.min(item.qty, item.stock > 0 ? item.stock : 0),
  }));
}

// ─── Public server functions ──────────────────────────────────────────────────

export const getCart = createServerFn().handler(async () => {
  const { cartId } = await resolveCart();
  return getCartItems(cartId);
});

export const addToCart = createServerFn()
  .validator(z.object({ productId: z.string().uuid(), qty: z.number().int().min(1).default(1) }))
  .handler(async ({ data }) => {
    const { cartId } = await resolveCart();

    // Validate product exists, is active, has stock
    const [product] = await db
      .select({ id: products.id, stock: products.stock, isActive: products.isActive })
      .from(products)
      .where(eq(products.id, data.productId))
      .limit(1);
    if (!product || !product.isActive) throw new Error("Product not available");
    if (product.stock < 1) throw new Error("Out of stock");

    // Upsert cart item
    const existing = await db
      .select({ id: cartItems.id, qty: cartItems.qty })
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, data.productId)))
      .limit(1);

    if (existing.length) {
      const newQty = Math.min(existing[0].qty + data.qty, product.stock);
      await db
        .update(cartItems)
        .set({ qty: newQty, updatedAt: new Date() })
        .where(eq(cartItems.id, existing[0].id));
    } else {
      const qty = Math.min(data.qty, product.stock);
      await db.insert(cartItems).values({ cartId, productId: data.productId, qty });
    }

    return getCartItems(cartId);
  });

export const updateQty = createServerFn()
  .validator(z.object({ itemId: z.string().uuid(), qty: z.number().int().min(0) }))
  .handler(async ({ data }) => {
    const { cartId } = await resolveCart();

    if (data.qty === 0) {
      await db
        .delete(cartItems)
        .where(and(eq(cartItems.id, data.itemId), eq(cartItems.cartId, cartId)));
      return getCartItems(cartId);
    }

    // Cap to stock
    const [item] = await db
      .select({ productId: cartItems.productId })
      .from(cartItems)
      .where(and(eq(cartItems.id, data.itemId), eq(cartItems.cartId, cartId)))
      .limit(1);
    if (!item) throw new Error("Item not in cart");

    const [product] = await db
      .select({ stock: products.stock })
      .from(products)
      .where(eq(products.id, item.productId))
      .limit(1);
    const qty = product ? Math.min(data.qty, product.stock) : data.qty;

    await db
      .update(cartItems)
      .set({ qty, updatedAt: new Date() })
      .where(and(eq(cartItems.id, data.itemId), eq(cartItems.cartId, cartId)));

    return getCartItems(cartId);
  });

export const removeItem = createServerFn()
  .validator(z.object({ itemId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { cartId } = await resolveCart();
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, data.itemId), eq(cartItems.cartId, cartId)));
    return getCartItems(cartId);
  });

export const clearCart = createServerFn().handler(async () => {
  const { cartId } = await resolveCart();
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  return [];
});

/** Merge guest cart into logged-in user cart. Called after login/signup. */
export const mergeGuestCart = createServerFn()
  .validator(z.object({ guestSessionKey: z.string() }))
  .handler(async ({ data }) => {
    const user = await getSessionUser();
    if (!user) return;

    const guestCart = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.sessionKey, data.guestSessionKey))
      .limit(1);
    if (!guestCart.length) return;

    const [userCart] = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.userId, user.id))
      .limit(1)
      .catch(() => []);

    let userCartId: string;
    if (userCart) {
      userCartId = userCart.id;
    } else {
      const [nc] = await db.insert(carts).values({ userId: user.id }).returning({ id: carts.id });
      userCartId = nc.id;
    }

    const guestItems = await db
      .select({ productId: cartItems.productId, qty: cartItems.qty })
      .from(cartItems)
      .where(eq(cartItems.cartId, guestCart[0].id));

    for (const item of guestItems) {
      const [existing] = await db
        .select({ id: cartItems.id, qty: cartItems.qty })
        .from(cartItems)
        .where(and(eq(cartItems.cartId, userCartId), eq(cartItems.productId, item.productId)))
        .limit(1);

      const [prod] = await db
        .select({ stock: products.stock })
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);
      const maxQty = prod?.stock ?? 99;

      if (existing) {
        const newQty = Math.min(existing.qty + item.qty, maxQty);
        await db.update(cartItems).set({ qty: newQty }).where(eq(cartItems.id, existing.id));
      } else {
        await db.insert(cartItems).values({
          cartId: userCartId,
          productId: item.productId,
          qty: Math.min(item.qty, maxQty),
        });
      }
    }

    // Delete guest cart
    await db.delete(carts).where(eq(carts.id, guestCart[0].id));
  });

/** Get just the cart item count (for badge). */
export const getCartCount = createServerFn().handler(async () => {
  try {
    const { cartId } = await resolveCart();
    const items = await db
      .select({ qty: cartItems.qty })
      .from(cartItems)
      .where(eq(cartItems.cartId, cartId));
    return items.reduce((sum, i) => sum + i.qty, 0);
  } catch {
    return 0;
  }
});
