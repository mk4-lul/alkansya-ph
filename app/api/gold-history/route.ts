import { NextResponse } from "next/server";

// CoinGecko PAX Gold (PAXG) — gold-backed token that tracks spot gold 1:1
// Complete daily data, no gaps, no API key needed, proven on Vercel

export async function GET() {
  try {
    // CoinGecko free tier: no interval param for days=max, it auto-selects daily
    const url = "https://api.coingecko.com/api/v3/coins/pax-gold/market_chart?vs_currency=usd&days=max";

    const res = await fetch(url, {
      next: { revalidate: 10800 },
      headers: { "Accept": "application/json" },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return NextResponse.json(
        { prices: [], error: `CoinGecko ${res.status}: ${body.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    if (!data?.prices?.length) {
      return NextResponse.json(
        { prices: [], error: "CoinGecko returned no price data" },
        { status: 502 }
      );
    }

    // data.prices is already [[timestamp_ms, price_usd], ...]
    const entries: [number, number][] = data.prices
      .filter((p: [number, number]) => p[1] > 0)
      .map((p: [number, number]) => [p[0], p[1]] as [number, number]);

    // Downsample to ~600 points
    const maxPoints = 600;
    const step = Math.max(1, Math.floor(entries.length / maxPoints));
    const sampled = entries.filter((_: [number, number], i: number) => i % step === 0);
    if (sampled.length > 0 && sampled[sampled.length - 1][0] !== entries[entries.length - 1][0]) {
      sampled.push(entries[entries.length - 1]);
    }

    return NextResponse.json(
      { prices: sampled, currency: "USD" },
      {
        headers: {
          "Cache-Control": "public, s-maxage=10800, stale-while-revalidate=3600",
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      { prices: [], error: String(err) },
      { status: 502 }
    );
  }
}
