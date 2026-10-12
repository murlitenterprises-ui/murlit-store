import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Truck, Package, Globe, MessageCircle, ArrowRight, Check, Quote } from "lucide-react";
import { Header } from "@/components/site/Header";
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
const btnPrimary = `${btn} bg-royal text-on-dark shadow-lift hover:brightness-110`;
const btnOutline = `${btn} border border-ink/80 hover:bg-ink hover:text-on-dark`;

function Home() {
  return (
    <div className="min-h-screen">
      <Header />
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

function Hero() {
  return (
    <section className="bg-ivory-fade">
      <div className="container-x grid items-center gap-10 py-12 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-5">
          <span className="eyebrow ornament">Festive Edit 2026</span>
          <h1 className="mt-5 text-6xl font-medium leading-[0.95] md:text-7xl xl:text-8xl">
            Traditions,<br /><em className="text-maroon">Beautifully</em> Crafted.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
            Discover thoughtfully curated pooja essentials, wedding collections, handcrafted treasures, and personalized gifts for every meaningful occasion.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/shop" className={btnPrimary}>Explore Collections <ArrowRight className="h-4 w-4" /></a>
            <a href="#custom" className={btnOutline}>Create Something Custom</a>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-4 border-t pt-6 text-xs font-semibold">
            {[[Sparkles, "Custom orders"], [Package, "Bulk & wholesale"], [Globe, "Worldwide enquiries"]].map(([I, t]: any) => (
              <div key={t} className="flex items-center gap-2"><I className="h-4 w-4 text-leaf" />{t}</div>
            ))}
          </div>
        </div>
        <div className="relative lg:col-span-7">
          <div className="overflow-hidden rounded-md shadow-lift">
            <img src={img.hero} alt="Pooja thali, kalash, wedding potli and gift boxes" width={1600} height={1200} className="aspect-[4/3] w-full object-cover" />
          </div>
          <div className="absolute -bottom-6 -left-4 hidden w-56 overflow-hidden rounded-md border-4 border-background shadow-lift md:block">
            <img src={img.mala} alt="Elaichi mala" loading="lazy" className="aspect-square w-full object-cover" />
          </div>
          <div className="absolute -top-4 right-6 rounded-sm bg-ember px-5 py-3 text-on-dark shadow-lift">
            <div className="text-[10px] uppercase tracking-widest">Now live</div>
            <div className="font-display text-xl">Diwali Collection</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Occasions() {
  return (
    <section className="py-20">
      <div className="container-x">
        <SectionHead eyebrow="Shop by Occasion" title="For every ceremony, every ritual" action={<TextLink>Explore All Occasions</TextLink>} />
        <div className="no-scrollbar -mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-2">
          {occasions.map((o) => (
            <a key={o.name} href="/shop" className="group w-44 shrink-0 snap-start md:w-52">
              <div className="aspect-[3/4] overflow-hidden rounded-md">
                <img src={o.img} alt={o.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
              </div>
              <div className="mt-3 font-display text-xl group-hover:text-maroon">{o.name}</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Categories() {
  return (
    <section className="bg-sage py-20">
      <div className="container-x">
        <SectionHead eyebrow="Shop by Category" title="Curated with devotion" />
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <a key={c.name} href="/shop" className="group text-center">
              <div className="mx-auto aspect-square overflow-hidden rounded-full border-4 border-background shadow-soft">
                <img src={c.img} alt={c.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
              </div>
              <div className="mt-3 text-sm font-semibold group-hover:text-maroon">{c.name}</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function BestSellers() {
  return (
    <section className="py-20">
      <div className="container-x">
        <SectionHead eyebrow="Best Sellers" title="Featured collections" sub="Sample products and prices for this prototype." action={<TextLink>View all products</TextLink>} />
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
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
    <section className="bg-sage-fade py-20">
      <div className="container-x">
        <SectionHead eyebrow="Shop by Need" title="Whoever you're shopping for" sub="From one family celebration to five hundred hampers." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {needs.map((n, i) => (
            <a key={n} href="/shop" className="group flex items-center gap-4 rounded-md border bg-background p-3 transition hover:border-maroon hover:shadow-soft">
              <img src={needImgs[i]} alt="" loading="lazy" className="h-16 w-16 rounded-sm object-cover" />
              <span className="font-display text-xl">{n}</span>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-maroon" />
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
    <section id="custom" className="py-20">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2">
        <div className="grid grid-cols-6 grid-rows-6 gap-3 h-[520px]">
          <img src={img.wedding} alt="Personalised potli" loading="lazy" className="col-span-4 row-span-4 h-full w-full rounded-md object-cover" />
          <img src={img.mala} alt="Custom mala" loading="lazy" className="col-span-2 row-span-3 h-full w-full rounded-md object-cover" />
          <img src={img.hamper} alt="Custom packaging" loading="lazy" className="col-span-2 row-span-3 h-full w-full rounded-md object-cover" />
          <img src={img.crochet} alt="Handmade gifts" loading="lazy" className="col-span-4 row-span-2 h-full w-full rounded-md object-cover" />
        </div>
        <div>
          <span className="eyebrow ornament">Customized Creations</span>
          <h2 className="mt-4 text-5xl font-medium leading-none md:text-6xl">You Imagine It.<br /><em className="text-terracotta">We Create It.</em></h2>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">Make every celebration personal with customized pooja kits, wedding accessories, handcrafted gifts, and beautifully designed packaging.</p>
          <ol className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
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
    <section className="container-x py-10">
      <div className="relative overflow-hidden rounded-md bg-royal text-on-dark">
        <img src={img.wedding} alt="" loading="lazy" className="absolute inset-y-0 right-0 hidden h-full w-1/2 object-cover lg:block" />
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-r from-burgundy to-transparent lg:block" />
        <div className="relative p-10 md:p-16 lg:w-1/2">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-gold">Wedding Spotlight</span>
          <h2 className="mt-4 text-5xl font-medium leading-none">Everything for Your Special Celebrations.</h2>
          <p className="mt-5 opacity-85">Pooja essentials, shagun items, decorative thalis, kalash, malas, potlis, varmala and gifting — in one place.</p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {tiers.map((t) => (
              <a key={t} href="/shop" className="rounded-sm border border-on-dark/30 px-4 py-3 text-sm font-semibold transition hover:bg-on-dark hover:text-burgundy">{t} →</a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Handcrafted() {
  const items = ["Crochet Jewellery", "Crochet Varmala", "Handmade Bags", "Keychains", "Table Tops", "Handmade Décor", "Crochet Flowers", "One-of-a-kind Pieces"];
  return (
    <section id="handcrafted" className="bg-ivory py-20">
      <div className="container-x grid gap-12 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <span className="eyebrow ornament">Handcrafted with Care</span>
          <h2 className="mt-4 text-5xl font-medium leading-none">Made stitch by stitch, by hand.</h2>
          <p className="mt-5 text-muted-foreground">Each crochet piece is made slowly, with patience — so no two are ever quite the same.</p>
          <div className="mt-8 flex flex-wrap gap-2">
            {items.map((i) => <a key={i} href="/shop" className="rounded-full border bg-background px-4 py-2 text-sm hover:border-leaf hover:text-leaf">{i}</a>)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:col-span-3">
          <img src={img.crochet} alt="Crochet varmala and flowers" loading="lazy" className="row-span-2 h-full w-full rounded-md object-cover" />
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
    <section id="b2b" className="py-20">
      <div className="container-x">
        <div className="rounded-md border-t-4 border-leaf bg-sage p-8 md:p-14">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-leaf">B2B / Bulk</span>
              <h2 className="mt-4 text-5xl font-medium leading-none">Your Trusted Partner for Bulk & Wholesale Orders.</h2>
              <p className="mt-5 text-muted-foreground">Thoughtfully curated products for retailers, wedding planners, event organizers, temples, resellers, and corporate gifting.</p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {feats.map((f) => <div key={f} className="flex items-center gap-2 rounded-sm bg-background p-3 text-sm font-semibold"><Check className="h-4 w-4 text-leaf" />{f}</div>)}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="overflow-hidden rounded-md border bg-background">
                <div className="flex items-center justify-between bg-leafy px-5 py-3 text-on-dark">
                  <span className="font-semibold">Designer Wedding Potli — tier pricing</span>
                  <span className="rounded-sm bg-on-dark/20 px-2 py-0.5 text-[10px] uppercase tracking-widest">Sample UI data</span>
                </div>
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr><th className="px-5 py-3">Quantity</th><th>Per unit</th><th>Saving</th></tr>
                  </thead>
                  <tbody>
                    {tiers.map(([q, p, s]) => (
                      <tr key={q} className="border-t"><td className="px-5 py-4 font-semibold">{q}</td><td className="font-bold text-maroon">{p}</td><td className="text-leaf">{s}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#contact" className={`${btn} bg-leafy text-on-dark hover:brightness-110`}>Request a Bulk Quote</a>
                <a href="/shop" className={btnOutline}>View Wholesale Collection</a>
                <button className={`${btn} underline-offset-4 hover:underline`}>Download Catalogue</button>
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
    <section className="py-16">
      <div className="container-x">
        <SectionHead eyebrow="Shop by Budget" title="Something for every purse" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {b.map(([t, src]) => (
            <a key={t} href="/shop" className="group relative aspect-[4/5] overflow-hidden rounded-md">
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/0 to-transparent" />
              <div className="absolute bottom-5 left-5 text-on-dark">
                <div className="font-display text-3xl">{t}</div>
                <div className="text-xs font-semibold uppercase tracking-widest opacity-80">Shop now →</div>
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
    <section className="bg-sage py-20">
      <div className="container-x">
        <SectionHead eyebrow="Shop by Recipient" title="Gifts they'll treasure" />
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
          {r.map(([t, src]) => (
            <a key={t} href="/shop" className="group rounded-md bg-background p-2 shadow-soft transition hover:-translate-y-1">
              <img src={src} alt="" loading="lazy" className="aspect-square w-full rounded-sm object-cover" />
              <div className="px-1 py-3 text-center font-display text-lg group-hover:text-maroon">{t}</div>
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
    <section id="story" className="py-20">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2">
        <img src={img.diwali} alt="Diwali pooja setup" loading="lazy" className="aspect-[4/5] w-full rounded-md object-cover lg:aspect-square" />
        <div>
          <span className="eyebrow ornament">Our Story</span>
          <h2 className="mt-4 text-5xl font-medium leading-none">Rooted in Tradition. Made for Every Celebration.</h2>
          <p className="mt-5 text-lg text-muted-foreground">From the first diya of Diwali to the last shagun of a wedding, we bring together the rituals, craft and care that make Indian celebrations whole — for families and businesses alike.</p>
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
    <section className="bg-ivory py-20">
      <div className="container-x">
        <SectionHead eyebrow="Testimonials & Gallery" title="Moments we've been part of" action={<TextLink>Explore the full gallery</TextLink>} />
        <div className="grid gap-5 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <figure key={i} className="rounded-md border bg-background p-6">
              <Quote className="h-6 w-6 text-gold" />
              <blockquote className="mt-3 font-display text-xl leading-snug">"Sample testimonial placeholder — real customer words will appear here once collected."</blockquote>
              <figcaption className="mt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Placeholder · Sample content</figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-8 grid grid-cols-3 gap-3 md:grid-cols-6">
          {g.map((s, i) => <img key={i} src={s} alt="Gallery" loading="lazy" className="aspect-square w-full rounded-sm object-cover transition hover:opacity-85" />)}
        </div>
      </div>
    </section>
  );
}

function Newsletter() {
  return (
    <section className="bg-ivory-fade border-t py-20">
      <div className="container-x max-w-2xl text-center">
        <span className="eyebrow ornament">Stay in touch</span>
        <h2 className="mt-4 text-5xl font-medium">Discover Something Meaningful.</h2>
        <p className="mt-3 text-muted-foreground">Festive edits, new handcrafted arrivals and early access — once a month.</p>
        <form className="mx-auto mt-8 flex max-w-md gap-2" onSubmit={(e) => e.preventDefault()}>
          <input type="email" placeholder="Your email address" className="flex-1 rounded-sm border bg-background px-4 py-3 text-sm outline-none focus:border-maroon" />
          <button className={btnPrimary}>Subscribe</button>
        </form>
        <a href="#" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-leaf"><MessageCircle className="h-4 w-4" /> Or enquire on WhatsApp</a>
      </div>
    </section>
  );
}
