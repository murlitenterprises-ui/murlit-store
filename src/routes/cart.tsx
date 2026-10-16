import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useCart } from "@/lib/cart-context";
import { inrFromPaise } from "@/lib/format";
import { clImg } from "@/lib/cloudinary";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const { items, count, isLoading, update, remove } = useCart();

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container-x py-10">
        <h1 className="font-display text-display mb-8">Your Cart</h1>

        {isLoading ? (
          <p className="text-muted-foreground">Loading cart…</p>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="h-16 w-16 mx-auto text-gray-200 mb-4" />
            <p className="text-lg text-muted-foreground">Your cart is empty</p>
            <Link to="/shop" className="mt-6 inline-flex items-center gap-2 rounded-sm bg-royal px-6 py-3 text-sm font-bold text-on-dark hover:brightness-110">
              Continue Shopping <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 rounded-lg border border-gray-100 bg-white p-4 shadow-soft">
                  <Link to="/product/$slug" params={{ slug: item.slug }} className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-md overflow-hidden bg-sage">
                      {item.imageUrl ? (
                        <img src={clImg(item.imageUrl, 160, 160) ?? item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-sage" />
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to="/product/$slug" params={{ slug: item.slug }}>
                      <h3 className="font-semibold text-gray-900 leading-tight hover:text-maroon">{item.name}</h3>
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">SKU: {item.sku}</p>
                    <div className="mt-2 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center rounded-sm border border-gray-200">
                        <button
                          onClick={() => update(item.id, item.qty - 1)}
                          className="grid h-8 w-8 place-items-center hover:bg-sage disabled:opacity-40"
                          disabled={item.qty <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                        <button
                          onClick={() => update(item.id, item.qty + 1)}
                          className="grid h-8 w-8 place-items-center hover:bg-sage disabled:opacity-40"
                          disabled={item.qty >= item.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900">{inrFromPaise(item.price * item.qty)}</span>
                        {item.qty > 1 && (
                          <span className="text-xs text-gray-400">{inrFromPaise(item.price)} each</span>
                        )}
                        <button
                          onClick={() => remove(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {item.stock < 5 && item.stock > 0 && (
                      <p className="text-xs text-amber-600 mt-1">Only {item.stock} left in stock</p>
                    )}
                    {!item.isActive && (
                      <p className="text-xs text-red-600 mt-1">This product is no longer available</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-soft sticky top-4">
                <h2 className="font-semibold text-gray-900 text-lg mb-4">Order Summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{count} item{count !== 1 ? "s" : ""}</span>
                    <span className="font-medium">{inrFromPaise(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-500 text-xs italic">Calculated at checkout</span>
                  </div>
                </div>
                <div className="border-t mt-4 pt-4 flex justify-between font-bold text-base">
                  <span>Subtotal</span>
                  <span>{inrFromPaise(subtotal)}</span>
                </div>
                <Link
                  to="/checkout"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-sm bg-royal py-3.5 text-sm font-bold text-on-dark hover:brightness-110 transition"
                >
                  Proceed to Checkout <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/shop"
                  className="mt-3 flex w-full items-center justify-center text-sm text-gray-500 hover:text-maroon"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
