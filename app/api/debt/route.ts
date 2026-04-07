import { NextResponse } from "next/server";

type DebtPoint = {
  label: string;
  isoDate: string;
  debt: number;
  sourceUrl: string;
};

const SEARCH_URL = "https://www.treasury.gov.ph/?s=NG+Debt+Press+Release";
const WP_POSTS_URL = "https://www.treasury.gov.ph/wp-json/wp/v2/posts?search=NG%20Debt%20Press%20Release&per_page=40&_fields=link,title,content,date";

const FALLBACK_DATA: DebtPoint[] = [
  { label: "Dec 2025", isoDate: "2025-12-31", debt: 17.71e12, sourceUrl: "https://www.treasury.gov.ph/wp-content/uploads/2026/02/NG-Debt-Press-Release-December-2025-2.pdf" },
  { label: "Jan 2026", isoDate: "2026-01-31", debt: 18.13e12, sourceUrl: "https://www.treasury.gov.ph/wp-content/uploads/2026/03/NG-Debt-Press-Release-January-2026.pdf" },
  { label: "Feb 2026", isoDate: "2026-02-28", debt: 18.16e12, sourceUrl: "https://www.treasury.gov.ph/" },
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

function parseMonthEnd(text: string): { isoDate: string; label: string } | null {
  const m = text.toLowerCase().match(/end[-\s]+([a-z]+)\s+(\d{4})/i);
  if (!m) return null;
  const monthName = m[1].toLowerCase();
  const year = Number(m[2]);
  const monthIndex = monthMap[monthName];
  if (!Number.isFinite(year) || monthIndex === undefined) return null;
  const d = new Date(Date.UTC(year, monthIndex + 1, 0));
  const short = d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
  return { isoDate: d.toISOString().slice(0, 10), label: short };
}

function parseDebtFromText(text: string): number | null {
  const match = text.match(/(?:₱|PHP|P)\s?([\d.,]+)\s*trillion/i);
  if (!match) return null;
  const trillions = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(trillions)) return null;
  return trillions * 1e12;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function parseLinks(html: string): string[] {
  const links = Array.from(html.matchAll(/href="(https:\/\/www\.treasury\.gov\.ph\/\?p=\d+)"/g)).map((m) => m[1]);
  return Array.from(new Set(links)).slice(0, 36);
}

function dedupeAndSort(points: DebtPoint[]): DebtPoint[] {
  const uniq = new Map<string, DebtPoint>();
  points.forEach((row) => uniq.set(row.isoDate, row));
  return Array.from(uniq.values()).sort((a, b) => a.isoDate.localeCompare(b.isoDate));
}

async function scrapeViaWpApi(): Promise<DebtPoint[]> {
  const res = await fetch(WP_POSTS_URL, { next: { revalidate: 43200 } });
  if (!res.ok) throw new Error("Failed to load WP JSON posts");
  const posts = await res.json();
  if (!Array.isArray(posts)) throw new Error("WP JSON shape mismatch");

  const rows: DebtPoint[] = [];
  for (const post of posts) {
    const title = stripHtml(post?.title?.rendered ?? "");
    const content = stripHtml(post?.content?.rendered ?? "");
    const combined = `${title} ${content}`;
    const parsedDate = parseMonthEnd(combined);
    const debt = parseDebtFromText(combined);
    const sourceUrl = typeof post?.link === "string" ? post.link : "https://www.treasury.gov.ph/";

    if (parsedDate && debt) rows.push({ ...parsedDate, debt, sourceUrl });
  }

  return dedupeAndSort(rows);
}

async function scrapeViaSearchPage(): Promise<DebtPoint[]> {
  const searchRes = await fetch(SEARCH_URL, { next: { revalidate: 43200 } });
  if (!searchRes.ok) throw new Error("Failed to load BTr search page");
  const searchHtml = await searchRes.text();
  const links = parseLinks(searchHtml);
  if (links.length === 0) throw new Error("No BTr links found");

  const pages = await Promise.all(
    links.map(async (url) => {
      const r = await fetch(url, { next: { revalidate: 43200 } });
      if (!r.ok) return null;
      const html = await r.text();
      const text = stripHtml(html);
      const debt = parseDebtFromText(text);
      const parsedDate = parseMonthEnd(text);
      if (!debt || !parsedDate) return null;
      return { ...parsedDate, debt, sourceUrl: url };
    }),
  );

  return dedupeAndSort(pages.filter((x): x is DebtPoint => Boolean(x)));
}

export async function GET() {
  try {
    const viaApi = await scrapeViaWpApi();
    if (viaApi.length >= 3) {
      return NextResponse.json({
        source: "Bureau of the Treasury (Philippines)",
        sourceUrl: "https://www.treasury.gov.ph/?page_id=12407",
        points: viaApi,
        usedFallback: false,
      });
    }

    const viaSearch = await scrapeViaSearchPage();
    if (viaSearch.length >= 3) {
      return NextResponse.json({
        source: "Bureau of the Treasury (Philippines)",
        sourceUrl: "https://www.treasury.gov.ph/?page_id=12407",
        points: viaSearch,
        usedFallback: false,
      });
    }

    throw new Error("No sufficient live points");
  } catch {
    return NextResponse.json({
      source: "Bureau of the Treasury (Philippines)",
      sourceUrl: "https://www.treasury.gov.ph/?page_id=12407",
      points: FALLBACK_DATA,
      usedFallback: true,
    });
  }
}
