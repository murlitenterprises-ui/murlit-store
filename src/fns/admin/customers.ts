import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/server/auth-helpers";
import { db, users, orders, addresses } from "@/server/db";
import { eq, and, ilike, or, desc, count, sql } from "drizzle-orm";

const PAGE_SIZE = 20;

export const listCustomers = createServerFn()
  .validator(z.object({
    search: z.string().optional(),
    page: z.number().int().min(1).default(1),
  }))
  .handler(async ({ data }) => {
    await requireAdmin();

    const conditions: any[] = [eq(users.role, "customer")];
    if (data.search) {
      const q = `%${data.search}%`;
      conditions.push(
        or(ilike(users.name, q), ilike(users.email, q), ilike(users.phone ?? "", q))
      );
    }
    const where = and(...conditions);

    const [{ n: total }] = await db.select({ n: count() }).from(users).where(where);
    const offset = (data.page - 1) * PAGE_SIZE;

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset);

    // Get order counts and totals per customer
    const withStats = await Promise.all(rows.map(async (u) => {
      const [stats] = await db
        .select({
          orderCount: count(),
          totalSpent: sql<number>`coalesce(sum(${orders.total}), 0)`,
        })
        .from(orders)
        .where(and(eq(orders.userId, u.id), sql`${orders.status} != 'cancelled'`));
      return { ...u, orderCount: Number(stats.orderCount), totalSpent: Number(stats.totalSpent) };
    }));

    return { rows: withStats, total: Number(total), page: data.page, pageSize: PAGE_SIZE };
  });

export const getCustomerDetail = createServerFn()
  .validator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const [user] = await db.select().from(users).where(eq(users.id, data.userId)).limit(1);
    if (!user) throw new Error("Customer not found");
    const customerOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        total: orders.total,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.userId, data.userId))
      .orderBy(desc(orders.createdAt));
    const customerAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, data.userId));
    return { ...user, orders: customerOrders, addresses: customerAddresses };
  });
