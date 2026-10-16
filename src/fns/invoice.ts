import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db, orders } from "@/server/db";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/server/auth-helpers";
import { assignInvoiceNumber, generateInvoicePdf } from "@/server/invoice-service";

export const getInvoice = createServerFn()
  .validator(z.object({ orderNumber: z.string() }))
  .handler(async ({ data }) => {
    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized");

    const [order] = await db
      .select({ id: orders.id, userId: orders.userId, invoiceNumber: orders.invoiceNumber, status: orders.status })
      .from(orders)
      .where(eq(orders.orderNumber, data.orderNumber))
      .limit(1);
    if (!order) throw new Error("Order not found");

    if (user.role !== "admin" && order.userId !== user.id) throw new Error("Unauthorized");

    if (!order.invoiceNumber) {
      if (["confirmed", "packed", "shipped", "delivered"].includes(order.status)) {
        await assignInvoiceNumber(order.id);
      } else {
        throw new Error("Invoice not yet available");
      }
    }

    const pdfBytes = await generateInvoicePdf(order.id);
    return Buffer.from(pdfBytes).toString("base64");
  });
