import { Heart, Eye, Star, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { inrFromPaise, discountPct } from "@/lib/format";

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
  const off = p.mrp ? discountPct(p.price, p.mrp) : 0;
  return (
    <Link to="/product/$slug" params={{ slug: p.slug }} className="group flex flex-col rounded-md transition-transform duration-500 hover:-translate-y-1">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-sage transition-shadow duration-500 group-hover:shadow-lift">
        {p.imageUrl ? (
          <img src={p.imageUrl} alt={p.name} loading="lazy" decoding="async" width={1024} height={1024}
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]" />
        ) : (
          <div className="h-full w-full bg-sage" />
        )}
        {p.badge && (
          <span className="absolute left-3 top-3 rounded-sm bg-ivory/95 px-2 py-1 text-[11px] font-bold uppercase tracking-widest text-burgundy">
            {p.badge}
          </span>
        )}
        <button aria-label="Add to wishlist" onClick={(e) => { e.preventDefault(); setLiked(!liked); }}
          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-background/90 shadow-soft transition press hover:scale-110">
          <Heart className={`h-4 w-4 ${liked ? "fill-maroon text-maroon" : "text-ink"}`} />
        </button>
        <div className="absolute inset-x-3 bottom-3 flex translate-y-3 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <button onClick={(e) => { e.preventDefault(); toast("Quick view coming soon"); }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-sm bg-background/95 py-2.5 text-xs font-semibold press">
            <Eye className="h-3.5 w-3.5" /> Quick view
          </button>
          <button onClick={(e) => { e.preventDefault(); toast("Cart coming soon — we'll notify you!"); }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-sm bg-royal py-2.5 text-xs font-semibold text-on-dark press">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <div className="flex items-center gap-1 text-[14px] text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" /> <span className="opacity-70">sample rating</span>
        </div>
        <h3 className="font-display text-[20px] leading-tight">{p.name}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-[18px] font-bold">{inrFromPaise(p.price)}</span>
          {p.mrp && <span className="text-[15px] text-muted-foreground line-through">{inrFromPaise(p.mrp)}</span>}
          {off > 0 && <span className="text-[15px] font-semibold text-leaf">{off}% off</span>}
        </div>
      </div>
    </Link>
  );
}
