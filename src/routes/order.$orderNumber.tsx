import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { CheckCircle2, Package, Truck, Clock, ArrowRight, MessageCircle } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { getOrder } from "@/fns/checkout";
import { getCurrentUser } from "@/fns/auth";
import { inrFromPaise } from "@/lib/format";

const WA_LINK = "https://wa.me/919999999999";

export const Route = createFileRoute("/order/$orderNumber")({
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) throw redirect({ to: "/login" });
  },
  loader: async ({ params }) => getOrder({ data: { orderNumber: params.orderNumber } }),
  component: OrderPage,
});

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: "Awaiting payment",
    confirmed: "Confirmed",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    refunded: "Refunded",
  };
  return map[status] ?? status;
}

function statusColor(status: string) {
  if (status === "cancelled" || status === "refunded") return "text-red-600 bg-red-50";
  if (status === "delivered") return "text-green-700 bg-green-50";
  if (status === "shipped") return "text-blue-700 bg-blue-50";
  return "text-amber-700 bg-amber-50";
}

function OrderPage() {
  const order = Route.useLoaderData();
  const addr = order.shippingAddress as any;
  const isPaid = order.paymentStatus === "paid" || order.paymentMethod === "cod";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container-x py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-50 mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="font-display text-display">Order Placed!</h1>
          <p className="text-muted-foreground mt-2">
            Thank you for your order. We'll {order.paymentMethod === "cod" ? "contact you before delivery" : "update you once it ships"}.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-1.5">
            <span className="text-sm text-gray-500">Order #</span>
            <span className="font-mono font-bold text-sm text-gray-900">{order.orderNumber}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg border border-gray-100 shadow-soft p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Items Ordered</h2>
              <div className="divide-y">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between py-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-400">SKU: {item.sku} · Qty: {item.qty}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="font-semibold">{inrFromPaise(item.price * item.qty)}</p>
                      {item.gstRate > 0 && (
                        <p className="text-xs text-gray-400">GST: {inrFromPaise(item.taxAmount ?? 0)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {/* Totals */}
              <div className="border-t mt-2 pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span><span>{inrFromPaise(order.subtotal)}</span>
                </div>
                {order.taxType === "CGST_SGST" ? (
                  <>
                    <div className="flex justify-between text-gray-600">
                      <span>CGST</span><span>{inrFromPaise(order.cgst)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>SGST</span><span>{inrFromPaise(order.sgst)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-gray-600">
                    <span>IGST</span><span>{inrFromPaise(order.igst)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{order.shipping === 0 ? <span className="text-green-600">Free</span> : inrFromPaise(order.shipping)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                  <span>Total</span><span>{inrFromPaise(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Shipping address */}
            <div className="bg-white rounded-lg border border-gray-100 shadow-soft p-5">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Truck className="h-4 w-4 text-gray-500" /> Delivery Address
              </h2>
              {addr && (
                <div className="text-sm text-gray-700 space-y-0.5">
                  <p className="font-semibold">{addr.name}</p>
                  <p>{addr.phone}</p>
                  <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                  <p>{addr.city}, {addr.state} – {addr.pincode}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Status card */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-lg border border-gray-100 shadow-soft p-5 space-y-4">
              <h2 className="font-semibold text-gray-900">Order Status</h2>

              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor(order.status)}`}>
                    {statusLabel(order.status)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Payment</p>
                  <p className="text-sm font-semibold capitalize">
                    {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online"}
                    {" · "}
                    <span className={order.paymentStatus === "paid" ? "text-green-600" : "text-amber-600"}>
                      {order.paymentStatus === "paid" ? "Paid" : "Pending"}
                    </span>
                  </p>
                </div>
              </div>

              {order.paymentMethod === "cod" && (
                <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 text-xs text-amber-800">
                  Pay ₹{(order.total / 100).toFixed(2)} in cash when your order is delivered.
                </div>
              )}

              {order.paymentMethod === "razorpay" && order.paymentStatus !== "paid" && (
                <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-xs text-red-800">
                  Payment is pending. If you were charged but the order shows pending, please contact us.
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                to="/shop"
                className="flex w-full items-center justify-center gap-2 rounded-sm bg-royal py-3 text-sm font-bold text-on-dark hover:brightness-110 transition"
              >
                Continue Shopping <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={`${WA_LINK}?text=${encodeURIComponent(`Hi, I need help with order ${order.orderNumber}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-sm border border-leaf py-3 text-sm font-semibold text-leaf hover:bg-leaf hover:text-white transition"
              >
                <MessageCircle className="h-4 w-4" /> Contact on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
