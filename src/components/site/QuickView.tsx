import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, ChevronLeft, ChevronRight, Minus, Plus, Star, ShoppingBag, Check, Loader2, ExternalLink, X } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { getProductBySlug } from "@/fns/catalog";
import { Price } from "@/components/site/Price";
import { discountPct } from "@/lib/format";
import { useCart } from "@/lib/cart-context";
import { toggleWishlist } from "@/fns/wishlist";
import { useSession } from "@/lib/auth-client";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

function QuickViewSkeleton() {
  return (
    <div className="grid gap-6 p-6 sm:grid-cols-2 sm:gap-8 sm:p-8">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-11 w-full mt-6" />
      </div>
    </div>
  );
}

function QuickViewBody({ slug, onClose }: { slug: string; onClose: () => void }) {
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug({ data: { slug } }),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [liked, setLiked] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const { add } = useCart();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const touchStart = { current: 0 };

  const images = product?.images ?? [];
  const mainSrc = images[activeImg]?.url ?? product?.imageUrl ?? null;

  const prev = useCallback(() => setActiveImg((i) => (i === 0 ? Math.max(images.length - 1, 0) : i - 1)), [images.length]);
  const next = useCallback(() => setActiveImg((i) => (i === images.length - 1 ? 0 : i + 1)), [images.length]);

  const handleAdd = async () => {
    if (!product || product.stock < 1 || adding) return;
    setAdding(true);
    try {
      await add(product.id, qty);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch {
      // cart context toasts error
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = async () => {
    if (!product) return;
    if (!session?.user) { navigate({ to: "/login", search: { redirect: `/product/${product.slug}` } as any }); return; }
    try {
      const r = await toggleWishlist({ data: { productId: product.id } });
      setLiked(r.wishlisted);
      toast(r.wishlisted ? "Added to wishlist" : "Removed from wishlist");
    } catch { toast.error("Failed"); }
  };

  if (isLoading || !product) return <QuickViewSkeleton />;

  const off = product.mrp ? discountPct(product.price, product.mrp) : 0;
  const outOfStock = product.stock < 1;
  const lowStock = !outOfStock && product.stock < 5;

  return (
    <div className="grid max-h-[90dvh] overflow-y-auto sm:max-h-none sm:overflow-visible sm:grid-cols-2">
      {/* Gallery */}
      <div className="bg-sage/30 p-4 sm:p-6"
        onTouchStart={(e) => { touchStart.current = e.touches[0]!.clientX; }}
        onTouchEnd={(e) => { const dx = e.changedTouches[0]!.clientX - touchStart.current; if (dx > 50) prev(); else if (dx < -50) next(); }}
      >
        <div className="relative aspect-square overflow-hidden rounded-lg bg-sage">
          {mainSrc ? (
            <img src={mainSrc} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-sage" />
          )}
          {images.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-background/90 shadow-soft hover:scale-110 transition">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-background/90 shadow-soft hover:scale-110 transition">
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
          {product.badge && (
            <span className="absolute left-3 top-3 rounded-sm bg-ivory/95 px-2 py-1 text-[11px] font-bold uppercase tracking-widest text-burgundy">
              {product.badge}
            </span>
          )}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button key={img.id} onClick={() => setActiveImg(i)}
                className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition ${i === activeImg ? "border-maroon" : "border-transparent hover:border-maroon/40"}`}
              >
                <img src={img.url} alt={img.alt ?? ""} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-3 p-5 sm:p-7">
        <div>
          {product.badge && (
            <span className="mb-2 inline-block rounded-sm bg-ivory px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-burgundy">{product.badge}</span>
          )}
          <h2 className="font-display text-2xl leading-tight text-ink">{product.name}</h2>
          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
            <span>4.8</span>
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-baseline gap-2">
            <Price paise={product.price} className="text-2xl font-bold" />
            {product.mrp && <Price paise={product.mrp} className="text-base text-muted-foreground line-through" />}
            {off > 0 && <span className="text-sm font-semibold text-leaf">{off}% off</span>}
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Inclusive of all taxes</p>
        </div>

        {product.shortDescription && (
          <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">{product.shortDescription}</p>
        )}

        <div>
          {outOfStock ? (
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">Out of stock</span>
          ) : lowStock ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Only {product.stock} left</span>
          ) : (
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">In stock</span>
          )}
        </div>

        {/* Qty stepper */}
        {!outOfStock && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">Qty</span>
            <div className="flex items-center rounded-md border">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-9 w-9 place-items-center hover:bg-sage transition">
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-10 text-center text-sm font-semibold">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="grid h-9 w-9 place-items-center hover:bg-sage transition">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto flex gap-2">
          <button
            onClick={handleAdd}
            disabled={outOfStock || adding}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition press disabled:cursor-not-allowed disabled:opacity-60
              ${outOfStock ? "bg-muted text-muted-foreground" : added ? "bg-leaf text-white" : "bg-maroon text-on-dark hover:bg-burgundy"}`}
          >
            {adding ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</> :
             outOfStock ? "Out of Stock" :
             added ? <><Check className="h-4 w-4" /> Added ✓</> :
             <><ShoppingBag className="h-4 w-4" /> Add to Cart</>}
          </button>
          <button onClick={handleWishlist} aria-label="Wishlist"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border transition hover:border-maroon">
            <Heart className={`h-5 w-5 ${liked ? "fill-maroon text-maroon" : ""}`} />
          </button>
        </div>

        <Link to="/product/$slug" params={{ slug: product.slug }} onClick={onClose}
          className="flex items-center justify-center gap-1.5 text-sm font-semibold text-maroon hover:text-burgundy transition">
          View full details <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function QuickView({ slug, open, onClose }: { slug: string; open: boolean; onClose: () => void }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(v) => { if (!v) onClose(); }} shouldScaleBackground={false}>
        <DrawerContent className="max-h-[90dvh] overflow-hidden">
          <div className="overflow-y-auto">
            <QuickViewBody slug={slug} onClose={onClose} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-[900px] p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">Quick View</DialogTitle>
        <QuickViewBody slug={slug} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
