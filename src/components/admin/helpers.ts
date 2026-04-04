"use client";

export function useMemoLamaSewa(sewa: string, kembali: string): number {
  if (!sewa || !kembali) return 0;
  const s = new Date(sewa);
  const k = new Date(kembali);
  const diff = k.getTime() - s.getTime();
  if (diff < 0) return 0;
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("Rp", "Rp ");
}

export function formatDateShort(date: string | Date): string {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
