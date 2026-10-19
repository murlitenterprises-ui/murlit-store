import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/server/db";
import { offers } from "@/server/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "@/server/auth-helpers";

export const listOffersAdmin = createServerFn().handler(async () => {
  await requireAdmin();
  return db.select().from(offers).orderBy(asc(offers.sortOrder));
});

const offerUpdateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  tagText: z.string().optional().nullable(),
  percent: z.number().int().min(0).max(20),
  maxDiscountPaise: z.number().int().positive().optional().nullable(),
  minOrderPaise: z.number().int().min(0).default(0),
  minPastOrders: z.number().int().min(0).default(0),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number().int().default(0),
});

export const updateOfferAdmin = createServerFn()
  .validator(offerUpdateSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    if (data.percent > 20) throw new Error("Offer percent cannot exceed 20%");
    const [row] = await db
      .update(offers)
      .set({
        title: data.title,
        description: data.description ?? null,
        tagText: data.tagText ?? null,
        percent: data.percent,
        maxDiscountPaise: data.maxDiscountPaise ?? null,
        minOrderPaise: data.minOrderPaise,
        minPastOrders: data.minPastOrders,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(offers.id, data.id))
      .returning();
    return row;
  });

export const toggleOfferAdmin = createServerFn()
  .validator(z.object({ id: z.string().uuid(), isActive: z.boolean() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    await db.update(offers).set({ isActive: data.isActive, updatedAt: new Date() }).where(eq(offers.id, data.id));
    return { ok: true };
  });
