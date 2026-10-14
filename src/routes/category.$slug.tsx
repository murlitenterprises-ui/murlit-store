import { createFileRoute, notFound, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Heart, Star, Plus, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { shopMenuColumns } from "@/lib/menu";
import { products, inr } from "@/lib/catalog";

const WA_LINK = "https://wa.me/919999999999";

export const Route = createFileRoute("/category/$slug")({
  validateSearch: (s: Record<string, unknown>) => ({
    sub: typeof s.sub === "string" ? s.sub : undefined,
  }),
  loader: ({ params }) => {
    const col = shopMenuColumns.find((c) => c.slug === params.slug);
    if (!col) throw notFound();
    return col;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — Murlit Enterprises` },
          { name: "description", content: `Shop ${loaderData.title} — pooja essentials, wedding collections, handcrafted gifts and more from Murlit Enterprises.` },
          { property: "og:title", content: `${loaderData.title} — Murlit Enterprises` },
        ]
      : [],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const col = Route.useLoaderData();
  const { sub } = Route.useSearch();
  const navigate = useNavigate({ from: "/category/$slug" });
  const productsRef = useRef<HTMLDivElement>(null);

  const activeLink = col.links.find((l) => l.subSlug === sub);

  const filtered = sub
    ? products.filter((p) => p.categorySlug === col.slug && p.subSlug === sub)
    : products.filter((p) => p.categorySlug === col.slug);

  // Scroll to products section when a sub-option is selected
  useEffect(() => {
    if (sub && productsRef.current) {
      productsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [sub]);

  const allCategoryProducts = products.filter((p) => p.categorySlug === col.slug);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="bg-ivory-fade">
        <div className="container-x py-8 lg:py-10 text-center">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-maroon">Home</Link>
            <span>/</span>
            {sub ? (
              <>
                <Link
                  to="/category/$slug"
                  params={{ slug: col.slug! }}
                  className="hover:text-maroon"
                  viewTransition={false}
                >
                  {col.title}
                </Link>
                <span>/</span>
                <span className="text-foreground font-medium">{activeLink?.label}</span>
              </>
            ) : (
              <span className="text-foreground font-medium">{col.title}</span>
            )}
          </nav>

          {/* Page heading */}
          <h1 className="mt-3 font-display text-4xl font-medium text-maroon md:text-5xl">{col.title}</h1>

          {/* Sub-option image circles */}
          <div className="mt-10 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-6 text-left">
            {col.links.map((link) => {
              const isActive = sub === link.subSlug;
              return (
                <button
                  key={link.label}
                  title={link.label}
                  onClick={() => {
                    navigate({
                      search: isActive ? { sub: undefined } : { sub: link.subSlug },
                      replace: true,
                      viewTransition: false,
                    });
                  }}
                  className="group text-center focus:outline-none"
                >
                  <div
                    className={`mx-auto aspect-square w-full max-w-[18svh] overflow-hidden rounded-full shadow-soft transition-all duration-300 ${
                      isActive
                        ? "border-4 border-maroon ring-2 ring-maroon ring-offset-2"
                        : "border-4 border-background hover:border-maroon/40"
                    }`}
                  >
                    <img
                      src={link.img}
                      alt={link.label}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div
                    className={`mt-2 text-xs font-semibold md:text-sm ${
                      isActive ? "text-maroon" : "group-hover:text-maroon"
                    }`}
                  >
                    {link.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Products section */}
        <div ref={productsRef} className="container-x scroll-mt-8 pb-16 pt-8 lg:scroll-mt-10">
          {/* Section heading */}
          <div className="mb-8 text-center">
            {sub && activeLink ? (
              <>
                <h2 className="font-display text-3xl font-medium text-maroon md:text-4xl">
                  {activeLink.label}
                </h2>
                {allCategoryProducts.length > 0 && (
                  <button
                    onClick={() =>
                      navigate({ search: { sub: undefined }, replace: true, viewTransition: false })
                    }
                    className="mt-2 text-sm text-muted-foreground underline-offset-4 hover:text-maroon hover:underline"
                  >
                    Show all {col.title} products
                  </button>
                )}
              </>
            ) : (
              <h2 className="font-display text-3xl font-medium text-maroon md:text-4xl">
                All {col.title} Products
              </h2>
            )}
          </div>

          {filtered.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center gap-6 py-16 text-center">
              <div className="rounded-full bg-sage p-8">
                <img
                  src={col.img}
                  alt=""
                  className="h-24 w-24 rounded-full object-cover opacity-60"
                />
              </div>
              <div>
                <p className="font-display text-2xl text-maroon">New pieces coming soon</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  We&rsquo;re handcrafting something special. Enquire to place a custom order.
                </p>
              </div>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-leaf px-6 py-3 text-sm font-semibold text-white transition hover:bg-leaf-deep"
              >
                <MessageCircle className="h-4 w-4" />
                Enquire on WhatsApp
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((p) => (
                <CategoryProductCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function CategoryProductCard({ p }: { p: import("@/lib/catalog").Product }) {
  const [liked, setLiked] = useState(false);
  const off = p.mrp ? Math.round((1 - p.price / p.mrp) * 100) : 0;

  return (
    <div className="group flex flex-col rounded-md transition-transform duration-500 hover:-translate-y-1">
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-sage transition-shadow duration-500 group-hover:shadow-lift">
        <img
          src={p.img}
          alt={p.name}
          loading="lazy"
          decoding="async"
          width={800}
          height={1000}
          className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
        />
        {p.badge && (
          <span className="absolute left-3 top-3 rounded-sm bg-ivory/95 px-2 py-1 text-[11px] font-bold uppercase tracking-widest text-burgundy">
            {p.badge}
          </span>
        )}
        <button
          aria-label="Add to wishlist"
          onClick={() => setLiked((v) => !v)}
          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-background/90 shadow-soft transition press hover:scale-110"
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-maroon text-maroon" : "text-ink"}`} />
        </button>
      </div>

      {/* Info */}
      <div className="mt-3 space-y-1">
        <div className="flex items-center gap-1 text-[14px] text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" /> {p.rating}
        </div>
        <h3 className="font-display text-[20px] leading-tight">{p.name}</h3>
        {p.description && (
          <p className="line-clamp-2 text-[13px] text-muted-foreground">{p.description}</p>
        )}
        <div className="flex items-baseline gap-2">
          <span className="text-[18px] font-bold">{inr(p.price)}</span>
          {p.mrp && (
            <span className="text-[15px] text-muted-foreground line-through">{inr(p.mrp)}</span>
          )}
          {off > 0 && (
            <span className="text-[15px] font-semibold text-leaf">{off}% off</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => toast.success(`${p.name} added to cart`)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-sm bg-royal py-2.5 text-xs font-semibold text-on-dark press"
        >
          <Plus className="h-3.5 w-3.5" /> Add to cart
        </button>
        <a
          href={`${WA_LINK}?text=${encodeURIComponent(`Hi, I'd like to enquire about: ${p.name}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-sm border border-leaf px-3 py-2.5 text-xs font-semibold text-leaf press hover:bg-leaf hover:text-white transition-colors"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
