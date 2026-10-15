export const inrFromPaise = (paise: number) =>
  "₹" + (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0 });

export const discountPct = (price: number, mrp: number) =>
  Math.round((1 - price / mrp) * 100);
