import { db } from "@/server/db";
import { offers, orders } from "@/server/db/schema";
import { eq, and, count, not } from "drizzle-orm";

export type OfferResult =
  | { eligible: true; offerId: string; key: string; title: string; discount: number; tagText: string | null }
  | { eligible: false; reason: string; key?: string; offerId?: string; title?: string; tagText?: string | null };

// Check if a single offer is eligible for this user + subtotal
export async function checkOfferEligibility(
  offerId: string,
  userId: string,
  subtotal: number,
): Promise<OfferResult> {
  const [offer] = await db.select().from(offers).where(eq(offers.id, offerId)).limit(1);
  if (!offer || !offer.isActive) return { eligible: false, reason: "Offer not available" };

  const now = new Date();
  if (offer.startsAt && offer.startsAt > now) return { eligible: false, reason: "Offer not active yet", key: offer.key, title: offer.title, tagText: offer.tagText };
  if (offer.endsAt && offer.endsAt < now) return { eligible: false, reason: "Offer has expired", key: offer.key, title: offer.title, tagText: offer.tagText };
  if (offer.minOrderPaise > 0 && subtotal < offer.minOrderPaise) {
    const need = offer.minOrderPaise - subtotal;
    return { eligible: false, reason: `Add ₹${Math.ceil(need / 100)} more`, key: offer.key, title: offer.title, tagText: offer.tagText };
  }

  // Type-specific checks
  if (offer.type === "welcome") {
    // Zero previous non-cancelled orders
    const prevRows = await db
      .select({ n: count() })
      .from(orders)
      .where(and(eq(orders.userId, userId), not(eq(orders.status, "cancelled"))));
    if (Number(prevRows[0]?.n ?? 0) > 0) return { eligible: false, reason: "Valid on first order only", key: offer.key, title: offer.title, tagText: offer.tagText };
    // Check not already used (look for a past order with this offer)
    const usedRows = await db
      .select({ used: count() })
      .from(orders)
      .where(and(eq(orders.userId, userId), eq(orders.appliedOfferId, offerId)));
    if (Number(usedRows[0]?.used ?? 0) > 0) return { eligible: false, reason: "Already used", key: offer.key, title: offer.title, tagText: offer.tagText };
  }

  if (offer.type === "loyalty") {
    const loyalRows = await db
      .select({ n: count() })
      .from(orders)
      .where(and(eq(orders.userId, userId), not(eq(orders.status, "cancelled"))));
    if (Number(loyalRows[0]?.n ?? 0) < offer.minPastOrders) {
      return { eligible: false, reason: `Place ${offer.minPastOrders - Number(loyalRows[0]?.n ?? 0)} more order(s) to unlock`, key: offer.key, title: offer.title, tagText: offer.tagText };
    }
  }

  // bank type is always ineligible (coming soon)
  if (offer.type === "bank") return { eligible: false, reason: "Coming soon", key: offer.key, title: offer.title, tagText: offer.tagText };

  // Compute discount
  let discount = Math.round((subtotal * offer.percent) / 100);
  if (offer.maxDiscountPaise && discount > offer.maxDiscountPaise) discount = offer.maxDiscountPaise;
  discount = Math.min(discount, subtotal);

  return { eligible: true, offerId: offer.id, key: offer.key, title: offer.title, discount, tagText: offer.tagText };
}

// Get the best eligible offer for this user + subtotal (returns the top one after checking all)
export async function getBestOffer(
  userId: string,
  subtotal: number,
): Promise<{ offerId: string; key: string; title: string; discount: number; tagText: string | null } | null> {
  const activeOffers = await db
    .select()
    .from(offers)
    .where(eq(offers.isActive, true))
    .orderBy(offers.sortOrder);

  let best: { offerId: string; key: string; title: string; discount: number; tagText: string | null } | null = null;

  for (const offer of activeOffers) {
    if (offer.type === "bank") continue;
    const result = await checkOfferEligibility(offer.id, userId, subtotal);
    if (result.eligible) {
      if (!best || result.discount > best.discount) {
        best = { offerId: result.offerId, key: result.key, title: result.title, discount: result.discount, tagText: result.tagText };
      }
    }
  }
  return best;
}

// List all offers with eligibility status for a user (for the Available Offers screen)
export async function listOffersWithEligibility(userId: string | null, subtotal: number) {
  const activeOffers = await db.select().from(offers).orderBy(offers.sortOrder);

  const results = await Promise.all(
    activeOffers.map(async (offer) => {
      if (!userId) {
        // Guest: welcome offer is locked, others may be eligible
        if (offer.type === "welcome") {
          return { ...offer, eligible: false, discount: 0, reason: "Login to unlock" };
        }
        if (offer.type === "bank") {
          return { ...offer, eligible: false, discount: 0, reason: "Coming soon" };
        }
        // Check non-user conditions
        if (!offer.isActive) return { ...offer, eligible: false, discount: 0, reason: "Inactive" };
        if (offer.minOrderPaise > 0 && subtotal < offer.minOrderPaise) {
          const need = offer.minOrderPaise - subtotal;
          return { ...offer, eligible: false, discount: 0, reason: `Add ₹${Math.ceil(need / 100)} more` };
        }
        if (offer.percent === 0) return { ...offer, eligible: false, discount: 0, reason: "Coming soon" };
        const discount = Math.min(
          Math.round((subtotal * offer.percent) / 100),
          offer.maxDiscountPaise ?? Infinity,
          subtotal,
        );
        return { ...offer, eligible: true, discount, reason: null };
      }

      const result = await checkOfferEligibility(offer.id, userId, subtotal);
      const discount = result.eligible ? result.discount : 0;
      const reason = result.eligible ? null : (result as any).reason;
      return { ...offer, eligible: result.eligible, discount, reason };
    })
  );

  return results;
}
