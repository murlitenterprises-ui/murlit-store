import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/server/auth-helpers";
import { db, products, categories, users, orders, orderItems } from "@/server/db";
import { eq, count, sql, desc, gte, and } from "drizzle-orm";

export const getDashboardStats = createServerFn().handler(async () => {
  await requireAdmin();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    [totalProducts],
    [activeProducts],
    [outOfStock],
    [totalCustomers],
    [totalCategories],
    lowStockItems,
    [todaySalesRow],
    [monthSalesRow],
    ordersByStatus,
    latestOrders,
  ] = await Promise.all([
    db.select({ n: count() }).from(products),
    db.select({ n: count() }).from(products).where(eq(products.isActive, true)),
    db.select({ n: count() }).from(products).where(sql`${products.stock} = 0`),
    db.select({ n: count() }).from(users).where(eq(users.role, "customer")),
    db.select({ n: count() }).from(categories).where(eq(categories.isActive, true)),
    db
      .select({ id: products.id, name: products.name, stock: products.stock, sku: products.sku })
      .from(products)
      .where(sql`${products.stock} > 0 AND ${products.stock} < 5 AND ${products.isActive} = true`)
      .orderBy(products.stock)
      .limit(10),
    db
      .select({ total: sql<number>`coalesce(sum(${orders.total}), 0)` })
      .from(orders)
      .where(and(gte(orders.createdAt, todayStart), sql`${orders.status} != 'cancelled'`)),
    db
      .select({ total: sql<number>`coalesce(sum(${orders.total}), 0)` })
      .from(orders)
      .where(and(gte(orders.createdAt, monthStart), sql`${orders.status} != 'cancelled'`)),
    db
      .select({ status: orders.status, n: count() })
      .from(orders)
      .groupBy(orders.status),
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        email: orders.email,
        total: orders.total,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(5),
  ]);

  return {
    totalProducts: totalProducts.n,
    activeProducts: activeProducts.n,
    outOfStock: outOfStock.n,
    totalCustomers: totalCustomers.n,
    totalCategories: totalCategories.n,
    lowStockItems,
    todaySales: Number(todaySalesRow.total),
    monthSales: Number(monthSalesRow.total),
    ordersByStatus: ordersByStatus.reduce((acc, row) => ({ ...acc, [row.status]: Number(row.n) }), {} as Record<string, number>),
    latestOrders,
  };
});
