"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import NavMenu from "@/components/NavMenu";

// ─── 2023 FIES Income Distribution Data ──────────────────────────
//
// HOW THIS WAS CALCULATED:
//
// Source: Philippine Statistics Authority (PSA), 2023 Family Income
// and Expenditure Survey (FIES) — the official nationwide survey of
// ~163,000 households conducted in July 2023 and January 2024.
//
// The PSA published the 2018 FIES with exact average annual family
// income per decile (₱107k for the 1st decile through ₱867k for
// the 10th decile). For 2023, PSA published:
//   - National average: ₱353,230/year
//   - Median family income: ₱241,080/year
//   - Bottom deciles grew ~25-26%, top grew ~10-12%
//   - Total families surveyed: ~27.4 million
//
// We scaled the 2018 decile averages using these published growth
// rates and validated against the 2023 average and median.
//
// Each decile average represents the midpoint of that 10% band:
//   1st decile avg → ~5th percentile
//   2nd decile avg → ~15th percentile
//   ...
//   10th decile avg → ~95th percentile
//
// We interpolate linearly between these points to estimate your
// percentile. This is an approximation — your actual rank may vary
// by a few percentage points.

// [percentile, annual family income in PHP]
const INCOME_CURVE: [number, number][] = [
  [0, 50000],      // estimated floor
  [5, 135000],     // 1st decile avg
  [15, 155000],    // 2nd decile avg
  [25, 190000],    // 3rd decile avg
  [35, 220000],    // 4th decile avg
  [45, 230000],    // 5th decile avg
  [50, 241000],    // median (PSA confirmed)
  [55, 255000],    // 6th decile avg
  [65, 340000],    // 7th decile avg
  [75, 430000],    // 8th decile avg
  [85, 585000],    // 9th decile avg
  [95, 995000],    // 10th decile avg
  [99, 1800000],   // estimated top 1%
  [100, 5000000],  // estimated ceiling
];

function getPercentile(annualIncome: number): number {
  if (annualIncome <= INCOME_CURVE[0][1]) return 0;
  if (annualIncome >= INCOME_CURVE[INCOME_CURVE.length - 1][1]) return 100;

  for (let i = 1; i < INCOME_CURVE.length; i++) {
    const [p0, inc0] = INCOME_CURVE[i - 1];
    const [p1, inc1] = INCOME_CURVE[i];
    if (annualIncome <= inc1) {
      const t = (annualIncome - inc0) / (inc1 - inc0);
      return p0 + t * (p1 - p0);
    }
  }
  return 100;
}

// ─── Verdicts ────────────────────────────────────────────────────

interface Verdict {
  emoji: string;
  title: string;
  subtitle: string;
  message: string;
  color: string;    // bg color
  textColor: string;
  subColor: string;
}

function getVerdict(percentile: number, monthlyIncome: number): Verdict {
  if (percentile >= 95) return {
    emoji: "👑", title: "Nako, boss ka talaga.", subtitle: "Top 5% ka sa Pilipinas.",
    message: `₱${fmt(monthlyIncome)}/buwan? Mas malaki kita mo kaysa sa 95% ng mga pamilyang Pilipino. Sana all.`,
    color: "#FFD600", textColor: "#1a1a1a", subColor: "rgba(26,26,26,0.5)",
  };
  if (percentile >= 85) return {
    emoji: "🤑", title: "Mayaman ka na, pre.", subtitle: "Top 15% ka.",
    message: `Mas malaki kita mo kaysa sa ${Math.round(percentile)}% ng mga pamilya. Hindi ka pa naka-yacht pero pwede na.`,
    color: "#00c853", textColor: "#fff", subColor: "rgba(255,255,255,0.6)",
  };
  if (percentile >= 70) return {
    emoji: "😎", title: "Okay ka na.", subtitle: "Above average ka.",
    message: `Mas malaki kita mo kaysa sa ${Math.round(percentile)}% ng mga pamilya. Comfortable — basta wag mag-lifestyle creep.`,
    color: "#00c853", textColor: "#fff", subColor: "rgba(255,255,255,0.6)",
  };
  if (percentile >= 50) return {
    emoji: "🙂", title: "Sakto lang.", subtitle: "Around average ka.",
    message: `Nasa gitna ka — ${Math.round(percentile)}% ng mga pamilya ang mas mababa ang kita. Hindi mayaman, hindi mahirap. Pwede pa mag-level up.`,
    color: "#FF9800", textColor: "#fff", subColor: "rgba(255,255,255,0.6)",
  };
  if (percentile >= 30) return {
    emoji: "😬", title: "Below average, pre.", subtitle: "Kailangan mo ng plano.",
    message: `${Math.round(100 - percentile)}% ng mga pamilya ang mas malaki ang kita kaysa sa'yo. Aral ng budgeting at mag-ipon.`,
    color: "#FF9800", textColor: "#fff", subColor: "rgba(255,255,255,0.6)",
  };
  if (percentile >= 15) return {
    emoji: "😓", title: "Mahirap talaga.", subtitle: "Laban lang.",
    message: `Nasa lower ${Math.round(percentile)}% ka ng mga pamilyang Pilipino. Napakahirap, pero may paraan palagi.`,
    color: "#D32F2F", textColor: "#fff", subColor: "rgba(255,255,255,0.6)",
  };
  return {
    emoji: "🥺", title: "Grabe ang hirap.", subtitle: "Hindi ka nag-iisa.",
    message: `Nasa bottom ${Math.round(percentile)}% ka. Mahirap ang sitwasyon, pero may mga programa ng gobyerno na pwedeng makatulong.`,
    color: "#D32F2F", textColor: "#fff", subColor: "rgba(255,255,255,0.6)",
  };
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString("en-PH");
}

function formatPeso(v: number): string {
  if (v >= 1_000_000) return `₱${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `₱${fmt(v)}`;
  return `₱${v}`;
}

// ─── Component ───────────────────────────────────────────────────

export default function RichPage() {
  const [income, setIncome] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [showMethod, setShowMethod] = useState(false);

  const annualIncome = income * 12;
  const percentile = useMemo(() => getPercentile(annualIncome), [annualIncome]);
  const verdict = useMemo(() => getVerdict(percentile, income), [percentile, income]);

  const isReady = income > 0;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Nav */}
      <nav className="flex justify-between items-center px-4 sm:px-6 py-4 max-w-[720px] mx-auto">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-[#1a1a1a] no-underline">
          alkansya<span className="text-[#00c853]">.ph</span>
        </Link>
        <NavMenu />
      </nav>

      <main className="max-w-[720px] mx-auto px-4 sm:px-6 pb-8">

        {!revealed ? (
        <>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a1a1a] tracking-tight mb-6">Gaano ako kayaman?</h1>

          {/* Input */}
          <div className="bg-white rounded-[20px] p-5 sm:p-6 mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-1">Monthly household income</p>
            <p className="text-[10px] text-[#aaa] mb-4">Lahat ng kinikita ng pamilya mo per month — sahod, negosyo, remittance, etc.</p>

            <p className="text-center text-3xl sm:text-4xl font-black text-[#1a1a1a] mb-4">
              {income === 0 ? <span className="text-[#ccc]">₱—</span> : `₱${fmt(income)}`}
            </p>

            <input
              type="range"
              min="0"
              max="300000"
              step="1000"
              value={income}
              onChange={(e) => setIncome(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #00c853 ${(income / 300000) * 100}%, #e8e8e8 ${(income / 300000) * 100}%)`,
              }}
            />
            <div className="flex justify-between mt-1 text-[10px] text-[#aaa]">
              <span>₱0</span>
              <span>₱300k+</span>
            </div>

            {/* Custom input */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-[#888]">Custom:</span>
              <div className="flex-1 flex items-center bg-[#f5f5f5] rounded-xl px-3 py-2">
                <span className="text-sm font-bold text-[#888] mr-1">₱</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={income > 0 ? fmt(income) : ""}
                  onChange={(e) => {
                    const v = Number(e.target.value.replace(/[^0-9]/g, ""));
                    setIncome(v || 0);
                  }}
                  className="flex-1 bg-transparent text-sm font-bold text-[#1a1a1a] outline-none"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Button */}
          <div className="text-center mt-4">
            <button
              onClick={() => isReady && setRevealed(true)}
              disabled={!isReady}
              className={`px-6 py-3 rounded-full text-sm font-bold tracking-tight transition-all ${
                isReady ? "bg-[#1a1a1a] text-white active:scale-[0.97]" : "bg-[#e0e0e0] text-[#aaa] cursor-not-allowed"
              }`}
            >Gaano ako kayaman?</button>
          </div>
        </>
        ) : (
        <>
          {/* Result card */}
          <div className="rounded-[20px] p-6 sm:p-8 mb-3" style={{ background: verdict.color, color: verdict.textColor }}>
            <div className="text-center">
              <p className="text-[72px] leading-none mb-2">{verdict.emoji}</p>
              <p className="text-3xl sm:text-4xl font-black tracking-tight leading-none mb-1">{verdict.title}</p>
              <p className="text-sm font-semibold mb-4" style={{ color: verdict.subColor }}>{verdict.subtitle}</p>

              {/* Big percentile */}
              <p className="text-[10px] font-semibold uppercase tracking-[1px] mb-1" style={{ color: verdict.subColor }}>
                Mas malaki kita mo kaysa sa
              </p>
              <p className="text-6xl sm:text-7xl font-black tracking-tight mb-1">
                {Math.round(percentile)}%
              </p>
              <p className="text-sm font-semibold mb-5" style={{ color: verdict.subColor }}>
                ng mga pamilyang Pilipino
              </p>

              {/* Visual bar */}
              <div className="max-w-[400px] mx-auto mb-5">
                <div className="h-3 rounded-full overflow-hidden" style={{ background: verdict.textColor === "#fff" ? "rgba(255,255,255,0.2)" : "rgba(26,26,26,0.1)" }}>
                  <div className="h-full rounded-full transition-all duration-1000" style={{
                    width: `${Math.max(2, percentile)}%`,
                    background: verdict.textColor === "#fff" ? "#fff" : "#1a1a1a",
                  }} />
                </div>
                <div className="flex justify-between mt-1 text-[9px] font-semibold" style={{ color: verdict.subColor }}>
                  <span>Pinakamahirap</span>
                  <span>Pinakamayaman</span>
                </div>
              </div>

              {/* Message */}
              <p className="text-xs leading-relaxed max-w-sm mx-auto mb-5" style={{ color: verdict.subColor }}>
                {verdict.message}
              </p>

              {/* Stats */}
              <div className="flex justify-center gap-4 sm:gap-6 mb-4">
                <div>
                  <p className="text-xl sm:text-2xl font-black">₱{fmt(income)}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: verdict.subColor }}>per month</p>
                </div>
                <div style={{ width: 1, background: verdict.textColor === "#fff" ? "rgba(255,255,255,0.2)" : "rgba(26,26,26,0.1)", alignSelf: "stretch" }} />
                <div>
                  <p className="text-xl sm:text-2xl font-black">{formatPeso(annualIncome)}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: verdict.subColor }}>per year</p>
                </div>
                <div style={{ width: 1, background: verdict.textColor === "#fff" ? "rgba(255,255,255,0.2)" : "rgba(26,26,26,0.1)", alignSelf: "stretch" }} />
                <div>
                  <p className="text-xl sm:text-2xl font-black">Top {Math.max(1, Math.round(100 - percentile))}%</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: verdict.subColor }}>rank</p>
                </div>
              </div>
            </div>
          </div>

          {/* Context card */}
          <div className="bg-white rounded-[20px] p-5 sm:p-6 mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">Paano ka kumompara</p>
            <div className="space-y-2">
              {[
                { label: "Poverty threshold", monthly: 13873, note: "Minimum para hindi considered na mahirap" },
                { label: "Median na pamilya", monthly: 20090, note: "Kalahati ng mga pamilya ang mas mababa dito" },
                { label: "Average na pamilya", monthly: 29436, note: "National average — pero misleading dahil sa mga sobrang yaman" },
                { label: "Top 10% na pamilya", monthly: 82917, note: "Kung nandito ka, isa ka sa pinakamayaman" },
              ].map((ref) => {
                const isAbove = income >= ref.monthly;
                return (
                  <div key={ref.label} className="flex items-center gap-3 py-2 border-b border-black/5 last:border-0">
                    <span className="text-lg">{isAbove ? "✅" : "❌"}</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#1a1a1a]">{ref.label}</p>
                      <p className="text-[10px] text-[#888]">{ref.note}</p>
                    </div>
                    <p className={`text-sm font-extrabold ${isAbove ? "text-[#00c853]" : "text-[#888]"}`}>₱{fmt(ref.monthly)}/mo</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Try again */}
          <div className="text-center mt-2 mb-3">
            <button
              onClick={() => { setRevealed(false); setIncome(0); }}
              className="px-6 py-2.5 rounded-full text-sm font-bold text-[#888] bg-white hover:bg-[#f0f0f0] transition-colors"
            >Try again ↻</button>
          </div>
        </>
        )}

        {/* Methodology — always visible */}
        <div className="bg-white rounded-[20px] p-5 sm:p-6 mb-3">
          <button
            onClick={() => setShowMethod(!showMethod)}
            className="w-full flex items-center justify-between"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888]">Paano ito kina-calculate?</p>
            <span className="text-[#888] text-sm">{showMethod ? "−" : "+"}</span>
          </button>

          {showMethod && (
            <div className="mt-4 space-y-3 text-[13px] text-[#666] leading-relaxed animate-fade-in">
              <p>
                <span className="font-bold text-[#1a1a1a]">Data source.</span> 2023 Family Income and Expenditure Survey (FIES) by the Philippine Statistics Authority (PSA) — the official nationwide survey of ~163,000 households.
              </p>
              <p>
                <span className="font-bold text-[#1a1a1a]">What we used.</span> PSA published exact per-decile average annual family income from the 2018 FIES (₱107k for the poorest 10% to ₱867k for the richest 10%). For 2023, PSA confirmed: national average ₱353,230/year, median ₱241,080/year, and that bottom deciles grew ~25-26% while top deciles grew ~10-12%.
              </p>
              <p>
                <span className="font-bold text-[#1a1a1a]">How we estimated.</span> We scaled each 2018 decile using the published growth rates, then validated that our estimates produce the correct 2023 average (₱353k) and median (₱241k). Your percentile is calculated by linear interpolation between these decile midpoints.
              </p>
              <p>
                <span className="font-bold text-[#1a1a1a]">What this measures.</span> This compares your total <span className="font-bold">household</span> income (everyone in your family combined) against all ~27.4 million Filipino families. If you live alone, your personal income is your household income.
              </p>
              <p>
                <span className="font-bold text-[#1a1a1a]">Limitations.</span> This is an approximation — actual percentile may vary by a few points. The data is from 2023 and doesn&apos;t reflect 2024-2026 changes. Income distribution within each decile is not uniform, so interpolation introduces small errors. The top 1% and beyond are estimated since FIES undersamples the ultra-rich.
              </p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="bg-white rounded-[20px] p-5 sm:p-6 text-center">
          <p className="text-sm text-[#888] mb-3">Gusto mo palakihin ang pera mo?</p>
          <Link href="/rates"
            className="inline-block bg-[#00c853] text-white font-bold text-sm px-6 py-3 rounded-full hover:bg-[#00a844] transition-colors no-underline">
            Tingnan ang best rates →
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-sm font-bold text-[#888]">alkansya<span className="text-[#00c853]">.ph</span></span>
          <p className="text-[10px] text-[#aaa] max-w-md sm:text-right leading-relaxed">
            Based on 2023 FIES data (PSA). Estimates derived from published decile averages scaled to 2023 growth rates. Hindi &apos;to financial advice — pang-curious lang.
          </p>
        </footer>
      </main>

      {/* Slider styling */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance:none;appearance:none;width:24px;height:24px;border-radius:50%;background:#00c853;cursor:pointer;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.15); }
        input[type="range"]::-moz-range-thumb { width:24px;height:24px;border-radius:50%;background:#00c853;cursor:pointer;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.15); }
      `}</style>
    </div>
  );
}
