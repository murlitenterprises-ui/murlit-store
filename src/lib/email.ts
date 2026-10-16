import { inrFromPaise } from "@/lib/format";

// Sends order confirmation email via Resend if RESEND_API_KEY is configured.
// Silent no-op if not configured — never throws.
export async function sendOrderConfirmationEmail(order: {
  orderNumber: string;
  email: string;
  total: number;
  paymentMethod: string;
  shippingAddress: Record<string, string>;
  items: { name: string; qty: number; price: number }[];
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;

  const addr = order.shippingAddress;
  const itemRows = order.items
    .map((i) => `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${i.name}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">×${i.qty}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">${inrFromPaise(i.price * i.qty)}</td></tr>`)
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Order Confirmed</title></head>
<body style="font-family:sans-serif;color:#333;max-width:560px;margin:0 auto;padding:24px">
  <h1 style="color:#7a1e2a;font-size:24px;margin-bottom:4px">Order Confirmed!</h1>
  <p style="color:#666;margin-top:0">Thank you for shopping with Murlit. Your order has been placed successfully.</p>

  <div style="background:#f9f9f6;border-radius:8px;padding:16px;margin:20px 0">
    <strong>Order Number:</strong> ${order.orderNumber}<br>
    <strong>Payment:</strong> ${order.paymentMethod === "cod" ? "Cash on Delivery" : "Online (Razorpay)"}
  </div>

  <h3 style="font-size:14px;margin-bottom:8px">Items</h3>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <tbody>${itemRows}</tbody>
    <tfoot>
      <tr><td colspan="2" style="padding-top:10px;font-weight:bold">Total</td><td style="padding-top:10px;font-weight:bold;text-align:right">${inrFromPaise(order.total)}</td></tr>
    </tfoot>
  </table>

  <h3 style="font-size:14px;margin-top:20px;margin-bottom:8px">Shipping To</h3>
  <p style="font-size:14px;color:#555;margin:0">
    ${addr.name}<br>${addr.phone}<br>
    ${addr.line1}${addr.line2 ? `, ${addr.line2}` : ""}<br>
    ${addr.city}, ${addr.state} – ${addr.pincode}
  </p>

  <p style="margin-top:24px;font-size:13px;color:#888">
    ${order.paymentMethod === "cod" ? `Please keep Rs. ${(order.total / 100).toFixed(2)} ready for delivery.` : "Your payment has been received."}
  </p>
  <p style="font-size:12px;color:#aaa">Murlit Enterprises · murlit.in</p>
</body>
</html>`;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Murlit <orders@murlit.in>",
        to: [order.email],
        subject: `Order Confirmed: ${order.orderNumber}`,
        html,
      }),
    });
  } catch {
    // Email failure must never break the order flow
  }
}
