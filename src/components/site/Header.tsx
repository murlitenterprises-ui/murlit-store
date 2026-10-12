import { Link } from "@tanstack/react-router";
import { Search, User, Heart, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { img } from "@/lib/catalog";
import logoCompact from "@/assets/logo-compact.png";

const announcements = ["Custom Orders Available", "Bulk & Wholesale", "Worldwide Shipping", "Diwali Special Collection Live", "WhatsApp Business Enquiries"];

const shopMenu = [
  { title: "Pooja & Rituals", img: img.poojakit, links: ["Pooja Kits", "Pooja Samagri", "Pooja Chowki & Aasan", "Pooja Thali & Aarti Set", "Kalash & Panchpatra", "Murti & Idols", "Pooja Mandir & Singhasan", "Diya, Batti, Dhoop & Agarbatti", "Yantra & Rudraksha"],
    sub: "Janam · Vivah · Hawan · Sundarkand · Diwali · Satyanarayan · Griha Pravesh · Navgrah · Rudrabhishek · Vastu Shanti · Vahan · Dukaan" },
  { title: "Wedding Essentials", img: img.wedding, links: ["Wedding Pooja Samagri", "Padle ka Saman", "Batisi ka Saman", "Shagun Envelopes, Boxes & Thalis", "Wedding Potli & Batua", "Decorative Chowki", "Wedding Thali", "Tilak, Roka & Ring Trays", "Dulha-Dulhan Accessories", "Bridal Accessories", "Groom Accessories"] },
  { title: "Wedding Décor & Gifting", img: img.hamper, links: ["Fancy Nariyal", "Dry Fruit Plates", "Decorative Plates & Trays", "Decorative Kalash", "Welcome / Swagat Items", "Haldi, Mehendi & Sangeet Décor", "Return Gifts", "Gift Hampers", "Dry Fruit Boxes & Mithai Boxes"] },
  { title: "Mala, Accessories & Handmade", img: img.mala, links: ["Elaichi Mala", "Moti Mala", "Laung Mala", "Dry Fruit Mala", "Bhagwan Ji Ki Mala / Chadhava", "Brooch & Bracelet", "Crochet Jewellery", "Varmala", "Keychains", "Table Tops", "Bags", "Handmade Décor"] },
];

const weddingMenu = [
  { title: "Wedding / Vivah", links: ["Vivah Pooja Kit", "Mandap Essentials", "Kanyadaan Items"], img: img.wedding },
  { title: "Haldi", links: ["Haldi Trays", "Haldi Décor", "Ubtan Bowls"], img: img.haldi },
  { title: "Mehendi", links: ["Mehendi Platters", "Guest Favours", "Floral Props"], img: img.mehendi },
  { title: "Sangeet", links: ["Décor Accents", "Return Gifts", "Props"], img: img.crochet },
  { title: "Engagement / Roka / Ring", links: ["Ring Trays", "Roka Thali", "Shagun Boxes"], img: img.mala },
  { title: "Tilak / Sagai", links: ["Tilak Thali", "Sagai Hampers", "Dry Fruit Plates"], img: img.hamper },
  { title: "Baraat / Welcome", links: ["Swagat Items", "Welcome Garlands", "Ittar Sets"], img: img.diwali },
  { title: "Reception", links: ["Guest Hampers", "Table Décor", "Thank-you Gifts"], img: img.hamper },
];

const nav = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop", mega: "shop" },
  { label: "Wedding", href: "/shop", mega: "wedding" },
  { label: "Pooja & Rituals", href: "/shop" },
  { label: "Handcrafted", href: "/#handcrafted" },
  { label: "Customized", href: "/#custom", emph: true },
  { label: "B2B / Bulk", href: "/#b2b", emph: true },
  { label: "About", href: "/#story" },
  { label: "Contact", href: "/#contact" },
];

const promo = ["New Arrivals", "Best Sellers", "Customized", "Bulk Orders", "View All Products"];

export function Header() {
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [mExp, setMExp] = useState<string | null>(null);

  return (
    <>
      <div className="overflow-hidden bg-royal text-on-dark">
        <div className="flex w-max animate-marquee gap-12 py-2 text-[11px] font-semibold uppercase tracking-[0.2em]">
          {[...announcements, ...announcements, ...announcements, ...announcements].map((a, i) => (
            <span key={i} className="flex items-center gap-12">{a}<span className="text-gold">✦</span></span>
          ))}
        </div>
      </div>
    <header className="sticky top-0 z-50 bg-background" onMouseLeave={() => setOpen(null)}>
      <div className="border-b">
        <div className="container-x flex h-16 items-center gap-4 lg:gap-8">
          <button className="lg:hidden" aria-label="Open menu" onClick={() => setMobile(true)}><Menu className="h-6 w-6" /></button>
          <Link to="/" aria-label="Murlit Enterprises — Home" className="shrink-0">
            <img src={logoCompact} alt="Murlit Enterprises" width={1174} height={829} className="h-10 w-auto object-contain lg:h-12" />
          </Link>
          <label className="relative hidden flex-1 md:block">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search kits, mala, potli, wedding items..."
              className="w-full rounded-full border bg-sage py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-maroon focus:bg-background" />
          </label>
          <div className="ml-auto flex items-center gap-1 md:gap-3">
            <select aria-label="Currency" className="hidden bg-transparent text-xs font-semibold outline-none lg:block">
              <option>INR ₹</option><option>USD $</option><option>GBP £</option><option>EUR €</option><option>AED</option>
            </select>
            <select aria-label="Language" className="hidden bg-transparent text-xs font-semibold outline-none lg:block">
              <option>English</option><option>हिन्दी</option>
            </select>
            {[User, Heart].map((I, i) => (
              <button key={i} aria-label={i ? "Wishlist" : "Account"} className="hidden h-10 w-10 place-items-center rounded-full hover:bg-sage sm:grid"><I className="h-5 w-5" /></button>
            ))}
            <button aria-label="Cart" className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-sage">
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-terracotta text-[9px] font-bold text-on-dark">2</span>
            </button>
          </div>
        </div>

        <nav className="container-x hidden items-center justify-center gap-7 lg:flex">
          {nav.map((n) => (
            <a key={n.label} href={n.href} onMouseEnter={() => setOpen(n.mega ?? null)}
              className={`relative flex h-11 items-center gap-1 text-[13px] font-semibold tracking-wide transition hover:text-maroon after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-maroon after:transition hover:after:scale-x-100 ${n.emph ? "text-terracotta" : ""}`}>
              {n.label}{n.mega && <ChevronDown className="h-3 w-3" />}
              {n.emph && <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-leaf" />}
            </a>
          ))}
        </nav>
      </div>

      {open === "shop" && (
        <div className="absolute inset-x-0 top-full hidden border-b bg-background shadow-lift lg:block">
          <div className="container-x grid grid-cols-4 gap-8 py-8">
            {shopMenu.map((c) => (
              <div key={c.title}>
                <div className="mb-4 flex items-center gap-3">
                  <img src={c.img} alt="" className="h-12 w-12 rounded-sm object-cover" />
                  <h4 className="font-display text-xl text-maroon">{c.title}</h4>
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {c.links.map((l) => <li key={l}><a href="/shop" className="hover:text-maroon">{l}</a></li>)}
                </ul>
                {c.sub && <p className="mt-3 rounded-sm bg-sage p-3 text-xs leading-relaxed text-muted-foreground"><b className="text-ink">Kits for: </b>{c.sub}</p>}
              </div>
            ))}
          </div>
          <div className="bg-ivory-fade border-t">
            <div className="container-x flex justify-center gap-10 py-3 text-xs font-bold uppercase tracking-widest">
              {promo.map((p) => <a key={p} href="/shop" className="text-burgundy hover:text-terracotta">{p} →</a>)}
            </div>
          </div>
        </div>
      )}

      {open === "wedding" && (
        <div className="absolute inset-x-0 top-full hidden border-b bg-background shadow-lift lg:block">
          <div className="container-x grid grid-cols-5 gap-6 py-8">
            <div className="grid grid-cols-2 col-span-4 gap-x-8 gap-y-6 lg:grid-cols-4">
              {weddingMenu.map((c) => (
                <div key={c.title} className="flex gap-3">
                  <img src={c.img} alt="" className="h-14 w-14 rounded-sm object-cover" />
                  <div>
                    <h4 className="font-display text-lg text-maroon">{c.title}</h4>
                    <ul className="text-xs text-muted-foreground">{c.links.map((l) => <li key={l}><a href="/shop" className="hover:text-maroon">{l}</a></li>)}</ul>
                  </div>
                </div>
              ))}
            </div>
            <a href="/shop" className="relative overflow-hidden rounded-md">
              <img src={img.wedding} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-burgundy/90 to-transparent p-4 text-on-dark">
                <span className="text-[10px] uppercase tracking-widest">Featured</span>
                <span className="font-display text-xl">Complete Wedding Kits</span>
              </div>
            </a>
          </div>
        </div>
      )}

      {mobile && (
        <div className="fixed inset-0 z-50 bg-ink/40 lg:hidden" onClick={() => setMobile(false)}>
          <div className="h-full w-[85%] max-w-sm overflow-y-auto bg-background p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <img src={logoCompact} alt="Murlit Enterprises" className="h-10 w-auto object-contain" />
              <button aria-label="Close menu" onClick={() => setMobile(false)}><X className="h-6 w-6" /></button>
            </div>
            <input placeholder="Search kits, mala, potli..." className="mb-4 w-full rounded-full border bg-sage px-4 py-2.5 text-sm" />
            {nav.map((n) => (
              <div key={n.label} className="border-b">
                <button className={`flex w-full items-center justify-between py-3.5 text-left font-semibold ${n.emph ? "text-terracotta" : ""}`}
                  onClick={() => n.mega ? setMExp(mExp === n.label ? null : n.label) : (window.location.href = n.href)}>
                  {n.label}{n.mega && <ChevronDown className={`h-4 w-4 transition ${mExp === n.label ? "rotate-180" : ""}`} />}
                </button>
                {mExp === n.label && (
                  <ul className="space-y-2 pb-3 pl-3 text-sm text-muted-foreground">
                    {(n.mega === "shop" ? shopMenu : weddingMenu).map((c) => <li key={c.title}><a href="/shop">{c.title}</a></li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
    </>
  );
}
