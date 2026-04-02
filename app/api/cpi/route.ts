import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: "No config" }, { status: 500 });
  }

  const cleanUrl = url.trim().replace(/^["']|["']$/g, "");
  const cleanKey = key.trim().replace(/^["']|["']$/g, "");

  const resp = await fetch(
    `${cleanUrl}/rest/v1/cpi_annual?select=year,cpi&order=year.asc`,
    {
      headers: {
        apikey: cleanKey,
        Authorization: `Bearer ${cleanKey}`,
      },
    }
  );

  if (!resp.ok) {
    return NextResponse.json({ error: `Supabase ${resp.status}` }, { status: 502 });
  }

  const data = await resp.json();

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
    },
  });
}
