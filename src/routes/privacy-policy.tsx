import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { getLegalStoreInfo } from "@/fns/checkout";
import { getNavCategories } from "@/fns/catalog";

export const Route = createFileRoute("/privacy-policy")({
  loader: async () => {
    const [info, navCategories] = await Promise.all([
      getLegalStoreInfo({ data: undefined }),
      getNavCategories({ data: {} }),
    ]);
    return { info, navCategories };
  },
  head: () => ({
    meta: [
      { title: "Privacy Policy — Murlit Enterprises" },
      { name: "description", content: "Privacy Policy for Murlit Enterprises — how we collect, use and protect your personal information." },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  const { info } = Route.useLoaderData();
  const name    = info.legalName ?? "Murlit Enterprises";
  const email   = info.businessEmail ?? info.supportEmail ?? "hello@murlit.com";
  const phone   = info.phone ?? "";
  const address = [info.addressLine1, info.addressLine2, info.city, info.pincode, info.state]
    .filter(Boolean).join(", ") || "Jaipur, Rajasthan, India";

  return (
    <div className="min-h-screen bg-ivory">
      <Header />
      <main className="container-x py-16 max-w-3xl mx-auto">
        <h1 className="font-display text-4xl text-burgundy mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: 17 October 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-ink leading-relaxed">

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">1. Who We Are</h2>
            <p>
              This Privacy Policy applies to <strong>{name}</strong>, a proprietorship/firm registered in India,
              with registered address at {address}.
              We operate the website murlit.com ("the Site") and sell pooja items, wedding essentials, décor,
              handmade/crochet products, customised gifts and bulk-order items.
            </p>
            <p>You can contact us at:</p>
            <ul className="list-disc pl-5 space-y-1">
              {email && <li>Email: <a href={`mailto:${email}`} className="text-maroon hover:underline">{email}</a></li>}
              {phone && <li>Phone / WhatsApp: {phone}</li>}
              <li>Address: {address}</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">2. Information We Collect</h2>
            <p>We collect the following categories of information:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Account data</strong> — When you create an account we collect your name, email address,
                and optionally your phone number and a profile photo.
              </li>
              <li>
                <strong>Google Sign-In</strong> — If you choose to sign in with Google we receive your name,
                email address, and Google profile photo from Google. We do not receive your Google password.
              </li>
              <li>
                <strong>Order &amp; address data</strong> — Shipping address, billing address, order history,
                order amounts and items purchased.
              </li>
              <li>
                <strong>Payment data</strong> — Payments are processed by <strong>Razorpay</strong> (a PCI-DSS
                compliant payment gateway). We do not store your card number, CVV or net-banking credentials.
                We receive only a payment confirmation token and order amount from Razorpay.
              </li>
              <li>
                <strong>Device &amp; usage data</strong> — Browser type, IP address, pages visited, referral URL.
                This is collected automatically via cookies and server logs.
              </li>
              <li>
                <strong>Communications</strong> — If you send us an enquiry, email or WhatsApp message we retain
                the content of that communication.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To process and fulfil your orders, including generating GST invoices.</li>
              <li>To send you order confirmation emails via <strong>Resend</strong> (our transactional email provider).</li>
              <li>To provide customer support and respond to your enquiries.</li>
              <li>To improve our website, catalogue, and services.</li>
              <li>To comply with applicable Indian laws including the IT Act 2000 and GST regulations.</li>
              <li>To prevent fraud and maintain the security of the Site.</li>
            </ul>
            <p className="mt-2">We do <strong>not</strong> sell, rent or share your personal data with third parties for their own marketing purposes.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">4. Third-Party Services</h2>
            <p>We use the following third-party services which may process your data:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Razorpay</strong> — payment processing (India). Their privacy policy is at razorpay.com/privacy.</li>
              <li><strong>Google OAuth</strong> — optional sign-in (Google LLC, USA). Subject to Google's Privacy Policy.</li>
              <li><strong>Cloudinary</strong> — product and category images are hosted on Cloudinary's CDN. Image URLs may contain your uploaded content.</li>
              <li><strong>Resend</strong> — transactional emails (order confirmations, password reset). Only your email address and order details are shared.</li>
              <li><strong>Neon (PostgreSQL)</strong> — database hosting on AWS infrastructure. Your data is stored in encrypted databases.</li>
              <li><strong>Vercel</strong> — website hosting. Vercel may collect standard server logs including IP addresses.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">5. Cookies</h2>
            <p>
              We use cookies to keep you logged in (session cookies managed by Better Auth with the prefix
              <code className="bg-muted px-1 rounded"> murlit_</code>) and to remember your cart. These cookies are
              essential for the website to function and do not track you across other websites.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">6. Data Retention</h2>
            <p>
              We retain your account and order data for as long as your account is active and for up to 7 years
              thereafter as required by Indian GST and accounting regulations. You may request earlier deletion
              subject to legal obligations.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate data.</li>
              <li>Request deletion of your account and associated personal data.</li>
              <li>Withdraw consent for marketing communications at any time.</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, please send an email to{" "}
              <a href={`mailto:${email}`} className="text-maroon hover:underline">{email}</a>{" "}
              with subject line "Data Request — [Your Name]".
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">8. Children's Privacy</h2>
            <p>
              Our services are not directed at children under 18. We do not knowingly collect personal data from
              children.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be communicated via email
              or a prominent notice on the Site. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-burgundy mb-3">10. Contact</h2>
            <p>
              For any privacy-related questions or complaints, contact us at{" "}
              <a href={`mailto:${email}`} className="text-maroon hover:underline">{email}</a>.
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
}
