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
        setCpiData(d);
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
    <div className="min-h-screen bg-[#f5f5f5] relative">
      <nav className="flex justify-between items-center px-4 sm:px-6 py-4 max-w-[600px] mx-auto">
        <Link href="/" className="no-underline">
          <span className="text-[#00e401]" style={{ fontFamily: "var(--font-old-english)" }}>Sentral</span>
        </Link>
        <NavMenu />
      </nav>

      <main className="max-w-[600px] mx-auto px-4 sm:px-6 pb-8">
        <h1 className="text-[22px] sm:text-[26px] font-extrabold text-[#1a1a1a] tracking-tight mb-1">
          Inflation Calculator
        </h1>
        <p className="text-[13px] text-[#888] mb-6">
          How much has the peso lost? Based on official Philippine CPI data.
        </p>

        {/* Input card */}
        <div className="bg-white rounded-[20px] p-5 mb-4 shadow-sm">
          <div className="mb-4">
            <label className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-1 block">Amount (₱)</label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
              className="w-full text-3xl font-black text-[#1a1a1a] bg-transparent outline-none"
              placeholder="100"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-1 block">From</label>
              <select
                value={fromYear}
                onChange={(e) => setFromYear(Number(e.target.value))}
                className="w-full bg-[#f5f5f5] rounded-xl px-3 py-2.5 text-[15px] font-bold text-[#1a1a1a] outline-none appearance-none cursor-pointer"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-1 block">To</label>
              <select
                value={toYear}
                onChange={(e) => setToYear(Number(e.target.value))}
                className="w-full bg-[#f5f5f5] rounded-xl px-3 py-2.5 text-[15px] font-bold text-[#1a1a1a] outline-none appearance-none cursor-pointer"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Result card */}
        {!loading && parsedAmount > 0 && fromCpi > 0 && toCpi > 0 && (
          <div className="bg-white rounded-[20px] p-5 mb-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-2">
              ₱{parsedAmount.toLocaleString("en-PH")} in {displayFrom} is worth
            </p>
            <p className="text-4xl sm:text-5xl font-black text-[#1a1a1a] tracking-tight">
              ₱{Math.round(displayAdjusted).toLocaleString("en-PH")}
            </p>
            <p className="text-[13px] text-[#888] mt-1">
              in {displayTo} pesos
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#f0f0f0]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-0.5">Price increase</p>
                <p className="text-[18px] font-extrabold text-[#1a1a1a]">
                  {displayTo > displayFrom ? "+" : ""}{((displayAdjusted / parsedAmount - 1) * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-0.5">Purchasing power</p>
                <p className="text-[18px] font-extrabold text-[#dc2626]">
                  ₱{Math.round(displayPower).toLocaleString("en-PH")}
                </p>
                <p className="text-[11px] text-[#888]">
                  what ₱{parsedAmount.toLocaleString("en-PH")} today buys in {displayFrom} terms
                </p>
              </div>
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
                Prices increased by <strong className="text-[#1a1a1a]">{((displayAdjusted / parsedAmount - 1) * 100).toFixed(1)}%</strong> between {displayFrom} and {displayTo}. Something that cost <strong className="text-[#1a1a1a]">₱{parsedAmount.toLocaleString("en-PH")}</strong> in {displayFrom} would cost <strong className="text-[#1a1a1a]">₱{Math.round(displayAdjusted).toLocaleString("en-PH")}</strong> in {displayTo}.
              </p>
              <p>
                Your <strong className="text-[#1a1a1a]">₱{parsedAmount.toLocaleString("en-PH")}</strong> today has the same buying power as <strong className="text-[#dc2626]">₱{Math.round(displayPower).toLocaleString("en-PH")}</strong> back in {displayFrom}. That's how much the peso has weakened.
              </p>
              <p>
                Average annual inflation over this period: <strong className="text-[#1a1a1a]">{(Math.pow(displayAdjusted / parsedAmount, 1 / (displayTo - displayFrom)) * 100 - 100).toFixed(1)}%</strong>
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
