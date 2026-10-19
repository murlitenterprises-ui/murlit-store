import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { SupportedCurrency } from "./currency";
import { CURRENCY_COOKIE } from "./currency";

type CurrencyContextValue = {
  currency: SupportedCurrency;
  rates: Record<string, number>;
  setCurrency: (c: SupportedCurrency) => void;
};

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "INR",
  rates: {},
  setCurrency: () => {},
});

export function useCurrency() {
  return useContext(CurrencyContext);
}

type Props = {
  initialCurrency: SupportedCurrency;
  initialRates: Record<string, number>;
  children: ReactNode;
};

export function CurrencyProvider({ initialCurrency, initialRates, children }: Props) {
  const [currency, setCurrencyState] = useState<SupportedCurrency>(initialCurrency);
  const [rates] = useState<Record<string, number>>(initialRates);

  const setCurrency = (c: SupportedCurrency) => {
    setCurrencyState(c);
    // Write cookie (1 year)
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `${CURRENCY_COOKIE}=${c}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, rates, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}
