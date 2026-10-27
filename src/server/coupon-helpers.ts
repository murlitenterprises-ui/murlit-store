import { db } from "@/server/db";
import { coupons, couponUsages, orders } from "@/server/db/schema";
import { eq, and, count } from "drizzle-orm";

export type CouponResult =
  | { valid: true; discount: number; code: string; description: string | null }
  | { valid: false; error: string };

export async function validateCoupon(
  code: string,
  orderSubtotal: number,
  userId: string | null,
): Promise<CouponResult> {
  const [coupon] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code.toUpperCase().trim()))
    .limit(1);

  if (!coupon || !coupon.isActive) return { valid: false, error: "Invalid or expired coupon" };

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) return { valid: false, error: "Coupon is not active yet" };
  if (coupon.endsAt && coupon.endsAt < now) return { valid: false, error: "Coupon has expired" };
  if (coupon.minOrder && orderSubtotal < coupon.minOrder) {
    const minRs = (coupon.minOrder / 100).toLocaleString("en-IN");
    return { valid: false, error: `Minimum order ₹${minRs} required` };
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, error: "Coupon usage limit has been reached" };
  }

  if (coupon.perUserLimit !== null && userId) {
    const [{ n: userUsage }] = await db
      .select({ n: count() })
      .from(couponUsages)
      .where(and(eq(couponUsages.couponId, coupon.id), eq(couponUsages.userId, userId)));
    if (Number(userUsage) >= coupon.perUserLimit) {
      return { valid: false, error: "You have already used this coupon" };
    }
  }

  if (coupon.firstOrderOnly) {
    if (!userId) return { valid: false, error: "This coupon is only valid on your first order" };
    const [{ n: prevOrders }] = await db
      .select({ n: count() })
      .from(orders)
      .where(eq(orders.userId, userId));
    if (Number(prevOrders) > 0) {
      return { valid: false, error: "This coupon is only valid on your first order" };
    }
  }

  let discount = 0;
  if (coupon.type === "percent") {
    discount = Math.round((orderSubtotal * coupon.value) / 100);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
  } else {
    discount = coupon.value;
  }
  discount = Math.min(discount, orderSubtotal);

  return { valid: true, discount, code: coupon.code, description: coupon.description };
}
