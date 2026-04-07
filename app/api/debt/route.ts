import { NextResponse } from "next/server";

type DebtPoint = {
  label: string;
  isoDate: string;
  debt: number;
  sourceUrl: string;
};

const DEBT_LISTING_URL = "https://www.treasury.gov.ph/?page_id=12407";

const FALLBACK_DATA: DebtPoint[] = [
  { label: "Dec 2025", isoDate: "2025-12-31", debt: 17.71e12, sourceUrl: "https://www.treasury.gov.ph/wp-content/uploads/2026/02/NG-Debt-Press-Release-December-2025-2.pdf" },
  { label: "Jan 2026", isoDate: "2026-01-31", debt: 18.13e12, sourceUrl: "https://www.treasury.gov.ph/?p=74627" },
  { label: "Feb 2026", isoDate: "2026-02-28", debt: 18.16e12, sourceUrl: "https://www.treasury.gov.ph/?p=75001" },
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

function parseDebtFromText(text: string): number | null {
  const match = text.match(/(?:₱|PHP|P)\s?([\d.,]+)\s*trillion/i);
  if (!match) return null;
  const trillions = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(trillions)) return null;
  return trillions * 1e12;
}

function toMonthEnd(monthName: string, year: number): { isoDate: string; label: string } | null {
  const idx = monthMap[monthName.toLowerCase()];
  if (idx === undefined || !Number.isFinite(year)) return null;
  const d = new Date(Date.UTC(year, idx + 1, 0));
  return {
    isoDate: d.toISOString().slice(0, 10),
    label: d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }),
  };
}

function dedupeAndSort(points: DebtPoint[]): DebtPoint[] {
  const uniq = new Map<string, DebtPoint>();
  points.forEach((row) => uniq.set(row.isoDate, row));
  return Array.from(uniq.values()).sort((a, b) => a.isoDate.localeCompare(b.isoDate));
}

function isFresh(points: DebtPoint[], maxAgeDays = 70): boolean {
  if (points.length === 0) return false;
  const latestIso = points[points.length - 1].isoDate;
  const latest = new Date(`${latestIso}T00:00:00Z`).getTime();
  return Date.now() - latest <= maxAgeDays * 24 * 60 * 60 * 1000;
}

function extractPdfLinks(html: string): string[] {
  const links = Array.from(html.matchAll(/href="(https:\/\/www\.treasury\.gov\.ph\/wp-content\/uploads\/[^"]*NG-Debt-Press-Release[^"]*\.pdf)"/gi)).map((m) => m[1]);
  return Array.from(new Set(links)).slice(0, 24);
}

function monthYearFromUrl(url: string): { month: string; year: number } | null {
  const clean = decodeURIComponent(url);
  const m = clean.match(/(?:-|_)(January|February|March|April|May|June|July|August|September|October|November|December)[-_\s]?(\d{4})/i);
  if (!m) return null;
  return { month: m[1], year: Number(m[2]) };
}

async function scrapeViaDebtListingPage(): Promise<DebtPoint[]> {
  const listRes = await fetch(DEBT_LISTING_URL, { next: { revalidate: 21600 } });
  if (!listRes.ok) return [];
  const listingHtml = await listRes.text();
  const pdfLinks = extractPdfLinks(listingHtml);

  const rows = await Promise.all(
    pdfLinks.map(async (url) => {
      const monthYear = monthYearFromUrl(url);
      if (!monthYear) return null;

      const date = toMonthEnd(monthYear.month, monthYear.year);
      if (!date) return null;

      const pdfRes = await fetch(url, { next: { revalidate: 21600 } });
      if (!pdfRes.ok) return null;
      const buf = Buffer.from(await pdfRes.arrayBuffer());
      const raw = buf.toString("latin1");

      const debt = parseDebtFromText(raw);
      if (!debt) return null;

      return { ...date, debt, sourceUrl: url };
    }),
  );

  return dedupeAndSort(rows.filter((x): x is DebtPoint => Boolean(x)));
}

export async function GET() {
  try {
    const points = await scrapeViaDebtListingPage();
    if (points.length >= 3 && isFresh(points)) {
      return NextResponse.json({
        source: "Bureau of the Treasury (Philippines)",
        sourceUrl: DEBT_LISTING_URL,
        points,
        usedFallback: false,
      });
    }

    return NextResponse.json({
      source: "Bureau of the Treasury (Philippines)",
      sourceUrl: DEBT_LISTING_URL,
      points: FALLBACK_DATA,
      usedFallback: true,
      staleLiveData: true,
    });
  } catch {
    return NextResponse.json({
      source: "Bureau of the Treasury (Philippines)",
      sourceUrl: DEBT_LISTING_URL,
      points: FALLBACK_DATA,
      usedFallback: true,
    });
  }
}
