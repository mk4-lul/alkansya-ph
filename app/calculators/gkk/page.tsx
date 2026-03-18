"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import NavMenu from "@/components/NavMenu";

// ─── 2023 FIES Income Distribution Data ──────────────────────────
//
// Source: PSA 2023 FIES (~163,000 households, Gini 0.39)
//
// Confirmed anchor points:
//   - 10.9th percentile = ₱166,476/yr (poverty threshold)
//   - 50th percentile = ₱241,080/yr (median, PSA confirmed)
//   - Mean = ₱353,230/yr (falls at ~72nd percentile)
//   - Palma ratio = 1.15 (top 10% / bottom 40%)
//
// Remaining percentiles estimated by fitting a curve through
// these anchors, consistent with Gini 0.39 and the Palma ratio.
// These are BOUNDARY values (entry points), not decile averages.

// [percentile, annual family income in PHP]
const INCOME_CURVE: [number, number][] = [
  [0, 30000],       // estimated floor
  [5, 100000],      // estimated
  [10, 145000],     // estimated, just below poverty line
  [11, 166476],     // poverty threshold (PSA 2023, confirmed)
  [20, 185000],     // estimated
  [30, 205000],     // estimated
  [40, 222000],     // estimated
  [50, 241080],     // median (PSA 2023, confirmed)
  [60, 280000],     // estimated
  [70, 340000],     // estimated
  [80, 420000],     // estimated
  [90, 580000],     // estimated — entry to top 10% (~₱48k/mo)
  [95, 870000],     // estimated — entry to top 5% (~₱73k/mo)
  [99, 1700000],    // estimated — entry to top 1% (~₱142k/mo)
  [99.5, 3500000],   // estimated — top 0.5%
  [99.9, 10000000],  // estimated — top 0.1%
  [100, 50000000],   // ceiling
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

function fmt(n: number): string {
  return Math.round(n).toLocaleString("en-PH");
}

function formatPeso(v: number): string {
  if (v >= 1_000_000) return `₱${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `₱${fmt(v)}`;
  return `₱${v}`;
}

// ─── Animated percentile display ─────────────────────────────────
function AnimatedPercentile({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 2500;
    cancelAnimationFrame(raf.current);
    function tick(now: number) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(eased * value);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  return <>{display >= 99 ? display.toFixed(1) : Math.round(display)}%</>;
}

// ─── Component ───────────────────────────────────────────────────

export default function GKKPage() {
  const [income, setIncome] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [show, setShow] = useState(false);

  const annualIncome = income * 12;
  const percentile = useMemo(() => Math.min(99.9, getPercentile(annualIncome)), [annualIncome]);

  const isReady = income > 0;

  // Trigger entrance animation on reveal
  useEffect(() => {
    if (revealed) {
      setShow(false);
      const t = setTimeout(() => setShow(true), 80);
      return () => clearTimeout(t);
    }
  }, [revealed]);

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
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-1">Monthly income</p>
            <p className="text-[10px] text-[#aaa] mb-4">Magkano kinikita mo per month — sahod, negosyo, freelance, etc.</p>

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
          <div className="text-center mt-10 mb-10">
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
          <div className="bg-[#1a1a1a] rounded-[20px] p-6 sm:p-8 mb-3 transition-all duration-700 ease-out"
            style={{
              transform: show ? "scale(1) translateY(0)" : "scale(0.92) translateY(20px)",
              opacity: show ? 1 : 0,
            }}>
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[1px] text-white/40 mb-1 transition-all duration-500 delay-200"
                style={{ opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(10px)" }}>
                Mas malaki ang income mo kaysa sa
              </p>
              <p className="text-7xl sm:text-8xl font-black tracking-tight text-white mb-1">
                {show ? <AnimatedPercentile value={percentile} /> : "0%"}
              </p>
              <p className="text-sm font-semibold text-white/40 mb-5 transition-all duration-500 delay-300"
                style={{ opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(10px)" }}>
                ng mga pamilyang Pilipino
              </p>

              {/* Visual bar */}
              <div className="max-w-[400px] mx-auto mb-6">
                <div className="h-3 rounded-full overflow-hidden bg-white/10">
                  <div className="h-full rounded-full bg-[#00c853] transition-all duration-[2500ms] ease-out" style={{
                    width: show ? `${Math.max(2, percentile)}%` : "0%",
                  }} />
                </div>
                <div className="flex justify-between mt-1.5 text-[9px] font-semibold text-white/30">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex justify-center gap-4 sm:gap-6 transition-all duration-500 delay-500"
                style={{ opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(10px)" }}>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-white">₱{fmt(income)}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">per month</p>
                </div>
                <div className="w-px bg-white/10 self-stretch" />
                <div>
                  <p className="text-xl sm:text-2xl font-black text-white">{formatPeso(annualIncome)}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">per year</p>
                </div>
                <div className="w-px bg-white/10 self-stretch" />
                <div>
                  <p className="text-xl sm:text-2xl font-black text-white">Top {(100 - percentile) < 1 ? (100 - percentile).toFixed(1) : Math.round(100 - percentile)}%</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">rank</p>
                </div>
              </div>
            </div>
          </div>

          {/* Reference points */}
          <div className="bg-white rounded-[20px] p-5 sm:p-6 mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">Reference points</p>
            <div className="space-y-2">
              {[
                { label: "Poverty threshold (2023)", monthly: 13873, percentile: "11th" },
                { label: "Median family income", monthly: 20090, percentile: "50th" },
                { label: "National average", monthly: 29436, percentile: "~72nd" },
                { label: "Top 10% entry", monthly: 48333, percentile: "90th" },
                { label: "Top 5% entry", monthly: 72500, percentile: "95th" },
                { label: "Top 1% entry", monthly: 141667, percentile: "99th" },
              ].map((ref) => {
                const isAbove = income >= ref.monthly;
                return (
                  <div key={ref.label} className="flex items-center justify-between py-2.5 border-b border-black/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isAbove ? "bg-[#00c853]" : "bg-[#e0e0e0]"}`} />
                      <div>
                        <p className="text-sm font-bold text-[#1a1a1a]">{ref.label}</p>
                        <p className="text-[10px] text-[#aaa]">{ref.percentile} percentile</p>
                      </div>
                    </div>
                    <p className={`text-sm font-extrabold ${isAbove ? "text-[#00c853]" : "text-[#888]"}`}>₱{fmt(ref.monthly)}/mo</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Income distribution */}
          <div className="bg-white rounded-[20px] p-5 sm:p-6 mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">Income distribution (2023 FIES)</p>
            <div className="space-y-1.5">
              {[
                { label: "Bottom 10%", range: "< ₱12,083/mo", pct: 10 },
                { label: "10th–20th", range: "₱12,083 – ₱15,417/mo", pct: 20 },
                { label: "20th–30th", range: "₱15,417 – ₱17,083/mo", pct: 30 },
                { label: "30th–40th", range: "₱17,083 – ₱18,500/mo", pct: 40 },
                { label: "40th–50th", range: "₱18,500 – ₱20,090/mo", pct: 50 },
                { label: "50th–60th", range: "₱20,090 – ₱23,333/mo", pct: 60 },
                { label: "60th–70th", range: "₱23,333 – ₱28,333/mo", pct: 70 },
                { label: "70th–80th", range: "₱28,333 – ₱35,000/mo", pct: 80 },
                { label: "80th–90th", range: "₱35,000 – ₱48,333/mo", pct: 90 },
                { label: "Top 10%", range: "> ₱48,333/mo", pct: 100 },
              ].map((band) => {
                const isYou = percentile >= band.pct - 10 && percentile < band.pct;
                const isTop = band.pct === 100 && percentile >= 90;
                const active = isYou || isTop;
                return (
                  <div key={band.label} className={`flex items-center justify-between py-2 px-3 rounded-xl transition-colors ${
                    active ? "bg-[#00c853]/10" : ""
                  }`}>
                    <div className="flex items-center gap-2">
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-[#00c853]" />}
                      <span className={`text-[12px] font-bold ${active ? "text-[#1a1a1a]" : "text-[#888]"}`}>{band.label}</span>
                    </div>
                    <span className={`text-[11px] ${active ? "font-bold text-[#1a1a1a]" : "text-[#aaa]"}`}>{band.range}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Try again */}
          <div className="text-center mt-10 mb-10">
            <button
              onClick={() => { setRevealed(false); setIncome(0); }}
              className="px-6 py-2.5 rounded-full text-sm font-bold text-[#888] bg-white hover:bg-[#f0f0f0] transition-colors"
            >Try again ↻</button>
          </div>
        </>
        )}

        {/* Methodology */}
        <div className="mb-3 px-1">
          <p className="text-[10px] text-[#aaa] leading-relaxed">
            <span className="font-semibold text-[#888]">Paano ito kina-calculate?</span> Based on 2023 FIES (PSA) — ~163,000 households, Gini 0.39. Calibrated using confirmed data points: poverty threshold ₱166,476/yr at 10.9th percentile, median ₱241,080/yr, mean ₱353,230/yr, and Palma ratio 1.15. Values between anchors are estimated via interpolation. FIES measures household income — if you entered individual income, this assumes a single-earner household. Approximation only; actual rank may vary by a few points.
          </p>
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
            Based on 2023 FIES data (PSA). Percentile boundaries estimated from confirmed anchors (median, poverty threshold, Gini, Palma ratio).
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
