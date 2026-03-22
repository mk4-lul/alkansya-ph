import { NextResponse } from "next/server";

// Yahoo Finance chart API — GC=F (Gold Futures)
// Returns complete daily OHLCV data, no API key needed

export async function GET() {
  try {
    // Fetch max range daily data for gold futures
    const url = "https://query1.finance.yahoo.com/v8/finance/chart/GC=F?range=max&interval=1d";

    const res = await fetch(url, {
      next: { revalidate: 10800 }, // cache 3 hours
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return NextResponse.json(
        { prices: [], error: `Yahoo ${res.status}: ${body.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result?.timestamp || !result?.indicators?.quote?.[0]?.close) {
      return NextResponse.json(
        { prices: [], error: "Yahoo returned no chart data" },
        { status: 502 }
      );
    }

    const timestamps: number[] = result.timestamp;
    const closes: (number | null)[] = result.indicators.quote[0].close;

    // Build [timestamp_ms, close_usd] pairs, skip nulls
    const entries: [number, number][] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const close = closes[i];
      if (close != null && close > 0) {
        entries.push([timestamps[i] * 1000, close]);
      }
    }

    // Downsample to ~800 points for performance
    const maxPoints = 800;
    const step = Math.max(1, Math.floor(entries.length / maxPoints));
    const sampled = entries.filter((_, i) => i % step === 0);
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
