/**
 * Format number to Indonesian currency format
 * Example: 1000000 -> "Rp 1.000.000"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number input with thousand separators
 * Example: "1000000" -> "1.000.000"
 */
export function formatNumberInput(value: string): string {
  const number = value.replace(/\D/g, "");
  if (!number) return "";
  return new Intl.NumberFormat("id-ID").format(Number(number));
}

/**
 * Parse formatted number back to number
 * Example: "1.000.000" -> 1000000
 */
export function parseFormattedNumber(value: string): number {
  const cleaned = value.replace(/\./g, "");
  return Number(cleaned) || 0;
}
