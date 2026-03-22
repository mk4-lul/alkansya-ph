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

  const resp = await fetch(
    `${cleanUrl}/rest/v1/gold_prices?select=date,price_usd&order=date.asc&limit=10000`,
    {
      headers: {
        apikey: cleanKey,
        Authorization: `Bearer ${cleanKey}`,
      },
    }
  );

  if (!resp.ok) {
    return NextResponse.json({ prices: [], error: `Supabase ${resp.status}` }, { status: 502 });
  }

  const data = await resp.json();
  const prices = (data || []).map((row: { date: string; price_usd: number }) => [
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
}
