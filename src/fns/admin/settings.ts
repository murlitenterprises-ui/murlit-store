import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/server/auth-helpers";
import { db, storeSettings } from "@/server/db";
import { eq } from "drizzle-orm";

export const getStoreSettings = createServerFn().handler(async () => {
  await requireAdmin();
  const rows = await db.select().from(storeSettings).limit(1);
  return rows[0] ?? null;
});

const settingsSchema = z.object({
  legalName: z.string().min(1),
  gstin: z.string().optional(),
  registeredAddress: z.string().optional(),
  state: z.string().min(1),
  stateCode: z.string().min(1),
  invoicePrefix: z.string().min(1).max(10),
  pricesIncludeGst: z.boolean(),
  freeShippingAbove: z.number().int().min(0),
  shippingFee: z.number().int().min(0),
  whatsappNumber: z.string().optional(),
  supportEmail: z.string().optional(),
});

export const saveStoreSettings = createServerFn()
  .validator(settingsSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const existing = await db.select({ id: storeSettings.id }).from(storeSettings).limit(1);
    if (existing.length) {
      const [row] = await db
        .update(storeSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(storeSettings.id, existing[0].id))
        .returning();
      return row;
    }
    const [row] = await db.insert(storeSettings).values(data).returning();
    return row;
  });
