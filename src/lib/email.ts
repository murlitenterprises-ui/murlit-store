import { inrFromPaise } from "@/lib/format";

const FROM = process.env.EMAIL_FROM || "Murlit <orders@murlit.in>";
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL;
const KEY = process.env.RESEND_API_KEY;

async function send(to: string[], subject: string, html: string, attachments?: { filename: string; content: string }[]) {
  if (!KEY) {
    console.log(`[email] RESEND_API_KEY not set — would send to ${to.join(", ")}: ${subject}`);
    return;
  }
  try {
    const body: any = { from: FROM, to, subject, html };
    if (attachments?.length) body.attachments = attachments;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error("[email] send failed:", e);
  }
}

export async function sendOrderConfirmationEmail(order: {
  orderNumber: string;
  email: string;
  total: number;
  paymentMethod: string;
  invoiceNumber?: string | null;
  shippingAddress: Record<string, string>;
  items: { name: string; qty: number; price: number }[];
  invoicePdfBase64?: string;
  offerDiscount?: number;
  offerTitle?: string | null;
  couponDiscount?: number;
  couponCode?: string | null;
  coinsValue?: number;
  coinsUsed?: number;
}): Promise<void> {
  const addr = order.shippingAddress;
  const itemRows = order.items
    .map((i) => `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${i.name}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">×${i.qty}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">${inrFromPaise(i.price * i.qty)}</td></tr>`)
    .join("");

  const discountRows = [
    order.offerDiscount && order.offerDiscount > 0
      ? `<tr><td colspan="2" style="padding:4px 0;color:#1a7a2a">Offer${order.offerTitle ? ` (${order.offerTitle})` : ""}</td><td style="padding:4px 0;color:#1a7a2a;text-align:right">-${inrFromPaise(order.offerDiscount)}</td></tr>`
      : "",
    order.couponDiscount && order.couponDiscount > 0
      ? `<tr><td colspan="2" style="padding:4px 0;color:#1a7a2a">Coupon${order.couponCode ? ` (${order.couponCode})` : ""}</td><td style="padding:4px 0;color:#1a7a2a;text-align:right">-${inrFromPaise(order.couponDiscount)}</td></tr>`
      : "",
    order.coinsValue && order.coinsValue > 0
      ? `<tr><td colspan="2" style="padding:4px 0;color:#1a7a2a">Coins (${order.coinsUsed ?? 0})</td><td style="padding:4px 0;color:#1a7a2a;text-align:right">-${inrFromPaise(order.coinsValue)}</td></tr>`
      : "",
  ].join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:sans-serif;color:#333;max-width:560px;margin:0 auto;padding:24px">
<h1 style="color:#7a1e2a;font-size:22px;margin-bottom:4px">Order Confirmed!</h1>
<p style="color:#666;margin-top:0">Thank you for shopping with Murlit.</p>
<div style="background:#f9f9f6;border-radius:8px;padding:16px;margin:20px 0">
  <strong>Order:</strong> ${order.orderNumber}${order.invoiceNumber ? ` &nbsp;·&nbsp; <strong>Invoice:</strong> ${order.invoiceNumber}` : ""}<br>
  <strong>Payment:</strong> ${order.paymentMethod === "cod" ? "Cash on Delivery" : "Online"}
</div>
<table style="width:100%;border-collapse:collapse;font-size:14px"><tbody>${itemRows}</tbody>
<tfoot>${discountRows}<tr><td colspan="2" style="padding-top:10px;font-weight:bold">Total</td><td style="padding-top:10px;font-weight:bold;text-align:right">${inrFromPaise(order.total)}</td></tr></tfoot></table>
<h3 style="font-size:14px;margin-top:20px;margin-bottom:6px">Shipping To</h3>
<p style="font-size:13px;color:#555;margin:0">${addr.name}<br>${addr.phone}<br>${addr.line1}${addr.line2 ? `, ${addr.line2}` : ""}<br>${addr.city}, ${addr.state} – ${addr.pincode}</p>
${order.paymentMethod === "cod" ? `<p style="margin-top:20px;font-size:13px;color:#888">Please keep Rs. ${(order.total / 100).toFixed(2)} ready at delivery.</p>` : "<p style=\"font-size:13px;color:#888;margin-top:20px\">Payment received. Thank you!</p>"}
<p style="font-size:11px;color:#bbb;margin-top:24px">Murlit Enterprises · murlit.in</p></body></html>`;

  const attachments: { filename: string; content: string }[] = [];
  if (order.invoicePdfBase64) {
    attachments.push({ filename: `${order.invoiceNumber ?? order.orderNumber}.pdf`, content: order.invoicePdfBase64 });
  }

  await send([order.email], `Order Confirmed: ${order.orderNumber}`, html, attachments.length ? attachments : undefined);
}

export async function sendAdminNewOrderEmail(order: {
  orderNumber: string;
  email: string;
  total: number;
  paymentMethod: string;
  shippingAddress: Record<string, string>;
}): Promise<void> {
  if (!ADMIN_EMAIL) return;
  const addr = order.shippingAddress;
  const html = `<p>New order received: <strong>${order.orderNumber}</strong></p>
<p>Customer: ${order.email}</p>
<p>Total: ${inrFromPaise(order.total)} · Payment: ${order.paymentMethod.toUpperCase()}</p>
<p>Ship to: ${addr.name}, ${addr.line1}, ${addr.city}, ${addr.state} ${addr.pincode}</p>`;
  await send([ADMIN_EMAIL], `New Order: ${order.orderNumber}`, html);
}

export async function sendOrderShippedEmail(order: {
  orderNumber: string;
  email: string;
  courier: string;
  trackingNumber: string;
  trackingUrl?: string | null;
}): Promise<void> {
  const html = `<p>Your order <strong>${order.orderNumber}</strong> has been shipped!</p>
<p><strong>Courier:</strong> ${order.courier}</p>
<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
${order.trackingUrl ? `<p><a href="${order.trackingUrl}">Track your order →</a></p>` : ""}`;
  await send([order.email], `Your Order ${order.orderNumber} Has Shipped`, html);
}

export async function sendOrderCancelledEmail(order: {
  orderNumber: string;
  email: string;
  reason?: string | null;
}): Promise<void> {
  const html = `<p>Your order <strong>${order.orderNumber}</strong> has been cancelled.</p>
${order.reason ? `<p>Reason: ${order.reason}</p>` : ""}
<p>If you paid online, a refund will be processed within 5–7 business days.</p>`;
  await send([order.email], `Order ${order.orderNumber} Cancelled`, html);
}

export async function sendPasswordResetEmail(userEmail: string, url: string): Promise<void> {
  const html = `<p>Click the link below to reset your Murlit account password:</p>
<p><a href="${url}" style="color:#7a1e2a">Reset Password</a></p>
<p style="font-size:12px;color:#888">This link expires in 1 hour. If you didn't request this, ignore this email.</p>`;
  await send([userEmail], "Reset Your Murlit Password", html);
}
