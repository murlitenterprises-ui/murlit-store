import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { getLegalStoreInfo } from "@/fns/checkout";
import { getNavCategories } from "@/fns/catalog";

export const Route = createFileRoute("/refund-policy")({
  loader: async () => {
    const [info, navCategories] = await Promise.all([
      getLegalStoreInfo({ data: undefined }),
      getNavCategories({ data: {} }),
    ]);
    return { info, navCategories };
  },
  head: () => ({
    meta: [
      { title: "Refund & Return Policy — Murlit Enterprises" },
      { name: "description", content: "Refund and return policy for orders placed on Murlit Enterprises." },
    ],
  }),
  component: RefundPolicyPage,
});

function RefundPolicyPage() {
  const { info } = Route.useLoaderData();
  const name  = info.legalName ?? "Murlit Enterprises";
  const email = info.businessEmail ?? info.supportEmail ?? "hello@murlit.in";
  const phone = info.whatsappNumber ?? info.phone ?? "";

  return (
    <div className="min-h-screen bg-ivory">
      <Header />
      <main className="container-x py-16 max-w-3xl mx-auto">
        <h1 className="font-display text-4xl text-burgundy mb-2">Refund &amp; Return Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: 17 October 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-ink leading-relaxed">

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">1. Overview</h2>
            <p>
              At <strong>{name}</strong>, we take pride in the quality of our products. If for any reason
              you are not satisfied with your order, please read this policy carefully and contact us
              within the applicable time window.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">2. Eligible Returns</h2>
            <p>You may request a return or replacement within <strong>7 days</strong> of delivery if:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>The product received is damaged or defective.</li>
              <li>The wrong product was delivered.</li>
              <li>The product is significantly different from the description on the Site.</li>
            </ul>
            <p className="mt-2">
              To be eligible, items must be unused, in original packaging, and accompanied by the
              original invoice.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">3. Non-Returnable Items</h2>
            <p>The following items <strong>cannot</strong> be returned or refunded:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Customised or personalised items made to your specifications.</li>
              <li>Perishable goods (e.g. fresh flowers, prasad).</li>
              <li>Items that have been used, washed, or altered.</li>
              <li>Items returned without prior communication and approval from us.</li>
              <li>Digital products or downloadable content.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">4. How to Initiate a Return</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Email us at{" "}
                <a href={`mailto:${email}`} className="text-maroon hover:underline">{email}</a>
                {phone && (
                  <> or WhatsApp us at <strong>{phone}</strong></>
                )}{" "}
                within 7 days of receiving your order.
              </li>
              <li>Include your order number, a description of the issue, and clear photos of the product and packaging.</li>
              <li>Our team will review your request within 2 business days and provide return instructions if approved.</li>
              <li>Ship the item back using a trackable courier. Return shipping costs are borne by us for defective/wrong items; for change-of-mind returns, the customer bears the cost.</li>
            </ol>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">5. Refund Process</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Once the returned item is received and inspected, we will notify you of the approval or rejection of your refund.</li>
              <li>Approved refunds are processed within <strong>5–7 business days</strong> to your original payment method (UPI, bank account, or card).</li>
              <li>For COD orders, refunds are processed via bank transfer. Please share your bank account details when requesting the refund.</li>
              <li>Shipping charges are non-refundable unless the return is due to our error.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">6. Cancellations</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You can cancel a COD order before it is dispatched by contacting us promptly.</li>
              <li>Prepaid orders may be cancelled before dispatch for a full refund to your original payment method.</li>
              <li>Once an order is dispatched, cancellations are not possible — you may initiate a return after delivery.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">7. Damaged in Transit</h2>
            <p>
              If your order arrives damaged due to transit, please take photos immediately upon opening
              and email us within 48 hours of delivery. We will arrange a replacement or refund at no
              extra cost.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">8. Contact Us</h2>
            <p>
              For any refund or return queries, please reach us at{" "}
              <a href={`mailto:${email}`} className="text-maroon hover:underline">{email}</a>.
              {phone && (
                <> You may also WhatsApp us at <strong>{phone}</strong>.</>
              )}
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
}
