import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { getExchangeRates, refreshExchangeRates, setManualRate, clearManualRate } from "@/server/currency-helpers";
import { db } from "@/server/db";
import { exchangeRates } from "@/server/db/schema";
import { requireAdmin } from "@/server/auth-helpers";
import { parseCurrencyCookie, countryToCurrency, type SupportedCurrency } from "@/lib/currency";

export const getPublicExchangeRates = createServerFn().handler(async () => {
  return getExchangeRates();
});

// Detects currency from cookie or Vercel country header — runs server-only
export const getInitialCurrency = createServerFn().handler(async (): Promise<SupportedCurrency> => {
  try {
    const req = getRequest();
    const cookieCurrency = parseCurrencyCookie(req?.headers.get("cookie") ?? "");
    if (cookieCurrency) return cookieCurrency;
    const country = req?.headers.get("x-vercel-ip-country") ?? "IN";
    return countryToCurrency(country);
  } catch {
    return "INR";
  }
});

export const getExchangeRatesAdmin = createServerFn().handler(async () => {
  await requireAdmin();
  const rows = await db.select().from(exchangeRates).orderBy(exchangeRates.currency);
  const ratesMap = await getExchangeRates();
  return { rows, ratesMap };
});

export const refreshRatesAdmin = createServerFn().handler(async () => {
  await requireAdmin();
  const ok = await refreshExchangeRates();
  return { ok };
});

export const setManualRateAdmin = createServerFn()
  .validator(z.object({ currency: z.string(), rate: z.number().positive() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    await setManualRate(data.currency, data.rate);
    return { ok: true };
  });

export const clearManualRateAdmin = createServerFn()
  .validator(z.object({ currency: z.string() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    await clearManualRate(data.currency);
    return { ok: true };
  });
