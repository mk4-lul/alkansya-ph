import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Reads gold_prices from Supabase. Data is complete because we control it.
// Cached 3 hours — scraper runs daily, so data is always fresh enough.

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ prices: [], error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const supabase = createClient(url, key);

    // Supabase defaults to 1000 rows — we have ~2200+
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

    // Convert to [timestamp_ms, price_usd] pairs (~2200 rows, ~44KB — fine to send all)
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
