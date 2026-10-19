import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/server/db";
import { users, coinLedger, storeSettings } from "@/server/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { requireUser } from "@/server/auth-helpers";
import { ensureReferralCode, getCoinBalanceForUser } from "@/server/referral-helpers";

// ─── Public: get referral info + coin balance ──────────────────────────────────

export const getMyReferralInfo = createServerFn().handler(async () => {
  const user = await requireUser();
  const referralCode = await ensureReferralCode(user.id);

  const [settings] = await db.select({
    referralEnabled: storeSettings.referralEnabled,
    referralCoinReward: storeSettings.referralCoinReward,
    referralWelcomeDiscount: storeSettings.referralWelcomeDiscount,
    coinValuePaise: storeSettings.coinValuePaise,
    maxCoinsPctPerOrder: storeSettings.maxCoinsPctPerOrder,
  }).from(storeSettings).limit(1);

  const coinBalance = await getCoinBalanceForUser(user.id);

  // Count referred users
  const [{ n: referredCount }] = await db
    .select({ n: count() })
    .from(users)
    .where(eq(users.referredBy, user.id));

  return {
    referralCode,
    referralLink: `https://murlit.com/?ref=${referralCode}`,
    coinBalance,
    referredCount: Number(referredCount),
    settings: settings ?? {
      referralEnabled: true,
      referralCoinReward: 100,
      referralWelcomeDiscount: 5000,
      coinValuePaise: 100,
      maxCoinsPctPerOrder: 20,
    },
  };
});

// ─── Public: get coin ledger history ──────────────────────────────────────────

export const getMyCoinLedger = createServerFn()
  .validator(z.object({ page: z.number().int().min(1).default(1) }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    const PAGE_SIZE = 20;
    const rows = await db
      .select()
      .from(coinLedger)
      .where(eq(coinLedger.userId, user.id))
      .orderBy(desc(coinLedger.createdAt))
      .limit(PAGE_SIZE)
      .offset((data.page - 1) * PAGE_SIZE);

    const [{ n: total }] = await db.select({ n: count() }).from(coinLedger).where(eq(coinLedger.userId, user.id));
    return { rows, total: Number(total), page: data.page, pageSize: PAGE_SIZE };
  });

// ─── Attach referral code after signup ────────────────────────────────────────

export const attachReferral = createServerFn()
  .validator(z.object({ refCode: z.string().max(20) }))
  .handler(async ({ data }) => {
    const user = await requireUser();

    const [currentUser] = await db
      .select({ id: users.id, referredBy: users.referredBy, email: users.email, phone: users.phone })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!currentUser || currentUser.referredBy) return { success: false, reason: "already_referred" };

    // Find referrer
    const [referrer] = await db
      .select({ id: users.id, referralCode: users.referralCode, email: users.email, phone: users.phone })
      .from(users)
      .where(eq(users.referralCode, data.refCode.toUpperCase()))
      .limit(1);

    if (!referrer) return { success: false, reason: "invalid_code" };
    if (referrer.id === user.id) return { success: false, reason: "self_referral" };

    // Anti-abuse: same email domain check (basic)
    // Same phone check
    if (currentUser.phone && referrer.phone && currentUser.phone === referrer.phone) {
      return { success: false, reason: "same_phone" };
    }

    await db.update(users).set({ referredBy: referrer.id, updatedAt: new Date() }).where(eq(users.id, user.id));
    return { success: true };
  });

// ─── Admin: get customer coin balance + history ───────────────────────────────

export const getCustomerCoins = createServerFn()
  .validator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("@/server/auth-helpers");
    await requireAdmin();

    const balance = await getCoinBalanceForUser(data.userId);
    const rows = await db
      .select()
      .from(coinLedger)
      .where(eq(coinLedger.userId, data.userId))
      .orderBy(desc(coinLedger.createdAt))
      .limit(50);

    return { balance, ledger: rows };
  });

// ─── Admin: adjust coins for a customer ──────────────────────────────────────

export const adminAdjustCoins = createServerFn()
  .validator(z.object({
    userId: z.string(),
    amount: z.number().int().refine((v) => v !== 0, "Amount cannot be zero"),
    reason: z.string().min(1),
  }))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("@/server/auth-helpers");
    await requireAdmin();

    await db.insert(coinLedger).values({
      userId: data.userId,
      type: "admin_adjust",
      amount: data.amount,
      reason: data.reason,
    });
    return { success: true };
  });

// ─── Get referral settings (public) ──────────────────────────────────────────

export const getReferralSettings = createServerFn().handler(async () => {
  const [s] = await db.select({
    referralEnabled: storeSettings.referralEnabled,
    referralCoinReward: storeSettings.referralCoinReward,
    referralWelcomeDiscount: storeSettings.referralWelcomeDiscount,
    coinValuePaise: storeSettings.coinValuePaise,
    maxCoinsPctPerOrder: storeSettings.maxCoinsPctPerOrder,
    coinExpiryDays: storeSettings.coinExpiryDays,
  }).from(storeSettings).limit(1);

  return s ?? {
    referralEnabled: true,
    referralCoinReward: 100,
    referralWelcomeDiscount: 5000,
    coinValuePaise: 100,
    maxCoinsPctPerOrder: 20,
    coinExpiryDays: 365,
  };
});
