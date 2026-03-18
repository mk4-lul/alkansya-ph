import { NextResponse } from "next/server";

const API_URL =
  "https://api.coingecko.com/api/v3/coins/tether/market_chart?vs_currency=php&days=max";

export async function GET() {
  try {
    const res = await fetch(API_URL, { next: { revalidate: 10800 } }); // 3 hours
    if (!res.ok) throw new Error(res.statusText);

    const data = await res.json();
    if (!data?.prices?.length) throw new Error("No price data");

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
  } catch {
    return NextResponse.json({ prices: [] }, { status: 502 });
  }
}
