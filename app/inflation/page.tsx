"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import NavMenu from "@/components/NavMenu";

type CpiRow = { year: number; cpi: number };

function Chart({ data, fromYear, toYear }: { data: CpiRow[]; fromYear: number; toYear: number }) {
  const filtered = useMemo(() => data.filter((d) => d.year >= fromYear && d.year <= toYear), [data, fromYear, toYear]);

  if (filtered.length < 2) return null;

  const w = 600, h = 200, padL = 45, padR = 10, padT = 15, padB = 25;
  const cW = w - padL - padR;
  const cH = h - padT - padB;
  const min = Math.min(...filtered.map((d) => d.cpi));
  const max = Math.max(...filtered.map((d) => d.cpi));
  const range = max - min || 1;

  const points = filtered.map((d, i) => ({
    x: padL + (i / (filtered.length - 1)) * cW,
    y: padT + ((max - d.cpi) / range) * cH,
    year: d.year,
    cpi: d.cpi,
  }));

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = path + ` L${points[points.length - 1].x},${padT + cH} L${points[0].x},${padT + cH} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      <defs>
        <linearGradient id="cpiFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00c853" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#00c853" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Y axis labels */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const val = min + range * (1 - f);
        const y = padT + f * cH;
        return (
          <g key={f}>
            <line x1={padL} x2={padL + cW} y1={y} y2={y} stroke="#e5e5e5" strokeWidth="0.5" />
            <text x={padL - 5} y={y + 4} textAnchor="end" fontSize="9" fill="#aaa">
              {val < 10 ? val.toFixed(1) : Math.round(val)}
            </text>
          </g>
        );
      })}
      {/* X axis labels */}
      {points.filter((_, i) => i === 0 || i === points.length - 1 || i % Math.max(1, Math.floor(points.length / 5)) === 0).map((p) => (
        <text key={p.year} x={p.x} y={padT + cH + 15} textAnchor="middle" fontSize="9" fill="#aaa">
          {p.year}
        </text>
      ))}
      <path d={area} fill="url(#cpiFill)" />
      <path d={path} fill="none" stroke="#00c853" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function DualSlider({
  min, max, from, to, onFromChange, onToChange,
}: {
  min: number; max: number; from: number; to: number;
  onFromChange: (v: number) => void; onToChange: (v: number) => void;
}) {
  const range = max - min || 1;
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  const loPercent = ((lo - min) / range) * 100;
  const hiPercent = ((hi - min) / range) * 100;

  return (
    <div className="relative pt-1 pb-6">
      <style>{`
        .dual-range { -webkit-appearance: none; appearance: none; position: absolute; top: 0; left: 0; width: 100%; height: 20px; background: transparent; pointer-events: none; margin: 0; z-index: 3; }
        .dual-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #00c853; border: 3px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.2); pointer-events: auto; cursor: pointer; position: relative; }
        .dual-range::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: #00c853; border: 3px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.2); pointer-events: auto; cursor: pointer; }
        .dual-range::-webkit-slider-runnable-track { height: 6px; }
        .dual-range::-moz-range-track { height: 6px; background: transparent; }
      `}</style>
      {/* Track background */}
      <div className="relative h-1.5 bg-[#e5e5e5] rounded-full top-[7px]">
        <div
          className="absolute h-full bg-[#00c853] rounded-full"
          style={{ left: `${loPercent}%`, width: `${hiPercent - loPercent}%` }}
        />
      </div>
      {/* From range */}
      <input
        type="range" min={min} max={max} step={1} value={from}
        onChange={(e) => onFromChange(Number(e.target.value))}
        className="dual-range"
        style={{ zIndex: from > to ? 5 : 3 }}
      />
      {/* To range */}
      <input
        type="range" min={min} max={max} step={1} value={to}
        onChange={(e) => onToChange(Number(e.target.value))}
        className="dual-range"
        style={{ zIndex: to >= from ? 5 : 3 }}
      />
      {/* Labels */}
      <div className="flex justify-between mt-3 text-[10px] text-[#bbb]">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export default function InflationPage() {
  const currentYear = new Date().getFullYear();
  const [cpiData, setCpiData] = useState<CpiRow[]>([]);
  const [amount, setAmount] = useState("100");
  const [fromYear, setFromYear] = useState(2000);
  const [toYear, setToYear] = useState(currentYear <= 2025 ? currentYear : 2025);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cpi")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setCpiData(d.map((row: { year: number; cpi: number | string }) => ({
            year: Number(row.year),
            cpi: Number(row.cpi),
          })));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const years = useMemo(() => cpiData.map((d) => d.year), [cpiData]);
  const minYear = years.length > 0 ? years[0] : 1959;
  const maxYear = years.length > 0 ? years[years.length - 1] : 2025;

  const fromCpi = cpiData.find((d) => d.year === fromYear)?.cpi ?? 0;
  const toCpi = cpiData.find((d) => d.year === toYear)?.cpi ?? 0;

  const parsedAmount = parseFloat(amount.replace(/,/g, "")) || 0;
  const adjustedAmount = fromCpi > 0 && toCpi > 0 ? (parsedAmount * toCpi) / fromCpi : 0;
  const multiplier = fromCpi > 0 && toCpi > 0 ? toCpi / fromCpi : 0;
  const percentChange = multiplier > 0 ? (multiplier - 1) * 100 : 0;

  // Purchasing power: how much is ₱100 from toYear worth in fromYear terms
  const purchasingPower = fromCpi > 0 && toCpi > 0 ? (parsedAmount * fromCpi) / toCpi : 0;

  const swapped = fromYear > toYear;
  const displayFrom = swapped ? toYear : fromYear;
  const displayTo = swapped ? fromYear : toYear;
  const displayAdjusted = swapped ? purchasingPower : adjustedAmount;
  const displayPower = swapped ? adjustedAmount : purchasingPower;

  return (
    <div className="min-h-screen bg-[#f5f5f5] glow-bg">
      <nav className="flex justify-between items-center px-4 sm:px-6 py-4 max-w-[720px] mx-auto">
        <Link href="/" className="no-underline">
          <span className="text-[#00e401]" style={{ fontFamily: "var(--font-old-english)" }}>Sentral</span>
        </Link>
        <NavMenu />
      </nav>

      <main className="max-w-[720px] mx-auto px-4 sm:px-6 pb-8">
        <h1 className="text-[22px] sm:text-[26px] font-extrabold text-[#1a1a1a] tracking-tight mb-1">
          Inflation Calculator
        </h1>
        <p className="text-[13px] text-[#888] mb-6">
          How much has the peso lost? Based on official Philippine CPI data.
        </p>

        {/* Input card */}
        <div className="bg-white rounded-[20px] p-5 mb-4 shadow-sm">
          <div className="mb-5">
            <label className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-1.5 block">Amount (₱)</label>
            <div className="flex items-center bg-[#f5f5f5] rounded-xl px-4 py-3 border border-[#e5e5e5] focus-within:border-[#00c853] transition-colors">
              <span className="text-[18px] font-bold text-[#aaa] mr-1">₱</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
                className="flex-1 text-[22px] font-extrabold text-[#1a1a1a] bg-transparent outline-none"
                placeholder="100"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888]">Year range</span>
              <span className="text-[13px] font-bold text-[#1a1a1a]">{displayFrom} — {displayTo}</span>
            </div>
            <DualSlider
              min={minYear}
              max={maxYear}
              from={fromYear}
              to={toYear}
              onFromChange={setFromYear}
              onToChange={setToYear}
            />
          </div>
        </div>

        {/* Result card */}
        {!loading && parsedAmount > 0 && fromCpi > 0 && toCpi > 0 && (
          <div className="bg-white rounded-[20px] p-5 mb-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-1">
              ₱{parsedAmount.toLocaleString("en-PH")} from {displayFrom} can only buy
            </p>
            <p className="text-4xl sm:text-5xl font-black text-[#1a1a1a] tracking-tight mt-1">
              ₱{displayPower < 1 ? displayPower.toFixed(2) : Math.round(displayPower).toLocaleString("en-PH")}
            </p>
            <p className="text-[13px] text-[#888] mt-1 mb-4">
              worth of goods in {displayTo}
            </p>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[14px] font-bold text-[#dc2626] bg-[#dc2626]/10 px-3 py-1.5 rounded-full">
                <span className="text-[12px]">▼</span>
                {(100 - (displayPower / parsedAmount) * 100).toFixed(1)}%
              </span>
              <span className="text-[12px] text-[#888]">purchasing power lost</span>
            </div>
          </div>
        )}

        {/* Chart */}
        {!loading && cpiData.length > 0 && (
          <div className="bg-white rounded-[20px] p-5 mb-4 shadow-sm">
            <h2 className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">
              Philippine CPI ({displayFrom}–{displayTo})
            </h2>
            <Chart data={cpiData} fromYear={displayFrom} toYear={displayTo} />
          </div>
        )}

        {/* Context */}
        {!loading && parsedAmount > 0 && fromCpi > 0 && toCpi > 0 && displayTo > displayFrom && (
          <div className="bg-white rounded-[20px] p-5 mb-4 shadow-sm">
            <h2 className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">What this means</h2>
            <div className="space-y-3 text-[13px] text-[#555] leading-relaxed">
              <p>
                If you kept <strong className="text-[#1a1a1a]">₱{parsedAmount.toLocaleString("en-PH")}</strong> in cash since {displayFrom}, it would only buy <strong className="text-[#dc2626]">₱{displayPower < 1 ? displayPower.toFixed(2) : Math.round(displayPower).toLocaleString("en-PH")}</strong> worth of goods today. Everything else was eaten by inflation.
              </p>
              <p>
                To match the same buying power, you'd need <strong className="text-[#1a1a1a]">₱{Math.round(displayAdjusted).toLocaleString("en-PH")}</strong> today — that's <strong className="text-[#1a1a1a]">{(displayAdjusted / parsedAmount).toFixed(1)}×</strong> more.
              </p>
              <p>
                Average inflation: <strong className="text-[#1a1a1a]">{(Math.pow(displayAdjusted / parsedAmount, 1 / (displayTo - displayFrom)) * 100 - 100).toFixed(1)}% per year</strong> over {displayTo - displayFrom} years.
              </p>
            </div>
          </div>
        )}

        {/* SEO content */}
        <div className="bg-white rounded-[20px] p-5 mb-4 shadow-sm">
          <h2 className="text-[13px] font-bold text-[#1a1a1a] mb-2">Philippine Inflation Calculator</h2>
          <p className="text-[12px] text-[#666] leading-relaxed mb-3">
            This tool uses the Consumer Price Index (CPI) published by the Philippine Statistics Authority (PSA) to calculate how the purchasing power of the Philippine peso has changed over time. CPI data from 2018 to present uses official PSA values (base year 2018=100). Earlier years are backcasted using inflation rates from the World Bank and International Monetary Fund.
          </p>
          <h3 className="text-[12px] font-bold text-[#1a1a1a] mb-1">How it works</h3>
          <p className="text-[12px] text-[#666] leading-relaxed">
            The adjusted amount is calculated using the formula: Adjusted = Original × (CPI in target year ÷ CPI in source year). This reflects the change in the general price level of goods and services commonly purchased by Filipino households. Individual experiences may vary depending on spending patterns — for example, education and healthcare costs have risen faster than the overall CPI in many years.
          </p>
        </div>

        {/* Footer */}
        <footer className="mt-6 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-sm font-bold text-[#00e401]" style={{ fontFamily: "var(--font-old-english)" }}>Sentral</span>
          <p className="text-[10px] text-[#aaa] max-w-md sm:text-right leading-relaxed">
            CPI data sourced from PSA (2018–present) and World Bank/IMF (1959–2017). Not financial advice.
          </p>
        </footer>
      </main>
    </div>
  );
}
