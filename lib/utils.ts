import { SavingsTier } from "@/lib/supabase";

export function formatPeso(amount: number): string {
  return "₱" + amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPesoShort(amount: number): string {
  if (amount >= 1000000) return `₱${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `₱${(amount / 1000).toFixed(0)}k`;
  return `₱${amount}`;
}

export function calcInterest(
  principal: number,
  ratePercent: number,
  days: number = 365
): number {
  return principal * (ratePercent / 100) * (days / 365);
}

export function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

/** Get the savings rate for a specific deposit amount from tiers */
export function getRateForAmount(tiers: SavingsTier[], amount: number): number {
  if (tiers.length === 0) return 0;
  // Find the tier that matches the amount
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (amount >= tiers[i].min_deposit) {
      if (tiers[i].max_deposit === null || amount <= tiers[i].max_deposit) {
        return tiers[i].rate;
      }
    }
  }
  // Fallback to first tier
  return tiers[0].rate;
}

/** Format a rate range like "0.0625% – 0.125%" or just "3.5%" if single tier */
export function formatRateRange(minRate: number, maxRate: number): string {
  if (minRate === maxRate) return `${maxRate}%`;
  return `${minRate}% – ${maxRate}%`;
}

export const AMOUNT_BRACKETS = [
  { label: "₱10,000", value: 10000 },
  { label: "₱50,000", value: 50000 },
  { label: "₱100,000", value: 100000 },
  { label: "₱250,000", value: 250000 },
  { label: "₱500,000", value: 500000 },
  { label: "₱1,000,000", value: 1000000 },
];

export const TERM_LABELS: Record<number, string> = {
  30: "30 Days",
  60: "60 Days",
  90: "90 Days",
  120: "120 Days",
  180: "6 Months",
  360: "1 Year",
  365: "1 Year",
};
