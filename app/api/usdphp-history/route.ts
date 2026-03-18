import { NextResponse } from "next/server";

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const url = `https://api.frankfurter.dev/v1/1999-01-04..${today}?base=USD&symbols=PHP`;

    const res = await fetch(url, {
      next: { revalidate: 10800 },
      headers: { "Accept": "application/json" },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return NextResponse.json(
        { prices: [], error: `Frankfurter ${res.status}: ${body.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    if (!data?.rates) {
      return NextResponse.json(
        { prices: [], error: "Frankfurter returned no rate data" },
        { status: 502 }
      );
    }

    const entries = Object.entries(data.rates as Record<string, { PHP: number }>)
      .map(([date, rates]) => [new Date(date).getTime(), rates.PHP] as [number, number])
      .sort((a, b) => a[0] - b[0]);

    const maxPoints = 500;
    const step = Math.max(1, Math.floor(entries.length / maxPoints));
    const sampled = entries.filter((_, i) => i % step === 0);
    if (sampled.length > 0 && sampled[sampled.length - 1][0] !== entries[entries.length - 1][0]) {
      sampled.push(entries[entries.length - 1]);
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
