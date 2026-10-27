import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/policies")({
  head: () => ({
    meta: [
      { title: "Policies — Murlit Enterprises" },
      { name: "description", content: "Privacy Policy, Terms & Conditions, Refund Policy and Shipping Policy for Murlit Enterprises." },
    ],
  }),
  component: PoliciesPage,
});

const policyCards = [
  {
    title: "Privacy Policy",
    desc: "How we collect, use and protect your personal information.",
    href: "/privacy-policy",
    icon: "🔒",
  },
  {
    title: "Terms & Conditions",
    desc: "The terms that govern your use of murlit.com and our services.",
    href: "/terms",
    icon: "📄",
  },
  {
    title: "Refund Policy",
    desc: "Our return and refund process, eligibility and timelines.",
    href: "/refund-policy",
    icon: "↩️",
  },
  {
    title: "Shipping Policy",
    desc: "Shipping zones, delivery timelines and charges.",
    href: "/shipping-policy",
    icon: "🚚",
  },
];

function PoliciesPage() {
  return (
    <div className="min-h-screen bg-ivory">
      <Header />
      <main className="container-x py-16 max-w-3xl mx-auto">
        <h1 className="font-display text-4xl text-burgundy mb-2">Policies</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Everything you need to know about how we operate and how we protect you.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {policyCards.map((p) => (
            <Link key={p.href} to={p.href}
              className="flex gap-4 items-start rounded-lg border bg-background p-5 shadow-sm hover:border-maroon hover:shadow-lift transition group">
              <span className="text-3xl shrink-0">{p.icon}</span>
              <div>
                <h2 className="font-semibold text-base group-hover:text-maroon transition">{p.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
