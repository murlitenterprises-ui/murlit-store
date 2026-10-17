import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { getLegalStoreInfo } from "@/fns/checkout";
import { getNavCategories } from "@/fns/catalog";
import { getPublicStoreSettings } from "@/fns/checkout";

export const Route = createFileRoute("/shipping-policy")({
  loader: async () => {
    const [info, settings, navCategories] = await Promise.all([
      getLegalStoreInfo({ data: undefined }),
      getPublicStoreSettings({ data: undefined }),
      getNavCategories({ data: {} }),
    ]);
    return { info, settings, navCategories };
  },
  head: () => ({
    meta: [
      { title: "Shipping Policy — Murlit Enterprises" },
      { name: "description", content: "Shipping and delivery policy for orders placed on Murlit Enterprises." },
    ],
  }),
  component: ShippingPolicyPage,
});

function fmt(paise: number): string {
  return "₹" + (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0 });
}

function ShippingPolicyPage() {
  const { info, settings } = Route.useLoaderData();
  const name  = info.legalName ?? "Murlit Enterprises";
  const email = info.businessEmail ?? info.supportEmail ?? "hello@murlit.in";
  const phone = info.whatsappNumber ?? info.phone ?? "";
  const shippingFee = settings?.shippingFee ?? 99_00;
  const freeAbove   = settings?.freeShippingAbove ?? 500_00;

  return (
    <div className="min-h-screen bg-ivory">
      <Header />
      <main className="container-x py-16 max-w-3xl mx-auto">
        <h1 className="font-display text-4xl text-burgundy mb-2">Shipping Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: 17 October 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-ink leading-relaxed">

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">1. Where We Ship</h2>
            <p>
              <strong>{name}</strong> currently ships to all addresses within <strong>India</strong>.
              We are based in Jaipur, Rajasthan and dispatch orders from there.
            </p>
            <p className="mt-2">
              We do not currently ship internationally. If you are outside India and wish to place an
              order, please contact us at{" "}
              <a href={`mailto:${email}`} className="text-maroon hover:underline">{email}</a>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">2. Shipping Charges</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Standard shipping: <strong>{fmt(shippingFee)}</strong> per order.
              </li>
              <li>
                <strong>Free shipping</strong> on orders above <strong>{fmt(freeAbove)}</strong>.
              </li>
              <li>Shipping charges are shown at checkout before you confirm your order.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">3. Estimated Delivery Times</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Ready-to-ship products:</strong> 3–7 business days across India.</li>
              <li><strong>Customised / made-to-order products:</strong> 7–15 business days depending on complexity, plus transit time.</li>
              <li><strong>Bulk orders:</strong> Timeline communicated separately at the time of order confirmation.</li>
            </ul>
            <p className="mt-2 text-muted-foreground text-xs">
              Delivery estimates are business days excluding Sundays and public holidays.
              Actual delivery may vary due to courier delays, remote locations, or festive seasons.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">4. Order Processing</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Orders placed before 2:00 PM IST on a business day are typically processed the same day.</li>
              <li>Orders placed after 2:00 PM or on weekends are processed the next business day.</li>
              <li>You will receive a shipment confirmation email with a tracking number once your order is dispatched.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">5. Tracking Your Order</h2>
            <p>
              Once dispatched, you will receive an email or SMS with a courier tracking link.
              You can also track your order from the <a href="/account" className="text-maroon hover:underline">My Account</a> section of our website.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">6. Cash on Delivery (COD)</h2>
            <p>
              COD is available on eligible orders. A small COD convenience fee may apply and will be
              shown at checkout. COD availability depends on your pin code and order value.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">7. Failed Deliveries</h2>
            <p>
              If a delivery attempt fails because no one was available to receive the package, the
              courier will attempt re-delivery. After 2–3 failed attempts, the package may be returned
              to us. In such cases, re-shipping charges will apply for a second delivery attempt.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">8. Damaged or Lost Shipments</h2>
            <p>
              If your package is damaged in transit or lost, please contact us within 48 hours of the
              expected delivery date with your order number and photographs of any damage.
              We will raise a claim with the courier and arrange a replacement or refund.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">9. Contact</h2>
            <p>
              For shipping queries, please email{" "}
              <a href={`mailto:${email}`} className="text-maroon hover:underline">{email}</a>
              {phone && (
                <> or WhatsApp us at <strong>{phone}</strong></>
              )}.
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
}
