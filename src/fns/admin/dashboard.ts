import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/server/auth-helpers";
import { db, products, categories, users } from "@/server/db";
import { eq, count, sql } from "drizzle-orm";

export const getDashboardStats = createServerFn().handler(async () => {
  await requireAdmin();
  const [
    [totalProducts],
    [activeProducts],
    [outOfStock],
    [totalCustomers],
    [totalCategories],
    lowStockItems,
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
  ]);
  return {
    totalProducts: totalProducts.n,
    activeProducts: activeProducts.n,
    outOfStock: outOfStock.n,
    totalCustomers: totalCustomers.n,
    totalCategories: totalCategories.n,
    lowStockItems,
  };
});
