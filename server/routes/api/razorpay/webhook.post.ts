import { defineEventHandler, readRawBody, getHeader, createError } from "h3";
import crypto from "node:crypto";
import { db } from "../../../../src/server/db/index.js";
import { orders, orderItems, products, carts, cartItems } from "../../../../src/server/db/schema.js";
import { eq } from "drizzle-orm";

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

export default defineEventHandler(async (event) => {
  const raw = await readRawBody(event);
  if (!raw) throw createError({ statusCode: 400, message: "Empty body" });

  if (WEBHOOK_SECRET) {
    const sig = getHeader(event, "x-razorpay-signature") ?? "";
    const expected = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(raw)
      .digest("hex");
    const sigBuf = Buffer.from(sig, "hex");
    const expBuf = Buffer.from(expected, "hex");
    const valid = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
    if (!valid) throw createError({ statusCode: 401, message: "Invalid signature" });
  }

  const payload = JSON.parse(raw) as any;
  const event_type = payload.event as string;

  if (event_type === "payment.captured") {
    const paymentEntity = payload.payload?.payment?.entity;
    if (!paymentEntity) return { ok: true };

    const rzpOrderId = paymentEntity.order_id as string;
    const rzpPaymentId = paymentEntity.id as string;

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.razorpayOrderId, rzpOrderId))
      .limit(1);

    if (!order || order.paymentStatus === "paid") return { ok: true };

    // Mark paid
    await db.update(orders).set({
      status: "confirmed",
      paymentStatus: "paid",
      razorpayPaymentId: rzpPaymentId,
      updatedAt: new Date(),
    }).where(eq(orders.id, order.id));

    // Reduce stock
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    for (const item of items) {
      if (item.productId) {
        const [prod] = await db.select({ stock: products.stock }).from(products).where(eq(products.id, item.productId)).limit(1);
        if (prod) {
          await db.update(products)
            .set({ stock: Math.max(0, prod.stock - item.qty), updatedAt: new Date() })
            .where(eq(products.id, item.productId));
        }
      }
    }

    // Clear cart
    const [cart] = await db.select({ id: carts.id }).from(carts).where(eq(carts.userId, order.userId)).limit(1);
    if (cart) await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
  }

  return { ok: true };
});
