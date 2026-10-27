import { Heart, Eye, Star, ShoppingBag, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useNavigate } from "@tanstack/react-router";
import { discountPct } from "@/lib/format";
import { Price } from "@/components/site/Price";
import { useCart } from "@/lib/cart-context";
import { toggleWishlist } from "@/fns/wishlist";
import { useSession } from "@/lib/auth-client";

export type CardProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  mrp?: number | null;
  badge?: string | null;
  stock: number;
  isFeatured: boolean;
  imageUrl?: string | null;
};

export function ProductCard({ p }: { p: CardProduct }) {
  const [liked, setLiked] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const navigate = useNavigate();
  const { add } = useCart();
  const { data: session } = useSession();
  const outOfStock = p.stock < 1;
  const off = p.mrp ? discountPct(p.price, p.mrp) : 0;

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user) {
      navigate({ to: "/login", search: { redirect: `/product/${p.slug}` } as any });
      return;
    }
    try {
      const res = await toggleWishlist({ data: { productId: p.id } });
      setLiked(res.wishlisted);
      toast(res.wishlisted ? "Added to wishlist" : "Removed from wishlist");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock || adding) return;
    setAdding(true);
    try {
      await add(p.id);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch {
      // cart context already toasts the error
    } finally {
      setAdding(false);
    }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast("Quick view coming soon");
  };

  return (
    <article className="group flex flex-col rounded-xl border border-transparent bg-background transition-all duration-300 hover:border-maroon/10 hover:shadow-lift">
      {/* ── Image ── */}
      <Link
        to="/product/$slug"
        params={{ slug: p.slug }}
        className="relative block aspect-[4/5] overflow-hidden rounded-t-xl bg-sage"
      >
        {p.imageUrl ? (
          <img
            src={p.imageUrl}
            alt={p.name}
            loading="lazy"
            decoding="async"
            width={1024}
            height={1024}
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div className="h-full w-full bg-sage" />
        )}

        {/* Badge */}
        {(p.badge || outOfStock) && (
          <span className={`absolute left-3 top-3 rounded-sm px-2 py-1 text-[11px] font-bold uppercase tracking-widest ${
            outOfStock ? "bg-gray-900/80 text-white" : "bg-ivory/95 text-burgundy"
          }`}>
            {outOfStock ? "Out of Stock" : p.badge}
          </span>
        )}

        {/* Wishlist */}
        <button
          aria-label="Add to wishlist"
          onClick={handleWishlist}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 shadow-soft transition hover:scale-110 press"
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-maroon text-maroon" : "text-ink"}`} />
        </button>

        {/* Quick view — always visible on mobile, hover on desktop */}
        <button
          aria-label="Quick view"
          onClick={handleQuickView}
          className="absolute right-3 top-14 grid h-9 w-9 place-items-center rounded-full bg-background/90 shadow-soft transition hover:scale-110 press opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:translate-y-1 sm:group-hover:translate-y-0 sm:duration-200"
        >
          <Eye className="h-4 w-4 text-ink" />
        </button>
      </Link>

      {/* ── Info ── */}
      <Link
        to="/product/$slug"
        params={{ slug: p.slug }}
        className="flex flex-col flex-1 px-3 pt-2.5"
      >
        {/* Rating */}
        <div className="flex items-center gap-1 text-[13px] text-muted-foreground">
          <Star className="h-3 w-3 fill-gold text-gold" />
          <span className="opacity-70">4.8</span>
        </div>

        {/* Name — always visible, 2-line clamp, fixed min-height keeps cards aligned */}
        <h3 className="mt-1 font-display text-[15px] leading-snug min-h-[2.5em] line-clamp-2 text-ink">
          {p.name || " "}
        </h3>

        {/* Price */}
        <div className="mt-1.5 flex flex-wrap items-baseline gap-1.5">
          <Price paise={p.price} className="text-[15px] font-bold" />
          {p.mrp && <Price paise={p.mrp} className="text-[13px] text-muted-foreground line-through" />}
          {off > 0 && <span className="text-[12px] font-semibold text-leaf">{off}% off</span>}
        </div>

        {/* Taxes line */}
        <p className="mt-0.5 text-[11px] text-muted-foreground/70">Inclusive of all taxes</p>
      </Link>

      {/* ── Add to Cart button — outside the Link so click doesn't navigate ── */}
      <div className="px-3 pb-3 pt-2.5">
        <button
          onClick={handleAdd}
          disabled={outOfStock || adding}
          className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-semibold transition-all press
            ${outOfStock
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : added
                ? "bg-leaf text-white"
                : "bg-maroon text-on-dark hover:bg-burgundy active:scale-[0.98]"
            }
            disabled:opacity-70 disabled:cursor-not-allowed`}
        >
          {adding ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</>
          ) : outOfStock ? (
            <>Out of Stock</>
          ) : added ? (
            <><Check className="h-4 w-4" /> Added ✓</>
          ) : (
            <><ShoppingBag className="h-4 w-4" /> Add to Cart</>
          )}
        </button>
      </div>
    </article>
  );
}
