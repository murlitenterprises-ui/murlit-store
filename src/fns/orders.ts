import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db, orders, orderItems, orderHistory, products, storeSettings } from "@/server/db";
import { eq, and, desc } from "drizzle-orm";
import { requireUser } from "@/server/auth-helpers";

// ─── Customer: list my orders ─────────────────────────────────────────────────

export const listMyOrders = createServerFn().handler(async () => {
  const user = await requireUser();
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
      total: orders.total,
      invoiceNumber: orders.invoiceNumber,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt));

  // Get item counts
  const withCounts = await Promise.all(
    rows.map(async (o) => {
      const items = await db
        .select({ qty: orderItems.qty })
        .from(orderItems)
        .where(eq(orderItems.orderId, o.id));
      return { ...o, itemCount: items.reduce((s, i) => s + i.qty, 0) };
    })
  );
  return withCounts;
});

// ─── Customer: get order detail (owner only) ──────────────────────────────────

export const getMyOrder = createServerFn()
  .validator(z.object({ orderNumber: z.string() }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.orderNumber, data.orderNumber), eq(orders.userId, user.id)))
      .limit(1);
    if (!order) throw new Error("Order not found");
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    const history = await db
      .select()
      .from(orderHistory)
      .where(eq(orderHistory.orderId, order.id))
      .orderBy(desc(orderHistory.createdAt));
    return { ...order, items, history };
  });

// ─── Customer: cancel COD order (confirmed only) ──────────────────────────────

export const cancelMyOrder = createServerFn()
  .validator(z.object({ orderNumber: z.string() }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.orderNumber, data.orderNumber), eq(orders.userId, user.id)))
      .limit(1);
    if (!order) throw new Error("Order not found");
    if (order.paymentMethod !== "cod") throw new Error("Only COD orders can be cancelled");
    if (order.status !== "confirmed") throw new Error("Order can only be cancelled when status is Confirmed");

    // Cancel order
    await db
      .update(orders)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(orders.id, order.id));

    // Restore stock
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    for (const item of items) {
      if (item.productId) {
        const [prod] = await db.select({ stock: products.stock }).from(products).where(eq(products.id, item.productId)).limit(1);
        if (prod) {
          await db.update(products).set({ stock: prod.stock + item.qty, updatedAt: new Date() }).where(eq(products.id, item.productId));
        }
      }
    }

    // Record history
    await db.insert(orderHistory).values({
      orderId: order.id,
      status: "cancelled",
      note: "Cancelled by customer",
      createdBy: user.id,
    });

    return { success: true };
  });
