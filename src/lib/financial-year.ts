/** Returns Indian financial year string for a date, e.g. "2026-27" for April 2026 */
export function getFinancialYear(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  if (month >= 4) {
    return `${year}-${String(year + 1).slice(2)}`;
  }
  return `${year - 1}-${String(year).slice(2)}`;
}

/** Converts a paise integer to Indian words, e.g. 123456 → "Rupees One Thousand Two Hundred Thirty-Four and Fifty-Six Paise Only" */
export function inrInWords(paise: number): string {
  const totalPaise = Math.round(paise);
  const rupees = Math.floor(totalPaise / 100);
  const p = totalPaise % 100;

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function toWords(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n] + " ";
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? "-" + ones[n % 10] : "") + " ";
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred " + toWords(n % 100);
    if (n < 100000) return toWords(Math.floor(n / 1000)) + "Thousand " + toWords(n % 1000);
    if (n < 10000000) return toWords(Math.floor(n / 100000)) + "Lakh " + toWords(n % 100000);
    return toWords(Math.floor(n / 10000000)) + "Crore " + toWords(n % 10000000);
  }

  const rupeesText = rupees === 0 ? "Zero" : toWords(rupees).trim();
  const paiseText = p > 0 ? ` and ${toWords(p).trim()} Paise` : "";
  return `Rupees ${rupeesText}${paiseText} Only`;
}
