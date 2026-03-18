import { NextResponse } from "next/server";

// Use a concrete day count — 'max' is unreliable on CoinGecko free tier
const API_URL =
  "https://api.coingecko.com/api/v3/coins/tether/market_chart?vs_currency=php&days=3650";

export async function GET() {
  try {
    const res = await fetch(API_URL, {
      next: { revalidate: 10800 }, // Next.js caches upstream response for 3 hours
      headers: {
        "Accept": "application/json",
        "User-Agent": "alkansya-ph/1.0",
      },
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

    // Downsample to ~500 points
    const raw = data.prices as [number, number][];
    const maxPoints = 500;
    const step = Math.max(1, Math.floor(raw.length / maxPoints));
    const sampled = raw.filter((_: [number, number], i: number) => i % step === 0);
    if (sampled[sampled.length - 1][0] !== raw[raw.length - 1][0]) {
      sampled.push(raw[raw.length - 1]);
    }

    return NextResponse.json(
      { prices: sampled },
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
