import { Link, useRouterState } from "@tanstack/react-router";
import { Search, User, Heart, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { img } from "@/lib/catalog";
import { shopMenuColumns, weddingMenuColumns } from "@/lib/menu";
import logoCompact from "@/assets/logo-compact.png";

const announcements = ["Custom Orders Available", "Bulk & Wholesale", "Worldwide Shipping", "Diwali Special Collection Live", "WhatsApp Business Enquiries"];

const nav = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop", mega: "shop" },
  { label: "Wedding", href: "/shop", mega: "wedding" },
  { label: "Pooja & Rituals", href: "/category/pooja-rituals", mega: "pooja" },
  { label: "Handcrafted", href: "/category/crochet", mega: "crochet" },
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
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const busy = useRef(false);
  busy.current = !!open || mobile;

  // SSR safety: portal only available after mount
  useEffect(() => { setMounted(true); }, []);

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = mobile ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobile]);

  // Close on Escape
  useEffect(() => {
    if (!mobile) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setMobile(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [mobile]);

  // Close on route change
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => { setMobile(false); }, [pathname]);

  useEffect(() => {
    setScrolled(window.scrollY > 120);

    let last = window.scrollY, ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY, d = y - last;
        const focusInside = document.activeElement?.closest("[data-site-header]");
        // Hysteresis: compact >120, expand <40 — prevents flicker at threshold
        if (y > 120) setScrolled(true);
        else if (y < 40) setScrolled(false);
        if (y < 40 || busy.current || focusInside) setHidden(false);
        else if (d > 8) setHidden(true);
        else if (d < -8) setHidden(false);
        if (Math.abs(d) > 8 || y < 40) last = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Keep --header-h in sync with the actual rendered header height
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () =>
      document.documentElement.style.setProperty("--header-h", `${el.getBoundingClientRect().height}px`);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    return () => ro.disconnect();
  }, []);

  return (
    <>
    {/* Spacer — constant height prevents layout shifts when header compacts */}
    <div aria-hidden="true" className="h-[91px] lg:h-[134px]" />
    <header ref={headerRef} data-site-header onMouseLeave={() => setOpen(null)}
      className={`fixed top-0 inset-x-0 z-50 bg-background transition-transform duration-300 ease-out motion-reduce:transition-none ${hidden ? "-translate-y-full" : "translate-y-0"}`}>
      {/* Announcement marquee — collapses when scrolled */}
      <div className={`overflow-hidden bg-royal text-on-dark transition-all duration-300 ${scrolled ? "max-h-0 opacity-0 pointer-events-none" : "max-h-[36px]"}`}>
        <div className="flex w-max animate-marquee gap-12 py-[6px] text-[10px] font-semibold uppercase tracking-[0.2em]">
          {[...announcements, ...announcements, ...announcements, ...announcements].map((a, i) => (
            <span key={i} className="flex items-center gap-12">{a}<span className="text-gold">✦</span></span>
          ))}
        </div>
      </div>
      <div className="border-b">
        <div className={`container-x flex items-center gap-4 lg:gap-8 transition-all duration-300 ${scrolled ? "h-12" : "h-16"}`}>
          <button className="lg:hidden" aria-label="Open menu" onClick={() => setMobile(true)}><Menu className="h-6 w-6" /></button>
          <Link to="/" aria-label="Murlit Enterprises — Home" className="shrink-0">
            <img src={logoCompact} alt="Murlit Enterprises" width={1174} height={829} className={`w-auto object-contain transition-all duration-300 ${scrolled ? "h-8 lg:h-9" : "h-10 lg:h-12"}`} />
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

        <nav className={`container-x hidden items-center justify-center gap-7 lg:flex transition-all duration-300 ${scrolled ? "h-8" : "h-[42px]"}`}>
          {nav.map((n) => (
            <a key={n.label} href={n.href} onMouseEnter={() => setOpen(n.mega ?? null)}
              className={`relative flex h-11 items-center gap-1 text-[13px] font-semibold tracking-wide transition hover:text-maroon after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-maroon after:transition hover:after:scale-x-100 ${n.emph ? "text-terracotta" : ""}`}>
              {n.label}{n.mega && <ChevronDown className="h-3 w-3" />}
              {n.emph && <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-leaf" />}
            </a>
          ))}
        </nav>
      </div>

      {/* Shop mega menu — unchanged */}
      {open === "shop" && (
        <div className="absolute inset-x-0 top-full hidden border-b bg-background shadow-lift animate-menu-in lg:block">
          <div className="container-x grid grid-cols-4 gap-8 py-8">
            {shopMenuColumns.map((c) => (
              <div key={c.title}>
                <div className="mb-4 flex items-center gap-3">
                  <img src={c.img} alt="" className="h-12 w-12 rounded-sm object-cover" />
                  <h4 className="font-display text-xl text-maroon">{c.title}</h4>
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {c.links.map((l) => <li key={l.label}><a href={l.href} className="hover:text-maroon">{l.label}</a></li>)}
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

      {/* Wedding mega menu — expanded with product columns */}
      {open === "wedding" && (
        <div className="absolute inset-x-0 top-full hidden border-b bg-background shadow-lift animate-menu-in lg:block">
          <div className="container-x max-h-[72vh] overflow-y-auto py-6">
            <div className="grid grid-cols-7 gap-5">
              {/* New: Wedding Essentials + Wedding Décor & Gifting */}
              {shopMenuColumns.slice(1, 3).map((c) => (
                <div key={c.title} className="col-span-1">
                  <div className="mb-3 flex items-center gap-2">
                    <img src={c.img} alt="" className="h-10 w-10 rounded-sm object-cover" />
                    <h4 className="font-display text-base text-maroon">{c.title}</h4>
                  </div>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {c.links.map((l) => <li key={l.label}><a href={l.href} className="hover:text-maroon">{l.label}</a></li>)}
                  </ul>
                </div>
              ))}
              {/* Existing occasion grid */}
              <div className="col-span-4 border-l pl-5">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">By Occasion</p>
                <div className="grid grid-cols-4 gap-x-5 gap-y-4">
                  {weddingMenuColumns.map((c) => (
                    <div key={c.title} className="flex gap-2">
                      <img src={c.img} alt="" className="h-11 w-11 shrink-0 rounded-sm object-cover" />
                      <div>
                        <h4 className="font-display text-sm text-maroon">{c.title}</h4>
                        <ul className="text-xs text-muted-foreground">
                          {c.links.map((l) => <li key={l.label}><a href={l.href} className="hover:text-maroon">{l.label}</a></li>)}
                        </ul>

                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Featured card */}
              <a href="/shop" className="col-span-1 relative overflow-hidden rounded-md min-h-40">
                <img src={img.wedding} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-burgundy/90 to-transparent p-4 text-on-dark">
                  <span className="text-[10px] uppercase tracking-widest">Featured</span>
                  <span className="font-display text-xl">Complete Wedding Kits</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Crochet mega menu */}
      {open === "crochet" && (
        <div className="absolute inset-x-0 top-full hidden border-b bg-background shadow-lift animate-menu-in lg:block">
          <div className="container-x py-8">
            <div className="flex gap-8">
              <div className="shrink-0">
                <img src={shopMenuColumns[4].img} alt="" className="h-40 w-40 rounded-sm object-cover" />
                <h4 className="mt-3 font-display text-xl text-maroon">{shopMenuColumns[4].title}</h4>
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-3 gap-x-8 gap-y-2 text-sm text-muted-foreground">
                  {shopMenuColumns[4].links.map((l) => (
                    <a key={l.label} href={l.href} className="hover:text-maroon">{l.label}</a>
                  ))}
                </div>
                <div className="mt-6 border-t pt-4">
                  <a href="/category/crochet" className="text-sm font-bold text-maroon hover:text-terracotta">View all Crochet →</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pooja & Rituals mega menu */}
      {open === "pooja" && (
        <div className="absolute inset-x-0 top-full hidden border-b bg-background shadow-lift animate-menu-in lg:block">
          <div className="container-x py-8">
            <div className="flex gap-8">
              {/* Category image + title */}
              <div className="shrink-0">
                <img src={shopMenuColumns[0].img} alt="" className="h-40 w-40 rounded-sm object-cover" />
                <h4 className="mt-3 font-display text-xl text-maroon">{shopMenuColumns[0].title}</h4>
              </div>
              {/* Links in 3 columns */}
              <div className="flex-1">
                <div className="grid grid-cols-3 gap-x-8 gap-y-2 text-sm text-muted-foreground">
                  {shopMenuColumns[0].links.map((l) => (
                    <a key={l.label} href={l.href} className="hover:text-maroon">{l.label}</a>
                  ))}
                </div>
                <div className="mt-6 border-t pt-4">
                  <a href="/category/pooja-rituals" className="text-sm font-bold text-maroon hover:text-terracotta">View all Pooja &amp; Rituals →</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </header>

    {/* Mobile drawer — rendered into document.body via portal so it escapes the header's stacking context */}
    {mounted && mobile && createPortal(
      <div className="lg:hidden">
        {/* Backdrop */}
        <div
          aria-hidden="true"
          style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.45)", viewTransitionName: "none" }}
          onClick={() => setMobile(false)}
        />
        {/* Drawer panel */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          style={{ position: "fixed", left: 0, top: 0, height: "100dvh", width: "min(88vw, 380px)", zIndex: 1000, overflowY: "auto", overscrollBehavior: "contain", viewTransitionName: "none" }}
          className="bg-background p-5 animate-drawer-in"
          onClick={(e) => e.stopPropagation()}
        >
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
                <ul className="animate-menu-in space-y-2 pb-3 pl-3 text-sm text-muted-foreground">
                  {n.mega === "pooja"
                    ? shopMenuColumns[0].links.map((l) => <li key={l.label}><a href={l.href} onClick={() => setMobile(false)} className="hover:text-maroon">{l.label}</a></li>)
                    : n.mega === "crochet"
                      ? shopMenuColumns[4].links.map((l) => <li key={l.label}><a href={l.href} onClick={() => setMobile(false)} className="hover:text-maroon">{l.label}</a></li>)
                      : (n.mega === "shop" ? shopMenuColumns : weddingMenuColumns).map((c) => <li key={c.title}><a href="/shop" onClick={() => setMobile(false)} className="hover:text-maroon">{c.title}</a></li>)
                  }
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
