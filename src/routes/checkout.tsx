import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { getCurrentUser } from "@/fns/auth";
import { listAddresses, createAddress } from "@/fns/addresses";
import { getCart } from "@/fns/cart";
import { getCheckoutSummary, placeOrder, createRazorpayOrder, verifyRazorpayPayment } from "@/fns/checkout";
import { inrFromPaise } from "@/lib/format";
import { INDIAN_STATES } from "@/lib/india-states";
import { useCart } from "@/lib/cart-context";
import { Loader2, Plus, CheckCircle2 } from "lucide-react";

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const Route = createFileRoute("/checkout")({
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) throw redirect({ to: "/login", search: { redirect: "/checkout" } as any });
  },
  loader: async () => {
    const [addresses, cart] = await Promise.all([listAddresses(), getCart()]);
    return { addresses, cart };
  },
  component: CheckoutPage,
});

const addressSchema = z.object({
  name: z.string().min(1, "Required"),
  phone: z.string().min(10, "Enter valid phone"),
  line1: z.string().min(1, "Required"),
  line2: z.string().optional(),
  city: z.string().min(1, "Required"),
  state: z.string().min(1, "Required"),
  stateCode: z.string().min(1),
  pincode: z.string().length(6, "6-digit pincode"),
  isDefault: z.boolean().optional(),
});
type AddressForm = z.infer<typeof addressSchema>;

declare global {
  interface Window {
    Razorpay: any;
  }
}

function CheckoutPage() {
  const { addresses: initAddresses, cart } = Route.useLoaderData();
  const navigate = useNavigate();
  const { invalidate: invalidateCart } = useCart();

  const [addresses, setAddresses] = useState(initAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState(
    initAddresses.find((a) => a.isDefault)?.id ?? initAddresses[0]?.id ?? null
  );
  const [showNewAddress, setShowNewAddress] = useState(initAddresses.length === 0);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "razorpay">("cod");
  const [isGstBusiness, setIsGstBusiness] = useState(false);
  const [gstin, setGstin] = useState("");
  const [gstinError, setGstinError] = useState("");
  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [placing, setPlacing] = useState(false);

  const addrForm = useForm<AddressForm>({ resolver: zodResolver(addressSchema) });
  const watchState = addrForm.watch("state");

  // Update stateCode when state changes
  useEffect(() => {
    const st = INDIAN_STATES.find((s) => s.name === watchState);
    if (st) addrForm.setValue("stateCode", st.code);
  }, [watchState]);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  // Recompute summary when address changes
  useEffect(() => {
    const addr = selectedAddress;
    if (!addr) { setSummary(null); return; }
    setSummaryLoading(true);
    getCheckoutSummary({ data: { shippingStateCode: addr.stateCode } })
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setSummaryLoading(false));
  }, [selectedAddressId]);

  const handleAddAddress = async (data: AddressForm) => {
    try {
      await createAddress({ data });
      const updated = await listAddresses();
      setAddresses(updated);
      const newest = updated[updated.length - 1];
      setSelectedAddressId(newest.id);
      setShowNewAddress(false);
      addrForm.reset();
      toast.success("Address saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save address");
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { toast.error("Select a delivery address"); return; }
    if (!summary?.lineItems?.length) { toast.error("Your cart is empty"); return; }
    if (isGstBusiness && !GSTIN_RE.test(gstin)) {
      setGstinError("Invalid GSTIN"); return;
    }

    setPlacing(true);
    let successOrderNumber: string | undefined;
    let successOrderId: string | undefined;
    try {
      const result = await placeOrder({
        data: {
          shippingAddress: {
            name: selectedAddress.name,
            phone: selectedAddress.phone,
            line1: selectedAddress.line1,
            line2: selectedAddress.line2 ?? undefined,
            city: selectedAddress.city,
            state: selectedAddress.state,
            stateCode: selectedAddress.stateCode,
            pincode: selectedAddress.pincode,
          },
          paymentMethod,
          customerGstin: isGstBusiness ? gstin : undefined,
        },
      });
      successOrderNumber = result.orderNumber;
      successOrderId = result.orderId;

      if (paymentMethod !== "cod") {
        // Razorpay flow
        const rzpData = await createRazorpayOrder({ data: { orderId: successOrderId! } });

        // Load Razorpay checkout.js if not loaded
        if (!window.Razorpay) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load Razorpay"));
            document.head.appendChild(script);
          });
        }

        await new Promise<void>((resolve, reject) => {
          const rzp = new window.Razorpay({
            key: rzpData.keyId,
            amount: rzpData.amount,
            currency: "INR",
            name: "Murlit Enterprises",
            description: "Order " + rzpData.orderNumber,
            order_id: rzpData.razorpayOrderId,
            handler: async (response: any) => {
              try {
                await verifyRazorpayPayment({
                  data: {
                    orderId: successOrderId!,
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                  },
                });
                invalidateCart();
                successOrderNumber = rzpData.orderNumber;
                resolve();
              } catch (e: any) {
                reject(e);
              }
            },
            modal: {
              ondismiss: () => {
                toast("Payment cancelled. You can retry from your order page.");
                successOrderNumber = rzpData.orderNumber;
                resolve();
              },
            },
            prefill: {
              name: selectedAddress.name,
              contact: selectedAddress.phone,
            },
            theme: { color: "#911e1f" },
          });
          rzp.open();
        });
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to place order");
      successOrderNumber = undefined;
    } finally {
      setPlacing(false);
    }
    // Navigate AFTER setPlacing(false) to avoid React re-render racing with router transition
    if (successOrderNumber) {
      invalidateCart();
      navigate({ to: "/order/$orderNumber", params: { orderNumber: successOrderNumber } });
    }
  };

  if (!cart.length) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container-x py-20 text-center">
          <p className="text-lg text-muted-foreground">Your cart is empty.</p>
          <a href="/shop" className="mt-4 inline-block text-maroon underline">Continue shopping</a>
        </main>
        <Footer />
      </div>
    );
  }

  const inp = "w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--maroon)] focus:ring-1 focus:ring-[var(--maroon)]";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container-x py-10">
        <h1 className="font-display text-display mb-8">Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Address + Payment */}
          <div className="lg:col-span-2 space-y-6">

            {/* Delivery Address */}
            <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
              <h2 className="font-semibold text-gray-800">Delivery Address</h2>
              {addresses.map((addr) => (
                <label key={addr.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${selectedAddressId === addr.id ? "border-[var(--maroon)] bg-[var(--maroon)]/5" : "border-gray-200 hover:border-gray-300"}`}>
                  <input
                    type="radio"
                    name="address"
                    value={addr.id}
                    checked={selectedAddressId === addr.id}
                    onChange={() => { setSelectedAddressId(addr.id); setShowNewAddress(false); }}
                    className="mt-0.5"
                  />
                  <div className="text-sm">
                    <p className="font-semibold">{addr.name} · {addr.phone}</p>
                    <p className="text-gray-600">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                    <p className="text-gray-600">{addr.city}, {addr.state} – {addr.pincode}</p>
                  </div>
                  {addr.isDefault && <span className="ml-auto text-[10px] bg-[var(--maroon)] text-white px-2 py-0.5 rounded-full font-bold">DEFAULT</span>}
                </label>
              ))}
              <button
                onClick={() => setShowNewAddress((v) => !v)}
                className="flex items-center gap-2 text-sm text-[var(--maroon)] font-semibold hover:opacity-80"
              >
                <Plus className="h-4 w-4" /> Add new address
              </button>

              {showNewAddress && (
                <form onSubmit={addrForm.handleSubmit(handleAddAddress)} className="border border-dashed border-gray-300 rounded-lg p-4 space-y-3 mt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                      <input {...addrForm.register("name")} className={inp} placeholder="Name" />
                      {addrForm.formState.errors.name && <p className="text-xs text-red-600">{addrForm.formState.errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Phone *</label>
                      <input {...addrForm.register("phone")} className={inp} placeholder="10-digit mobile" />
                      {addrForm.formState.errors.phone && <p className="text-xs text-red-600">{addrForm.formState.errors.phone.message}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Address Line 1 *</label>
                    <input {...addrForm.register("line1")} className={inp} placeholder="House/Flat, Street" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Address Line 2</label>
                    <input {...addrForm.register("line2")} className={inp} placeholder="Area, Landmark (optional)" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">City *</label>
                      <input {...addrForm.register("city")} className={inp} placeholder="City" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Pincode *</label>
                      <input {...addrForm.register("pincode")} className={inp} placeholder="6-digit" maxLength={6} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">State *</label>
                    <select
                      {...addrForm.register("state")}
                      className={inp}
                    >
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s.code} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                    <input type="hidden" {...addrForm.register("stateCode")} />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input type="checkbox" {...addrForm.register("isDefault")} className="rounded" />
                    Set as default address
                  </label>
                  <button type="submit" className="rounded bg-[var(--maroon)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                    Save Address
                  </button>
                </form>
              )}
            </section>

            {/* Business GST */}
            <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
              <h2 className="font-semibold text-gray-800">Business Purchase (optional)</h2>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={isGstBusiness} onChange={(e) => { setIsGstBusiness(e.target.checked); setGstin(""); setGstinError(""); }} className="rounded" />
                I'm purchasing for my business (need GST invoice with GSTIN)
              </label>
              {isGstBusiness && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">GSTIN *</label>
                  <input
                    value={gstin}
                    onChange={(e) => { setGstin(e.target.value.toUpperCase()); setGstinError(""); }}
                    maxLength={15}
                    className={inp}
                    placeholder="22AAAAA0000A1Z5"
                  />
                  {gstinError && <p className="text-xs text-red-600 mt-0.5">{gstinError}</p>}
                </div>
              )}
            </section>

            {/* Payment */}
            <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
              <h2 className="font-semibold text-gray-800">Payment Method</h2>
              {summary?.codEnabled !== false && (
                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${paymentMethod === "cod" ? "border-[var(--maroon)] bg-[var(--maroon)]/5" : "border-gray-200"}`}>
                  <input type="radio" name="payment" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} />
                  <div>
                    <p className="text-sm font-semibold">Cash on Delivery</p>
                    <p className="text-xs text-gray-500">Pay when you receive the order</p>
                  </div>
                </label>
              )}
              {process.env.VITE_RAZORPAY_KEY_ID && (
                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${paymentMethod === "razorpay" ? "border-[var(--maroon)] bg-[var(--maroon)]/5" : "border-gray-200"}`}>
                  <input type="radio" name="payment" value="razorpay" checked={paymentMethod === "razorpay"} onChange={() => setPaymentMethod("razorpay")} />
                  <div>
                    <p className="text-sm font-semibold">Pay Online</p>
                    <p className="text-xs text-gray-500">Cards, UPI, Net Banking via Razorpay</p>
                  </div>
                </label>
              )}
            </section>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-soft sticky top-4 space-y-4">
              <h2 className="font-semibold text-gray-900">Order Summary</h2>

              {/* Cart items */}
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-700 truncate flex-1 mr-2">{item.name} × {item.qty}</span>
                    <span className="font-medium flex-shrink-0">{inrFromPaise(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 space-y-2 text-sm">
                {summaryLoading ? (
                  <p className="text-xs text-gray-400 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Computing taxes…</p>
                ) : summary ? (
                  <>
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>{inrFromPaise(summary.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Taxable amount</span>
                      <span>{inrFromPaise(summary.taxableAmount)}</span>
                    </div>
                    {summary.taxType === "CGST_SGST" ? (
                      <>
                        <div className="flex justify-between text-gray-600">
                          <span>CGST</span>
                          <span>{inrFromPaise(summary.cgst)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>SGST</span>
                          <span>{inrFromPaise(summary.sgst)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-gray-600">
                        <span>IGST</span>
                        <span>{inrFromPaise(summary.igst)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span>{summary.shipping === 0 ? <span className="text-green-600 font-medium">Free</span> : inrFromPaise(summary.shipping)}</span>
                    </div>
                    {summary.shipping === 0 && summary.freeShippingAbove > 0 && (
                      <p className="text-xs text-green-600">🎉 Free shipping on orders above {inrFromPaise(summary.freeShippingAbove)}</p>
                    )}
                    <div className="border-t pt-2 flex justify-between font-bold text-base">
                      <span>Total</span>
                      <span>{inrFromPaise(summary.total)}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-400">Select an address to see GST breakdown</p>
                )}
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placing || !selectedAddress || !summary || summaryLoading}
                className="w-full flex items-center justify-center gap-2 rounded-sm bg-[var(--maroon)] py-3.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {placing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Placing order…</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4" /> {paymentMethod === "cod" ? "Place Order (COD)" : "Pay Now"}</>
                )}
              </button>
              <p className="text-[10px] text-gray-400 text-center">By placing the order you agree to our terms and conditions</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
