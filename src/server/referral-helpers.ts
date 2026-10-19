import { db } from "@/server/db";
import { users, coinLedger } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";

export async function ensureReferralCode(userId: string): Promise<string> {
  const [user] = await db.select({ referralCode: users.referralCode }).from(users).where(eq(users.id, userId)).limit(1);
  if (user?.referralCode) return user.referralCode;

  const code = crypto.randomBytes(4).toString("hex").toUpperCase();
  const short = code.slice(0, 6);

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.referralCode, short)).limit(1);
  const finalCode = existing.length ? crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 8) : short;

  await db.update(users).set({ referralCode: finalCode, updatedAt: new Date() }).where(eq(users.id, userId));
  return finalCode;
}

export async function getCoinBalanceForUser(userId: string): Promise<number> {
  const now = new Date();
  const rows = await db
    .select({ amount: coinLedger.amount, expiresAt: coinLedger.expiresAt })
    .from(coinLedger)
    .where(eq(coinLedger.userId, userId));

  const balance = rows.reduce((sum, row) => {
    if (row.amount > 0 && row.expiresAt && row.expiresAt < now) return sum;
    return sum + row.amount;
  }, 0);
  return Math.max(0, balance);
}
