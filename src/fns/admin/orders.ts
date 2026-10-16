import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db, orders, orderItems, orderHistory, products } from "@/server/db";
import { eq, and, ilike, or, desc, gte, lte, sql, count } from "drizzle-orm";
import { requireAdmin } from "@/server/auth-helpers";
import { sendOrderShippedEmail, sendOrderCancelledEmail } from "@/lib/email";

const PAGE_SIZE = 20;

export const listOrders = createServerFn()
  .validator(z.object({
    search: z.string().optional(),
    status: z.string().optional(),
    paymentMethod: z.string().optional(),
    paymentStatus: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    page: z.number().int().min(1).default(1),
  }))
  .handler(async ({ data }) => {
    await requireAdmin();

    const conditions: any[] = [];

    if (data.search) {
      const q = `%${data.search}%`;
      conditions.push(
        or(
          ilike(orders.orderNumber, q),
          ilike(orders.email, q),
          ilike(orders.phone, q),
        )
      );
    }
    if (data.status) conditions.push(eq(orders.status, data.status as any));
    if (data.paymentMethod) conditions.push(eq(orders.paymentMethod, data.paymentMethod as any));
    if (data.paymentStatus) conditions.push(eq(orders.paymentStatus, data.paymentStatus as any));
    if (data.dateFrom) conditions.push(gte(orders.createdAt, new Date(data.dateFrom)));
    if (data.dateTo) {
      const end = new Date(data.dateTo);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(orders.createdAt, end));
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const [{ n: total }] = await db.select({ n: count() }).from(orders).where(where);
    const offset = (data.page - 1) * PAGE_SIZE;

    const rows = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        email: orders.email,
        phone: orders.phone,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        total: orders.total,
        invoiceNumber: orders.invoiceNumber,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset);

    return { rows, total: Number(total), page: data.page, pageSize: PAGE_SIZE };
  });

export const getAdminOrderDetail = createServerFn()
  .validator(z.object({ orderId: z.string().uuid() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const [order] = await db.select().from(orders).where(eq(orders.id, data.orderId)).limit(1);
    if (!order) throw new Error("Order not found");
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    const history = await db
      .select()
      .from(orderHistory)
      .where(eq(orderHistory.orderId, order.id))
      .orderBy(desc(orderHistory.createdAt));
    return { ...order, items, history };
  });

export const updateOrderStatus = createServerFn()
  .validator(z.object({
    orderId: z.string().uuid(),
    status: z.enum(["confirmed", "packed", "shipped", "delivered"]),
    note: z.string().optional(),
    courier: z.string().optional(),
    trackingNumber: z.string().optional(),
    trackingUrl: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const admin = await requireAdmin();
    const [order] = await db.select({ id: orders.id, status: orders.status }).from(orders).where(eq(orders.id, data.orderId)).limit(1);
    if (!order) throw new Error("Order not found");

    const updateData: Record<string, any> = { status: data.status, updatedAt: new Date() };
    if (data.status === "shipped") {
      if (!data.courier) throw new Error("Courier name is required for shipped status");
      if (!data.trackingNumber) throw new Error("Tracking number is required for shipped status");
    }

    await db.update(orders).set(updateData).where(eq(orders.id, data.orderId));

    await db.insert(orderHistory).values({
      orderId: data.orderId,
      status: data.status,
      note: data.note,
      courier: data.courier,
      trackingNumber: data.trackingNumber,
      trackingUrl: data.trackingUrl,
      createdBy: (admin as any).id,
    });

    if (data.status === "shipped" && data.courier && data.trackingNumber) {
      const [ord] = await db.select({ orderNumber: orders.orderNumber, email: orders.email }).from(orders).where(eq(orders.id, data.orderId)).limit(1);
      if (ord) {
        sendOrderShippedEmail({
          orderNumber: ord.orderNumber,
          email: ord.email,
          courier: data.courier,
          trackingNumber: data.trackingNumber,
          trackingUrl: data.trackingUrl,
        }).catch(() => {});
      }
    }

    return { success: true };
  });

export const markCodPaid = createServerFn()
  .validator(z.object({ orderId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const admin = await requireAdmin();
    const [order] = await db
      .select({ id: orders.id, paymentMethod: orders.paymentMethod, paymentStatus: orders.paymentStatus })
      .from(orders)
      .where(eq(orders.id, data.orderId))
      .limit(1);
    if (!order) throw new Error("Order not found");
    if (order.paymentMethod !== "cod") throw new Error("Not a COD order");
    if (order.paymentStatus === "paid") throw new Error("Already marked as paid");

    await db.update(orders).set({ paymentStatus: "paid", updatedAt: new Date() }).where(eq(orders.id, data.orderId));
    await db.insert(orderHistory).values({
      orderId: data.orderId,
      status: "delivered",
      note: "COD payment collected",
      createdBy: (admin as any).id,
    });
    return { success: true };
  });

export const cancelOrderAdmin = createServerFn()
  .validator(z.object({ orderId: z.string().uuid(), note: z.string().optional() }))
  .handler(async ({ data }) => {
    const admin = await requireAdmin();
    const [order] = await db.select().from(orders).where(eq(orders.id, data.orderId)).limit(1);
    if (!order) throw new Error("Order not found");
    if (order.status === "cancelled") throw new Error("Order already cancelled");
    if (order.status === "delivered") throw new Error("Cannot cancel a delivered order");

    await db.update(orders).set({ status: "cancelled", updatedAt: new Date() }).where(eq(orders.id, data.orderId));

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

    await db.insert(orderHistory).values({
      orderId: data.orderId,
      status: "cancelled",
      note: data.note ?? "Cancelled by admin",
      createdBy: (admin as any).id,
    });

    sendOrderCancelledEmail({
      orderNumber: order.orderNumber,
      email: order.email,
      reason: data.note,
    }).catch(() => {});

    return { success: true };
  });
