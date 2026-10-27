import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { getReferralSettings } from "@/fns/referral";
import { getPublicStoreSettings } from "@/fns/checkout";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export const Route = createFileRoute("/faqs")({
  loader: async () => {
    const [referral, store] = await Promise.all([
      getReferralSettings(),
      getPublicStoreSettings({ data: undefined }),
    ]);
    return { referral, store };
  },
  head: () => ({
    meta: [
      { title: "FAQs — Murlit Enterprises" },
      { name: "description", content: "Frequently asked questions about ordering, shipping, returns, coins and more at Murlit Enterprises." },
    ],
  }),
  component: FaqsPage,
});

function FaqsPage() {
  const { referral, store } = Route.useLoaderData();
  const coinValue = referral.coinValuePaise / 100;
  const maxPct = referral.maxCoinsPctPerOrder;
  const expiryDays = referral.coinExpiryDays;
  const welcomeDiscount = referral.referralWelcomeDiscount / 100;
  const rewardCoins = referral.referralCoinReward;
  const shippingFee = store ? (store.shippingFee / 100) : 99;
  const freeAbove = store ? (store.freeShippingAbove / 100) : 500;
  const codEnabled = store?.codEnabled ?? true;

  const faqs: { q: string; a: string }[] = [
    {
      q: "What payment methods do you accept?",
      a: codEnabled
        ? "We currently accept Cash on Delivery (COD) across India. Online card / UPI payments via Razorpay will be available soon."
        : "We accept online payments via Razorpay (cards, UPI, net banking). Cash on Delivery is not currently available.",
    },
    {
      q: "What are the shipping charges?",
      a: `Standard shipping is ₹${shippingFee}. Orders above ₹${freeAbove} qualify for free shipping within India. We ship only within India at this time.`,
    },
    {
      q: "How long does delivery take?",
      a: "Delivery timelines depend on your location and the courier partner. Contact us on WhatsApp for details.",
    },
    {
      q: "Can I return or exchange a product?",
      a: "You may request a return or replacement within 7 days of delivery if the product is damaged, defective, wrong, or significantly different from the description. Items must be unused and in original packaging. See our Refund Policy for full details.",
    },
    {
      q: "Do you provide GST invoices?",
      a: "Yes. A GST invoice is automatically generated for every order and can be downloaded from your account under Order details.",
    },
    {
      q: "How do coupons and offers work?",
      a: "Coupons can be applied at checkout. The maximum total discount (coupon + active offer) is capped at 20% of your order value.",
    },
    {
      q: "What are Murlit Coins?",
      a: `Murlit Coins are loyalty points. 1 coin = ₹${coinValue}. You can use coins to pay up to ${maxPct}% of any order. Coins expire ${expiryDays} days after being earned.`,
    },
    {
      q: "How do I earn Murlit Coins?",
      a: `Refer a friend using your personal referral link. Your friend gets ₹${welcomeDiscount} off their first order. Once their first order is delivered, you earn ${rewardCoins} coins (worth ₹${rewardCoins * coinValue}).`,
    },
    {
      q: "How do I place a custom or bulk order?",
      a: "For customised products or bulk / wholesale enquiries, please fill in the enquiry form on our homepage or contact us on WhatsApp. Our team will get back to you with a quote.",
    },
    {
      q: "Do you ship internationally?",
      a: "We currently ship only within India. For international enquiries please contact us on WhatsApp.",
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-ivory">
      <Header />
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="container-x py-16 max-w-2xl mx-auto">
        <h1 className="font-display text-4xl text-burgundy mb-2">FAQs</h1>
        <p className="text-sm text-muted-foreground mb-10">Frequently asked questions.</p>
        <div className="divide-y rounded-lg border bg-background shadow-sm">
          {faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold hover:bg-sage transition"
      >
        <span>{q}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-gold transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{a}</div>
      )}
    </div>
  );
}
