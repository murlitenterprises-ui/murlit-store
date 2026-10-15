import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Sparkles, Truck, Package, Globe, MessageCircle, ArrowRight, Check, Quote } from "lucide-react";
import { Header } from "@/components/site/Header";
import { CategoryCarousel } from "@/components/site/CategoryCarousel";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { SectionHead, TextLink } from "@/components/site/Section";
import { categories, img, occasions, products } from "@/lib/catalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Murlit Enterprises — Pooja, Wedding & Handcrafted Gifts" },
      { name: "description", content: "Curated pooja samagri, wedding essentials, handcrafted crochet, malas and customised gifts. Bulk & worldwide enquiries welcome." },
      { property: "og:title", content: "Murlit Enterprises — Traditions, Beautifully Crafted" },
      { property: "og:description", content: "Pooja essentials, wedding collections, handcrafted treasures and personalised gifts." },
    ],
  }),
  component: Home,
});

const btn = "inline-flex items-center justify-center gap-2 rounded-sm px-6 py-3.5 text-sm font-bold tracking-wide transition";
const btnPrimary = `${btn} press bg-royal text-on-dark shadow-lift hover:-translate-y-0.5 hover:brightness-110 [&_svg]:transition-transform hover:[&_svg]:translate-x-1`;
const btnOutline = `${btn} press border border-ink/80 hover:-translate-y-0.5 hover:bg-ink hover:text-on-dark`;

function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <CategoryCarousel />
      <main>
        <Hero />
        <Occasions />
        <Categories />
        <BestSellers />
        <ShopByNeed />
        <Custom />
        <WeddingSpot />
        <Handcrafted />
        <B2B />
        <Budget />
        <Recipient />
        <Story />
        <Testimonials />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}

const btnOutlineDark = "inline-flex items-center justify-center gap-2 rounded-sm px-6 py-3.5 text-sm font-bold tracking-wide transition press border border-on-dark/60 text-on-dark hover:-translate-y-0.5 hover:bg-on-dark/15";

function Hero() {
  // Only true on a REAL unrecoverable error (MEDIA_ERR_NETWORK=2, MEDIA_ERR_DECODE=3, MEDIA_ERR_SRC_NOT_SUPPORTED=4).
  // MEDIA_ERR_ABORTED=1 fires when the browser navigates/aborts, NOT a real failure — ignored.
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const play = () => {
      video.muted = true;
      video.defaultMuted = true;
      video.play().catch(() => {});
    };

    video.load();
    play();

    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) play(); };
    const onVisible = () => { if (!document.hidden) play(); };
    const onCanPlay = () => play();

    video.addEventListener("canplay", onCanPlay);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      video.removeEventListener("canplay", onCanPlay);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const code = (e.currentTarget as HTMLVideoElement).error?.code ?? 0;
    // Ignore abort (1) — fired harmlessly during navigation/view-transition snapshots
    if (code >= 2) setVideoFailed(true);
  };

  return (
    <section className="hero-section relative overflow-hidden">
      {/* Fallback image — shown when prefers-reduced-motion is set OR video fatally failed */}
      <img
        src={img.hero}
        alt=""
        aria-hidden="true"
        width={1600}
        height={1200}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className={`absolute inset-0 h-full w-full object-cover object-center ${videoFailed ? "" : "motion-safe:hidden"}`}
      />

      {/* Video is ALWAYS in the DOM so it isn't lost during view-transition snapshots.
          CSS hides it for reduced-motion; hidden class when truly failed. */}
      <video
        key="hero-video"
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/videos/hero-poster.jpg"
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full object-cover object-center motion-reduce:hidden${videoFailed ? " hidden" : ""}`}
        onError={handleVideoError}
      >
        <source src="/videos/hero-mobile.mp4" type="video/mp4" media="(max-width: 767px)" />
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>

      {/* Overlays — lighter than static image since video is already dark */}
      {/* Mobile: soft uniform tint */}
      <div className="absolute inset-0 lg:hidden" style={{ background: "rgba(30,10,5,0.30)" }} />
      {/* Desktop: gentle radial fade */}
      <div className="absolute inset-0 hidden lg:block" style={{ background: "radial-gradient(ellipse at 50% 46%, rgba(30,10,5,0.22) 0%, rgba(30,10,5,0.06) 100%)" }} />
      {/* Text-backing: focused ellipse behind the copy for readability */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 55% at 50% 40%, rgba(20,8,4,0.40) 0%, transparent 100%)" }} />
      {/* Bottom fade — keeps lower text readable */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(20,8,4,0.45) 0%, transparent 32%)" }} />

      {/* Centered content */}
      <div className="container-x relative z-10 flex flex-col items-center text-center">
        <div className="w-full max-w-[760px]">
          <span
            className="eyebrow ornament animate-fade-up"
            style={{ color: "var(--gold)", filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }}
          >
            Festive Edit 2026
          </span>
          <h1
            className="hero-gap animate-fade-up delay-1 font-medium leading-[0.95] text-on-dark"
            style={{ fontSize: "clamp(1.9rem, 6vh, 4.25rem)", textShadow: "0 2px 14px rgba(20,8,4,0.55)" }}
          >
            Traditions,<br /><em style={{ color: "var(--gold)" }}>Beautifully</em> Crafted.
          </h1>
          <p
            className="hero-para mx-auto hero-gap max-w-lg animate-fade-up delay-2 text-on-dark"
            style={{ textShadow: "0 1px 8px rgba(20,8,4,0.50)", opacity: 0.9 }}
          >
            Discover thoughtfully curated pooja essentials, wedding collections, handcrafted treasures, and personalized gifts for every meaningful occasion.
          </p>
          <div className="hero-gap flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <a href="/shop" className={`${btnPrimary} animate-fade-up delay-3 w-full sm:w-auto`}>
              Explore Collections <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#custom" className={`${btnOutlineDark} animate-fade-up delay-4 w-full sm:w-auto`}>
              Create Something Custom
            </a>
          </div>
          <div
            className="hero-gap animate-fade-up delay-4 grid grid-cols-3 gap-3 border-t pt-3 text-[11px] font-semibold text-on-dark"
            style={{ borderColor: "rgba(255,255,240,0.22)" }}
          >
            {[[Sparkles, "Custom orders"], [Package, "Bulk & wholesale"], [Globe, "Worldwide enquiries"]].map(([I, t]: any) => (
              <div key={t} className="flex items-center justify-center gap-2">
                <I className="h-4 w-4" style={{ color: "var(--gold)" }} />{t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Diwali badge — floats top-right */}
      <div className="absolute right-8 top-6 z-10 animate-float rounded-sm bg-ember [animation-delay:1.5s] px-5 py-3 text-on-dark shadow-lift lg:right-16">
        <div className="text-[10px] uppercase tracking-widest">Now live</div>
        <div className="font-display text-xl">Diwali Collection</div>
      </div>
    </section>
  );
}

function OccasionCard({ o, hidden }: { o: { name: string; img: string }; hidden?: boolean }) {
  return (
    <a
      href="/shop"
      className="group w-[180px] shrink-0"
      aria-hidden={hidden ? "true" : undefined}
      tabIndex={hidden ? -1 : undefined}
    >
      <div className="aspect-[4/5] overflow-hidden rounded-md">
        <img src={o.img} alt={o.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
      </div>
      <div className="mt-3 font-display text-2xl group-hover:text-maroon">{o.name}</div>
    </a>
  );
}

function Occasions() {
  return (
    <section className="py-10 md:py-12 lg:py-16 overflow-hidden">
      <div className="container-x">
        <SectionHead eyebrow="Shop by Occasion" title="For every ceremony, every ritual" action={<TextLink>Explore All Occasions</TextLink>} />
      </div>

      {/* Marquee wrapper — full-bleed so cards fade edge-to-edge */}
      <div
        className="relative mt-2"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
        }}
      >
        {/* Track — pauses on hover (desktop) and on touch-hold (mobile) */}
        <div
          className="flex gap-5 w-max animate-occasions-marquee [animation-play-state:running] hover:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:overflow-x-auto motion-reduce:no-scrollbar motion-reduce:w-auto motion-reduce:px-5 pb-2"
          style={{ willChange: "transform" }}
          onTouchStart={(e) => (e.currentTarget.style.animationPlayState = "paused")}
          onTouchEnd={(e) => (e.currentTarget.style.animationPlayState = "running")}
        >
          {/* Primary list — visible to AT */}
          {occasions.map((o) => <OccasionCard key={o.name} o={o} />)}
          {/* Duplicate — aria-hidden, creates the seamless loop */}
          {occasions.map((o) => <OccasionCard key={`dup-${o.name}`} o={o} hidden />)}
        </div>
      </div>
    </section>
  );
}

function Categories() {
  return (
    <section className="py-10 md:py-12 lg:py-16 bg-sage">
      <div className="container-x">
        <SectionHead eyebrow="Shop by Category" title="Curated with devotion" />
        <div className="grid grid-cols-3 gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-6 lg:gap-5">
          {categories.map((c) => (
            <a key={c.name} href="/shop" className="group text-center">
              <div className="mx-auto h-[110px] w-[110px] lg:h-[170px] lg:w-[170px] overflow-hidden rounded-full border-4 border-background shadow-soft">
                <img src={c.img} alt={c.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
              </div>
              <div className="mt-3 text-[17px] font-medium leading-snug group-hover:text-maroon">{c.name}</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function BestSellers() {
  return (
    <section className="py-10 md:py-12 lg:py-16">
      <div className="container-x">
        <SectionHead eyebrow="Best Sellers" title="Featured collections" sub="Sample products and prices for this prototype." action={<TextLink>View all products</TextLink>} />
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {products.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </div>
    </section>
  );
}

const needs = ["For Weddings", "For Pooja & Rituals", "For Wedding Planners", "For Event Planners", "For Retailers & Resellers", "For Wholesalers", "For Return Gifts", "For Corporate Gifting", "For Customized Orders"];
const needImgs = [img.wedding, img.poojakit, img.haldi, img.diwali, img.hamper, img.mala, img.hamper, img.hero, img.crochet];

function ShopByNeed() {
  return (
    <section className="py-10 md:py-12 lg:py-16 bg-sage-fade">
      <div className="container-x">
        <SectionHead eyebrow="Shop by Need" title="Whoever you're shopping for" sub="From one family celebration to five hundred hampers." />
        <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {needs.map((n, i) => (
            <a key={n} href="/shop" className="group flex items-center gap-3 rounded-md border bg-background p-3 md:gap-5 md:p-4 transition hover:border-maroon hover:shadow-soft">
              <img src={needImgs[i]} alt="" loading="lazy" decoding="async" className="h-16 w-16 shrink-0 rounded-sm object-cover md:h-24 md:w-24" />
              <span className="min-w-0 break-words font-display text-[18px] leading-tight md:text-[22px]">{n}</span>
              <ArrowRight className="ml-auto hidden h-5 w-5 shrink-0 md:block text-muted-foreground transition group-hover:translate-x-1 group-hover:text-maroon" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Custom() {
  const steps = ["Tell Us", "Design Approval", "We Create", "Delivered"];
  return (
    <section id="custom" className="py-10 md:py-12 lg:py-16">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2">
        <div className="grid grid-cols-6 grid-rows-6 gap-3 h-[280px] lg:h-[480px]">
          <img src={img.wedding} alt="Personalised potli" loading="lazy" decoding="async" className="col-span-4 row-span-4 h-full w-full rounded-md object-cover" />
          <img src={img.mala} alt="Custom mala" loading="lazy" decoding="async" className="col-span-2 row-span-3 h-full w-full rounded-md object-cover" />
          <img src={img.hamper} alt="Custom packaging" loading="lazy" decoding="async" className="col-span-2 row-span-3 h-full w-full rounded-md object-cover" />
          <img src={img.crochet} alt="Handmade gifts" loading="lazy" decoding="async" className="col-span-4 row-span-2 h-full w-full rounded-md object-cover" />
        </div>
        <div>
          <span className="eyebrow ornament">Customized Creations</span>
          <h2 className="mt-3 text-display font-medium leading-none">You Imagine It.<br /><em className="text-terracotta">We Create It.</em></h2>
          <p className="mt-3 max-w-lg text-[18px] text-muted-foreground leading-relaxed">Make every celebration personal with customized pooja kits, wedding accessories, handcrafted gifts, and beautifully designed packaging.</p>
          <ol className="mt-6 grid grid-cols-4 gap-3">
            {steps.map((s, i) => (
              <li key={s} className="border-t-2 border-maroon pt-3">
                <span className="font-display text-3xl text-maroon">0{i + 1}</span>
                <div className="text-sm font-semibold">{s}</div>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#contact" className={btnPrimary}>Create Your Custom Order</a>
            <a href="/shop" className={btnOutline}>Explore Customization</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function WeddingSpot() {
  const tiers = ["Complete Wedding Kits", "Budget Collection", "Standard Collection", "Premium Collection"];
  return (
    <section className="py-10 md:py-12 lg:py-16"><div className="container-x">
      <div className="relative overflow-hidden rounded-md bg-royal text-on-dark">
        <img src={img.wedding} alt="" loading="lazy" decoding="async" className="absolute inset-y-0 right-0 hidden h-full w-1/2 object-cover lg:block" />
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-r from-burgundy to-transparent lg:block" />
        <div className="relative p-6 md:p-12 lg:w-1/2">
          <span className="text-[14px] font-bold uppercase tracking-[0.25em] text-gold">Wedding Spotlight</span>
          <h2 className="mt-3 text-display font-medium leading-none">Everything for Your Special Celebrations.</h2>
          <p className="mt-5 text-[18px] opacity-85">Pooja essentials, shagun items, decorative thalis, kalash, malas, potlis, varmala and gifting — in one place.</p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {tiers.map((t) => (
              <a key={t} href="/shop" className="rounded-sm border border-on-dark/30 px-4 py-3 text-sm font-semibold transition hover:bg-on-dark hover:text-burgundy">{t} →</a>
            ))}
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}

function Handcrafted() {
  const items = ["Crochet Jewellery", "Crochet Varmala", "Handmade Bags", "Keychains", "Table Tops", "Handmade Décor", "Crochet Flowers", "One-of-a-kind Pieces"];
  return (
    <section id="handcrafted" className="py-10 md:py-12 lg:py-16 bg-ivory">
      <div className="container-x grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <span className="eyebrow ornament">Handcrafted with Care</span>
          <h2 className="mt-3 text-display font-medium leading-none">Made stitch by stitch, by hand.</h2>
          <p className="mt-5 text-[18px] text-muted-foreground leading-relaxed">Each crochet piece is made slowly, with patience — so no two are ever quite the same.</p>
          <div className="mt-8 flex flex-wrap gap-2">
            {items.map((i) => <a key={i} href="/shop" className="rounded-full border bg-background px-4 py-2 text-sm hover:border-leaf hover:text-leaf">{i}</a>)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:col-span-3">
          <img src={img.crochet} alt="Crochet varmala and flowers" loading="lazy" decoding="async" className="aspect-[4/5] w-full rounded-md object-cover" />
          <ProductCard p={products[9]!} />
        </div>
      </div>
    </section>
  );
}

function B2B() {
  const feats = ["Wholesale Orders", "Wedding Planners", "Event Planners", "Retailers & Resellers", "Corporate Gifting", "Temples & Institutions", "Private Label Packaging", "International Bulk Orders"];
  const tiers = [["50 units", "₹540", "10%"], ["100 units", "₹510", "15%"], ["500 units", "₹450", "25%"]];
  return (
    <section id="b2b" className="py-10 md:py-12 lg:py-16">
      <div className="container-x">
        <div className="rounded-md border-t-4 border-leaf bg-sage p-5 md:p-7">
          <div className="grid gap-5 md:gap-8 lg:grid-cols-2">
            <div>
              <span className="text-[14px] font-bold uppercase tracking-[0.25em] text-leaf">B2B / Bulk</span>
              <h2 className="mt-3 font-display font-medium leading-tight text-[clamp(1.5rem,5vw,2.5rem)]">Your Trusted Partner for Bulk & Wholesale Orders.</h2>
              <p className="mt-3 text-[18px] text-muted-foreground leading-relaxed">Thoughtfully curated products for retailers, wedding planners, event organizers, temples, resellers, and corporate gifting.</p>
              <div className="mt-4 grid grid-cols-1 gap-1.5 min-[400px]:grid-cols-2 md:mt-6 md:gap-2">
                {feats.map((f) => <div key={f} className="flex items-center gap-2 rounded-sm bg-background p-2 text-sm font-semibold"><Check className="h-4 w-4 shrink-0 text-leaf" /><span className="min-w-0">{f}</span></div>)}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="overflow-hidden rounded-md border bg-background">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-leafy px-4 py-3 text-on-dark">
                  <span className="font-semibold text-sm">Designer Wedding Potli — tier pricing</span>
                  <span className="rounded-sm bg-on-dark/20 px-2 py-0.5 text-[10px] uppercase tracking-widest shrink-0">Sample UI data</span>
                </div>
                {/* Mobile: vertical card list. md+: table */}
                <div className="md:hidden divide-y">
                  {tiers.map(([q, p, s]) => (
                    <div key={q} className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="font-semibold">{q}</span>
                      <span className="font-bold text-maroon">{p}</span>
                      <span className="text-leaf">{s} off</span>
                    </div>
                  ))}
                </div>
                <table className="hidden md:table w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr><th className="px-5 py-3">Quantity</th><th>Per unit</th><th>Saving</th></tr>
                  </thead>
                  <tbody>
                    {tiers.map(([q, p, s]) => (
                      <tr key={q} className="border-t"><td className="px-5 py-3 font-semibold">{q}</td><td className="font-bold text-maroon">{p}</td><td className="text-leaf">{s}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-col gap-2 md:mt-6 md:flex-row md:flex-wrap md:gap-3">
                <a href="#contact" className={`${btn} w-full justify-center bg-leafy text-on-dark hover:brightness-110 md:w-auto`}>Request a Bulk Quote</a>
                <a href="/shop" className={`${btnOutline} w-full justify-center md:w-auto`}>View Wholesale Collection</a>
                <button className={`${btn} w-full justify-center underline-offset-4 hover:underline md:w-auto`}>Download Catalogue</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Budget() {
  const b = [["Under ₹499", img.mala], ["₹500–₹999", img.crochet], ["₹1,000–₹2,999", img.hamper], ["Premium ₹3,000+", img.wedding]];
  return (
    <section className="py-10 md:py-12 lg:py-16">
      <div className="container-x">
        <SectionHead eyebrow="Shop by Budget" title="Something for every purse" />
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {b.map(([t, src]) => (
            <a key={t} href="/shop" className="group relative aspect-[4/5] overflow-hidden rounded-md">
              <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/0 to-transparent" />
              <div className="absolute bottom-5 left-5 text-on-dark">
                <div className="font-display text-4xl">{t}</div>
                <div className="text-sm font-semibold uppercase tracking-widest opacity-80">Shop now →</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Recipient() {
  const r = [["For the Bride", img.wedding], ["For the Groom", img.mala], ["For Wedding Guests", img.hamper], ["For Family", img.hero], ["For Temples & Mandirs", img.diwali], ["For Corporate Clients", img.hamper]];
  return (
    <section className="py-10 md:py-12 lg:py-16 bg-sage">
      <div className="container-x">
        <SectionHead eyebrow="Shop by Recipient" title="Gifts they'll treasure" />
        <div className="grid grid-cols-3 gap-4 md:gap-5 lg:grid-cols-6">
          {r.map(([t, src]) => (
            <a key={t} href="/shop" className="group rounded-md bg-background p-2 shadow-soft transition hover:-translate-y-1">
              <img src={src} alt="" loading="lazy" decoding="async" className="aspect-square w-full rounded-sm object-cover" />
              <div className="px-1 py-2 text-center font-display text-[17px] group-hover:text-maroon">{t}</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Story() {
  const t = [[Sparkles, "Thoughtfully Curated Collections"], [Package, "Customization Available"], [Truck, "Bulk Order Support"], [Globe, "Domestic & International Enquiries"]];
  return (
    <section id="story" className="py-10 md:py-12 lg:py-16">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2">
        <img src={img.diwali} alt="Diwali pooja setup" loading="lazy" decoding="async" className="h-[260px] md:h-[380px] lg:h-[520px] w-full rounded-md object-cover" />
        <div>
          <span className="eyebrow ornament">Our Story</span>
          <h2 className="mt-3 text-display font-medium leading-none">Rooted in Tradition. Made for Every Celebration.</h2>
          <p className="mt-3 text-[18px] text-muted-foreground leading-relaxed">From the first diya of Diwali to the last shagun of a wedding, we bring together the rituals, craft and care that make Indian celebrations whole — for families and businesses alike.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {t.map(([I, s]: any) => (
              <div key={s} className="flex items-start gap-3 border-l-2 border-gold pl-4"><I className="mt-0.5 h-5 w-5 text-maroon" /><span className="font-semibold">{s}</span></div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const g = [img.wedding, img.haldi, img.diwali, img.crochet, img.poojakit, img.hamper];
  return (
    <section className="py-10 md:py-12 lg:py-16 bg-ivory">
      <div className="container-x">
        <SectionHead eyebrow="Testimonials & Gallery" title="Moments we've been part of" action={<TextLink>Explore the full gallery</TextLink>} />
        <div className="grid gap-5 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <figure key={i} className={`rounded-md border bg-background p-5 ${i > 1 ? "hidden md:block" : ""}`}>
              <Quote className="h-6 w-6 text-gold" />
              <blockquote className="mt-2 font-display text-lg leading-snug">"Sample testimonial placeholder — real customer words will appear here once collected."</blockquote>
              <figcaption className="mt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Placeholder · Sample content</figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 md:grid-cols-6">
          {g.map((s, i) => <img key={i} src={s} alt="Gallery" loading="lazy" decoding="async" className="aspect-square w-full rounded-sm object-cover transition hover:opacity-85" />)}
        </div>
      </div>
    </section>
  );
}

function Newsletter() {
  return (
    <section className="py-10 md:py-12 lg:py-16 bg-ivory-fade border-t">
      <div className="container-x max-w-2xl text-center">
        <span className="eyebrow ornament">Stay in touch</span>
        <h2 className="mt-3 text-display font-medium">Discover Something Meaningful.</h2>
        <p className="mt-3 text-[18px] text-muted-foreground">Festive edits, new handcrafted arrivals and early access — once a month.</p>
        <form className="mx-auto mt-8 flex max-w-md gap-2" onSubmit={(e) => e.preventDefault()}>
          <input type="email" placeholder="Your email address" className="flex-1 rounded-sm border bg-background px-4 py-3 text-sm outline-none focus:border-maroon" />
          <button className={btnPrimary}>Subscribe</button>
        </form>
        <a href="#" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-leaf"><MessageCircle className="h-4 w-4" /> Or enquire on WhatsApp</a>
      </div>
    </section>
  );
}
