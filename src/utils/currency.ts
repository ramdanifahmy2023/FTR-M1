// src/utils/currency.ts

/**
 * Format number to Indonesian currency format
 * Example: 1000000 -> "Rp 1.000.000"
 * With short: 1500000 -> "Rp 1,5 jt"
 */
export function formatCurrency(amount: number, short: boolean = false): string {
  // Format Singkat (untuk chart atau nilai besar)
  if (short) {
    if (Math.abs(amount) >= 1_000_000_000) {
      // Miliar
      return `Rp ${(amount / 1_000_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M`;
    }
    if (Math.abs(amount) >= 1_000_000) {
      // Juta
      return `Rp ${(amount / 1_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} jt`;
    }
    if (Math.abs(amount) >= 1_000) {
      // Ribu
       return `Rp ${(amount / 1_000).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} rb`;
    }
    // Jika di bawah 1000, gunakan format standar tanpa desimal
    // (return format standar di bawah akan menangani ini)
  }

  // Format Standar
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0, // Tidak menampilkan desimal
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number input with thousand separators (as user types)
 * Example: "1000000" -> "1.000.000"
 */
export function formatNumberInput(value: string): string {
  // 1. Hapus semua karakter non-digit
  const numberString = value.replace(/\D/g, "");
  // 2. Jika string kosong setelah dibersihkan, return string kosong
  if (!numberString) return "";
  // 3. Konversi ke angka (untuk menghilangkan leading zeros seperti "00500")
  const number = Number(numberString);
  // 4. Format angka tersebut ke format locale Indonesia
  return new Intl.NumberFormat("id-ID").format(number);
}


/**
 * Parse formatted number string (with dots) back to number
 * Example: "1.000.000" -> 1000000
 */
export function parseFormattedNumber(value: string): number {
  // Hapus semua karakter non-digit (termasuk titik)
  const cleaned = value.replace(/\D/g, "");
  // Konversi ke angka, atau return 0 jika hasil konversi NaN (misal string kosong)
  return Number(cleaned) || 0;
}