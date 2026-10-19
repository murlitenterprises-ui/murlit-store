import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { getAdminOrderDetail, updateOrderStatus, markCodPaid, cancelOrderAdmin } from "@/fns/admin/orders";
import { getInvoice } from "@/fns/invoice";
import { inrFromPaise } from "@/lib/format";
import { ArrowLeft, Download, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders/$id")({
  loader: async ({ params }) => getAdminOrderDetail({ data: { orderId: params.id } }),
  component: AdminOrderDetail,
});

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-gray-100 text-gray-600",
    confirmed: "bg-amber-100 text-amber-700",
    packed: "bg-blue-100 text-blue-700",
    shipped: "bg-indigo-100 text-indigo-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-600",
    refunded: "bg-pink-100 text-pink-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

const STATUS_FLOW = ["confirmed", "packed", "shipped", "delivered"];

function AdminOrderDetail() {
  const initial = Route.useLoaderData();
  const { id } = Route.useParams();
  const [order, setOrder] = useState(initial);
  const [updating, setUpdating] = useState(false);
  const [shipForm, setShipForm] = useState(false);
  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [cancelNote, setCancelNote] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const addr = order.shippingAddress as any;

  const reload = async () => {
    const fresh = await getAdminOrderDetail({ data: { orderId: id } });
    setOrder(fresh);
  };

  const handleNextStatus = async () => {
    const idx = STATUS_FLOW.indexOf(order.status);
    const next = STATUS_FLOW[idx + 1];
    if (!next) return;
    if (next === "shipped") { setShipForm(true); return; }
    setUpdating(true);
    try {
      await updateOrderStatus({ data: { orderId: id, status: next as any } });
      await reload();
      toast.success(`Order marked as ${next}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleShip = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await updateOrderStatus({ data: { orderId: id, status: "shipped", courier, trackingNumber, trackingUrl } });
      setShipForm(false);
      await reload();
      toast.success("Order marked as shipped");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkPaid = async () => {
    setUpdating(true);
    try {
      await markCodPaid({ data: { orderId: id } });
      await reload();
      toast.success("Marked as paid");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    setUpdating(true);
    try {
      await cancelOrderAdmin({ data: { orderId: id, note: cancelNote } });
      setShowCancelConfirm(false);
      await reload();
      toast.success("Order cancelled");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadInvoice = async () => {
    setDownloadingInvoice(true);
    try {
      const b64 = await getInvoice({ data: { orderNumber: order.orderNumber } });
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${order.invoiceNumber ?? order.orderNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to generate invoice");
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];
  const canAdvance = nextStatus && order.status !== "cancelled" && order.status !== "refunded";
  const canCancel = order.status !== "cancelled" && order.status !== "delivered" && order.status !== "refunded";
  const canMarkPaid = order.paymentMethod === "cod" && order.paymentStatus !== "paid";
  const canInvoice = ["confirmed", "packed", "shipped", "delivered"].includes(order.status);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/admin/orders" className="text-gray-400 hover:text-gray-700">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Order {order.orderNumber}</h1>
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
            {order.invoiceNumber && <> · Invoice: {order.invoiceNumber}</>}
          </p>
        </div>
        <div className="ml-auto flex gap-2 flex-wrap">
          {canInvoice && (
            <button
              onClick={handleDownloadInvoice}
              disabled={downloadingInvoice}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              <Download size={13} /> {downloadingInvoice ? "Generating…" : "Invoice PDF"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: items + address */}
        <div className="lg:col-span-2 space-y-4">
          {/* Items */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 font-medium text-sm">Items</div>
            <div className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-400">SKU: {item.sku} · HSN: {item.hsnCode ?? "—"} · GST: {item.gstRate}% · Qty: {item.qty}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="font-semibold">{inrFromPaise(item.price * item.qty)}</p>
                    <p className="text-xs text-gray-400">Tax: {inrFromPaise(item.taxAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="px-4 py-3 border-t border-gray-100 space-y-1 text-sm bg-gray-50">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{inrFromPaise(order.subtotal)}</span></div>
              {order.taxType === "CGST_SGST" ? (
                <>
                  <div className="flex justify-between text-gray-600"><span>CGST</span><span>{inrFromPaise(order.cgst)}</span></div>
                  <div className="flex justify-between text-gray-600"><span>SGST</span><span>{inrFromPaise(order.sgst)}</span></div>
                </>
              ) : (
                <div className="flex justify-between text-gray-600"><span>IGST</span><span>{inrFromPaise(order.igst)}</span></div>
              )}
              <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{order.shipping === 0 ? "Free" : inrFromPaise(order.shipping)}</span></div>
              {(order as any).offerDiscountPaise > 0 && (
                <div className="flex justify-between text-green-700"><span>Offer Discount</span><span>-{inrFromPaise((order as any).offerDiscountPaise)}</span></div>
              )}
              {order.couponDiscount > 0 && (
                <div className="flex justify-between text-green-700"><span>Coupon {order.couponCode ? `(${order.couponCode})` : ""}</span><span>-{inrFromPaise(order.couponDiscount)}</span></div>
              )}
              {order.coinsValue > 0 && (
                <div className="flex justify-between text-green-700"><span>Coins ({order.coinsUsed})</span><span>-{inrFromPaise(order.coinsValue)}</span></div>
              )}
              <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>{inrFromPaise(order.total)}</span></div>
            </div>
          </div>

          {/* Shipping address */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-sm">
            <div className="font-medium text-gray-800 mb-2">Shipping Address</div>
            <p className="font-semibold">{addr.name}</p>
            <p className="text-gray-500">{addr.phone}</p>
            <p className="text-gray-500">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
            <p className="text-gray-500">{addr.city}, {addr.state} – {addr.pincode}</p>
            {order.customerGstin && <p className="text-gray-500 mt-1">GSTIN: {order.customerGstin}</p>}
            <p className="text-xs text-gray-400 mt-1">Place of Supply: {order.placeOfSupplyState} · Tax type: {order.taxType}</p>
          </div>

          {/* Payment info */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-sm">
            <div className="font-medium text-gray-800 mb-2">Payment</div>
            <p><span className="text-gray-500">Method:</span> {order.paymentMethod.toUpperCase()}</p>
            <p><span className="text-gray-500">Status:</span> {order.paymentStatus}</p>
            {order.razorpayOrderId && <p className="text-xs text-gray-400 mt-1">Razorpay Order: {order.razorpayOrderId}</p>}
            {order.razorpayPaymentId && <p className="text-xs text-gray-400">Razorpay Payment: {order.razorpayPaymentId}</p>}
          </div>
        </div>

        {/* Right: status + actions + history */}
        <div className="space-y-4">
          {/* Status card */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">Status</span>
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>

            {/* Status flow steps */}
            <div className="space-y-1">
              {STATUS_FLOW.map((s, i) => {
                const idx = STATUS_FLOW.indexOf(order.status);
                const done = i < idx || order.status === s;
                const current = order.status === s;
                return (
                  <div key={s} className={`flex items-center gap-2 text-xs ${current ? "text-[var(--maroon)] font-semibold" : done ? "text-green-600" : "text-gray-300"}`}>
                    {done ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            {canAdvance && !shipForm && (
              <button
                onClick={handleNextStatus}
                disabled={updating}
                className="w-full py-2 text-sm font-semibold bg-[var(--maroon)] text-white rounded-md hover:opacity-90 disabled:opacity-50"
              >
                {updating ? "Updating…" : `Mark as ${nextStatus}`}
              </button>
            )}

            {shipForm && (
              <form onSubmit={handleShip} className="space-y-2">
                <input
                  placeholder="Courier name *"
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  required
                  className="w-full text-sm border rounded-md px-3 py-1.5 outline-none focus:border-[var(--maroon)]"
                />
                <input
                  placeholder="Tracking number *"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  required
                  className="w-full text-sm border rounded-md px-3 py-1.5 outline-none focus:border-[var(--maroon)]"
                />
                <input
                  placeholder="Tracking URL (optional)"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  className="w-full text-sm border rounded-md px-3 py-1.5 outline-none focus:border-[var(--maroon)]"
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={updating} className="flex-1 py-1.5 text-sm font-semibold bg-[var(--maroon)] text-white rounded-md hover:opacity-90 disabled:opacity-50">
                    {updating ? "…" : "Confirm Shipped"}
                  </button>
                  <button type="button" onClick={() => setShipForm(false)} className="flex-1 py-1.5 text-sm border rounded-md text-gray-600 hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {canMarkPaid && (
              <button
                onClick={handleMarkPaid}
                disabled={updating}
                className="w-full py-2 text-sm font-semibold border border-green-600 text-green-700 rounded-md hover:bg-green-50 disabled:opacity-50"
              >
                Mark COD as Paid
              </button>
            )}

            {canCancel && (
              <>
                {!showCancelConfirm ? (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full py-2 text-sm font-medium border border-red-200 text-red-600 rounded-md hover:bg-red-50"
                  >
                    Cancel Order
                  </button>
                ) : (
                  <div className="space-y-2 border border-red-200 rounded-md p-3">
                    <p className="text-xs font-medium text-red-700">Cancel this order?</p>
                    <textarea
                      placeholder="Reason (optional)"
                      value={cancelNote}
                      onChange={(e) => setCancelNote(e.target.value)}
                      rows={2}
                      className="w-full text-xs border rounded px-2 py-1 outline-none focus:border-red-400 resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleCancel} disabled={updating} className="flex-1 py-1 text-xs font-semibold bg-red-600 text-white rounded hover:opacity-90 disabled:opacity-50">
                        {updating ? "…" : "Confirm Cancel"}
                      </button>
                      <button onClick={() => setShowCancelConfirm(false)} className="flex-1 py-1 text-xs border rounded text-gray-600 hover:bg-gray-50">
                        Keep
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* History timeline */}
          {order.history.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm font-medium text-gray-800 mb-3">Order Timeline</div>
              <div className="space-y-3">
                {order.history.map((h) => (
                  <div key={h.id} className="flex gap-3">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-[var(--maroon)] flex-shrink-0" />
                    <div className="text-xs text-gray-600">
                      <p className="font-semibold capitalize">{h.status}</p>
                      {h.note && <p className="text-gray-400">{h.note}</p>}
                      {h.courier && <p className="text-gray-400">Courier: {h.courier} · {h.trackingNumber}</p>}
                      <p className="text-gray-300 mt-0.5">{new Date(h.createdAt).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
