import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/server/db";
import { orders, orderItems, products, storeSettings, carts, cartItems, orderHistory, couponUsages, coupons, coinLedger, users, offers } from "@/server/db/schema";
import { eq, and, inArray, count } from "drizzle-orm";
import { requireUser } from "@/server/auth-helpers";
import crypto from "node:crypto";
import { INDIAN_STATES } from "@/lib/india-states";
import { assignInvoiceNumber } from "@/server/invoice-number";
import { sendOrderConfirmationEmail, sendAdminNewOrderEmail } from "@/lib/email";
import { validateCoupon } from "@/server/coupon-helpers";
import { getCoinBalanceForUser } from "@/server/referral-helpers";
import { getBestOffer } from "@/server/offer-helpers";

// Normalize any state identifier to the 2-letter postal code from INDIAN_STATES.
// Accepts: "DL", "Delhi", "07" (GSTIN prefix), "dl" — returns "DL" or the uppercased input as fallback.
function toPostalCode(raw: string): string {
  const up = raw.trim().toUpperCase();
  // Already a 2-letter code?
  const byCode = INDIAN_STATES.find((s) => s.code === up);
  if (byCode) return byCode.code;
  // Full state name?
  const byName = INDIAN_STATES.find((s) => s.name.toUpperCase() === up);
  if (byName) return byName.code;
  // Return as-is (unknown code — let comparison fail gracefully)
  return up;
}

// ─── GST helpers ─────────────────────────────────────────────────────────────

export function computeItemGst(
  price: number,         // paise, unit price
  qty: number,
  gstRate: number,       // 0 | 5 | 12 | 18
  priceIncludesGst: boolean,
): {
  taxableValue: number;  // total taxable (paise)
  taxAmount: number;     // total tax (paise)
  total: number;         // taxable + tax
} {
  const total = price * qty;
  if (gstRate === 0) return { taxableValue: total, taxAmount: 0, total };
  if (priceIncludesGst) {
    const taxableValue = Math.round((total * 100) / (100 + gstRate));
    const taxAmount = total - taxableValue;
    return { taxableValue, taxAmount, total };
  } else {
    const taxableValue = total;
    const taxAmount = Math.round((total * gstRate) / 100);
    return { taxableValue, taxAmount, total: total + taxAmount };
  }
}

// ─── Public legal/contact info (for legal pages) ─────────────────────────────

export const getLegalStoreInfo = createServerFn().handler(async () => {
  const rows = await db
    .select({
      legalName:     storeSettings.legalName,
      addressLine1:  storeSettings.addressLine1,
      addressLine2:  storeSettings.addressLine2,
      city:          storeSettings.city,
      pincode:       storeSettings.pincode,
      state:         storeSettings.state,
      phone:         storeSettings.phone,
      businessEmail: storeSettings.businessEmail,
      supportEmail:  storeSettings.supportEmail,
      gstin:         storeSettings.gstin,
      whatsappNumber: storeSettings.whatsappNumber,
    })
    .from(storeSettings)
    .limit(1);
  return rows[0] ?? {
    legalName: "Murlit Enterprises",
    addressLine1: null, addressLine2: null,
    city: "Jaipur", pincode: "302001", state: "Rajasthan",
    phone: null, businessEmail: null, supportEmail: null,
    gstin: null, whatsappNumber: null,
  };
});

// ─── Public store settings (for checkout display) ────────────────────────────

export const getPublicStoreSettings = createServerFn().handler(async () => {
  const rows = await db
    .select({
      state: storeSettings.state,
      stateCode: storeSettings.stateCode,
      shippingFee: storeSettings.shippingFee,
      freeShippingAbove: storeSettings.freeShippingAbove,
      codEnabled: storeSettings.codEnabled,
      whatsappNumber: storeSettings.whatsappNumber,
    })
    .from(storeSettings)
    .limit(1);
  return rows[0] ?? { state: "Maharashtra", stateCode: "MH", shippingFee: 9900, freeShippingAbove: 50000, codEnabled: true, whatsappNumber: null };
});

// ─── Compute checkout summary (server-authoritative GST) ─────────────────────

const addressSnap = z.object({
  name: z.string(),
  phone: z.string(),
  line1: z.string(),
  line2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  stateCode: z.string(),
  pincode: z.string(),
});

export const getCheckoutSummary = createServerFn()
  .validator(z.object({
    shippingStateCode: z.string(),
    couponCode: z.string().optional(),
    offerId: z.string().uuid().optional(),
    useCoins: z.boolean().optional(),
  }))
  .handler(async ({ data }) => {
    const user = await requireUser();

    // Get user's cart
    const [cart] = await db.select({ id: carts.id }).from(carts).where(eq(carts.userId, user.id)).limit(1);
    if (!cart) return null;

    const items = await db
      .select({
        id: cartItems.id,
        productId: cartItems.productId,
        qty: cartItems.qty,
        name: products.name,
        sku: products.sku,
        price: products.price,
        stock: products.stock,
        isActive: products.isActive,
        gstRate: products.gstRate,
        priceIncludesGst: products.priceIncludesGst,
        hsnCode: products.hsnCode,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, cart.id));

    if (!items.length) return null;

    const [settings] = await db.select().from(storeSettings).limit(1);
    const storeStateCode = toPostalCode(settings?.stateCode ?? "MH");
    const shippingFee = settings?.shippingFee ?? 9900;
    const freeShippingAbove = settings?.freeShippingAbove ?? 50000;

    const isSameState = toPostalCode(data.shippingStateCode) === storeStateCode;

    let subtotal = 0;
    let totalTaxable = 0;
    let totalTax = 0;

    const lineItems = items.map((item) => {
      const { taxableValue, taxAmount, total } = computeItemGst(
        item.price,
        item.qty,
        item.gstRate,
        item.priceIncludesGst,
      );
      subtotal += total;
      totalTaxable += taxableValue;
      totalTax += taxAmount;

      return {
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        price: item.price,
        qty: item.qty,
        hsnCode: item.hsnCode,
        gstRate: item.gstRate,
        taxableValue,
        taxAmount,
        total,
        stock: item.stock,
        isActive: item.isActive,
      };
    });

    const shipping = subtotal >= freeShippingAbove ? 0 : shippingFee;

    // ── Referral welcome discount (auto if user was referred and this is first order) ──
    let referralDiscount = 0;
    const referralEnabled = settings?.referralEnabled ?? true;
    const referralWelcomeDiscount = settings?.referralWelcomeDiscount ?? 5000;
    if (referralEnabled) {
      const [userData] = await db.select({ referredBy: users.referredBy }).from(users).where(eq(users.id, user.id)).limit(1);
      if (userData?.referredBy) {
        const prevOrderRows = await db.select({ n: count() }).from(orders).where(eq(orders.userId, user.id));
        if (Number(prevOrderRows[0]?.n ?? 0) === 0) {
          referralDiscount = Math.min(referralWelcomeDiscount, subtotal);
        }
      }
    }

    // ── Offer discount (auto best-offer or selected) ─────────────────────────────
    const maxTotalDiscountPct = (settings as any)?.maxTotalDiscountPercent ?? 20;
    const maxTotalDiscount = Math.floor((subtotal * maxTotalDiscountPct) / 100);
    let offerDiscount = 0;
    let appliedOfferId: string | null = null;
    let appliedOfferTitle: string | null = null;
    if (data.offerId) {
      const { checkOfferEligibility } = await import("@/server/offer-helpers");
      const res = await checkOfferEligibility(data.offerId, user.id, subtotal);
      if (res.eligible) {
        offerDiscount = res.discount;
        appliedOfferId = res.offerId;
        appliedOfferTitle = res.title;
      }
    } else {
      // Auto-apply best offer
      const best = await getBestOffer(user.id, subtotal);
      if (best) {
        offerDiscount = best.discount;
        appliedOfferId = best.offerId;
        appliedOfferTitle = best.title;
      }
    }

    // ── Coupon discount ──────────────────────────────────────────────────────────
    let couponDiscount = 0;
    let couponResult: { valid: boolean; code?: string; discount?: number; error?: string; description?: string | null } = { valid: false };
    if (data.couponCode?.trim()) {
      const res = await validateCoupon(data.couponCode, subtotal - offerDiscount - referralDiscount, user.id);
      couponResult = res;
      if (res.valid) couponDiscount = res.discount;
    }

    // ── Coins discount ───────────────────────────────────────────────────────────
    let coinsUsed = 0;
    let coinsValue = 0;
    const coinValuePaise = settings?.coinValuePaise ?? 100;
    const maxCoinsPct = settings?.maxCoinsPctPerOrder ?? 20;
    if (data.useCoins && referralEnabled) {
      const coinBalance = await getCoinBalanceForUser(user.id);
      const maxCoinsValue = Math.floor((subtotal * maxCoinsPct) / 100);
      const applicableValue = Math.min(coinBalance * coinValuePaise, maxCoinsValue, subtotal - offerDiscount - couponDiscount - referralDiscount);
      if (applicableValue > 0) {
        coinsValue = applicableValue;
        coinsUsed = Math.floor(coinsValue / coinValuePaise);
      }
    }

    // ── Hard 20% cap on combined discounts ───────────────────────────────────────
    let totalDiscount = offerDiscount + couponDiscount + coinsValue + referralDiscount;
    let capWarning = false;
    if (totalDiscount > maxTotalDiscount) {
      capWarning = true;
      // Reduce coins first, then coupon, then offer
      const overBy = totalDiscount - maxTotalDiscount;
      if (coinsValue >= overBy) {
        coinsValue -= overBy;
        coinsUsed = Math.floor(coinsValue / coinValuePaise);
      } else {
        const overAfterCoins = overBy - coinsValue;
        coinsValue = 0; coinsUsed = 0;
        if (couponDiscount >= overAfterCoins) {
          couponDiscount -= overAfterCoins;
        } else {
          const overAfterCoupon = overAfterCoins - couponDiscount;
          couponDiscount = 0;
          offerDiscount = Math.max(0, offerDiscount - overAfterCoupon);
        }
      }
      totalDiscount = offerDiscount + couponDiscount + coinsValue + referralDiscount;
    }

    const discountedSubtotal = Math.max(0, subtotal - totalDiscount);

    // Scale taxable/tax proportionally
    let adjustedTaxable = totalTaxable;
    let adjustedTax = totalTax;
    if (totalDiscount > 0 && subtotal > 0) {
      const ratio = discountedSubtotal / subtotal;
      adjustedTaxable = Math.round(totalTaxable * ratio);
      adjustedTax = Math.round(totalTax * ratio);
    }

    const grand = discountedSubtotal + shipping;

    return {
      lineItems,
      subtotal,
      shipping,
      shippingFee,
      freeShippingAbove,
      discount: totalDiscount,
      offerDiscount,
      appliedOfferId,
      appliedOfferTitle,
      couponDiscount,
      coinsUsed,
      coinsValue,
      referralDiscount,
      couponCode: couponResult.valid ? (couponResult as any).code : null,
      couponError: !couponResult.valid && data.couponCode ? (couponResult as any).error : null,
      taxableAmount: adjustedTaxable,
      taxAmount: adjustedTax,
      cgst: isSameState ? Math.round(adjustedTax / 2) : 0,
      sgst: isSameState ? adjustedTax - Math.round(adjustedTax / 2) : 0,
      igst: isSameState ? 0 : adjustedTax,
      taxType: isSameState ? "CGST_SGST" : "IGST",
      total: grand,
      storeStateCode,
      codEnabled: settings?.codEnabled ?? true,
      coinBalance: data.useCoins !== undefined ? await getCoinBalanceForUser(user.id) : null,
      coinValuePaise,
      maxCoinsPct,
      referralEnabled: settings?.referralEnabled ?? true,
    };
  });

// ─── Place order ─────────────────────────────────────────────────────────────

const placeOrderSchema = z.object({
  shippingAddress: addressSnap,
  paymentMethod: z.enum(["cod", "razorpay"]),
  customerGstin: z.string().optional(),
  businessName: z.string().optional(),
  couponCode: z.string().optional(),
  offerId: z.string().uuid().optional(),
  useCoins: z.boolean().optional(),
});

export const placeOrder = createServerFn()
  .validator(placeOrderSchema)
  .handler(async ({ data }) => {
    const user = await requireUser();

    // Get cart
    const [cart] = await db.select({ id: carts.id }).from(carts).where(eq(carts.userId, user.id)).limit(1);
    if (!cart) throw new Error("Cart is empty");

    const items = await db
      .select({
        id: cartItems.id,
        productId: cartItems.productId,
        qty: cartItems.qty,
      })
      .from(cartItems)
      .where(eq(cartItems.cartId, cart.id));
    if (!items.length) throw new Error("Cart is empty");

    // Re-validate products from DB
    const productIds = items.map((i) => i.productId);
    const dbProducts = await db
      .select()
      .from(products)
      .where(and(inArray(products.id, productIds)));

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // Validate stock & active
    for (const item of items) {
      const p = productMap.get(item.productId);
      if (!p || !p.isActive) throw new Error(`Product "${p?.name ?? item.productId}" is no longer available`);
      if (p.stock < item.qty) throw new Error(`Only ${p.stock} unit(s) of "${p.name}" available`);
    }

    const [settings] = await db.select().from(storeSettings).limit(1);
    const storeStateCode = toPostalCode(settings?.stateCode ?? "MH");
    const shippingFee = settings?.shippingFee ?? 9900;
    const freeShippingAbove = settings?.freeShippingAbove ?? 50000;
    const invoicePrefix = settings?.invoicePrefix ?? "MUR";

    if (data.paymentMethod === "cod" && !(settings?.codEnabled ?? true)) {
      throw new Error("Cash on Delivery is not available");
    }

    const isSameState = toPostalCode(data.shippingAddress.stateCode) === storeStateCode;

    let subtotal = 0;
    let totalTaxable = 0;
    let totalTax = 0;

    const lineItems = items.map((item) => {
      const p = productMap.get(item.productId)!;
      const { taxableValue, taxAmount, total } = computeItemGst(
        p.price,
        item.qty,
        p.gstRate,
        p.priceIncludesGst,
      );
      subtotal += total;
      totalTaxable += taxableValue;
      totalTax += taxAmount;
      return {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        price: p.price,
        qty: item.qty,
        hsnCode: p.hsnCode,
        gstRate: p.gstRate,
        taxableValue,
        taxAmount,
      };
    });

    const shipping = subtotal >= freeShippingAbove ? 0 : shippingFee;

    // ── Referral discount (first-order only, auto-applied) ──────────────────────
    let referralDiscount = 0;
    if (settings?.referralEnabled !== false) {
      const [userData] = await db.select({ referredBy: users.referredBy }).from(users).where(eq(users.id, user.id)).limit(1);
      if (userData?.referredBy) {
        const prevOrderRows2 = await db.select({ n: count() }).from(orders).where(eq(orders.userId, user.id));
        if (Number(prevOrderRows2[0]?.n ?? 0) === 0) {
          referralDiscount = Math.min(settings?.referralWelcomeDiscount ?? 5000, subtotal);
        }
      }
    }

    // ── Offer validation (server re-validates) ───────────────────────────────────
    const maxTotalDiscountPct2 = (settings as any)?.maxTotalDiscountPercent ?? 20;
    const maxTotalDiscount2 = Math.floor((subtotal * maxTotalDiscountPct2) / 100);
    let offerDiscountPl = 0;
    let appliedOfferIdPl: string | null = null;
    let appliedOfferTitle: string | null = null;
    if (data.offerId) {
      const { checkOfferEligibility } = await import("@/server/offer-helpers");
      const res = await checkOfferEligibility(data.offerId, user.id, subtotal);
      if (res.eligible) {
        offerDiscountPl = res.discount;
        appliedOfferIdPl = res.offerId;
        appliedOfferTitle = res.title;
      }
    } else {
      const best = await getBestOffer(user.id, subtotal);
      if (best) {
        offerDiscountPl = best.discount;
        appliedOfferIdPl = best.offerId;
        appliedOfferTitle = best.title;
      }
    }

    // ── Coupon validation (server re-validates) ──────────────────────────────────
    let couponDiscount = 0;
    let validatedCouponCode: string | null = null;
    let couponId: string | null = null;
    if (data.couponCode?.trim()) {
      const res = await validateCoupon(data.couponCode, subtotal - offerDiscountPl - referralDiscount, user.id);
      if (!res.valid) throw new Error(res.error);
      couponDiscount = res.discount;
      validatedCouponCode = res.code;
      const [c] = await db.select({ id: coupons.id }).from(coupons).where(eq(coupons.code, res.code)).limit(1);
      couponId = c?.id ?? null;
    }

    // ── Coins validation (server re-validates balance) ───────────────────────────
    let coinsUsed = 0;
    let coinsValue = 0;
    if (data.useCoins && settings?.referralEnabled !== false) {
      const coinValuePaise = settings?.coinValuePaise ?? 100;
      const maxCoinsPct = settings?.maxCoinsPctPerOrder ?? 20;
      const coinBalance = await getCoinBalanceForUser(user.id);
      const maxCoinsValue = Math.floor((subtotal * maxCoinsPct) / 100);
      const applicableValue = Math.min(coinBalance * coinValuePaise, maxCoinsValue, subtotal - offerDiscountPl - couponDiscount - referralDiscount);
      if (applicableValue > 0) {
        coinsValue = applicableValue;
        coinsUsed = Math.floor(coinsValue / coinValuePaise);
      }
    }

    // ── Hard 20% cap ──────────────────────────────────────────────────────────────
    let totalDiscount = offerDiscountPl + couponDiscount + coinsValue + referralDiscount;
    if (totalDiscount > maxTotalDiscount2) {
      const overBy = totalDiscount - maxTotalDiscount2;
      if (coinsValue >= overBy) {
        coinsValue -= overBy;
        const coinValuePaise = settings?.coinValuePaise ?? 100;
        coinsUsed = Math.floor(coinsValue / coinValuePaise);
      } else {
        const overAfterCoins = overBy - coinsValue;
        coinsValue = 0; coinsUsed = 0;
        if (couponDiscount >= overAfterCoins) {
          couponDiscount -= overAfterCoins;
        } else {
          const overAfterCoupon = overAfterCoins - couponDiscount;
          couponDiscount = 0;
          offerDiscountPl = Math.max(0, offerDiscountPl - overAfterCoupon);
        }
      }
      totalDiscount = offerDiscountPl + couponDiscount + coinsValue + referralDiscount;
    }

    const discountedSubtotal = Math.max(0, subtotal - totalDiscount);

    // Scale taxable/tax proportionally after discount
    let adjustedTaxable = totalTaxable;
    let adjustedTax = totalTax;
    if (totalDiscount > 0 && subtotal > 0) {
      const ratio = discountedSubtotal / subtotal;
      adjustedTaxable = Math.round(totalTaxable * ratio);
      adjustedTax = Math.round(totalTax * ratio);
    }

    const cgst = isSameState ? Math.round(adjustedTax / 2) : 0;
    const sgst = isSameState ? adjustedTax - Math.round(adjustedTax / 2) : 0;
    const igst = isSameState ? 0 : adjustedTax;
    const total = discountedSubtotal + shipping;

    // Generate order number from a random UUID segment — guaranteed unique, no race condition.
    // Format: PREFIX-YYYYMM-XXXXXXXX (e.g. MUR-202610-A1B2C3D4)
    const now2 = new Date();
    const yyyymm = `${now2.getFullYear()}${String(now2.getMonth() + 1).padStart(2, "0")}`;
    const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
    const orderNumber = `${invoicePrefix}-${yyyymm}-${suffix}`;

    // Insert order + items (neon-http doesn't support real transactions, use sequential inserts)
    const [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        userId: user.id,
        email: user.email,
        phone: data.shippingAddress.phone,
        status: data.paymentMethod === "cod" ? "confirmed" : "pending",
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentMethod === "cod" ? "pending" : "pending",
        subtotal,
        shipping,
        discount: totalDiscount,
        offerDiscountPaise: offerDiscountPl,
        appliedOfferId: appliedOfferIdPl,
        couponDiscount,
        couponCode: validatedCouponCode,
        coinsUsed,
        coinsValue,
        referralDiscount,
        taxableAmount: adjustedTaxable,
        cgst,
        sgst,
        igst,
        total,
        taxType: isSameState ? "CGST_SGST" : "IGST",
        placeOfSupplyState: data.shippingAddress.state,
        customerGstin: data.customerGstin ?? null,
        shippingAddress: data.shippingAddress,
      })
      .returning();

    await db.insert(orderItems).values(
      lineItems.map((li) => ({
        orderId: order.id,
        productId: li.productId,
        name: li.name,
        sku: li.sku,
        price: li.price,
        qty: li.qty,
        hsnCode: li.hsnCode,
        gstRate: li.gstRate,
        taxableValue: li.taxableValue,
        taxAmount: li.taxAmount,
      }))
    );

    // For COD: reduce stock, assign invoice, record history, clear cart
    if (data.paymentMethod === "cod") {
      for (const item of items) {
        const p = productMap.get(item.productId)!;
        const newStock = Math.max(0, p.stock - item.qty);
        await db
          .update(products)
          .set({ stock: newStock, updatedAt: new Date() })
          .where(eq(products.id, p.id));
      }
      // Record confirmed in history
      await db.insert(orderHistory).values({
        orderId: order.id,
        status: "confirmed",
        note: "Order placed (COD)",
        createdBy: user.id,
      });
      await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));

      // Record coupon usage + increment usedCount
      if (couponId && validatedCouponCode) {
        await db.insert(couponUsages).values({ couponId, userId: user.id, orderId: order.id });
        await db.update(coupons).set({ usedCount: (await db.select({ v: coupons.usedCount }).from(coupons).where(eq(coupons.id, couponId)).limit(1))[0].v + 1, updatedAt: new Date() }).where(eq(coupons.id, couponId));
      }

      // Deduct coins from wallet
      if (coinsUsed > 0) {
        await db.insert(coinLedger).values({
          userId: user.id,
          type: "spend",
          amount: -coinsUsed,
          reason: `Used on order ${orderNumber}`,
          orderId: order.id,
        });
      }

      const invNum = await assignInvoiceNumber(order.id);
      // Generate PDF for attachment
      let invoicePdfBase64: string | undefined;
      try {
        const { generateInvoicePdf } = await import("@/server/invoice-service");
        const pdfBytes = await generateInvoicePdf(order.id);
        invoicePdfBase64 = Buffer.from(pdfBytes).toString("base64");
      } catch {}
      // Send confirmation email (non-blocking)
      sendOrderConfirmationEmail({
        orderNumber: order.orderNumber,
        email: user.email,
        total: order.total,
        paymentMethod: "cod",
        invoiceNumber: invNum,
        shippingAddress: data.shippingAddress as Record<string, string>,
        items: lineItems.map((li) => ({ name: li.name, qty: li.qty, price: li.price })),
        invoicePdfBase64,
        offerDiscount: offerDiscountPl > 0 ? offerDiscountPl : undefined,
        offerTitle: appliedOfferTitle,
        couponDiscount: couponDiscount > 0 ? couponDiscount : undefined,
        couponCode: validatedCouponCode,
        coinsValue: coinsValue > 0 ? coinsValue : undefined,
        coinsUsed: coinsUsed > 0 ? coinsUsed : undefined,
      }).catch(() => {});
      sendAdminNewOrderEmail({
        orderNumber: order.orderNumber,
        email: user.email,
        total: order.total,
        paymentMethod: "cod",
        shippingAddress: data.shippingAddress as Record<string, string>,
      }).catch(() => {});
    }

    return { orderNumber: order.orderNumber, orderId: order.id };
  });

// ─── Get order (owner only) ───────────────────────────────────────────────────

export const getOrder = createServerFn()
  .validator(z.object({ orderNumber: z.string() }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.orderNumber, data.orderNumber), eq(orders.userId, user.id)))
      .limit(1);
    if (!order) throw new Error("Order not found");
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));
    return { ...order, items };
  });

// ─── Razorpay ─────────────────────────────────────────────────────────────────

const RZP_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RZP_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export const createRazorpayOrder = createServerFn()
  .validator(z.object({ orderId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    if (!RZP_KEY_ID || !RZP_KEY_SECRET) throw new Error("Razorpay not configured");

    const [order] = await db
      .select({ id: orders.id, orderNumber: orders.orderNumber, total: orders.total, status: orders.status })
      .from(orders)
      .where(and(eq(orders.id, data.orderId), eq(orders.userId, user.id)))
      .limit(1);
    if (!order) throw new Error("Order not found");
    if (order.status !== "pending") throw new Error("Order already processed");

    const creds = Buffer.from(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: `Basic ${creds}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: order.total,  // already in paise
        currency: "INR",
        receipt: order.orderNumber,
        notes: { orderId: order.id },
      }),
    });
    const rzpOrder = await res.json() as { id: string; error?: { description: string } };
    if (!res.ok || rzpOrder.error) throw new Error(rzpOrder.error?.description ?? "Failed to create payment");

    await db.update(orders).set({ razorpayOrderId: rzpOrder.id }).where(eq(orders.id, order.id));
    return { razorpayOrderId: rzpOrder.id, keyId: RZP_KEY_ID, amount: order.total, orderNumber: order.orderNumber };
  });

export const verifyRazorpayPayment = createServerFn()
  .validator(z.object({
    orderId: z.string().uuid(),
    razorpayOrderId: z.string(),
    razorpayPaymentId: z.string(),
    razorpaySignature: z.string(),
  }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    if (!RZP_KEY_SECRET) throw new Error("Razorpay not configured");

    const expected = crypto
      .createHmac("sha256", RZP_KEY_SECRET)
      .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
      .digest("hex");

    const sigBuf = Buffer.from(data.razorpaySignature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    const valid =
      sigBuf.length === expBuf.length &&
      crypto.timingSafeEqual(sigBuf, expBuf);

    if (!valid) throw new Error("Payment signature invalid");

    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, data.orderId), eq(orders.userId, user.id)))
      .limit(1);
    if (!order) throw new Error("Order not found");

    // Mark paid and reduce stock
    await db.update(orders).set({
      status: "confirmed",
      paymentStatus: "paid",
      razorpayOrderId: data.razorpayOrderId,
      razorpayPaymentId: data.razorpayPaymentId,
      updatedAt: new Date(),
    }).where(eq(orders.id, order.id));

    // Reduce stock
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    for (const item of items) {
      if (item.productId) {
        const [prod] = await db.select({ stock: products.stock }).from(products).where(eq(products.id, item.productId)).limit(1);
        if (prod) {
          await db.update(products).set({ stock: Math.max(0, prod.stock - item.qty), updatedAt: new Date() }).where(eq(products.id, item.productId));
        }
      }
    }

    // Assign invoice number and record history
    await assignInvoiceNumber(order.id);
    await db.insert(orderHistory).values({
      orderId: order.id,
      status: "confirmed",
      note: "Payment verified (Razorpay)",
      createdBy: user.id,
    });

    // Record coupon usage if applicable
    if (order.couponCode) {
      const [c] = await db.select({ id: coupons.id, usedCount: coupons.usedCount }).from(coupons).where(eq(coupons.code, order.couponCode)).limit(1);
      if (c) {
        await db.insert(couponUsages).values({ couponId: c.id, userId: user.id, orderId: order.id }).onConflictDoNothing();
        await db.update(coupons).set({ usedCount: c.usedCount + 1, updatedAt: new Date() }).where(eq(coupons.id, c.id));
      }
    }

    // Deduct coins if applicable
    if (order.coinsUsed > 0) {
      const existing = await db.select({ id: coinLedger.id }).from(coinLedger)
        .where(eq(coinLedger.orderId, order.id))
        .limit(1);
      if (!existing.length) {
        await db.insert(coinLedger).values({
          userId: user.id,
          type: "spend",
          amount: -order.coinsUsed,
          reason: `Used on order ${order.orderNumber}`,
          orderId: order.id,
        });
      }
    }

    // Clear cart
    const [cart] = await db.select({ id: carts.id }).from(carts).where(eq(carts.userId, user.id)).limit(1);
    if (cart) await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));

    // Generate PDF for attachment
    let invoicePdfBase64Rzp: string | undefined;
    try {
      const { generateInvoicePdf } = await import("@/server/invoice-service");
      const pdfBytes = await generateInvoicePdf(order.id);
      invoicePdfBase64Rzp = Buffer.from(pdfBytes).toString("base64");
    } catch {}
    // Look up offer title for email
    let rzpOfferTitle: string | null = null;
    if ((order as any).appliedOfferId) {
      const [offerRow] = await db.select({ title: offers.title }).from(offers).where(eq(offers.id, (order as any).appliedOfferId)).limit(1);
      rzpOfferTitle = offerRow?.title ?? null;
    }
    sendOrderConfirmationEmail({
      orderNumber: order.orderNumber,
      email: user.email,
      total: order.total,
      paymentMethod: "razorpay",
      invoiceNumber: order.invoiceNumber,
      shippingAddress: order.shippingAddress as Record<string, string>,
      items: items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
      invoicePdfBase64: invoicePdfBase64Rzp,
      offerDiscount: (order as any).offerDiscountPaise > 0 ? (order as any).offerDiscountPaise : undefined,
      offerTitle: rzpOfferTitle,
      couponDiscount: order.couponDiscount > 0 ? order.couponDiscount : undefined,
      couponCode: order.couponCode,
      coinsValue: order.coinsValue > 0 ? order.coinsValue : undefined,
      coinsUsed: order.coinsUsed > 0 ? order.coinsUsed : undefined,
    }).catch(() => {});
    sendAdminNewOrderEmail({
      orderNumber: order.orderNumber,
      email: user.email,
      total: order.total,
      paymentMethod: "razorpay",
      shippingAddress: order.shippingAddress as Record<string, string>,
    }).catch(() => {});

    return { success: true };
  });
