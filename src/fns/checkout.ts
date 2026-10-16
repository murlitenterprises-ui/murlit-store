import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db, orders, orderItems, products, storeSettings, carts, cartItems } from "@/server/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireUser } from "@/server/auth-helpers";
import crypto from "node:crypto";

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

// ─── Public store settings (for checkout display) ────────────────────────────

export const getPublicStoreSettings = createServerFn().handler(async () => {
  const rows = await db
    .select({
      state: storeSettings.state,
      stateCode: storeSettings.stateCode,
      shippingFee: storeSettings.shippingFee,
      freeShippingAbove: storeSettings.freeShippingAbove,
      codEnabled: storeSettings.codEnabled,
    })
    .from(storeSettings)
    .limit(1);
  return rows[0] ?? { state: "Maharashtra", stateCode: "MH", shippingFee: 9900, freeShippingAbove: 50000, codEnabled: true };
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
  .validator(z.object({ shippingStateCode: z.string() }))
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
    const storeStateCode = settings?.stateCode ?? "MH";
    const shippingFee = settings?.shippingFee ?? 9900;
    const freeShippingAbove = settings?.freeShippingAbove ?? 50000;

    const isSameState = data.shippingStateCode.toUpperCase() === storeStateCode.toUpperCase();

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
    const grand = subtotal + shipping;

    return {
      lineItems,
      subtotal,
      shipping,
      shippingFee,
      freeShippingAbove,
      taxableAmount: totalTaxable,
      taxAmount: totalTax,
      cgst: isSameState ? Math.round(totalTax / 2) : 0,
      sgst: isSameState ? totalTax - Math.round(totalTax / 2) : 0,
      igst: isSameState ? 0 : totalTax,
      taxType: isSameState ? "CGST_SGST" : "IGST",
      total: grand,
      storeStateCode,
      codEnabled: settings?.codEnabled ?? true,
    };
  });

// ─── Place order ─────────────────────────────────────────────────────────────

const placeOrderSchema = z.object({
  shippingAddress: addressSnap,
  paymentMethod: z.enum(["cod", "razorpay"]),
  customerGstin: z.string().optional(),
  businessName: z.string().optional(),
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
    const storeStateCode = settings?.stateCode ?? "MH";
    const shippingFee = settings?.shippingFee ?? 9900;
    const freeShippingAbove = settings?.freeShippingAbove ?? 50000;
    const invoicePrefix = settings?.invoicePrefix ?? "MUR";

    if (data.paymentMethod === "cod" && !(settings?.codEnabled ?? true)) {
      throw new Error("Cash on Delivery is not available");
    }

    const isSameState =
      data.shippingAddress.stateCode.toUpperCase() === storeStateCode.toUpperCase();

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
    const cgst = isSameState ? Math.round(totalTax / 2) : 0;
    const sgst = isSameState ? totalTax - Math.round(totalTax / 2) : 0;
    const igst = isSameState ? 0 : totalTax;
    const total = subtotal + shipping;

    // Generate order number (sequential, collision-safe enough for now)
    const count = await db.$count(orders);
    const orderNumber = `${invoicePrefix}-${String(100001 + Number(count)).padStart(6, "0")}`;

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
        discount: 0,
        taxableAmount: totalTaxable,
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

    // For COD: reduce stock immediately and clear cart
    if (data.paymentMethod === "cod") {
      for (const item of items) {
        const p = productMap.get(item.productId)!;
        const newStock = Math.max(0, p.stock - item.qty);
        await db
          .update(products)
          .set({ stock: newStock, updatedAt: new Date() })
          .where(eq(products.id, p.id));
      }
      await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
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

    // Clear cart
    const [cart] = await db.select({ id: carts.id }).from(carts).where(eq(carts.userId, user.id)).limit(1);
    if (cart) await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));

    return { success: true };
  });
