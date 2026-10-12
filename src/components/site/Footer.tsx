import { Instagram, Facebook, Youtube, Linkedin, Phone, Mail, MessageCircle } from "lucide-react";

const cols = [
  { t: "Shop", l: ["All Products", "New Arrivals", "Best Sellers", "Shop by Occasion", "Pooja & Rituals", "Wedding Essentials", "Handcrafted Collections"] },
  { t: "Services", l: ["Customized Orders", "B2B / Wholesale", "Gallery / Past Work", "Testimonials", "Blog"] },
  { t: "Help", l: ["Track Order", "FAQs", "Shipping & Delivery", "Returns & Refunds", "Contact Us"] },
  { t: "Company", l: ["About Us", "Privacy Policy", "Terms & Conditions"] },
];

export function Footer() {
  return (
    <footer id="contact" className="border-t bg-ivory">
      <div className="h-1 bg-ember" />
      <div className="container-x grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <span className="font-display text-3xl font-semibold text-maroon">Murlit</span>
          <span className="block text-[9px] font-bold uppercase tracking-[0.42em] text-leaf">Enterprises</span>
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
            <ul className="space-y-2.5 text-sm text-muted-foreground">{c.l.map((l) => <li key={l}><a href="#" className="hover:text-maroon">{l}</a></li>)}</ul>
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
  );
}
