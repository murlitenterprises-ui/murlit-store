import { createFileRoute, notFound, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { Heart, ChevronLeft, ChevronRight, Minus, Plus, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { getProductBySlug } from "@/fns/catalog";
import { inrFromPaise, discountPct } from "@/lib/format";
import { Price } from "@/components/site/Price";
import { useCart } from "@/lib/cart-context";
import { toggleWishlist } from "@/fns/wishlist";
import { useSession } from "@/lib/auth-client";

const WA_LINK = "https://wa.me/919999999999";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const product = await getProductBySlug({ data: { slug: params.slug } });
    if (!product) throw notFound();
    return product;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} — Murlit Enterprises` },
          { name: "description", content: loaderData.seoDescription ?? loaderData.description ?? `Buy ${loaderData.name} from Murlit Enterprises` },
          { property: "og:title", content: `${loaderData.name} — Murlit Enterprises` },
          { property: "og:description", content: loaderData.description ?? `Buy ${loaderData.name}` },
          ...(loaderData.imageUrl ? [{ property: "og:image", content: loaderData.imageUrl }] : []),
        ]
      : [],
  }),
  component: ProductPage,
});

type LoaderProduct = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

function ProductPage() {
  const product = Route.useLoaderData() as LoaderProduct;
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [liked, setLiked] = useState(false);
  const [adding, setAdding] = useState(false);
  const [tab, setTab] = useState<"description" | "details" | "shipping">("description");
  const { add } = useCart();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const galleryRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef(0);

  const images = product.images ?? [];
  const mainSrc = images[activeImg]?.url ?? product.imageUrl ?? null;

  const prev = useCallback(() => setActiveImg((i) => (i === 0 ? images.length - 1 : i - 1)), [images.length]);
  const next = useCallback(() => setActiveImg((i) => (i === images.length - 1 ? 0 : i + 1)), [images.length]);

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, [prev, next]);

  const off = product.mrp ? discountPct(product.price, product.mrp) : 0;
  const lowStock = product.stock > 0 && product.stock < 5;

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Breadcrumb */}
        <div className="border-b bg-ivory-fade">
          <div className="container-x py-3 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-maroon">Home</Link>
            {product.category && (
              <>
                <span className="mx-1.5">/</span>
                <Link to="/category/$slug" params={{ slug: product.category.slug ?? "" }} className="hover:text-maroon">
                  {product.category.name}
                </Link>
              </>
            )}
            <span className="mx-1.5">/</span>
            <span className="text-foreground font-medium">{product.name}</span>
          </div>
        </div>

        {/* Main product area */}
        <div className="container-x py-8 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
            {/* Gallery */}
            <div
              ref={galleryRef}
              tabIndex={0}
              className="outline-none"
              onTouchStart={(e) => { touchStart.current = e.touches[0]!.clientX; }}
              onTouchEnd={(e) => {
                const dx = e.changedTouches[0]!.clientX - touchStart.current;
                if (dx > 50) prev();
                else if (dx < -50) next();
              }}
            >
              {/* Main image */}
              <div className="relative aspect-square overflow-hidden rounded-md bg-sage group">
                {mainSrc ? (
                  <img
                    src={mainSrc}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-sage" />
                )}
                {images.length > 1 && (
                  <>
                    <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-background/90 shadow-soft hover:scale-110 transition">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-background/90 shadow-soft hover:scale-110 transition">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
                {product.badge && (
                  <span className="absolute left-3 top-3 rounded-sm bg-ivory/95 px-2 py-1 text-[11px] font-bold uppercase tracking-widest text-burgundy">
                    {product.badge}
                  </span>
                )}
              </div>
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImg(i)}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-sm border-2 transition ${
                        i === activeImg ? "border-maroon" : "border-transparent hover:border-maroon/40"
                      }`}
                    >
                      <img src={img.url} alt={img.alt ?? ""} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product info */}
            <div>
              <h1 className="font-display text-3xl font-medium leading-tight md:text-4xl">{product.name}</h1>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-3">
                <Price paise={product.price} usdCents={product.priceUsdCents} className="text-3xl font-bold" />
                {product.mrp && (
                  <Price paise={product.mrp} className="text-xl text-muted-foreground line-through" />
                )}
                {off > 0 && (
                  <span className="rounded-sm bg-leaf/10 px-2 py-1 text-sm font-bold text-leaf">{off}% off</span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes</p>

              {/* Stock */}
              <div className="mt-3">
                {product.stock === 0 ? (
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">Out of stock</span>
                ) : lowStock ? (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Only {product.stock} left</span>
                ) : (
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">In stock</span>
                )}
              </div>

              {/* Short description */}
              {product.shortDescription && (
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">{product.shortDescription}</p>
              )}

              {/* Qty + actions */}
              <div className="mt-6 space-y-3">
                {/* Quantity stepper */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold">Quantity</span>
                  <div className="flex items-center rounded-sm border">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={product.stock === 0}
                      className="grid h-9 w-9 place-items-center hover:bg-sage disabled:opacity-40"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                    <button
                      onClick={() => setQty((q) => q + 1)}
                      disabled={product.stock === 0}
                      className="grid h-9 w-9 place-items-center hover:bg-sage disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      if (product.stock === 0) return;
                      setAdding(true);
                      try { await add(product.id, qty); } finally { setAdding(false); }
                    }}
                    disabled={product.stock === 0 || adding}
                    className="flex flex-1 items-center justify-center gap-2 rounded-sm bg-royal py-3.5 text-sm font-bold text-on-dark transition hover:brightness-110 disabled:opacity-50"
                  >
                    {adding ? "Adding…" : product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                  </button>
                  <button
                    onClick={async () => {
                      if (product.stock === 0) return;
                      setAdding(true);
                      try {
                        await add(product.id, qty);
                        navigate({ to: "/cart" });
                      } finally { setAdding(false); }
                    }}
                    disabled={product.stock === 0 || adding}
                    className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-royal py-3.5 text-sm font-bold text-royal transition hover:bg-royal hover:text-on-dark disabled:opacity-50"
                  >
                    Buy Now
                  </button>
                  <button
                    onClick={async () => {
                      if (!session?.user) {
                        navigate({ to: "/login", search: { redirect: `/product/${product.slug}` } as any });
                        return;
                      }
                      try {
                        const r = await toggleWishlist({ data: { productId: product.id } });
                        setLiked(r.wishlisted);
                        toast(r.wishlisted ? "Added to wishlist" : "Removed from wishlist");
                      } catch { toast.error("Failed"); }
                    }}
                    className="grid h-12 w-12 place-items-center rounded-sm border transition hover:border-maroon"
                  >
                    <Heart className={`h-5 w-5 ${liked ? "fill-maroon text-maroon" : "text-ink"}`} />
                  </button>
                </div>

                {/* WhatsApp */}
                <a
                  href={`${WA_LINK}?text=${encodeURIComponent(`Hi, I'd like to enquire about: ${product.name} (SKU: ${product.sku})`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-sm border border-leaf py-3 text-sm font-semibold text-leaf transition hover:bg-leaf hover:text-white"
                >
                  <MessageCircle className="h-4 w-4" />
                  Enquire on WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-12 border-t pt-8">
            <div className="flex gap-6 border-b">
              {(["description", "details", "shipping"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`pb-3 text-sm font-semibold capitalize transition border-b-2 -mb-px ${
                    tab === t ? "border-maroon text-maroon" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "shipping" ? "Shipping & Returns" : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div className="mt-6 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              {tab === "description" && (
                <p>{product.description ?? "No description available."}</p>
              )}
              {tab === "details" && (
                <dl className="space-y-2">
                  {product.materials && <div className="flex gap-3"><dt className="w-28 shrink-0 font-semibold text-foreground">Materials</dt><dd>{product.materials}</dd></div>}
                  {product.dimensions && <div className="flex gap-3"><dt className="w-28 shrink-0 font-semibold text-foreground">Dimensions</dt><dd>{product.dimensions}</dd></div>}
                  {product.weight && <div className="flex gap-3"><dt className="w-28 shrink-0 font-semibold text-foreground">Weight</dt><dd>{product.weight}</dd></div>}
                  <div className="flex gap-3"><dt className="w-28 shrink-0 font-semibold text-foreground">SKU</dt><dd>{product.sku}</dd></div>
                  <div className="flex gap-3"><dt className="w-28 shrink-0 font-semibold text-foreground">GST Rate</dt><dd>{product.gstRate}%</dd></div>
                  {product.hsnCode && <div className="flex gap-3"><dt className="w-28 shrink-0 font-semibold text-foreground">HSN Code</dt><dd>{product.hsnCode}</dd></div>}
                </dl>
              )}
              {tab === "shipping" && (
                <div className="space-y-2">
                  <p>Usually ships in 3–7 business days.</p>
                  <p>Free shipping above ₹500. Returns within 7 days for damaged or wrong items.</p>
                  <p>WhatsApp us for any issues.</p>
                  <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-leaf hover:underline font-semibold">
                    <MessageCircle className="h-4 w-4" /> Contact on WhatsApp
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Related products */}
          {product.related.length > 0 && (
            <div className="mt-12">
              <h2 className="font-display text-2xl font-medium">More from this collection</h2>
              <div className="no-scrollbar mt-6 -mx-5 flex snap-x gap-5 overflow-x-auto px-5 pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible">
                {product.related.map((p) => (
                  <div key={p.id} className="w-56 shrink-0 snap-start lg:w-auto">
                    <ProductCard p={p} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
