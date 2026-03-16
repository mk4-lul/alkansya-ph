"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import NavMenu from "@/components/NavMenu";
import ScrollingPeso from "@/components/ScrollingPeso";

// ─── Asset Price Data (approximate Jan 1 prices, USD) ────────────

interface AssetData {
  id: string;
  name: string;
  emoji: string;
  prices: Record<number, number>; // year -> price on ~Jan 1
  unit?: string;
  info?: string;
}

const ASSETS: AssetData[] = [
  {
    id: "btc", name: "Bitcoin", emoji: "₿",
    prices: { 2015: 314, 2016: 434, 2017: 998, 2018: 13850, 2019: 3747, 2020: 7200, 2021: 29000, 2022: 46300, 2023: 16540, 2024: 42280, 2025: 93400, 2026: 71500 },
  },
  {
    id: "gold", name: "Gold", emoji: "🥇", unit: "/oz",
    prices: { 2015: 1184, 2016: 1062, 2017: 1150, 2018: 1303, 2019: 1282, 2020: 1517, 2021: 1898, 2022: 1830, 2023: 1824, 2024: 2063, 2025: 2625, 2026: 5090 },
  },
  {
    id: "silver", name: "Silver", emoji: "🥈", unit: "/oz",
    prices: { 2015: 15.70, 2016: 13.80, 2017: 16.00, 2018: 17.00, 2019: 15.50, 2020: 17.80, 2021: 26.40, 2022: 23.30, 2023: 23.95, 2024: 23.80, 2025: 28.90, 2026: 84.44 },
  },
  {
    id: "sp500", name: "US Stocks", emoji: "📈", info: "Tracks the S&P 500 index — the 500 largest publicly traded companies in the United States.",
    prices: { 2015: 2058, 2016: 2044, 2017: 2239, 2018: 2684, 2019: 2507, 2020: 3231, 2021: 3756, 2022: 4766, 2023: 3839, 2024: 4770, 2025: 5882, 2026: 6632 },
  },
  {
    id: "psei", name: "PH Stocks", emoji: "🇵🇭", info: "Tracks the PSEi (Philippine Stock Exchange Index) — the 30 largest publicly traded companies in the Philippines.",
    prices: { 2015: 7231, 2016: 6952, 2017: 6841, 2018: 8558, 2019: 7466, 2020: 7815, 2021: 7023, 2022: 7362, 2023: 6566, 2024: 6572, 2025: 6580, 2026: 5900 },
  },
  {
    id: "aapl", name: "Apple Stock", emoji: "🍎",
    prices: { 2015: 27.0, 2016: 26.3, 2017: 29.0, 2018: 43.1, 2019: 39.5, 2020: 73.4, 2021: 132.7, 2022: 182.0, 2023: 130.0, 2024: 185.6, 2025: 243.0, 2026: 228.0 },
  },
  {
    id: "nvda", name: "Nvidia Stock", emoji: "🟢",
    prices: { 2015: 0.50, 2016: 0.82, 2017: 2.67, 2018: 5.88, 2019: 3.35, 2020: 5.90, 2021: 13.0, 2022: 29.4, 2023: 14.6, 2024: 49.5, 2025: 134.0, 2026: 114.0 },
  },
  {
    id: "amzn", name: "Amazon Stock", emoji: "📦",
    prices: { 2015: 15.40, 2016: 33.83, 2017: 38.21, 2018: 59.25, 2019: 75.85, 2020: 92.50, 2021: 163.3, 2022: 166.7, 2023: 84.0, 2024: 152.0, 2025: 220.0, 2026: 205.0 },
  },
  {
    id: "goog", name: "Google Stock", emoji: "🔍",
    prices: { 2015: 26.50, 2016: 38.75, 2017: 39.75, 2018: 52.58, 2019: 52.10, 2020: 67.20, 2021: 87.60, 2022: 144.7, 2023: 88.7, 2024: 140.3, 2025: 189.0, 2026: 170.0 },
  },
];

const START_YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

const AMOUNT_PRESETS = [
  { label: "₱10k", value: 10000 },
  { label: "₱50k", value: 50000 },
  { label: "₱100k", value: 100000 },
  { label: "₱500k", value: 500000 },
  { label: "₱1M", value: 1000000 },
  { label: "₱5M", value: 5000000 },
];

const CURRENT_YEAR = 2026;

function formatPeso(value: number): string {
  if (value >= 1_000_000_000) return `₱${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `₱${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  return `₱${value.toFixed(0)}`;
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  if (Math.abs(value) >= 10000) return `${sign}${(value / 100).toFixed(0)}x`;
  return `${sign}${value.toFixed(0)}%`;
}

function formatWithCommas(n: number): string {
  if (!n) return "";
  return n.toLocaleString("en-PH");
}

function parseFormatted(s: string): number {
  return Number(s.replace(/[^0-9]/g, "")) || 0;
}

// ─── Growth Chart ────────────────────────────────────────────────

function GrowthChart({ asset, startYear, amount, height = 280 }: { asset: AssetData; startYear: number; amount: number; height?: number }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const years = Object.keys(asset.prices).map(Number).filter(y => y >= startYear).sort((a, b) => a - b);
  const data = years.map(y => ({
    year: y,
    value: amount * (asset.prices[y] / asset.prices[startYear]),
  }));

  if (data.length < 2) return null;

  const width = 600;
  const padding = { top: 24, right: 20, bottom: 36, left: 20 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map(d => d.value)) * 1.05;
  const minVal = Math.min(...data.map(d => d.value)) * 0.95;
  const range = maxVal - minVal;

  const scaleX = (i: number) => padding.left + (i / (data.length - 1)) * chartW;
  const scaleY = (v: number) => padding.top + chartH - ((v - minVal) / range) * chartH;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${scaleX(i)},${scaleY(d.value)}`).join(" ");
  const areaPath = `${linePath} L${scaleX(data.length - 1)},${scaleY(minVal)} L${scaleX(0)},${scaleY(minVal)} Z`;

  // Deposit baseline
  const depositY = scaleY(amount);

  const isPositive = data[data.length - 1].value >= amount;
  const color = isPositive ? "#00c853" : "#ff1744";

  const findClosest = (mouseX: number) => {
    const relX = Math.max(0, Math.min(1, (mouseX - padding.left) / chartW));
    return Math.round(relX * (data.length - 1));
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;
    setHoverIdx(findClosest(mouseX));
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.touches[0].clientX - rect.left) / rect.width) * width;
    setHoverIdx(findClosest(mouseX));
  };

  const hoverData = hoverIdx !== null ? data[hoverIdx] : null;
  const hoverX = hoverIdx !== null ? scaleX(hoverIdx) : 0;
  const tooltipFlip = hoverX > width * 0.65;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full cursor-crosshair"
      style={{ maxHeight: height }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverIdx(null)}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setHoverIdx(null)}
    >
      <defs>
        <linearGradient id="assetGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      {/* Deposit baseline */}
      <line x1={padding.left} y1={depositY} x2={width - padding.right} y2={depositY} stroke="#ccc" strokeWidth="1" strokeDasharray="6 4" />
      <text x={width - padding.right - 4} y={depositY - 6} textAnchor="end" fontSize="10" fill="#aaa" fontFamily="Plus Jakarta Sans, sans-serif">
        Invested
      </text>
      {/* Area + Line */}
      <path d={areaPath} fill="url(#assetGrad)" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {/* Year labels */}
      {data.map((d, i) => {
        // Show every year if <=6 points, else skip some
        const showLabel = data.length <= 7 || i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 5) === 0;
        if (!showLabel) return null;
        return (
          <text key={d.year} x={scaleX(i)} y={height - 4} textAnchor="middle" fontSize="12" fontWeight="600" fill="#888" fontFamily="Plus Jakarta Sans, sans-serif">
            {d.year}
          </text>
        );
      })}
      {/* End value */}
      {hoverIdx === null && (
        <text x={scaleX(data.length - 1) - 4} y={scaleY(data[data.length - 1].value) - 10} textAnchor="end" fontSize="15" fontWeight="800" fill={color} fontFamily="Plus Jakarta Sans, sans-serif">
          {formatPeso(data[data.length - 1].value)}
        </text>
      )}
      {/* Hover */}
      {hoverData && (
        <>
          <line x1={hoverX} y1={padding.top} x2={hoverX} y2={padding.top + chartH} stroke="#1a1a1a" strokeWidth="1" strokeDasharray="4 3" opacity="0.3" />
          <circle cx={hoverX} cy={scaleY(hoverData.value)} r="5" fill={color} stroke="white" strokeWidth="2" />
          <g transform={`translate(${tooltipFlip ? hoverX - 160 : hoverX + 10}, ${Math.max(padding.top, scaleY(hoverData.value) - 40)})`}>
            <rect width="150" height="68" rx="10" fill="#1a1a1a" opacity="0.92" />
            <text x="12" y="18" fontSize="12" fill="#888" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="600">
              Jan {hoverData.year}
            </text>
            <text x="12" y="38" fontSize="15" fill="white" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="800">
              {formatPeso(hoverData.value)}
            </text>
            <text x="12" y="56" fontSize="11" fill={color} fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700">
              {formatPercent(((hoverData.value - amount) / amount) * 100)}
            </text>
          </g>
        </>
      )}
    </svg>
  );
}

// ─── All Assets Comparison Bar ────────────────────────────────────

function ComparisonBars({ startYear, amount }: { startYear: number; amount: number }) {
  const sorted = ASSETS
    .filter(a => a.prices[startYear] && a.prices[CURRENT_YEAR])
    .map(a => ({
      ...a,
      multiplier: a.prices[CURRENT_YEAR] / a.prices[startYear],
      currentValue: amount * (a.prices[CURRENT_YEAR] / a.prices[startYear]),
    }))
    .sort((a, b) => b.multiplier - a.multiplier);

  const maxMult = Math.max(...sorted.map(s => s.multiplier));

  return (
    <div className="space-y-2">
      {sorted.map((a, i) => {
        const pct = (a.multiplier / maxMult) * 100;
        const isPositive = a.multiplier >= 1;
        return (
          <div key={a.id} className="flex items-center gap-3">
            <span className="text-lg w-7 text-center shrink-0">{a.emoji}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[12px] font-bold text-[#1a1a1a]">{a.name}</span>
                <span className={`text-[12px] font-extrabold ${isPositive ? "text-[#00c853]" : "text-[#ff1744]"}`}>
                  {formatPeso(a.currentValue)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#f0f0f0] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(2, pct)}%`,
                    backgroundColor: isPositive ? "#00c853" : "#ff1744",
                    opacity: i === 0 ? 1 : 0.4 + (0.6 * (1 - i / sorted.length)),
                  }}
                />
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-[10px] text-[#aaa]">{a.multiplier.toFixed(1)}x</span>
                <span className={`text-[10px] ${isPositive ? "text-[#00c853]" : "text-[#ff1744]"}`}>
                  {formatPercent((a.multiplier - 1) * 100)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────

export default function InvestmentCalculatorPage() {
  const [asset, setAsset] = useState<AssetData>(ASSETS[0]); // bitcoin default
  const [startYear, setStartYear] = useState(2015);
  const [amount, setAmount] = useState(100000);
  const [showInfo, setShowInfo] = useState<string | null>(null);

  const entryPrice = asset.prices[startYear];
  const currentPrice = asset.prices[CURRENT_YEAR];
  const multiplier = currentPrice / entryPrice;
  const currentValue = amount * multiplier;
  const gain = currentValue - amount;
  const gainPct = ((multiplier - 1) * 100);
  const isPositive = gain >= 0;

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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a1a1a] tracking-tight mb-4">What if you invested?</h1>

        {/* Inputs */}
        <div className="space-y-3 mb-3">
          {/* Asset selector */}
          <div className="bg-white rounded-[20px] p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">Choose an asset</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ASSETS.map((a) => (
                <div key={a.id} className="relative">
                  <button onClick={() => setAsset(a)}
                    className={`w-full py-2.5 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                      asset.id === a.id ? "bg-[#1a1a1a] text-white" : "bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#e8e8e8]"
                    }`}>
                    <span className="text-sm">{a.emoji}</span> {a.name}
                    {a.info && (
                      <span
                        onClick={(e) => { e.stopPropagation(); setShowInfo(showInfo === a.id ? null : a.id); }}
                        className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border text-[8px] ml-0.5 shrink-0 ${
                          asset.id === a.id ? "border-white/40 text-white/60 hover:text-white" : "border-[#ccc] text-[#aaa] hover:text-[#1a1a1a]"
                        }`}>i</span>
                    )}
                  </button>
                  {showInfo === a.id && a.info && (
                    <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-[#1a1a1a] text-white text-[11px] leading-relaxed rounded-xl p-3 shadow-lg">
                      {a.info}
                      <button onClick={() => setShowInfo(null)} className="block mt-1 text-[10px] text-white/50 hover:text-white">dismiss</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Start year */}
          <div className="bg-white rounded-[20px] p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">When did you invest?</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {START_YEARS.map((y) => (
                <button key={y} onClick={() => setStartYear(y)}
                  className={`py-2.5 rounded-xl text-[12px] font-bold transition-all ${
                    startYear === y ? "bg-[#1a1a1a] text-white" : "bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#e8e8e8]"
                  }`}>{y}</button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="bg-white rounded-[20px] p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">How much did you invest?</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {AMOUNT_PRESETS.map((p) => (
                <button key={p.value} onClick={() => setAmount(p.value)}
                  className={`py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                    amount === p.value ? "bg-[#1a1a1a] text-white" : "bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#e8e8e8]"
                  }`}>{p.label}</button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-[#888]">Custom:</span>
              <div className="flex-1 flex items-center bg-[#f5f5f5] rounded-xl px-3 py-2">
                <span className="text-sm font-bold text-[#888] mr-1">₱</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatWithCommas(amount)}
                  onChange={(e) => setAmount(parseFormatted(e.target.value))}
                  className="flex-1 bg-transparent text-sm font-bold text-[#1a1a1a] outline-none"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hero result card */}
        <div className="bg-[#FFD700] rounded-[20px] p-6 sm:p-8 mb-3 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none select-none" style={{ filter: "blur(2px)" }} aria-hidden="true">
            {['⚜️','₿','🤑','💎','📈'].map((e, i) => (
              <span key={i} className="absolute text-[28px] sm:text-[34px] emoji-float" style={{
                left: `${(i * 47 + 13) % 100}%`,
                top: `${(i * 31 + 7) % 100}%`,
                opacity: 0.75,
                '--base-rotate': `rotate(${(i * 37) % 360}deg)`,
                '--float-duration': `${6 + (i % 5) * 2}s`,
                '--float-delay': `${-((i * 1.3) % 8)}s`,
              } as React.CSSProperties}>{e}</span>
            ))}
          </div>
          <div className="relative text-center">
            <p className="text-[13px] font-bold uppercase tracking-[1px] text-white/80 mb-2">
              {formatPeso(amount)} in {asset.name} since Jan {startYear}
            </p>
            <p className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white">
              <ScrollingPeso value={currentValue} />
            </p>
            <div className="flex justify-center mt-4">
              <div className="bg-white/15 backdrop-blur-md rounded-2xl px-6 py-4 flex gap-8">
                <div className="text-center">
                  <p className="text-[12px] font-semibold text-white/70 uppercase tracking-[0.5px]">Invested</p>
                  <p className="text-xl font-extrabold text-white"><ScrollingPeso value={amount} /></p>
                </div>
                <div className="text-center">
                  <p className={`text-[12px] font-semibold ${isPositive ? "text-white/70" : "text-red-300"} uppercase tracking-[0.5px]`}>
                    {isPositive ? "Gain" : "Loss"}
                  </p>
                  <p className={`text-xl font-extrabold ${isPositive ? "text-white" : "text-red-300"}`}>
                    <ScrollingPeso value={Math.abs(gain)} /> ({formatPercent(gainPct)})
                  </p>
                </div>
              </div>
            </div>
            <p className="text-[12px] font-semibold text-white/70 mt-3">{multiplier.toFixed(2)}x return in {CURRENT_YEAR - startYear} {CURRENT_YEAR - startYear === 1 ? "year" : "years"}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-[20px] p-5 sm:p-6 mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">Value over time</p>
          <GrowthChart asset={asset} startYear={startYear} amount={amount} />
        </div>

        {/* Comparison */}
        <div className="bg-white rounded-[20px] p-5 sm:p-6 mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-1">All assets compared</p>
          <p className="text-[10px] text-[#aaa] mb-4">{formatPeso(amount)} invested in Jan {startYear} → today</p>
          <ComparisonBars startYear={startYear} amount={amount} />
        </div>

        {/* CTA */}
        <div className="mt-3 bg-white rounded-[20px] p-5 sm:p-6 text-center">
          <p className="text-sm text-[#888] mb-3">Want to grow your money with less risk?</p>
          <Link href="/rates"
            className="inline-block bg-[#00c853] text-white font-bold text-sm px-6 py-3 rounded-full hover:bg-[#00a844] transition-colors no-underline">
            Compare rates →
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-sm font-bold text-[#888]">alkansya<span className="text-[#00c853]">.ph</span></span>
          <p className="text-[10px] text-[#aaa] max-w-md sm:text-right leading-relaxed">
            Prices are approximate (Jan 1 each year, USD-denominated). Stock prices are split-adjusted. This is for illustrative purposes only — not financial advice. Past performance does not guarantee future results.
          </p>
        </footer>
      </main>
    </div>
  );
}
