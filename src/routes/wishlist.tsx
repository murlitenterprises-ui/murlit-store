import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { Heart, Trash2, ShoppingBag } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { getWishlist, removeFromWishlist } from "@/fns/wishlist";
import { getCurrentUser } from "@/fns/auth";
import { Price } from "@/components/site/Price";
import { clImg } from "@/lib/cloudinary";
import { useCart } from "@/lib/cart-context";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/wishlist")({
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) throw redirect({ to: "/login", search: { redirect: "/wishlist" } as any });
  },
  loader: () => getWishlist(),
  component: WishlistPage,
});

function WishlistPage() {
  const initialItems = Route.useLoaderData();
  const [items, setItems] = useState(initialItems);
  const { add } = useCart();
  const router = useRouter();

  const handleRemove = async (itemId: string) => {
    try {
      const updated = await removeFromWishlist({ data: { itemId } });
      setItems(updated);
      toast("Removed from wishlist");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const handleMoveToCart = async (productId: string, itemId: string) => {
    try {
      await add(productId);
      const updated = await removeFromWishlist({ data: { itemId } });
      setItems(updated);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container-x py-10">
        <h1 className="font-display text-display mb-8">Wishlist</h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="h-16 w-16 mx-auto text-gray-200 mb-4" />
            <p className="text-lg text-muted-foreground">Your wishlist is empty</p>
            <Link to="/shop" className="mt-6 inline-flex items-center gap-2 rounded-sm bg-royal px-6 py-3 text-sm font-bold text-on-dark hover:brightness-110">
              Discover Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col rounded-lg border border-gray-100 bg-white shadow-soft overflow-hidden">
                <Link to="/product/$slug" params={{ slug: item.slug }} className="block aspect-[4/5] bg-sage overflow-hidden">
                  {item.imageUrl ? (
                    <img src={clImg(item.imageUrl, 400, 500) ?? item.imageUrl} alt={item.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-sage" />
                  )}
                </Link>
                <div className="p-3 flex-1 flex flex-col">
                  <Link to="/product/$slug" params={{ slug: item.slug }}>
                    <h3 className="font-semibold text-sm leading-tight hover:text-maroon line-clamp-2">{item.name}</h3>
                  </Link>
                  <div className="flex items-baseline gap-2 mt-1">
                    <Price paise={item.price} className="font-bold text-sm" />
                    {item.mrp && <Price paise={item.mrp} className="text-xs text-gray-400 line-through" />}
                  </div>
                  {item.stock < 1 && (
                    <p className="text-xs text-red-500 mt-1">Out of stock</p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleMoveToCart(item.productId, item.id)}
                      disabled={item.stock < 1}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-sm bg-royal py-2 text-xs font-bold text-on-dark hover:brightness-110 disabled:opacity-50"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      {item.stock < 1 ? "Out of stock" : "Add to Cart"}
                    </button>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="grid h-8 w-8 place-items-center rounded-sm border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
