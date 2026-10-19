import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { listProducts, getNavCategories } from "@/fns/catalog";
import type { ProductRow, CategoryTree } from "@/lib/catalog-types";

const PRICES = [
  { label: "Under ₹499",      min: 0,      max: 49900 },
  { label: "₹500–₹999",       min: 50000,  max: 99900 },
  { label: "₹1,000–₹2,999",   min: 100000, max: 299900 },
  { label: "₹3,000+",         min: 300000, max: undefined },
] as const;

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>) => ({
    q:            typeof s.q === "string" && s.q ? s.q : undefined,
    categorySlug: typeof s.categorySlug === "string" ? s.categorySlug : undefined,
    minPrice:     typeof s.minPrice === "number" ? s.minPrice : undefined,
    maxPrice:     typeof s.maxPrice === "number" ? s.maxPrice : undefined,
    inStock:      s.inStock === true || s.inStock === "true" ? true : undefined,
    sort:         (["featured","newest","price_asc","price_desc","name"] as const).includes(s.sort as any)
                    ? (s.sort as "featured"|"newest"|"price_asc"|"price_desc"|"name")
                    : undefined,
    page:         typeof s.page === "number" && s.page > 0 ? s.page : undefined,
  }),
  loader: async ({ location }) => {
    const { q, categorySlug, minPrice, maxPrice, inStock, sort, page } = location.search as any;
    const [result, navCategories] = await Promise.all([
      listProducts({ data: { q, categorySlug, minPrice, maxPrice, inStock, sort, page, pageSize: 24 } }),
      getNavCategories({ data: {} }),
    ]);
    return { items: result.items, total: result.total, navCategories };
  },
  head: () => ({
    meta: [
      { title: "Shop All Products — Murlit Enterprises" },
      { name: "description", content: "Browse pooja kits, wedding potlis, malas, kalash, gift hampers and handcrafted crochet from Murlit Enterprises." },
      { property: "og:title", content: "Shop All Products — Murlit Enterprises" },
      { property: "og:description", content: "Pooja kits, wedding essentials, malas, hampers and handcrafted pieces." },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { items, total, navCategories } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const [showF, setShowF] = useState(false);
  const [allItems, setAllItems] = useState<ProductRow[]>(items);
  const [loadedTotal, setLoadedTotal] = useState(total);

  const q = search.q;
  const currentCat = search.categorySlug;
  const currentSort = search.sort ?? "featured";
  const currentInStock = search.inStock;

  // Reset allItems when search changes (navigating)
  const searchKey = JSON.stringify(search);

  const setSearch = (patch: Record<string, unknown>) => {
    navigate({ search: (prev: any) => ({ ...prev, ...patch, page: undefined }) as any });
    setAllItems(items);
  };

  const loadMore = async () => {
    const nextPage = (search.page ?? 1) + 1;
    const more = await listProducts({
      data: { ...search, page: nextPage, pageSize: 24 },
    });
    setAllItems((prev) => [...prev, ...more.items]);
    setLoadedTotal(more.total);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <section className="bg-ivory-fade border-b">
        <div className="container-x py-12">
          <nav className="text-xs text-muted-foreground">
            <Link to="/" className="hover:text-maroon">Home</Link> / <Link to="/shop" className="hover:text-maroon">Shop</Link>
            {q && <> / <span className="text-ink">{q}</span></>}
          </nav>
          <h1 className="mt-3 animate-fade-up text-5xl font-medium md:text-6xl">
            {q ? `"${q}"` : "All Products"}
          </h1>
          <p className="mt-3 max-w-xl animate-fade-up delay-1 text-muted-foreground">
            Pooja essentials, wedding collections, malas and handcrafted pieces — curated for every occasion.
          </p>
        </div>
      </section>

      <div className="container-x grid gap-10 py-10 lg:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className={`${showF ? "block" : "hidden"} lg:block`}>
          {/* Categories */}
          <div className="border-b py-5">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-burgundy">Category</h4>
            <label className="flex cursor-pointer items-center gap-2 py-1 text-sm">
              <input type="radio" name="cat" checked={!currentCat} onChange={() => setSearch({ categorySlug: undefined })} className="accent-maroon" />
              All categories
            </label>
            {navCategories.map((c: CategoryTree) => (
              <label key={c.slug} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
                <input type="radio" name="cat" checked={currentCat === c.slug} onChange={() => setSearch({ categorySlug: c.slug })} className="accent-maroon" />
                {c.name}
              </label>
            ))}
          </div>

          {/* Price */}
          <div className="border-b py-5">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-burgundy">Price</h4>
            <label className="flex cursor-pointer items-center gap-2 py-1 text-sm">
              <input type="radio" name="price" checked={!search.minPrice && !search.maxPrice} onChange={() => setSearch({ minPrice: undefined, maxPrice: undefined })} className="accent-maroon" />
              All prices
            </label>
            {PRICES.map((p) => (
              <label key={p.label} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
                <input
                  type="radio" name="price"
                  checked={search.minPrice === p.min && search.maxPrice === p.max}
                  onChange={() => setSearch({ minPrice: p.min, maxPrice: p.max })}
                  className="accent-maroon"
                />
                {p.label}
              </label>
            ))}
          </div>

          {/* In stock */}
          <div className="py-5">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-burgundy">Availability</h4>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={!!currentInStock} onChange={(e) => setSearch({ inStock: e.target.checked || undefined })} className="accent-maroon" />
              In stock only
            </label>
          </div>

          <button onClick={() => setSearch({ categorySlug: undefined, minPrice: undefined, maxPrice: undefined, inStock: undefined, q: undefined })} className="text-sm font-bold text-maroon hover:underline">
            Clear all filters
          </button>
        </aside>

        {/* Product grid */}
        <div>
          <div className="mb-6 flex items-center justify-between gap-4">
            <button onClick={() => setShowF(!showF)} className="flex items-center gap-2 text-sm font-semibold lg:hidden">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
            <span className="text-sm text-muted-foreground">{loadedTotal} products</span>
            <select
              value={currentSort}
              onChange={(e) => setSearch({ sort: e.target.value })}
              className="rounded-sm border bg-background px-3 py-2 text-sm"
            >
              <option value="featured">Sort: Featured</option>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>

          <div key={searchKey} data-stagger className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3">
            {allItems.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>

          {!allItems.length && (
            <p className="py-20 text-center text-muted-foreground">No products match these filters.</p>
          )}

          {allItems.length < loadedTotal && (
            <div className="mt-10 text-center">
              <button onClick={loadMore} className="rounded-sm border border-maroon px-8 py-3 text-sm font-bold text-maroon hover:bg-maroon hover:text-white transition">
                Load more
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
