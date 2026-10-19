// Server-only — invoice number assignment without pdf-lib dependency
import { db } from "@/server/db";
import { orders, storeSettings } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { getFinancialYear } from "@/lib/financial-year";

export async function assignInvoiceNumber(orderId: string): Promise<string> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) throw new Error("Order not found");
  if (order.invoiceNumber) return order.invoiceNumber;

  const now = new Date();
  const fy = getFinancialYear(now);

  const [settings] = await db.select().from(storeSettings).limit(1);
  if (!settings) throw new Error("Store settings not configured");

  let counter = settings.nextInvoiceNumber;
  const settingsFy = settings.currentFy;

  if (settingsFy !== fy) {
    counter = 1;
  }

  const invoiceNumber = `${settings.invoicePrefix}/${fy}/${String(counter).padStart(4, "0")}`;

  await db.update(storeSettings).set({
    nextInvoiceNumber: counter + 1,
    currentFy: fy,
    updatedAt: new Date(),
  }).where(eq(storeSettings.id, settings.id));

  await db.update(orders).set({
    invoiceNumber,
    invoiceDate: now,
    updatedAt: new Date(),
  }).where(eq(orders.id, orderId));

  return invoiceNumber;
}
