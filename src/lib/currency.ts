// Currency types and helpers for Murlit multi-currency support.
// Money stored as INR paise; exchange rates come from the exchange_rates table.

export type SupportedCurrency = "INR" | "USD" | "EUR" | "GBP" | "AED" | "CAD" | "AUD" | "SGD";

export const CURRENCIES: Record<SupportedCurrency, { symbol: string; flag: string; decimals: number }> = {
  INR: { symbol: "₹", flag: "🇮🇳", decimals: 0 },
  USD: { symbol: "$", flag: "🇺🇸", decimals: 2 },
  EUR: { symbol: "€", flag: "🇪🇺", decimals: 2 },
  GBP: { symbol: "£", flag: "🇬🇧", decimals: 2 },
  AED: { symbol: "AED", flag: "🇦🇪", decimals: 2 },
  CAD: { symbol: "CA$", flag: "🇨🇦", decimals: 2 },
  AUD: { symbol: "A$", flag: "🇦🇺", decimals: 2 },
  SGD: { symbol: "S$", flag: "🇸🇬", decimals: 2 },
};

export const CURRENCY_COOKIE = "murlit_currency";

// Country code → currency mapping
const COUNTRY_CURRENCY: Record<string, SupportedCurrency> = {
  IN: "INR",
  US: "USD",
  GB: "GBP",
  AE: "AED",
  CA: "CAD",
  AU: "AUD",
  SG: "SGD",
  // Eurozone
  DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR", BE: "EUR",
  AT: "EUR", PT: "EUR", FI: "EUR", IE: "EUR", GR: "EUR", LU: "EUR",
  SK: "EUR", SI: "EUR", EE: "EUR", LV: "EUR", LT: "EUR", CY: "EUR",
  MT: "EUR",
};

export function countryToCurrency(countryCode: string): SupportedCurrency {
  return COUNTRY_CURRENCY[countryCode?.toUpperCase()] ?? "USD";
}

export function parseCurrencyCookie(cookieHeader: string | null | undefined): SupportedCurrency | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/murlit_currency=([A-Z]{3})/);
  if (!match) return null;
  const c = match[1] as SupportedCurrency;
  return c in CURRENCIES ? c : null;
}

// Format paise → display string in given currency using rates map
export function formatPrice(
  paise: number,
  currency: SupportedCurrency,
  rates: Record<string, number>,
  usdCents?: number | null, // optional fixed USD cents (from product.priceUsdCents)
): string {
  if (currency === "INR") {
    const rupees = paise / 100;
    return "₹" + rupees.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  // Use fixed USD price if currency is USD and product has one
  if (currency === "USD" && usdCents != null) {
    return "$" + (usdCents / 100).toFixed(2);
  }

  const rate = rates[currency] ?? 0.012; // fallback
  const amount = (paise / 100) * rate;
  const info = CURRENCIES[currency];

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: info.decimals,
    maximumFractionDigits: info.decimals,
  }).format(amount);
}

// Convert paise to foreign currency amount (for the "charged in INR" note)
export function paiseToForeignAmount(
  paise: number,
  currency: SupportedCurrency,
  rates: Record<string, number>,
): number {
  if (currency === "INR") return paise / 100;
  const rate = rates[currency] ?? 0.012;
  return Math.round(((paise / 100) * rate) * 100) / 100;
}
