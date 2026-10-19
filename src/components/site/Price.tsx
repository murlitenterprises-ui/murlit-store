import { useCurrency } from "@/lib/currency-context";
import { formatPrice } from "@/lib/currency";

type Props = {
  paise: number;
  usdCents?: number | null;       // product.priceUsdCents — used when currency=USD
  className?: string;
};

export function Price({ paise, usdCents, className }: Props) {
  const { currency, rates } = useCurrency();
  const text = formatPrice(paise, currency, rates, usdCents);
  return <span className={className}>{text}</span>;
}

// Convenience: just get the formatted string (for aria-label, title etc.)
export function useFormattedPrice(paise: number, usdCents?: number | null) {
  const { currency, rates } = useCurrency();
  return formatPrice(paise, currency, rates, usdCents);
}
