import { inflateSync } from "node:zlib";
import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type DebtPoint = {
  label: string;
  isoDate: string;
  debt: number;
  sourceUrl: string;
};

const DEBT_LISTING_URL = "https://www.treasury.gov.ph/?page_id=12407";
const OSDEBT_SERIES_URL = "https://www.treasury.gov.ph/wp-content/uploads/2026/03/OSDEBT_1993-2025.pdf";
const ANNUAL_DEBT_SERIES_URL = "https://www.treasury.gov.ph/wp-content/uploads/2026/03/Debt-Stock-Annual-1986-2025.pdf";
const LOCAL_DEBT_PDF_DIR = path.join(process.cwd(), "data", "debt-pdfs");
const MAX_LOCAL_PDF_PARSE_BYTES = 300_000;
const SCRAPE_TIMEOUT_MS = 4500;
const MIN_POINTS_TO_USE_LIVE = 2;

const FALLBACK_DATA: DebtPoint[] = [
  { label: "Dec 2025", isoDate: "2025-12-31", debt: 17.71e12, sourceUrl: "https://www.treasury.gov.ph/wp-content/uploads/2026/02/NG-Debt-Press-Release-December-2025-2.pdf" },
  { label: "Jan 2026", isoDate: "2026-01-31", debt: 18.13e12, sourceUrl: "https://www.treasury.gov.ph/?p=74627" },
  { label: "Feb 2026", isoDate: "2026-02-28", debt: 18.16e12, sourceUrl: "https://www.treasury.gov.ph/?p=75001" },
];

const monthMap: Record<string, number> = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

function cleanPdfLiteralText(input: string): string {
  const octalDecoded = input.replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(Number.parseInt(oct, 8)));
  return octalDecoded
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

function extractTextFromPdfBuffer(buf: Buffer): string {
  const binary = buf.toString("latin1");
  const chunks: string[] = [];

  let cursor = 0;
  while (cursor < binary.length) {
    const streamIdx = binary.indexOf("stream", cursor);
    if (streamIdx < 0) break;

    let start = streamIdx + 6;
    if (binary[start] === "\r" && binary[start + 1] === "\n") start += 2;
    else if (binary[start] === "\n") start += 1;

    const end = binary.indexOf("endstream", start);
    if (end < 0) break;

    const compressed = buf.subarray(start, end);
    try {
      const inflated = inflateSync(compressed).toString("latin1");

      for (const match of inflated.matchAll(/\(([^()]*(?:\\.[^()]*)*)\)\s*Tj/g)) {
        chunks.push(cleanPdfLiteralText(match[1]));
      }

      for (const match of inflated.matchAll(/\[(.*?)\]\s*TJ/gs)) {
        for (const piece of match[1].matchAll(/\(([^()]*(?:\\.[^()]*)*)\)/g)) {
          chunks.push(cleanPdfLiteralText(piece[1]));
        }
      }
    } catch {
      // Not a deflate-compressed text stream. Skip.
    }

    cursor = end + 9;
  }

  return chunks.join(" ");
}

function parseDebtFromText(text: string): number | null {
  const normalized = text.replace(/\s+/g, " ");
  const match = normalized.match(/(?:₱|PHP|P)\s*([\d.,]+)\s*(trillion|billion)/i);
  if (!match) return null;

  const base = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(base)) return null;

  const unit = match[2].toLowerCase();
  return unit === "trillion" ? base * 1e12 : base * 1e9;
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

function toYearEnd(year: number): { isoDate: string; label: string } {
  const d = new Date(Date.UTC(year, 11, 31));
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
  const allPdfLinks = Array.from(html.matchAll(/href="(https:\/\/www\.treasury\.gov\.ph\/wp-content\/uploads\/[^"]+\.pdf)"/gi)).map((m) => m[1]);
  const debtLinks = allPdfLinks.filter((url) => {
    const clean = decodeURIComponent(url).toLowerCase();
    return (
      clean.includes("debt")
      && (
        clean.includes("press-release")
        || clean.includes("debt-web")
        || clean.includes("debt-stock-annual")
        || clean.includes("osdebt")
      )
    );
  });

  debtLinks.push(OSDEBT_SERIES_URL, ANNUAL_DEBT_SERIES_URL);
  return Array.from(new Set(debtLinks));
}

function monthYearFromUrl(url: string): { month: string; year: number } | null {
  const clean = decodeURIComponent(url);
  const m = clean.match(/(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[-_\s]*(\d{4})/i);
  if (!m) return null;
  return { month: m[1], year: Number(m[2]) };
}

async function readLocalDebtPdfFiles(): Promise<Array<{ sourceUrl: string; raw: string }>> {
  try {
    const entries = await fs.readdir(LOCAL_DEBT_PDF_DIR, { withFileTypes: true });
    const pdfs = entries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".pdf"));

    return Promise.all(
      pdfs.map(async (entry) => {
        const filePath = path.join(LOCAL_DEBT_PDF_DIR, entry.name);
        const buf = await fs.readFile(filePath);
        const shouldParse = buf.byteLength <= MAX_LOCAL_PDF_PARSE_BYTES || entry.name.toLowerCase().includes("debt-web");
        return {
          sourceUrl: `local://${entry.name}`,
          raw: shouldParse ? extractTextFromPdfBuffer(buf) : "",
        };
      }),
    );
  } catch {
    return [];
  }
}

function parseOsDebtDecemberSeries(text: string, sourceUrl: string): DebtPoint[] {
  const rows: DebtPoint[] = [];
  const blockRegex = /As\s+of\s+December\s+(\d{4})[\s\S]*?\bT\s*O\s*T\s*A\s*L\b\s+([\d,\.\s]+?)(?:Forex\s+Rate\s+Used|\*Breakdown|Source:)/gi;

  let match: RegExpExecArray | null = blockRegex.exec(text);
  while (match) {
    const year = Number(match[1]);
    const values = (match[2].match(/[\d,]+(?:\.\d+)?/g) ?? [])
      .map((raw) => Number(raw.replace(/,/g, "")))
      .filter((n) => Number.isFinite(n));

    const december = values.at(-1);
    if (Number.isFinite(december) && year >= 1993) {
      const date = toYearEnd(year);
      rows.push({ ...date, debt: Number(december) * 1e6, sourceUrl });
    }

    match = blockRegex.exec(text);
  }

  return rows;
}

function parseAnnualLegacySeries(text: string, sourceUrl: string): DebtPoint[] {
  const rows: DebtPoint[] = [];
  const tableRegex = /Particulars\s+((?:19|20)\d{2}[\s\S]{10,300}?)T\s*O\s*T\s*A\s*L\s+((?:[\d,]+\s+){5,25})/gi;

  let match: RegExpExecArray | null = tableRegex.exec(text);
  while (match) {
    const years = Array.from(match[1].matchAll(/\b((?:19|20)\d{2})\b/g)).map((x) => Number(x[1]));
    const values = (match[2].match(/[\d,]+/g) ?? [])
      .map((raw) => Number(raw.replace(/,/g, "")))
      .filter((n) => Number.isFinite(n));

    if (years.length > 0 && values.length >= years.length) {
      years.forEach((year, idx) => {
        const value = values[idx];
        if (!Number.isFinite(value)) return;
        const date = toYearEnd(year);
        rows.push({ ...date, debt: value * 1e6, sourceUrl });
      });
    }

    match = tableRegex.exec(text);
  }

  return rows;
}

async function scrapeViaDebtListingPage(): Promise<DebtPoint[]> {
  const localPdfData = await readLocalDebtPdfFiles();

  const parseRows = (pdfData: Array<{ sourceUrl: string; raw: string }>) => {
    const rows = pdfData.map(({ sourceUrl, raw }) => {
      const lowerSource = sourceUrl.toLowerCase();

      if (lowerSource.includes("osdebt")) {
        return parseOsDebtDecemberSeries(raw, sourceUrl);
      }

      if (lowerSource.includes("debt-stock-annual")) {
        return parseAnnualLegacySeries(raw, sourceUrl);
      }

      const monthYear = monthYearFromUrl(sourceUrl);
      if (!monthYear) return [] as DebtPoint[];

      const date = toMonthEnd(monthYear.month, monthYear.year);
      if (!date) return [] as DebtPoint[];

      const debt = parseDebtFromText(raw);
      if (!debt) return [] as DebtPoint[];

      return [{ ...date, debt, sourceUrl }];
    });

    return dedupeAndSort(rows.flat());
  };

  const localPoints = parseRows(localPdfData);
  if (localPoints.length >= 10) {
    return localPoints;
  }

  const fetchWithTimeout = async (url: string, timeoutMs = 9000) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { next: { revalidate: 21600 }, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  };

  let remotePdfData: Array<{ sourceUrl: string; raw: string }> = [];

  try {
    const listRes = await fetchWithTimeout(DEBT_LISTING_URL);
    if (listRes.ok) {
      const listingHtml = await listRes.text();
      const pdfLinks = extractPdfLinks(listingHtml);

      const remoteResults = await Promise.allSettled(
        pdfLinks.map(async (url) => {
          const pdfRes = await fetchWithTimeout(url);
          if (!pdfRes.ok) return null;
          const buf = Buffer.from(await pdfRes.arrayBuffer());
          return {
            sourceUrl: url,
            raw: extractTextFromPdfBuffer(buf),
          };
        }),
      );

      remotePdfData = remoteResults
        .flatMap((result) => (result.status === "fulfilled" ? [result.value] : []))
        .filter((row): row is { sourceUrl: string; raw: string } => !!row);
    }
  } catch {
    // Ignore network errors. Local PDFs can still be parsed.
  }

  return parseRows([...remotePdfData, ...localPdfData]);
}

export async function GET() {
  try {
    const points = await Promise.race([
      scrapeViaDebtListingPage(),
      new Promise<DebtPoint[]>((resolve) => setTimeout(() => resolve([]), SCRAPE_TIMEOUT_MS)),
    ]);
    if (points.length >= MIN_POINTS_TO_USE_LIVE) {
      return NextResponse.json({
        source: "Bureau of the Treasury (Philippines)",
        sourceUrl: DEBT_LISTING_URL,
        points,
        usedFallback: false,
        staleLiveData: !isFresh(points),
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
