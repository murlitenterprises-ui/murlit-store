import { Link, useRouterState } from "@tanstack/react-router";
import { Search, User, Heart, ShoppingBag, Menu, X, ChevronDown, MessageCircle } from "lucide-react";
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

    {/* Mobile drawer — portal into document.body to escape header stacking context */}
    {mounted && mobile && createPortal(
      <div className="lg:hidden">
        {/* Backdrop */}
        <div
          aria-hidden="true"
          onClick={() => setMobile(false)}
          style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.5)", viewTransitionName: "none", animation: "drawer-backdrop-in 200ms ease both" }}
        />

        {/* Drawer panel */}
        <div
          role="dialog" aria-modal="true" aria-label="Navigation menu"
          onClick={(e) => e.stopPropagation()}
          style={{ position: "fixed", left: 0, top: 0, height: "100dvh", width: "min(90vw,400px)", zIndex: 1000, display: "flex", flexDirection: "column", overscrollBehavior: "contain", viewTransitionName: "none" }}
          className="animate-drawer-in bg-background"
        >
          {/* ── 1. TOP BAND ── */}
          <div style={{ background: "var(--maroon)", padding: "18px 18px 14px", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <img src={logoCompact} alt="Murlit Enterprises" style={{ height: 34, width: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
                <p style={{ color: "var(--on-dark)", fontSize: 10, fontStyle: "italic", opacity: 0.75, marginTop: 4 }} className="font-display">
                  Traditions, Beautifully Crafted
                </p>
              </div>
              <button aria-label="Close menu" onClick={() => setMobile(false)}
                style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,240,0.18)", border: "none", display: "grid", placeItems: "center", cursor: "pointer", color: "var(--on-dark)", flexShrink: 0 }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            {/* Search */}
            <div style={{ position: "relative", marginTop: 12 }}>
              <Search style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "rgba(255,255,240,0.55)", pointerEvents: "none" }} />
              <input placeholder="Search kits, mala, potli…"
                style={{ width: "100%", borderRadius: 100, background: "rgba(255,255,240,0.13)", border: "1px solid rgba(255,255,240,0.28)", color: "var(--on-dark)", padding: "8px 14px 8px 36px", fontSize: 13, outline: "none" }} />
            </div>
          </div>

          {/* ── 2 & 3. SCROLLABLE CONTENT ── */}
          <div style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain" }}>

            {/* Home row */}
            <a href="/" onClick={() => setMobile(false)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", borderBottom: "1px solid rgba(184,145,63,0.15)", textDecoration: "none", color: "inherit", animation: "drawer-item-in 280ms 40ms both" }}>
              <img src={img.hero} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              <span className="font-display" style={{ fontSize: 17 }}>Home</span>
            </a>

            {/* Expandable categories */}
            {(
              [
                { label: "Shop",             mega: "shop",    rowImg: img.wedding,            href: "/shop",                    viewAll: "/shop" },
                { label: "Wedding",          mega: "wedding", rowImg: img.wedding,            href: "/shop",                    viewAll: "/shop" },
                { label: "Pooja & Rituals",  mega: "pooja",   rowImg: shopMenuColumns[0].img, href: "/category/pooja-rituals",  viewAll: "/category/pooja-rituals" },
                { label: "Handcrafted",      mega: "crochet", rowImg: shopMenuColumns[4].img, href: "/category/crochet",        viewAll: "/category/crochet" },
              ] as const
            ).map((n, idx) => {
              const isOpen = mExp === n.label;

              // Build sub-item grid data
              type Sub = { label: string; img: string; href: string };
              let subs: Sub[] = [];
              if (n.mega === "shop") {
                subs = shopMenuColumns.slice(0, 5).map((c) => ({ label: c.title, img: c.img, href: c.slug ? `/category/${c.slug}` : "/shop" }));
              } else if (n.mega === "wedding") {
                subs = weddingMenuColumns.slice(0, 9).map((c) => ({ label: c.title, img: c.img, href: c.links[0]?.href ?? "/shop" }));
              } else if (n.mega === "pooja") {
                subs = shopMenuColumns[0].links.slice(0, 9).map((l) => ({ label: l.label, img: l.img, href: l.href }));
              } else {
                subs = shopMenuColumns[4].links.slice(0, 9).map((l) => ({ label: l.label, img: l.img, href: l.href }));
              }

              return (
                <div key={n.label} style={{ borderBottom: "1px solid rgba(184,145,63,0.15)", animation: `drawer-item-in 280ms ${(idx + 1) * 50 + 40}ms both` }}>
                  {/* Row button */}
                  <button
                    onClick={() => setMExp(isOpen ? null : n.label)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", width: "100%", background: isOpen ? "rgba(145,30,31,0.04)" : "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
                    <img src={n.rowImg} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                    <span className="font-display" style={{ fontSize: 17, flex: 1 }}>{n.label}</span>
                    <ChevronDown style={{ width: 18, height: 18, flexShrink: 0, color: "var(--gold)", transition: "transform 300ms ease", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }} />
                  </button>

                  {/* Smooth height expand via CSS grid trick */}
                  <div style={{ display: "grid", gridTemplateRows: isOpen ? "1fr" : "0fr", transition: "grid-template-rows 300ms cubic-bezier(.4,0,.2,1)" }}>
                    <div style={{ overflow: "hidden" }}>
                      <div style={{ padding: "10px 14px 6px", background: "var(--sage)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
                          {subs.map((sub) => (
                            <a key={sub.label} href={sub.href} onClick={() => setMobile(false)}
                              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "8px 4px", textDecoration: "none", color: "inherit" }}>
                              <img src={sub.img} alt="" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", flexShrink: 0 }} />
                              <span style={{ fontSize: 11, textAlign: "center", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{sub.label}</span>
                            </a>
                          ))}
                        </div>
                        <a href={n.viewAll} onClick={() => setMobile(false)}
                          style={{ display: "block", textAlign: "right", padding: "8px 4px 2px", fontSize: 12, fontWeight: 700, color: "var(--terracotta)", textDecoration: "none" }}>
                          View all →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* ── 4. HIGHLIGHT CARDS ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "14px 18px", animation: "drawer-item-in 280ms 290ms both" }}>
              <a href="/#custom" onClick={() => setMobile(false)}
                style={{ border: "1.5px solid var(--gold)", borderRadius: 8, padding: 10, background: "var(--ivory)", textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", gap: 6 }}>
                <img src={img.crochet} alt="" style={{ width: "100%", height: 64, objectFit: "cover", borderRadius: 5 }} />
                <span className="font-display" style={{ fontSize: 14, fontWeight: 600 }}>Customized</span>
                <span style={{ fontSize: 10, color: "#888" }}>Made just for you</span>
              </a>
              <a href="/#b2b" onClick={() => setMobile(false)}
                style={{ borderRadius: 8, padding: 10, background: "var(--maroon)", textDecoration: "none", color: "var(--on-dark)", display: "flex", flexDirection: "column", gap: 6 }}>
                <img src={img.hamper} alt="" style={{ width: "100%", height: 64, objectFit: "cover", borderRadius: 5 }} />
                <span className="font-display" style={{ fontSize: 14, fontWeight: 600 }}>B2B / Bulk</span>
                <span style={{ fontSize: 10, opacity: 0.78 }}>Wholesale & corporate</span>
              </a>
            </div>

            {/* ── 5. SECONDARY LINKS ── */}
            <div style={{ display: "flex", gap: 20, padding: "2px 18px 16px", animation: "drawer-item-in 280ms 330ms both" }}>
              <a href="/#story" onClick={() => setMobile(false)} style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>About</a>
              <a href="/#contact" onClick={() => setMobile(false)} style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>Contact</a>
            </div>
          </div>

          {/* ── 6. BOTTOM BAR ── */}
          <div style={{ borderTop: "1px solid rgba(184,145,63,0.18)", background: "var(--background)", flexShrink: 0, paddingBottom: "env(safe-area-inset-bottom)" }}>
            {/* Currency / Language selectors */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 18px 2px", fontSize: 11 }}>
              <select aria-label="Currency" style={{ background: "transparent", border: "none", fontSize: 11, fontWeight: 600, outline: "none", cursor: "pointer" }}>
                <option>INR ₹</option><option>USD $</option><option>GBP £</option>
              </select>
              <span style={{ color: "rgba(0,0,0,0.2)" }}>|</span>
              <select aria-label="Language" style={{ background: "transparent", border: "none", fontSize: 11, fontWeight: 600, outline: "none", cursor: "pointer" }}>
                <option>English</option><option>हिन्दी</option>
              </select>
            </div>
            {/* Icons + WhatsApp */}
            <div style={{ display: "flex", alignItems: "center", padding: "4px 12px 10px" }}>
              {[
                { Icon: User,        label: "Account"  },
                { Icon: Heart,       label: "Wishlist" },
                { Icon: ShoppingBag, label: "Cart",    badge: "2" },
              ].map(({ Icon, label, badge }) => (
                <button key={label} aria-label={label}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 10px", background: "none", border: "none", cursor: "pointer", position: "relative" }}>
                  <Icon style={{ width: 20, height: 20 }} />
                  {badge && (
                    <span style={{ position: "absolute", top: 0, right: 6, width: 14, height: 14, borderRadius: "50%", background: "var(--terracotta)", color: "var(--on-dark)", fontSize: 8, display: "grid", placeItems: "center", fontWeight: 700 }}>{badge}</span>
                  )}
                  <span style={{ fontSize: 9 }}>{label}</span>
                </button>
              ))}
              <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer"
                style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, background: "#25D366", color: "#fff", borderRadius: 100, padding: "8px 14px", fontSize: 12, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>
                <MessageCircle style={{ width: 15, height: 15 }} />
                WhatsApp us
              </a>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
