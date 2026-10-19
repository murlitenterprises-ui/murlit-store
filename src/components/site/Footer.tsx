import { SeoLinks } from "./SeoLinks";
import { Link } from "@tanstack/react-router";
import logoFull from "@/assets/logo-full.webp";
import { Instagram, Facebook, Youtube, Linkedin, Phone, Mail, MessageCircle } from "lucide-react";

type NavLink = { label: string; href: string };
type NavCol  = { t: string; links: NavLink[] };

const cols: NavCol[] = [
  { t: "Shop", links: [
    { label: "All Products",          href: "/shop" },
    { label: "Pooja & Rituals",       href: "/category/pooja-rituals" },
    { label: "Wedding Essentials",    href: "/category/wedding-essentials" },
    { label: "Handcrafted Collections", href: "/category/handcrafted" },
    { label: "Décor",                 href: "/category/decor" },
  ]},
  { t: "Services", links: [
    { label: "Customised Orders",  href: "/#contact" },
    { label: "B2B / Wholesale",    href: "/#contact" },
  ]},
  { t: "Help", links: [
    { label: "Track Order",         href: "/account" },
    { label: "Shipping Policy",     href: "/shipping-policy" },
    { label: "Returns & Refunds",   href: "/refund-policy" },
    { label: "Contact Us",          href: "/#contact" },
  ]},
  { t: "Company", links: [
    { label: "Privacy Policy",      href: "/privacy-policy" },
    { label: "Terms & Conditions",  href: "/terms" },
    { label: "Refund Policy",       href: "/refund-policy" },
    { label: "Shipping Policy",     href: "/shipping-policy" },
  ]},
];

export function Footer() {
  return (
    <>
    <footer id="contact" className="border-t bg-ivory">
      <div className="h-1 bg-ember" />
      <div className="container-x grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <img src={logoFull} alt="Murlit Enterprises — Tradition, Quality & Spirituality" width={1174} height={940} loading="lazy" decoding="async" className="h-[120px] w-auto object-contain" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Pooja samagri, wedding essentials, handcrafted treasures and personalised gifts — curated for every meaningful occasion.
          </p>
          <ul className="mt-5 space-y-2 text-sm">
            <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-leaf" /> WhatsApp: +91 XXXXX XXXXX</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-maroon" /> +91 XXXXX XXXXX</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-maroon" /> hello@murlit.example</li>
          </ul>
          <div className="mt-5 flex gap-2">
            {[Instagram, Facebook, Youtube, Linkedin].map((I, i) => (
              <a key={i} href="#" aria-label="Social link placeholder" className="grid h-9 w-9 place-items-center rounded-full border bg-background hover:border-maroon hover:text-maroon"><I className="h-4 w-4" /></a>
            ))}
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.t}>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-burgundy">{c.t}</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {c.links.map((l) => (
                <li key={l.label}>
                  {l.href.startsWith("/") && !l.href.includes("#") ? (
                    <Link to={l.href} className="hover:text-maroon">{l.label}</Link>
                  ) : (
                    <a href={l.href} className="hover:text-maroon">{l.label}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <div className="container-x flex flex-col items-center justify-between gap-4 py-5 text-xs text-muted-foreground md:flex-row">
          <span>© 2026 Murlit Enterprises. All rights reserved.</span>
          <div className="flex items-center gap-2">
            <span className="mr-1">Illustrative payment icons:</span>
            {["UPI", "VISA", "MC", "RuPay", "PayPal"].map((p) => <span key={p} className="rounded-sm border bg-background px-2 py-1 font-bold text-ink">{p}</span>)}
          </div>
          <div className="flex gap-3">
            <select aria-label="Currency" className="bg-transparent font-semibold"><option>INR ₹</option><option>USD $</option><option>GBP £</option><option>EUR €</option><option>AED</option></select>
            <select aria-label="Language" className="bg-transparent font-semibold"><option>English</option><option>हिन्दी</option></select>
          </div>
        </div>
      </div>
    </footer>
    <SeoLinks />
    </>
  );
}
