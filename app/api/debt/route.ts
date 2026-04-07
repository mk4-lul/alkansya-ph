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

type LocalDebtJsonPoint = {
  isoDate: string;
  debt: number;
  label?: string;
  sourceUrl?: string;
};

const DEBT_LISTING_URL = "https://www.treasury.gov.ph/?page_id=12407";
const LOCAL_DEBT_JSON_PATH = path.join(process.cwd(), "data", "debt-pdfs", "debt-history.json");
const SCRAPE_TIMEOUT_MS = 1500;
const MIN_POINTS_TO_USE_LIVE = 2;

const FALLBACK_DATA: DebtPoint[] = [
  { label: "Dec 2025", isoDate: "2025-12-31", debt: 17.71e12, sourceUrl: "https://www.treasury.gov.ph/wp-content/uploads/2026/02/NG-Debt-Press-Release-December-2025-2.pdf" },
  { label: "Jan 2026", isoDate: "2026-01-31", debt: 18.13e12, sourceUrl: "https://www.treasury.gov.ph/?p=74627" },
  { label: "Feb 2026", isoDate: "2026-02-28", debt: 18.16e12, sourceUrl: "https://www.treasury.gov.ph/?p=75001" },
];

function dedupeAndSort(points: DebtPoint[]): DebtPoint[] {
  const uniq = new Map<string, DebtPoint>();
  points.forEach((row) => uniq.set(row.isoDate, row));
  return Array.from(uniq.values()).sort((a, b) => a.isoDate.localeCompare(b.isoDate));
}

function filterKnownBadPoints(points: DebtPoint[]): DebtPoint[] {
  return points.filter((point) => {
    // OSDEBT_1993-2025.pdf should represent total national debt in trillion-level pesos
    // for modern years. Some parsed rows are malformed (hundreds of billions) and create
    // artificial chart cliffs/spikes, so we drop only those clearly invalid rows.
    if (point.sourceUrl.includes("OSDEBT_1993-2025.pdf") && point.isoDate >= "2010-01-01" && point.debt < 1e12) {
      return false;
    }
    return true;
  });
}

function isFresh(points: DebtPoint[], maxAgeDays = 70): boolean {
  if (points.length === 0) return false;
  const latestIso = points[points.length - 1].isoDate;
  const latest = new Date(`${latestIso}T00:00:00Z`).getTime();
  return Date.now() - latest <= maxAgeDays * 24 * 60 * 60 * 1000;
}

async function readLocalDebtJsonSeries(): Promise<DebtPoint[]> {
  try {
    const raw = await fs.readFile(LOCAL_DEBT_JSON_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const rows = parsed.flatMap((entry: LocalDebtJsonPoint) => {
      if (!entry || typeof entry.isoDate !== "string" || !Number.isFinite(entry.debt)) return [] as DebtPoint[];

      const isoDate = entry.isoDate.slice(0, 10);
      const date = new Date(`${isoDate}T00:00:00Z`);
      if (Number.isNaN(date.getTime())) return [] as DebtPoint[];

      return [{
        isoDate,
        label: entry.label
          ?? date.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }),
        debt: Number(entry.debt),
        sourceUrl: entry.sourceUrl ?? "local://debt-history.json",
      }];
    });

    return dedupeAndSort(filterKnownBadPoints(rows));
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const points = await Promise.race([
      readLocalDebtJsonSeries(),
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
