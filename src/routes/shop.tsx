import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { products } from "@/lib/catalog";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop All Products — Murlit Enterprises" },
      { name: "description", content: "Browse pooja kits, wedding potlis, malas, kalash, gift hampers and handcrafted crochet from Murlit Enterprises." },
      { property: "og:title", content: "Shop All Products — Murlit Enterprises" },
      { property: "og:description", content: "Pooja kits, wedding essentials, malas, hampers and handcrafted pieces." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { q?: string; price?: number } => ({
    q: typeof s.q === "string" && s.q ? s.q : undefined,
    price: typeof s.price === "number" && s.price >= 0 && s.price <= 3 ? s.price : undefined,
  }),
  component: Shop,
});

const cats = Array.from(new Set(products.map((p) => p.category)));
const occs = Array.from(new Set(products.map((p) => p.occasion)));
const prices = [["Under ₹499", 0, 499], ["₹500–₹999", 500, 999], ["₹1,000–₹2,999", 1000, 2999], ["₹3,000+", 3000, 1e9]] as const;

const stop = new Set(["kit", "kits", "products", "items", "and", "&", "ki", "ji", "for"]);
const words = (t: string) => t.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !stop.has(w));

function Shop() {
  const { q, price: priceParam } = Route.useSearch();
  const [cat, setCat] = useState<string[]>([]);
  const [occ, setOcc] = useState<string[]>([]);
  const [price, setPrice] = useState<number | null>(priceParam ?? null);
  useEffect(() => { setPrice(priceParam ?? null); }, [priceParam]);
  const [sort, setSort] = useState("featured");
  const [showF, setShowF] = useState(false);

  const matched = useMemo(() => {
    if (!q) return { items: products, related: false };
    const ws = words(q);
    const hits = products.filter((p) => { const hay = words(`${p.name} ${p.category} ${p.occasion}`); return ws.some((w) => hay.some((h) => h.startsWith(w.slice(0, 5)))); });
    return hits.length ? { items: hits, related: false } : { items: products, related: true };
  }, [q]);

  const list = useMemo(() => {
    let l = matched.items.filter((p) => (!cat.length || cat.includes(p.category)) && (!occ.length || occ.includes(p.occasion)) &&
      (price === null || (p.price >= prices[price]![1] && p.price <= prices[price]![2])));
    if (sort === "low") l = [...l].sort((a, b) => a.price - b.price);
    if (sort === "high") l = [...l].sort((a, b) => b.price - a.price);
    return l;
  }, [matched, cat, occ, price, sort]);

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const Group = ({ title, items, sel, set }: { title: string; items: string[]; sel: string[]; set: (v: string[]) => void }) => (
    <div className="border-b py-5">
      <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-burgundy">{title}</h4>
      {items.map((i) => (
        <label key={i} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
          <input type="checkbox" checked={sel.includes(i)} onChange={() => toggle(sel, set, i)} className="accent-maroon" /> {i}
        </label>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen">
      <Header />
      <section className="bg-ivory-fade border-b">
        <div className="container-x py-12">
          <nav className="text-xs text-muted-foreground"><Link to="/" className="hover:text-maroon">Home</Link> / <Link to="/shop" className="hover:text-maroon">Shop</Link>{q && <> / <span className="text-ink">{q}</span></>}</nav>
          <h1 className="mt-3 animate-fade-up text-5xl font-medium md:text-6xl">{q ?? "All Products"}</h1>
          <p className="mt-3 max-w-xl animate-fade-up delay-1 text-muted-foreground">{matched.related && <b className="mb-1 block text-terracotta">More {q} pieces are coming soon — here are related products.</b>}Pooja essentials, wedding collections, malas and handcrafted pieces — curated for every occasion. Sample catalogue for this prototype.</p>
        </div>
      </section>
      <div className="container-x grid gap-10 py-10 lg:grid-cols-[240px_1fr]">
        <aside className={`${showF ? "block" : "hidden"} lg:block`}>
          <Group title="Category" items={cats} sel={cat} set={setCat} />
          <Group title="Occasion" items={occs} sel={occ} set={setOcc} />
          <div className="border-b py-5">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-burgundy">Price</h4>
            {prices.map(([l], i) => (
              <label key={l} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
                <input type="radio" name="price" checked={price === i} onChange={() => setPrice(i)} className="accent-maroon" /> {l}
              </label>
            ))}
          </div>
          <div className="py-5">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-burgundy">Availability</h4>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="accent-maroon" /> In stock</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-maroon" /> Made to order</label>
          </div>
          <button onClick={() => { setCat([]); setOcc([]); setPrice(null); }} className="text-sm font-bold text-maroon hover:underline">Clear all filters</button>
        </aside>
        <div>
          <div className="mb-6 flex items-center justify-between gap-4">
            <button onClick={() => setShowF(!showF)} className="flex items-center gap-2 text-sm font-semibold lg:hidden"><SlidersHorizontal className="h-4 w-4" /> Filters</button>
            <span className="text-sm text-muted-foreground">{list.length} products</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-sm border bg-background px-3 py-2 text-sm">
              <option value="featured">Sort: Featured</option>
              <option value="low">Price: Low to High</option>
              <option value="high">Price: High to Low</option>
            </select>
          </div>
          <div key={`${q}-${price}-${cat}-${occ}-${sort}`} data-stagger className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3">
            {list.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
          {!list.length && <p className="py-20 text-center text-muted-foreground">No products match these filters.</p>}
        </div>
      </div>
      <Footer />
    </div>
  );
}
