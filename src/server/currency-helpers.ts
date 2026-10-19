import { db } from "@/server/db";
import { exchangeRates } from "@/server/db/schema";
import { eq } from "drizzle-orm";

const ER_API_URL = "https://open.er-api.com/v6/latest/INR";
const STALE_MS = 24 * 60 * 60 * 1000; // 24 hours

// Fallback rates (paise-relative) — kept in sync with migration seed
const FALLBACK_RATES: Record<string, number> = {
  USD: 0.01190,
  EUR: 0.01100,
  GBP: 0.00940,
  AED: 0.04370,
  CAD: 0.01630,
  AUD: 0.01840,
  SGD: 0.01610,
};

export async function getExchangeRates(): Promise<Record<string, number>> {
  try {
    const rows = await db.select().from(exchangeRates);
    if (!rows.length) return FALLBACK_RATES;

    // Check staleness of the newest auto row
    const autoRows = rows.filter((r) => !r.isManual);
    const oldestUpdate = autoRows.reduce<Date | null>((acc, r) => {
      const d = new Date(r.updatedAt);
      return !acc || d < acc ? d : acc;
    }, null);

    const needsRefresh = !oldestUpdate || Date.now() - oldestUpdate.getTime() > STALE_MS;

    if (needsRefresh) {
      // Fire-and-forget refresh; return current rates in the meantime
      refreshExchangeRates().catch(() => {});
    }

    const result: Record<string, number> = { ...FALLBACK_RATES };
    for (const row of rows) {
      result[row.currency] = parseFloat(row.ratePerInr as string);
    }
    return result;
  } catch {
    return FALLBACK_RATES;
  }
}

export async function refreshExchangeRates(): Promise<boolean> {
  try {
    const res = await fetch(ER_API_URL, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return false;
    const data = await res.json() as { rates?: Record<string, number> };
    if (!data.rates) return false;

    const currencies = ["USD", "EUR", "GBP", "AED", "CAD", "AUD", "SGD"];
    const now = new Date();

    for (const currency of currencies) {
      const rate = data.rates[currency];
      if (!rate) continue;
      const ratePerInr = 1 / rate; // er-api gives rates from INR, e.g. "USD": 0.012

      // Check if a manual override exists; if so, skip
      const [existing] = await db
        .select({ isManual: exchangeRates.isManual })
        .from(exchangeRates)
        .where(eq(exchangeRates.currency, currency))
        .limit(1);

      if (existing?.isManual) continue;

      await db
        .insert(exchangeRates)
        .values({ currency, ratePerInr: String(ratePerInr), isManual: false, updatedAt: now })
        .onConflictDoUpdate({
          target: exchangeRates.currency,
          set: { ratePerInr: String(ratePerInr), isManual: false, updatedAt: now },
        });
    }
    return true;
  } catch {
    return false;
  }
}

export async function setManualRate(currency: string, rate: number): Promise<void> {
  await db
    .insert(exchangeRates)
    .values({ currency, ratePerInr: String(rate), isManual: true, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: exchangeRates.currency,
      set: { ratePerInr: String(rate), isManual: true, updatedAt: new Date() },
    });
}

export async function clearManualRate(currency: string): Promise<void> {
  await db
    .update(exchangeRates)
    .set({ isManual: false, updatedAt: new Date() })
    .where(eq(exchangeRates.currency, currency));
}
