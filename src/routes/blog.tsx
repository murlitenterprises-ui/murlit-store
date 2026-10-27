import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Murlit Enterprises" },
      { name: "description", content: "Stories, inspiration and guides from Murlit Enterprises — pooja, wedding, crochet and more." },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  return (
    <div className="min-h-screen bg-ivory">
      <Header />
      <main className="container-x py-16 max-w-3xl mx-auto">
        <h1 className="font-display text-4xl text-burgundy mb-4">Blog</h1>
        <p className="text-muted-foreground leading-relaxed mb-16 max-w-xl">
          Stories, inspiration and guides from Murlit — covering pooja traditions, wedding essentials,
          crochet crafts and personalised gifting.
        </p>

        <div className="flex flex-col items-center gap-6 py-16 border border-dashed border-gold rounded-lg bg-background text-center">
          <span className="text-5xl">✦</span>
          <h2 className="font-display text-2xl text-maroon">Stories coming soon</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Our first articles are on the way. While you wait, explore our collection.
          </p>
          <Link to="/shop"
            className="mt-2 inline-block rounded-full bg-maroon px-6 py-2.5 text-sm font-semibold text-on-dark hover:bg-burgundy transition">
            Shop Now →
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
