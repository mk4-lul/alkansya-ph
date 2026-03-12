import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (_supabase) return _supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn("Supabase credentials not configured — using fallback data");
    return null;
  }

  _supabase = createClient(url, key);
  return _supabase;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Bank {
  id: string;
  name: string;
  type: "traditional" | "digital";
  logo: string;
  source_url: string | null;
  notes: string | null;
  has_promo: boolean;
  promo_rate: number | null;
  promo_terms: string | null;
}

export interface SavingsTier {
  rate: number;
  min_deposit: number;
  max_deposit: number | null;
}

export interface BankWithRates extends Bank {
  savings_rate: number; // highest savings rate (for sorting)
  savings_min_rate: number; // lowest savings rate (for range display)
  savings_tiers: SavingsTier[];
  time_deposit_rates: { term_days: number; rate: number }[];
  last_verified: string;
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

export async function getBanksWithRates(): Promise<BankWithRates[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  // Fetch all current rates via the view
  const { data, error } = await supabase
    .from("current_rates")
    .select("*")
    .order("rate", { ascending: false });

  if (error) {
    console.error("Supabase fetch error:", error);
    return [];
  }

  // Group by bank
  const bankMap = new Map<string, BankWithRates>();

  for (const row of data || []) {
    if (!bankMap.has(row.bank_id)) {
      bankMap.set(row.bank_id, {
        id: row.bank_id,
        name: row.bank_name,
        type: row.bank_type,
        logo: row.logo,
        source_url: row.source_url,
        notes: row.notes,
        has_promo: row.has_promo,
        promo_rate: row.promo_rate,
        promo_terms: row.promo_terms,
        savings_rate: 0,
        savings_min_rate: Infinity,
        savings_tiers: [],
        time_deposit_rates: [],
        last_verified: row.verified_at,
      });
    }

    const bank = bankMap.get(row.bank_id)!;

    if (row.product_type === "savings") {
      const rate = Number(row.rate);
      bank.savings_tiers.push({
        rate,
        min_deposit: Number(row.min_deposit) || 0,
        max_deposit: row.max_deposit ? Number(row.max_deposit) : null,
      });
      if (rate > bank.savings_rate) bank.savings_rate = rate;
      if (rate < bank.savings_min_rate) bank.savings_min_rate = rate;
    } else if (row.product_type === "time_deposit" && row.term_days) {
      bank.time_deposit_rates.push({
        term_days: row.term_days,
        rate: Number(row.rate),
      });
    }

    // Track most recent verification
    if (row.verified_at > bank.last_verified) {
      bank.last_verified = row.verified_at;
    }
  }

  // Sort and fix up
  for (const bank of bankMap.values()) {
    bank.time_deposit_rates.sort((a, b) => a.term_days - b.term_days);
    bank.savings_tiers.sort((a, b) => a.min_deposit - b.min_deposit);
    // If no savings tiers found, min = max = 0
    if (bank.savings_min_rate === Infinity) bank.savings_min_rate = bank.savings_rate;
  }

  return Array.from(bankMap.values());
}

export async function flagRate(bankId: string, reason?: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.from("rate_flags").insert({
    bank_id: bankId,
    reason: reason || "Rate may be outdated",
  });
  if (error) console.error("Flag error:", error);
}
