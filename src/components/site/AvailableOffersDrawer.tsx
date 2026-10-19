import { useState, useEffect } from "react";
import { X, Tag, ChevronRight, LogIn, Check, Ticket } from "lucide-react";
import { getAvailableOffers } from "@/fns/offers";
import { getPublicCoupons } from "@/fns/coupons";
import { inrFromPaise } from "@/lib/format";

type Offer = Awaited<ReturnType<typeof getAvailableOffers>>[number];
type PublicCoupon = Awaited<ReturnType<typeof getPublicCoupons>>[number];

interface Props {
  open: boolean;
  onClose: () => void;
  subtotal: number;
  isLoggedIn: boolean;
  selectedOfferId: string | null;
  onSelectOffer: (offerId: string | null) => void;
  selectedCouponCode: string | null;
  onSelectCoupon: (code: string | null) => void;
}

type FilterChip = "All" | "Offers" | "Coupons" | "Bank Offers";

export function AvailableOffersDrawer({
  open, onClose, subtotal, isLoggedIn,
  selectedOfferId, onSelectOffer,
  selectedCouponCode, onSelectCoupon,
}: Props) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [coupons, setCoupons] = useState<PublicCoupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterChip>("All");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      getAvailableOffers({ data: { subtotal } }),
      getPublicCoupons({ data: { subtotal } }),
    ])
      .then(([o, c]) => { setOffers(o); setCoupons(c); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, subtotal]);

  const selectedOffer = offers.find((o) => o.id === selectedOfferId) ?? null;
  const selectedCoupon = coupons.find((c) => c.code === selectedCouponCode) ?? null;

  const totalSavings =
    (selectedOffer?.eligible ? (selectedOffer.discount ?? 0) : 0) +
    (selectedCoupon?.eligible ? (selectedCoupon.discount ?? 0) : 0);

  const filteredOffers = offers.filter((o) => {
    if (filter === "All" || filter === "Offers") return o.type !== "bank";
    if (filter === "Bank Offers") return o.type === "bank";
    return false;
  });
  const filteredCoupons = (filter === "All" || filter === "Coupons") ? coupons : [];
  const showBankComingSoon = filter === "Bank Offers";

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex lg:justify-end lg:items-stretch">
        <div className="w-full lg:w-[420px] bg-white flex flex-col h-full shadow-2xl">

          {/* Header */}
          <div className="bg-green-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div>
              <p className="font-bold text-sm">Coupons &amp; Offers</p>
              {subtotal > 0 && <p className="text-xs text-green-100">Order value: {inrFromPaise(subtotal)}</p>}
            </div>
            <button onClick={onClose} className="rounded-full p-1 hover:bg-green-700 transition">
              <X size={18} />
            </button>
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 px-4 py-3 border-b flex-shrink-0 overflow-x-auto">
            {(["All", "Offers", "Coupons", "Bank Offers"] as FilterChip[]).map((chip) => (
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {loading && <p className="text-sm text-gray-400 text-center py-8">Loading offers…</p>}

            {!loading && showBankComingSoon && (
              <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center">
                <Tag className="mx-auto mb-2 text-gray-300" size={28} />
                <p className="text-sm font-medium text-gray-400">Bank Offers</p>
                <p className="text-xs text-gray-300 mt-1">Coming soon</p>
              </div>
            )}

            {/* Offers */}
            {!loading && filteredOffers.map((offer) => {
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
                        {offer.tagText && (
                          <span className="rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5">
                            {offer.tagText}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {offer.percent}% off
                        {offer.maxDiscountPaise ? ` (max ${inrFromPaise(offer.maxDiscountPaise)})` : ""}
                        {offer.minOrderPaise > 0 ? ` · min order ${inrFromPaise(offer.minOrderPaise)}` : ""}
                      </p>
                      {offer.description && <p className="text-xs text-gray-400 mt-0.5">{offer.description}</p>}
                    </div>
                    {offer.eligible ? (
                      <button
                        onClick={() => { onSelectOffer(isSelected ? null : offer.id); onClose(); }}
                        className={`flex-shrink-0 flex items-center gap-1 rounded px-3 py-1.5 text-xs font-bold transition ${
                          isSelected ? "bg-green-600 text-white" : "bg-[var(--maroon)] text-white hover:opacity-90"
                        }`}
                      >
                        {isSelected ? <><Check size={12} /> Applied</> : "Apply"}
                      </button>
                    ) : (
                      <ChevronRight size={16} className="flex-shrink-0 text-gray-300 mt-0.5" />
                    )}
                  </div>
                  {!offer.eligible && offer.reason && (
                    <p className="text-xs text-gray-400 mt-2">
                      {offer.reason === "Login to unlock" ? <><LogIn size={11} className="inline mr-1" />{offer.reason}</> : offer.reason}
                    </p>
                  )}
                  {offer.eligible && offer.discount > 0 && (
                    <p className="text-xs text-green-600 font-semibold mt-1.5">You save {inrFromPaise(offer.discount)}</p>
                  )}
                </div>
              );
            })}

            {/* Coupon cards */}
            {!loading && filteredCoupons.map((coupon) => {
              const isSelected = selectedCouponCode === coupon.code;
              return (
                <div
                  key={coupon.id}
                  className={`rounded-lg border p-4 transition ${
                    isSelected
                      ? "border-green-500 bg-green-50"
                      : coupon.eligible
                      ? "border-gray-200 bg-white hover:border-gray-300"
                      : "border-gray-100 bg-gray-50 opacity-75"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Ticket size={13} className="text-gray-400 flex-shrink-0" />
                        <span className="font-mono font-bold text-sm text-gray-900 tracking-wide">{coupon.code}</span>
                        {coupon.firstOrderOnly && (
                          <span className="rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5">
                            1st order
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {coupon.type === "percent"
                          ? `${coupon.value}% off${coupon.maxDiscount ? ` (max ${inrFromPaise(coupon.maxDiscount)})` : ""}`
                          : `Flat ${inrFromPaise(coupon.value)} off`}
                        {coupon.minOrder ? ` · min order ${inrFromPaise(coupon.minOrder)}` : ""}
                      </p>
                      {coupon.description && <p className="text-xs text-gray-400 mt-0.5">{coupon.description}</p>}
                      {coupon.endsAt && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Expires {new Date(coupon.endsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      )}
                    </div>
                    {coupon.eligible ? (
                      <button
                        onClick={() => {
                          if (coupon.requiresLogin) return;
                          onSelectCoupon(isSelected ? null : coupon.code);
                          onClose();
                        }}
                        disabled={coupon.requiresLogin}
                        className={`flex-shrink-0 flex items-center gap-1 rounded px-3 py-1.5 text-xs font-bold transition ${
                          coupon.requiresLogin
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : isSelected
                            ? "bg-green-600 text-white"
                            : "bg-[var(--maroon)] text-white hover:opacity-90"
                        }`}
                      >
                        {coupon.requiresLogin ? (
                          <><LogIn size={12} /> Login</>
                        ) : isSelected ? (
                          <><Check size={12} /> Applied</>
                        ) : "Apply"}
                      </button>
                    ) : (
                      <ChevronRight size={16} className="flex-shrink-0 text-gray-300 mt-0.5" />
                    )}
                  </div>
                  {!coupon.eligible && coupon.reason && (
                    <p className="text-xs text-gray-400 mt-2">{coupon.reason}</p>
                  )}
                  {coupon.eligible && coupon.discount > 0 && !coupon.requiresLogin && (
                    <p className="text-xs text-green-600 font-semibold mt-1.5">You save {inrFromPaise(coupon.discount)}</p>
                  )}
                </div>
              );
            })}

            {!loading && !showBankComingSoon && filteredOffers.length === 0 && filteredCoupons.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No offers available</p>
            )}
          </div>

          {/* Sticky bottom — Total Savings */}
          <div className="border-t bg-white px-4 py-3 flex-shrink-0">
            {totalSavings > 0 ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total savings</p>
                  <p className="text-sm font-bold text-green-600">{inrFromPaise(totalSavings)}</p>
                </div>
                <button
                  onClick={() => { onSelectOffer(null); onSelectCoupon(null); }}
                  className="text-xs text-red-500 hover:underline font-medium"
                >
                  Remove all
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center">Select an offer or coupon to save</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
