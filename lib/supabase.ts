import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (_supabase) return _supabase;
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("Supabase credentials not configured — using fallback data");
    return null;
  }
  // Strip any accidental quotes or whitespace from env vars
  url = url.trim().replace(/^["']|["']$/g, "");
  key = key.trim().replace(/^["']|["']$/g, "");
  try {
    _supabase = createClient(url, key);
  } catch (err) {
    console.error("Supabase client creation failed:", err);
    return null;
  }
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
  td_source_url: string | null;
  notes: string | null;
  has_promo: boolean;
  promo_rate: number | null;
  promo_terms: string | null;
  avg_app_rating: number | null;
  play_store_rating: number | null;
  app_store_rating: number | null;
}

export interface SavingsTier {
  rate: number;
  min_deposit: number;
  max_deposit: number | null;
}

export interface SavingsProduct {
  name: string;
  tiers: SavingsTier[];
  best_rate: number;
  min_rate: number;
}

export interface TimeDepositRate {
  term_days: number;
  rate: number;
  min_deposit: number;
  max_deposit: number | null;
}

export interface BankWithRates extends Bank {
  savings_rate: number;
  savings_min_rate: number;
  savings_products: SavingsProduct[];
  savings_tiers: SavingsTier[];
  time_deposit_rates: TimeDepositRate[];
  last_verified: string;
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

export async function getBanksWithRates(): Promise<BankWithRates[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("current_rates")
    .select("*")
    .order("rate", { ascending: false });

  if (error) {
    console.error("Supabase fetch error:", error);
    return [];
  }

  const bankMap = new Map<string, BankWithRates>();

  for (const row of data || []) {
    if (!bankMap.has(row.bank_id)) {
      bankMap.set(row.bank_id, {
        id: row.bank_id,
        name: row.bank_name,
        type: row.bank_type,
        logo: row.logo,
        source_url: row.source_url,
        td_source_url: row.td_source_url || null,
        notes: row.notes,
        has_promo: row.has_promo,
        promo_rate: row.promo_rate,
        promo_terms: row.promo_terms,
        avg_app_rating: row.avg_app_rating ? Number(row.avg_app_rating) : null,
        play_store_rating: row.play_store_rating ? Number(row.play_store_rating) : null,
        app_store_rating: row.app_store_rating ? Number(row.app_store_rating) : null,
        savings_rate: 0,
        savings_min_rate: Infinity,
        savings_products: [],
        savings_tiers: [],
        time_deposit_rates: [],
        last_verified: row.verified_at,
      });
    }

    const bank = bankMap.get(row.bank_id)!;

    if (row.product_type === "savings") {
      const rate = Number(row.rate);
      const productName = row.product_name || "Savings";

      if (rate > bank.savings_rate) bank.savings_rate = rate;
      if (rate < bank.savings_min_rate) bank.savings_min_rate = rate;

      bank.savings_tiers.push({
        rate,
        min_deposit: Number(row.min_deposit) || 0,
        max_deposit: row.max_deposit ? Number(row.max_deposit) : null,
      });

      let product = bank.savings_products.find((p) => p.name === productName);
      if (!product) {
        product = { name: productName, tiers: [], best_rate: 0, min_rate: Infinity };
        bank.savings_products.push(product);
      }
      product.tiers.push({
        rate,
        min_deposit: Number(row.min_deposit) || 0,
        max_deposit: row.max_deposit ? Number(row.max_deposit) : null,
      });
      if (rate > product.best_rate) product.best_rate = rate;
      if (rate < product.min_rate) product.min_rate = rate;

    } else if (row.product_type === "time_deposit" && row.term_days) {
      bank.time_deposit_rates.push({
        term_days: row.term_days,
        rate: Number(row.rate),
        min_deposit: Number(row.min_deposit) || 0,
        max_deposit: row.max_deposit ? Number(row.max_deposit) : null,
      });
    }

    if (row.verified_at > bank.last_verified) {
      bank.last_verified = row.verified_at;
    }
  }

  for (const bank of bankMap.values()) {
    bank.time_deposit_rates.sort((a, b) => a.term_days - b.term_days || a.min_deposit - b.min_deposit);
    bank.savings_tiers.sort((a, b) => a.min_deposit - b.min_deposit);
    bank.savings_products.sort((a, b) => b.best_rate - a.best_rate);
    for (const p of bank.savings_products) {
      p.tiers.sort((a, b) => a.min_deposit - b.min_deposit);
      if (p.min_rate === Infinity) p.min_rate = p.best_rate;
    }
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

export async function getGoldPrices(): Promise<[number, number][]> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return [];

    const cleanUrl = url.trim().replace(/^["']|["']$/g, "");
    const cleanKey = key.trim().replace(/^["']|["']$/g, "");

    const resp = await fetch(
      `${cleanUrl}/rest/v1/gold_prices?select=date,price_usd&order=date.asc`,
      {
        headers: {
          apikey: cleanKey,
          Authorization: `Bearer ${cleanKey}`,
          Range: "0-9999",
        },
      }
    );

    if (!resp.ok) {
      console.error("Gold prices fetch error:", resp.status);
      return [];
    }

    const data = await resp.json();
    return (data || []).map((row: { date: string; price_usd: number }) => [
      new Date(row.date).getTime(),
      Number(row.price_usd),
    ]);
  } catch (err) {
    console.error("Gold prices error:", err);
    return [];
  }
}
