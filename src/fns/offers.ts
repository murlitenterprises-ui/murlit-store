import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/server/db";
import { offers } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { listOffersWithEligibility } from "@/server/offer-helpers";
import { getSessionUser } from "@/server/auth-helpers";

// List all offers with eligibility status (used by Available Offers screen)
export const getAvailableOffers = createServerFn()
  .validator(z.object({ subtotal: z.number().min(0) }))
  .handler(async ({ data }) => {
    const user = await getSessionUser();
    return listOffersWithEligibility(user?.id ?? null, data.subtotal);
  });

// Get offers a logged-in user can use (for My Offers on account page)
export const getMyOffers = createServerFn().handler(async () => {
  const user = await getSessionUser();
  if (!user) return [];
  return listOffersWithEligibility(user.id, 0);
});
