import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/server/db";
import { coupons, couponUsages } from "@/server/db/schema";
import { eq, and, count, gte, lte, or, isNull } from "drizzle-orm";
import { requireUser } from "@/server/auth-helpers";
import { validateCoupon } from "@/server/coupon-helpers";

export type { CouponResult } from "@/server/coupon-helpers";

export const applyCoupon = createServerFn()
  .validator(z.object({ code: z.string(), orderSubtotal: z.number().int() }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    const result = await validateCoupon(data.code, data.orderSubtotal, user.id);
    return result;
  });

// ─── List eligible coupons for current user/cart ───────────────────────────────

export const getAvailableCoupons = createServerFn()
  .validator(z.object({ orderSubtotal: z.number().int() }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    const now = new Date();

    const allCoupons = await db
      .select()
      .from(coupons)
      .where(
        and(
          eq(coupons.isActive, true),
          or(isNull(coupons.startsAt), lte(coupons.startsAt, now)),
          or(isNull(coupons.endsAt), gte(coupons.endsAt, now)),
          or(isNull(coupons.usageLimit), gte(coupons.usageLimit, coupons.usedCount)),
        )
      );

    // Filter by per-user usage and min order
    const eligible = [];
    for (const c of allCoupons) {
      if (c.minOrder && data.orderSubtotal < c.minOrder) continue;
      if (c.perUserLimit !== null) {
        const [{ n }] = await db.select({ n: count() }).from(couponUsages)
          .where(and(eq(couponUsages.couponId, c.id), eq(couponUsages.userId, user.id)));
        if (Number(n) >= c.perUserLimit) continue;
      }
      // Compute discount for display
      let discount = 0;
      if (c.type === "percent") {
        discount = Math.round((data.orderSubtotal * c.value) / 100);
        if (c.maxDiscount && discount > c.maxDiscount) discount = c.maxDiscount;
      } else {
        discount = c.value;
      }
      discount = Math.min(discount, data.orderSubtotal);
      eligible.push({
        code: c.code,
        type: c.type,
        value: c.value,
        maxDiscount: c.maxDiscount,
        minOrder: c.minOrder,
        endsAt: c.endsAt,
        description: c.description,
        firstOrderOnly: c.firstOrderOnly,
        discount,
      });
    }
    return eligible;
  });
