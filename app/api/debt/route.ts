import { NextResponse } from "next/server";

type DebtPoint = {
  label: string;
  isoDate: string;
  debt: number;
  sourceUrl: string;
};

const SEARCH_URL = "https://www.treasury.gov.ph/?s=NG+Debt+Press+Release";

const FALLBACK_DATA: DebtPoint[] = [
  { label: "Nov 2023", isoDate: "2023-11-30", debt: 14.51e12, sourceUrl: "https://www.treasury.gov.ph/" },
  { label: "Dec 2024", isoDate: "2024-12-31", debt: 16.05e12, sourceUrl: "https://www.treasury.gov.ph/" },
  { label: "Jan 2025", isoDate: "2025-01-31", debt: 16.31e12, sourceUrl: "https://www.treasury.gov.ph/" },
  { label: "Feb 2025", isoDate: "2025-02-28", debt: 16.63e12, sourceUrl: "https://www.treasury.gov.ph/" },
  { label: "Sep 2025", isoDate: "2025-09-30", debt: 17.455e12, sourceUrl: "https://www.treasury.gov.ph/" },
  { label: "Oct 2025", isoDate: "2025-10-31", debt: 17.56e12, sourceUrl: "https://www.treasury.gov.ph/" },
  { label: "Nov 2025", isoDate: "2025-11-30", debt: 17.65e12, sourceUrl: "https://www.treasury.gov.ph/" },
];

const monthMap: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

function parseMonthEnd(label: string): { isoDate: string; label: string } | null {
  const m = label.toLowerCase().match(/end[-\s]+([a-z]+)\s+(\d{4})/i);
  if (!m) return null;
  const monthName = m[1].toLowerCase();
  const year = Number(m[2]);
  const monthIndex = monthMap[monthName];
  if (!Number.isFinite(year) || monthIndex === undefined) return null;
  const d = new Date(Date.UTC(year, monthIndex + 1, 0));
  const short = d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
  return { isoDate: d.toISOString().slice(0, 10), label: short };
}

function parseDebtFromHtml(html: string): number | null {
  const match = html.match(/(?:₱|PHP|P)\s?([\d.,]+)\s*trillion/i);
  if (!match) return null;
  const trillions = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(trillions)) return null;
  return trillions * 1e12;
}

function parseLinks(html: string): string[] {
  const links = Array.from(html.matchAll(/href="(https:\/\/www\.treasury\.gov\.ph\/\?p=\d+)"/g)).map((m) => m[1]);
  return [...new Set(links)].slice(0, 24);
}

async function scrapeDebtSeries(): Promise<DebtPoint[]> {
  const searchRes = await fetch(SEARCH_URL, { next: { revalidate: 86400 } });
  if (!searchRes.ok) throw new Error("Failed to load BTr search page");
  const searchHtml = await searchRes.text();
  const links = parseLinks(searchHtml);
  if (links.length === 0) throw new Error("No BTr links found");

  const pages = await Promise.all(
    links.map(async (url) => {
      const r = await fetch(url, { next: { revalidate: 86400 } });
      if (!r.ok) return null;
      const html = await r.text();
      const debt = parseDebtFromHtml(html);
      const parsedDate = parseMonthEnd(html);
      if (!debt || !parsedDate) return null;
      return { ...parsedDate, debt, sourceUrl: url };
    }),
  );

  const cleaned = pages.filter((x): x is DebtPoint => Boolean(x));
  const uniq = new Map<string, DebtPoint>();
  cleaned.forEach((row) => uniq.set(row.isoDate, row));

  return Array.from(uniq.values()).sort((a, b) => a.isoDate.localeCompare(b.isoDate));
}

export async function GET() {
  try {
    const points = await scrapeDebtSeries();
    if (points.length < 4) throw new Error("Too few points");

    return NextResponse.json({
      source: "Bureau of the Treasury (Philippines)",
      sourceUrl: "https://www.treasury.gov.ph/?page_id=12407",
      points,
      usedFallback: false,
    });
  } catch {
    return NextResponse.json({
      source: "Bureau of the Treasury (Philippines)",
      sourceUrl: "https://www.treasury.gov.ph/?page_id=12407",
      points: FALLBACK_DATA,
      usedFallback: true,
    });
  }
}
