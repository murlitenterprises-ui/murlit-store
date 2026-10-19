import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/server/db";
import { coupons, couponUsages } from "@/server/db/schema";
import { eq, desc, ilike, or, count, and } from "drizzle-orm";
import { requireAdmin } from "@/server/auth-helpers";

const PAGE_SIZE = 20;

export const listCoupons = createServerFn()
  .validator(z.object({
    search: z.string().optional(),
    page: z.number().int().min(1).default(1),
  }))
  .handler(async ({ data }) => {
    await requireAdmin();

    const conditions: any[] = [];
    if (data.search) {
      const q = `%${data.search}%`;
      conditions.push(or(ilike(coupons.code, q), ilike(coupons.description, q)));
    }
    const where = conditions.length ? and(...conditions) : undefined;

    const [{ n: total }] = await db.select({ n: count() }).from(coupons).where(where);
    const rows = await db
      .select()
      .from(coupons)
      .where(where)
      .orderBy(desc(coupons.createdAt))
      .limit(PAGE_SIZE)
      .offset((data.page - 1) * PAGE_SIZE);

    // Attach per-coupon usage counts (already in coupons.usedCount, but verify)
    return { rows, total: Number(total), page: data.page, pageSize: PAGE_SIZE };
  });

export const getCoupon = createServerFn()
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const [row] = await db.select().from(coupons).where(eq(coupons.id, data.id)).limit(1);
    if (!row) throw new Error("Coupon not found");
    return row;
  });

const couponSchema = z.object({
  code: z.string().min(2).max(30).toUpperCase(),
  type: z.enum(["percent", "flat"]),
  value: z.number().int().positive(),
  minOrder: z.number().int().min(0).default(0),
  maxDiscount: z.number().int().positive().optional().nullable(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  perUserLimit: z.number().int().positive().optional().nullable(),
  firstOrderOnly: z.boolean().default(false),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(false),
});

export const createCoupon = createServerFn()
  .validator(couponSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    // Validate: percent type value max 100
    if (data.type === "percent" && data.value > 100) throw new Error("Percent value cannot exceed 100");

    const existing = await db.select({ id: coupons.id }).from(coupons).where(eq(coupons.code, data.code.toUpperCase())).limit(1);
    if (existing.length) throw new Error(`Coupon code "${data.code.toUpperCase()}" already exists`);

    const [row] = await db.insert(coupons).values({
      code: data.code.toUpperCase(),
      type: data.type,
      value: data.value,
      minOrder: data.minOrder,
      maxDiscount: data.maxDiscount ?? null,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      usageLimit: data.usageLimit ?? null,
      perUserLimit: data.perUserLimit ?? null,
      firstOrderOnly: data.firstOrderOnly,
      description: data.description ?? null,
      isActive: data.isActive,
      isPublic: data.isPublic,
    }).returning();
    return row;
  });

export const updateCoupon = createServerFn()
  .validator(couponSchema.extend({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    if (data.type === "percent" && data.value > 100) throw new Error("Percent value cannot exceed 100");

    const existing = await db.select({ id: coupons.id }).from(coupons)
      .where(and(eq(coupons.code, data.code.toUpperCase()), eq(coupons.id, data.id)))
      .limit(1);
    // Check code uniqueness for other coupons
    const dupe = await db.select({ id: coupons.id }).from(coupons).where(eq(coupons.code, data.code.toUpperCase())).limit(1);
    if (dupe.length && dupe[0].id !== data.id) throw new Error(`Coupon code "${data.code.toUpperCase()}" already exists`);

    const [row] = await db.update(coupons).set({
      code: data.code.toUpperCase(),
      type: data.type,
      value: data.value,
      minOrder: data.minOrder,
      maxDiscount: data.maxDiscount ?? null,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      usageLimit: data.usageLimit ?? null,
      perUserLimit: data.perUserLimit ?? null,
      firstOrderOnly: data.firstOrderOnly,
      description: data.description ?? null,
      isActive: data.isActive,
      isPublic: data.isPublic,
      updatedAt: new Date(),
    }).where(eq(coupons.id, data.id)).returning();
    return row;
  });

export const deactivateCoupon = createServerFn()
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    await db.update(coupons).set({ isActive: false, updatedAt: new Date() }).where(eq(coupons.id, data.id));
    return { success: true };
  });
