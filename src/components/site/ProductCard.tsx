import { Heart, Eye, Star, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { inr, type Product } from "@/lib/catalog";

export function ProductCard({ p }: { p: Product }) {
  const [liked, setLiked] = useState(false);
  const off = p.mrp ? Math.round((1 - p.price / p.mrp) * 100) : 0;
  return (
    <div className="group flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-sage">
        <img src={p.img} alt={p.name} loading="lazy" width={1024} height={1024}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        {p.badge && (
          <span className="absolute left-3 top-3 rounded-sm bg-ivory/95 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-burgundy">
            {p.badge}
          </span>
        )}
        <button aria-label="Add to wishlist" onClick={() => setLiked(!liked)}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 shadow-soft transition hover:scale-110">
          <Heart className={`h-4 w-4 ${liked ? "fill-maroon text-maroon" : "text-ink"}`} />
        </button>
        <div className="absolute inset-x-3 bottom-3 flex translate-y-3 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button onClick={() => toast("Quick view is a prototype preview")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-sm bg-background/95 py-2.5 text-xs font-semibold">
            <Eye className="h-3.5 w-3.5" /> Quick view
          </button>
          <button onClick={() => toast.success(`${p.name} added to cart`)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-sm bg-royal py-2.5 text-xs font-semibold text-on-dark">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3 w-3 fill-gold text-gold" /> {p.rating} <span className="opacity-70">· sample rating</span>
        </div>
        <h3 className="font-display text-lg leading-tight">{p.name}</h3>
        <div className="flex items-baseline gap-2 text-sm">
          <span className="font-bold">{inr(p.price)}</span>
          {p.mrp && <span className="text-muted-foreground line-through">{inr(p.mrp)}</span>}
          {off > 0 && <span className="text-xs font-semibold text-leaf">{off}% off</span>}
        </div>
      </div>
    </div>
  );
}
