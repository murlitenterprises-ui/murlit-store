import crypto from "node:crypto";
import { db } from "./db/index";
import { orders, orderItems, products, carts, cartItems } from "./db/schema";
import { eq } from "drizzle-orm";

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

export async function razorpayWebhookHandler(request: Request): Promise<Response> {
  const raw = await request.text();
  if (!raw) return new Response("Empty body", { status: 400 });

  if (WEBHOOK_SECRET) {
    const sig = request.headers.get("x-razorpay-signature") ?? "";
    const expected = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(raw)
      .digest("hex");
    const sigBuf = Buffer.from(sig.length % 2 === 0 ? sig : "", "hex");
    const expBuf = Buffer.from(expected, "hex");
    const valid =
      sigBuf.length > 0 &&
      sigBuf.length === expBuf.length &&
      crypto.timingSafeEqual(sigBuf, expBuf);
    if (!valid) return new Response("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(raw) as Record<string, unknown>;
  const event_type = payload.event as string;

  if (event_type === "payment.captured") {
    const paymentEntity = (payload.payload as any)?.payment?.entity;
    if (!paymentEntity) return Response.json({ ok: true });

    const rzpOrderId = paymentEntity.order_id as string;
    const rzpPaymentId = paymentEntity.id as string;

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.razorpayOrderId, rzpOrderId))
      .limit(1);

    if (!order || order.paymentStatus === "paid") return Response.json({ ok: true });

    await db.update(orders).set({
      status: "confirmed",
      paymentStatus: "paid",
      razorpayPaymentId: rzpPaymentId,
      updatedAt: new Date(),
    }).where(eq(orders.id, order.id));

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

    const [cart] = await db.select({ id: carts.id }).from(carts).where(eq(carts.userId, order.userId)).limit(1);
    if (cart) await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
  }

  return Response.json({ ok: true });
}
