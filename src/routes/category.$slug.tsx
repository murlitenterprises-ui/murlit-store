import { createFileRoute, notFound, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { getCategoryBySlug, listProducts } from "@/fns/catalog";
import { img } from "@/lib/catalog";

const WA_LINK = "https://wa.me/919999999999";

export const Route = createFileRoute("/category/$slug")({
  validateSearch: (s: Record<string, unknown>) => ({
    sub: typeof s.sub === "string" ? s.sub : undefined,
  }),
  loader: async ({ params, location }) => {
    const { sub } = location.search as { sub?: string };
    const [cat, result] = await Promise.all([
      getCategoryBySlug({ data: { slug: params.slug } }),
      listProducts({ data: { categorySlug: params.slug, subSlug: sub } }),
    ]);
    if (!cat) throw notFound();
    return { cat, products: result.items, total: result.total };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.cat.name} — Murlit Enterprises` },
          { name: "description", content: `Shop ${loaderData.cat.name} — pooja essentials, wedding collections, handcrafted gifts and more from Murlit Enterprises.` },
          { property: "og:title", content: `${loaderData.cat.name} — Murlit Enterprises` },
          ...(loaderData.cat.image ? [{ property: "og:image", content: loaderData.cat.image }] : []),
        ]
      : [],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { cat, products, total } = Route.useLoaderData();
  const { sub } = Route.useSearch();
  const navigate = useNavigate({ from: "/category/$slug" });
  const productsRef = useRef<HTMLDivElement>(null);

  const activeChild = cat.children.find((c) => c.slug === sub);

  useEffect(() => {
    if (sub && productsRef.current) {
      productsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [sub]);

  // Fallback image for category circles
  const fallbackImg = cat.image ?? img.poojakit;

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
                  params={{ slug: cat.slug }}
                  className="hover:text-maroon"
                  viewTransition={false}
                >
                  {cat.name}
                </Link>
                <span>/</span>
                <span className="text-foreground font-medium">{activeChild?.name}</span>
              </>
            ) : (
              <span className="text-foreground font-medium">{cat.name}</span>
            )}
          </nav>

          {/* Page heading */}
          <h1 className="mt-3 font-display text-4xl font-medium text-maroon md:text-5xl">{cat.name}</h1>

          {/* Sub-option image circles */}
          {cat.children.length > 0 && (
            <div className="mt-10 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-6 text-left">
              {cat.children.map((child) => {
                const isActive = sub === child.slug;
                return (
                  <button
                    key={child.slug}
                    title={child.name}
                    onClick={() => {
                      navigate({
                        search: isActive ? { sub: undefined } : { sub: child.slug },
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
                        src={child.image ?? fallbackImg}
                        alt={child.name}
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
                      {child.name}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Products section */}
        <div ref={productsRef} className="container-x scroll-mt-8 pb-16 pt-8 lg:scroll-mt-10">
          <div className="mb-8 text-center">
            {sub && activeChild ? (
              <>
                <h2 className="font-display text-3xl font-medium text-maroon md:text-4xl">{activeChild.name}</h2>
                {total > 0 && (
                  <button
                    onClick={() => navigate({ search: { sub: undefined }, replace: true, viewTransition: false })}
                    className="mt-2 text-sm text-muted-foreground underline-offset-4 hover:text-maroon hover:underline"
                  >
                    Show all {cat.name} products
                  </button>
                )}
              </>
            ) : (
              <h2 className="font-display text-3xl font-medium text-maroon md:text-4xl">
                All {cat.name} Products
              </h2>
            )}
          </div>

          {products.length === 0 ? (
            <div className="flex flex-col items-center gap-6 py-16 text-center">
              <div className="rounded-full bg-sage p-8">
                <img src={fallbackImg} alt="" className="h-24 w-24 rounded-full object-cover opacity-60" />
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
              {products.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
