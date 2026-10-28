import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { getLegalStoreInfo } from "@/fns/checkout";
import { getNavCategories } from "@/fns/catalog";

export const Route = createFileRoute("/terms")({
  loader: async () => {
    const [info, navCategories] = await Promise.all([
      getLegalStoreInfo({ data: undefined }),
      getNavCategories({ data: {} }),
    ]);
    return { info, navCategories };
  },
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Murlit Enterprises" },
      { name: "description", content: "Terms and Conditions for using the Murlit Enterprises website and placing orders." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const { info } = Route.useLoaderData();
  const name    = info.legalName ?? "Murlit Enterprises";
  const email   = info.businessEmail ?? info.supportEmail ?? "hello@murlit.com";
  const address = [info.addressLine1, info.addressLine2, info.city, info.pincode, info.state]
    .filter(Boolean).join(", ") || "Jaipur, Rajasthan, India";
  const gstin   = info.gstin ?? "";

  return (
    <div className="min-h-screen bg-ivory">
      <Header />
      <main className="container-x py-16 max-w-3xl mx-auto">
        <h1 className="font-display text-4xl text-burgundy mb-2">Terms &amp; Conditions</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: 17 October 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-ink leading-relaxed">

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">1. About Us</h2>
            <p>
              These Terms &amp; Conditions govern your use of the website murlit.com ("the Site")
              operated by <strong>{name}</strong>, a business registered in India with address at {address}.
              {gstin && <> GST Identification Number: <strong>{gstin}</strong>.</>}
            </p>
            <p>
              By placing an order or using the Site, you agree to these Terms. If you do not agree,
              please do not use the Site.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">2. Products &amp; Pricing</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>All prices are displayed in Indian Rupees (INR) and are inclusive of applicable GST unless stated otherwise.</li>
              <li>We reserve the right to update prices at any time. The price at the time of checkout is the final price for your order.</li>
              <li>Product images are for illustrative purposes. Handcrafted and customised items may vary slightly from images.</li>
              <li>We reserve the right to limit quantities, cancel orders, or refuse service at our discretion.</li>
              <li>Stock availability is updated regularly but is not guaranteed in real time.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">3. Orders &amp; Payment</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>An order is confirmed only after you receive an order confirmation email from us.</li>
              <li>We accept payments via Razorpay (credit/debit card, UPI, net banking, wallets) and Cash on Delivery (COD) where available.</li>
              <li>For COD orders, payment is collected at the time of delivery.</li>
              <li>We do not store your card or banking credentials. All online payments are handled by Razorpay, a PCI-DSS compliant payment gateway.</li>
              <li>We reserve the right to cancel any order in the event of pricing errors, stock unavailability, or suspected fraud.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">4. Shipping</h2>
            <p>
              Shipping terms, estimated delivery times and shipping charges are detailed on our{" "}
              <a href="/shipping-policy" className="text-maroon hover:underline">Shipping Policy</a> page.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">5. Returns &amp; Refunds</h2>
            <p>
              Our returns and refund process is described in full on our{" "}
              <a href="/refund-policy" className="text-maroon hover:underline">Refund Policy</a> page.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">6. Customised &amp; Bulk Orders</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Customised orders are made-to-order and are generally non-refundable once production has begun.</li>
              <li>For bulk/wholesale orders, separate terms may apply and will be communicated via email.</li>
              <li>Delivery timelines for customised orders are estimates and may vary based on complexity and materials.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">7. Intellectual Property</h2>
            <p>
              All content on the Site including text, images, logos, product designs and graphics is the
              property of {name} or its licensors and is protected under applicable Indian laws.
              You may not reproduce, redistribute, or use any content for commercial purposes without
              our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, {name} shall not be liable for any indirect,
              incidental or consequential damages arising from your use of the Site or our products.
              Our total liability in any event shall not exceed the amount paid by you for the specific
              order giving rise to the claim.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">9. Governing Law</h2>
            <p>
              These Terms are governed by the laws of India. Any disputes shall be subject to the
              exclusive jurisdiction of the courts in Jaipur, Rajasthan, India.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">10. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the Site after any changes
              constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">11. Contact</h2>
            <p>
              For any questions about these Terms, please email us at{" "}
              <a href={`mailto:${email}`} className="text-maroon hover:underline">{email}</a>.
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
}
