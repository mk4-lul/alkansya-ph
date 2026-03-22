import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Don't prerender — env vars aren't available at build time
export const dynamic = "force-dynamic";

// Reads gold_prices from Supabase. Same client pattern as lib/supabase.ts.

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url.trim(), key.trim());
}

export async function GET() {
  const supabase = getSupabase();

  if (!supabase) {
    return NextResponse.json({ prices: [], error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const { data, error } = await supabase
      .from("gold_prices")
      .select("date, price_usd")
      .order("date", { ascending: true })
      .limit(10000);

    if (error) {
      return NextResponse.json({ prices: [], error: error.message }, { status: 502 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ prices: [], error: "No gold data in database" }, { status: 404 });
    }

    const prices: [number, number][] = data.map((row) => [
      new Date(row.date).getTime(),
      Number(row.price_usd),
    ]);

    return NextResponse.json(
      { prices, currency: "USD" },
      {
        headers: {
          "Cache-Control": "public, s-maxage=10800, stale-while-revalidate=3600",
        },
      }
    );
  } catch (err) {
    return NextResponse.json({ prices: [], error: String(err) }, { status: 502 });
  }
}
