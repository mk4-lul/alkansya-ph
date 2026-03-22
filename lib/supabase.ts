import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ prices: [], error: "No config" }, { status: 500 });
  }

  const cleanUrl = url.trim().replace(/^["']|["']$/g, "");
  const cleanKey = key.trim().replace(/^["']|["']$/g, "");

  const fetchUrl = `${cleanUrl}/rest/v1/gold_prices?select=date,price_usd&order=date.asc&limit=10000`;

  const resp = await fetch(fetchUrl, {
    headers: {
      apikey: cleanKey,
      Authorization: `Bearer ${cleanKey}`,
    },
  });

  const data = await resp.json();
  const count = Array.isArray(data) ? data.length : -1;

  const prices = (data || []).map((row: { date: string; price_usd: number }) => [
    new Date(row.date).getTime(),
    Number(row.price_usd),
  ]);

  return NextResponse.json({
    count,
    total_prices: prices.length,
    first: prices[0],
    last: prices[prices.length - 1],
    prices,
    currency: "USD",
  });
}
