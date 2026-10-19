import { useState, useEffect } from "react";
import { X, Tag, ChevronRight, LogIn, Check } from "lucide-react";
import { getAvailableOffers } from "@/fns/offers";
import { inrFromPaise } from "@/lib/format";

type Offer = Awaited<ReturnType<typeof getAvailableOffers>>[number];

interface Props {
  open: boolean;
  onClose: () => void;
  subtotal: number;
  isLoggedIn: boolean;
  selectedOfferId: string | null;
  onSelectOffer: (offerId: string | null) => void;
}

const TYPE_LABELS: Record<string, string> = {
  welcome: "Offers",
  loyalty: "Offers",
  cart_value: "Offers",
  sitewide: "Offers",
  bank: "Bank Offers",
};

type FilterChip = "All" | "Offers" | "Bank Offers";

export function AvailableOffersDrawer({ open, onClose, subtotal, isLoggedIn, selectedOfferId, onSelectOffer }: Props) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterChip>("All");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getAvailableOffers({ data: { subtotal } })
      .then(setOffers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, subtotal]);

  const bestEligible = offers.reduce<Offer | null>((best, o) => {
    if (!o.eligible) return best;
    if (!best || o.discount > (best as any).discount) return o;
    return best;
  }, null);

  const filtered = offers.filter((o) => {
    if (filter === "All") return true;
    if (filter === "Bank Offers") return o.type === "bank";
    return o.type !== "bank";
  });

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40 lg:block" onClick={onClose} />

      {/* Drawer: full screen mobile, right drawer desktop */}
      <div className="fixed inset-0 z-50 flex lg:justify-end lg:items-stretch">
        <div className="w-full lg:w-[420px] bg-white flex flex-col h-full shadow-2xl">

          {/* Green strip header */}
          <div className="bg-green-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div>
              <p className="font-bold text-sm">Coupons &amp; Offers</p>
              {subtotal > 0 && <p className="text-xs text-green-100">Order value: {inrFromPaise(subtotal)}</p>}
            </div>
            <button onClick={onClose} className="rounded-full p-1 hover:bg-green-700 transition"><X size={18} /></button>
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 px-4 py-3 border-b flex-shrink-0 overflow-x-auto">
            {(["All", "Offers", "Bank Offers"] as FilterChip[]).map((chip) => (
              <button
                key={chip}
                onClick={() => setFilter(chip)}
                className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold border transition ${
                  filter === chip
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Guest notice */}
          {!isLoggedIn && (
            <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 flex-shrink-0">
              <LogIn size={14} />
              <span>Login to unlock exclusive offers</span>
            </div>
          )}

          {/* Offer list */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {loading && <p className="text-sm text-gray-400 text-center py-8">Loading offers…</p>}
            {!loading && filtered.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No offers available</p>
            )}
            {!loading && filtered.map((offer) => {
              const isBest = bestEligible?.id === offer.id;
              const isSelected = selectedOfferId === offer.id;
              return (
                <div
                  key={offer.id}
                  className={`rounded-lg border p-4 transition ${
                    isSelected
                      ? "border-green-500 bg-green-50"
                      : offer.eligible
                      ? "border-gray-200 bg-white hover:border-gray-300"
                      : "border-gray-100 bg-gray-50 opacity-80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-gray-900">{offer.title}</span>
                        {isBest && offer.eligible && (
                          <span className="rounded-full bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5">Best offer</span>
                        )}
                        {offer.tagText && (
                          <span className="rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5">{offer.tagText}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {offer.percent}% off{offer.maxDiscountPaise ? ` (max ${inrFromPaise(offer.maxDiscountPaise)})` : ""}
                        {offer.minOrderPaise > 0 ? ` · min order ${inrFromPaise(offer.minOrderPaise)}` : ""}
                      </p>
                      {offer.description && <p className="text-xs text-gray-400 mt-0.5">{offer.description}</p>}
                    </div>
                    {offer.eligible ? (
                      <button
                        onClick={() => {
                          onSelectOffer(isSelected ? null : offer.id);
                          onClose();
                        }}
                        className={`flex-shrink-0 flex items-center gap-1 rounded px-3 py-1.5 text-xs font-bold transition ${
                          isSelected
                            ? "bg-green-600 text-white"
                            : "bg-[var(--maroon)] text-white hover:opacity-90"
                        }`}
                      >
                        {isSelected ? <><Check size={12} /> Applied</> : "Apply"}
                      </button>
                    ) : (
                      <ChevronRight size={16} className="flex-shrink-0 text-gray-300 mt-0.5" />
                    )}
                  </div>
                  {!offer.eligible && offer.reason && (
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      {offer.reason === "Login to unlock" ? (
                        <><LogIn size={11} /> {offer.reason}</>
                      ) : (
                        offer.reason
                      )}
                    </p>
                  )}
                  {offer.eligible && offer.discount > 0 && (
                    <p className="text-xs text-green-600 font-semibold mt-1.5">
                      You save {inrFromPaise(offer.discount)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sticky bottom bar */}
          <div className="border-t bg-white px-4 py-3 flex-shrink-0">
            {selectedOfferId ? (
              <div className="flex items-center justify-between">
                <div className="text-xs text-green-700">
                  <span className="font-semibold">Offer applied</span>
                  {bestEligible && selectedOfferId === bestEligible.id && (
                    <span className="text-gray-400 ml-1">· saving {inrFromPaise(bestEligible.discount)}</span>
                  )}
                </div>
                <button
                  onClick={() => onSelectOffer(null)}
                  className="text-xs text-red-500 hover:underline font-medium"
                >
                  Remove
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center">Select an offer to apply savings</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
