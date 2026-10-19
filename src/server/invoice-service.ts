// Server-only — never import this from client code
import { db, orders, orderItems, storeSettings } from "@/server/db";
import { eq } from "drizzle-orm";
import { inrInWords } from "@/lib/financial-year";
import type { PDFFont } from "pdf-lib";

// ─── Generate PDF invoice ─────────────────────────────────────────────────────

type RGBColor = ReturnType<import("pdf-lib")["rgb"]>;

function fmt(paise: number): string {
  return "Rs. " + (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function drawLine(page: any, x1: number, y: number, x2: number, color?: RGBColor, thickness = 0.5) {
  page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color });
}

function drawText(page: any, text: string, x: number, y: number, font: PDFFont, size: number, color?: RGBColor) {
  page.drawText(text, { x, y, font, size, color });
}

export async function generateInvoicePdf(orderId: string): Promise<Uint8Array> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) throw new Error("Order not found");

  const [[items, settings], { PDFDocument, rgb, StandardFonts }] = await Promise.all([
    Promise.all([
      db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
      db.select().from(storeSettings).limit(1).then((r) => r[0]),
    ]),
    import("pdf-lib"),
  ]);

  const addr = order.shippingAddress as Record<string, string>;
  const isSameState = order.taxType === "CGST_SGST";

  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const regFont = await doc.embedFont(StandardFonts.Helvetica);

  const M = 40;
  let y = height - M;

  // Header
  drawText(page, "TAX INVOICE", M, y, boldFont, 18, rgb(0.55, 0.07, 0.07));
  y -= 8;
  drawLine(page, M, y, width - M, rgb(0.55, 0.07, 0.07), 1.5);
  y -= 16;

  const colR = width / 2 + 10;

  // Seller info (left)
  drawText(page, settings?.legalName ?? "Murlit Enterprises", M, y, boldFont, 10);
  y -= 13;
  // Prefer structured address fields; fall back to registeredAddress
  if (settings?.addressLine1) {
    drawText(page, settings.addressLine1, M, y, regFont, 8, rgb(0.3, 0.3, 0.3));
    y -= 11;
    if (settings.addressLine2) {
      drawText(page, settings.addressLine2, M, y, regFont, 8, rgb(0.3, 0.3, 0.3));
      y -= 11;
    }
    const cityPin = [settings.city, settings.pincode].filter(Boolean).join(" – ");
    if (cityPin) {
      drawText(page, cityPin, M, y, regFont, 8, rgb(0.3, 0.3, 0.3));
      y -= 11;
    }
  } else if (settings?.registeredAddress) {
    const addrLines = settings.registeredAddress.split(",");
    for (let i = 0; i < Math.min(addrLines.length, 3); i++) {
      drawText(page, addrLines[i].trim(), M, y, regFont, 8, rgb(0.3, 0.3, 0.3));
      y -= 11;
    }
  }
  if (settings?.gstin) {
    drawText(page, `GSTIN: ${settings.gstin}`, M, y, regFont, 8, rgb(0.3, 0.3, 0.3));
    y -= 11;
  }
  if (settings?.state) {
    drawText(page, `State: ${settings.state} | Code: ${settings.stateCode}`, M, y, regFont, 8, rgb(0.3, 0.3, 0.3));
    y -= 11;
  }

  // Invoice details (right)
  const invoiceDate = order.invoiceDate ? new Date(order.invoiceDate) : new Date(order.createdAt);
  const dateStr = invoiceDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  let ry = height - M - 8;
  const rightPairs: [string, string][] = [
    ["Invoice No:", order.invoiceNumber ?? "Not assigned"],
    ["Invoice Date:", dateStr],
    ["Order No:", order.orderNumber],
    ["Payment:", order.paymentMethod.toUpperCase()],
  ];
  for (const [label, value] of rightPairs) {
    drawText(page, label, colR, ry, boldFont, 8);
    drawText(page, value, colR + 75, ry, regFont, 8);
    ry -= 13;
  }

  y = Math.min(y, ry) - 16;
  drawLine(page, M, y + 8, width - M);

  // Billing/Shipping
  drawText(page, "Bill To / Ship To:", M, y, boldFont, 9);
  y -= 13;
  drawText(page, addr.name ?? "", M, y, boldFont, 9);
  y -= 12;
  const addrStr = [addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ");
  const words = addrStr.split(" ");
  let line = "";
  for (const word of words) {
    if ((line + word).length > 50) {
      drawText(page, line.trim(), M, y, regFont, 8, rgb(0.3, 0.3, 0.3));
      y -= 11;
      line = word + " ";
    } else {
      line += word + " ";
    }
  }
  if (line.trim()) { drawText(page, line.trim(), M, y, regFont, 8, rgb(0.3, 0.3, 0.3)); y -= 11; }
  if (addr.phone) { drawText(page, `Ph: ${addr.phone}`, M, y, regFont, 8, rgb(0.3, 0.3, 0.3)); y -= 11; }
  if (order.customerGstin) { drawText(page, `GSTIN: ${order.customerGstin}`, M, y, regFont, 8, rgb(0.3, 0.3, 0.3)); y -= 11; }

  drawText(page, `Place of Supply: ${order.placeOfSupplyState}`, colR, y + 11 * 3 + 24, regFont, 8, rgb(0.3, 0.3, 0.3));

  y -= 16;
  drawLine(page, M, y + 8, width - M);
  y -= 4;

  // Items table
  const colWidths = isSameState
    ? [140, 50, 35, 60, 65, 50, 50, 50]
    : [160, 50, 35, 60, 75, 65, 60];
  const colX = [M];
  for (const w of colWidths.slice(0, -1)) colX.push(colX[colX.length - 1] + w);

  const headers = isSameState
    ? ["Item", "HSN", "Qty", "Rate", "Taxable", "CGST", "SGST", "Total"]
    : ["Item", "HSN", "Qty", "Rate", "Taxable", "IGST", "Total"];

  page.drawRectangle({ x: M, y: y - 14, width: width - 2 * M, height: 16, color: rgb(0.94, 0.94, 0.94) });
  for (let i = 0; i < headers.length; i++) {
    drawText(page, headers[i], colX[i] + 2, y - 11, boldFont, 7.5);
  }
  y -= 16;
  drawLine(page, M, y, width - M);

  for (const item of items) {
    const taxable = item.taxableValue;
    const tax = item.taxAmount;
    const total = item.price * item.qty;
    const cgst = isSameState ? Math.round(tax / 2) : 0;
    const sgst = isSameState ? tax - Math.round(tax / 2) : 0;
    const igst = isSameState ? 0 : tax;
    const rate = item.price / 100;

    y -= 14;
    const cols = isSameState
      ? [item.name.substring(0, 25), item.hsnCode ?? "", String(item.qty),
         `Rs.${rate.toFixed(2)}`, fmt(taxable), `${item.gstRate / 2}% / ${fmt(cgst)}`,
         `${item.gstRate / 2}% / ${fmt(sgst)}`, fmt(total)]
      : [item.name.substring(0, 30), item.hsnCode ?? "", String(item.qty),
         `Rs.${rate.toFixed(2)}`, fmt(taxable), `${item.gstRate}% / ${fmt(igst)}`, fmt(total)];

    for (let i = 0; i < cols.length; i++) {
      drawText(page, cols[i], colX[i] + 2, y, regFont, 7.5);
    }
    drawLine(page, M, y - 3, width - M, rgb(0.9, 0.9, 0.9));
  }

  if (order.shipping > 0) {
    y -= 14;
    drawText(page, "Shipping", colX[0] + 2, y, regFont, 7.5);
    drawText(page, fmt(order.shipping), colX[colX.length - 1] + 2, y, regFont, 7.5);
    drawLine(page, M, y - 3, width - M, rgb(0.9, 0.9, 0.9));
  }

  // Discount lines
  const ord = order as any;
  if ((ord.couponDiscount ?? 0) > 0) {
    y -= 14;
    drawText(page, `Discount (${ord.couponCode ?? "Coupon"})`, colX[0] + 2, y, regFont, 7.5, rgb(0.1, 0.5, 0.1));
    drawText(page, `-${fmt(ord.couponDiscount)}`, colX[colX.length - 1] + 2, y, regFont, 7.5, rgb(0.1, 0.5, 0.1));
    drawLine(page, M, y - 3, width - M, rgb(0.9, 0.9, 0.9));
  }
  if ((ord.coinsValue ?? 0) > 0) {
    y -= 14;
    drawText(page, `Coins Used (${ord.coinsUsed ?? 0} coins)`, colX[0] + 2, y, regFont, 7.5, rgb(0.1, 0.5, 0.1));
    drawText(page, `-${fmt(ord.coinsValue)}`, colX[colX.length - 1] + 2, y, regFont, 7.5, rgb(0.1, 0.5, 0.1));
    drawLine(page, M, y - 3, width - M, rgb(0.9, 0.9, 0.9));
  }
  if ((ord.referralDiscount ?? 0) > 0) {
    y -= 14;
    drawText(page, "Welcome Discount (Referral)", colX[0] + 2, y, regFont, 7.5, rgb(0.1, 0.5, 0.1));
    drawText(page, `-${fmt(ord.referralDiscount)}`, colX[colX.length - 1] + 2, y, regFont, 7.5, rgb(0.1, 0.5, 0.1));
    drawLine(page, M, y - 3, width - M, rgb(0.9, 0.9, 0.9));
  }

  y -= 14;
  drawLine(page, M, y + 10, width - M, rgb(0.55, 0.07, 0.07), 1);
  y -= 6;

  // Totals
  const totR = width - M - 120;
  const totV = width - M;
  const totalPairs: [string, string][] = [
    ["Subtotal:", fmt(order.subtotal)],
    ...(order.shipping > 0 ? [["Shipping:", fmt(order.shipping)] as [string, string]] : []),
    ...((ord.couponDiscount ?? 0) > 0 ? [[`Discount (${ord.couponCode ?? "Coupon"}):`, `-${fmt(ord.couponDiscount)}`] as [string, string]] : []),
    ...((ord.coinsValue ?? 0) > 0 ? [[`Coins (${ord.coinsUsed ?? 0}):`, `-${fmt(ord.coinsValue)}`] as [string, string]] : []),
    ...((ord.referralDiscount ?? 0) > 0 ? [["Welcome Discount:", `-${fmt(ord.referralDiscount)}`] as [string, string]] : []),
    ["Taxable Amount:", fmt(order.taxableAmount)],
    ...(isSameState ? [
      ["CGST:", fmt(order.cgst)],
      ["SGST:", fmt(order.sgst)],
    ] as [string, string][] : [
      ["IGST:", fmt(order.igst)],
    ] as [string, string][]),
  ];

  for (const [label, value] of totalPairs) {
    drawText(page, label, totR, y, regFont, 8.5);
    drawText(page, value, totV - regFont.widthOfTextAtSize(value, 8.5), y, regFont, 8.5);
    y -= 13;
  }

  page.drawRectangle({ x: M, y: y - 5, width: width - 2 * M, height: 18, color: rgb(0.94, 0.94, 0.94) });
  drawText(page, "GRAND TOTAL:", totR, y + 1, boldFont, 9);
  const grandStr = fmt(order.total);
  drawText(page, grandStr, totV - boldFont.widthOfTextAtSize(grandStr, 9), y + 1, boldFont, 9, rgb(0.55, 0.07, 0.07));
  y -= 24;

  drawText(page, inrInWords(order.total), M, y, regFont, 8, rgb(0.3, 0.3, 0.3));
  y -= 20;
  drawLine(page, M, y, width - M);
  y -= 14;

  drawText(page, "This is a computer generated invoice.", M, y, regFont, 7.5, rgb(0.5, 0.5, 0.5));

  return doc.save();
}
