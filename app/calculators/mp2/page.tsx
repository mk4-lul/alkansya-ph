"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { formatPeso } from "@/lib/utils";
import NavMenu from "@/components/NavMenu";
import ScrollingPeso from "@/components/ScrollingPeso";

const MP2_HISTORY = [
  { year: 2011, rate: 4.63 },
  { year: 2012, rate: 4.67 },
  { year: 2013, rate: 4.58 },
  { year: 2014, rate: 4.69 },
  { year: 2015, rate: 5.34 },
  { year: 2016, rate: 7.43 },
  { year: 2017, rate: 8.11 },
  { year: 2018, rate: 7.41 },
  { year: 2019, rate: 7.23 },
  { year: 2020, rate: 6.12 },
  { year: 2021, rate: 6.00 },
  { year: 2022, rate: 7.03 },
  { year: 2023, rate: 7.05 },
  { year: 2024, rate: 7.10 },
  { year: 2025, rate: 7.12 },
];

const AVG_5YR = MP2_HISTORY.slice(-5).reduce((s, d) => s + d.rate, 0) / 5;
const AVG_10YR = MP2_HISTORY.slice(-10).reduce((s, d) => s + d.rate, 0) / 10;
const AVG_ALL = MP2_HISTORY.reduce((s, d) => s + d.rate, 0) / MP2_HISTORY.length;

const YEAR_OPTIONS = [5, 10, 15, 20];

const MONTHLY_PRESETS = [
  { label: "₱500", value: 500 },
  { label: "₱1k", value: 1000 },
  { label: "₱2.5k", value: 2500 },
  { label: "₱5k", value: 5000 },
  { label: "₱10k", value: 10000 },
  { label: "₱25k", value: 25000 },
];

function formatWithCommas(n: number): string {
  if (!n) return "";
  return n.toLocaleString("en-PH");
}

function parseFormatted(s: string): number {
  return Number(s.replace(/[^0-9]/g, "")) || 0;
}

function computeMP2(monthly: number, annualRate: number, years: number) {
  // MP2 dividends are computed on average daily balance, credited annually
  // We approximate: monthly contributions compound at annual rate
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;
  const data: { month: number; balance: number; deposits: number }[] = [];

  let balance = 0;
  let totalDeposits = 0;

  data.push({ month: 0, balance: 0, deposits: 0 });

  for (let m = 1; m <= months; m++) {
    balance += monthly;
    totalDeposits += monthly;
    const interest = balance * monthlyRate;
    balance += interest;

    if (years <= 5 || m % 3 === 0 || m === months) {
      data.push({ month: m, balance, deposits: totalDeposits });
    }
  }

  const totalInterest = balance - totalDeposits;
  return { finalBalance: balance, totalDeposits, totalInterest, data };
}

// ─── Growth Chart (interactive) ────────────────────────────────────

function GrowthChart({ data, height = 300 }: { data: { month: number; balance: number; deposits: number }[]; height?: number }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (data.length < 2) return null;

  const width = 600;
  const padding = { top: 20, right: 20, bottom: 36, left: 20 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxBalance = Math.max(...data.map((d) => d.balance));
  const maxMonth = data[data.length - 1].month;

  const scaleX = (month: number) => padding.left + (month / maxMonth) * chartW;
  const scaleY = (val: number) => padding.top + chartH - (val / (maxBalance * 1.05)) * chartH;

  const balancePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${scaleX(d.month)},${scaleY(d.balance)}`).join(" ");
  const balanceArea = `${balancePath} L${scaleX(maxMonth)},${scaleY(0)} L${scaleX(0)},${scaleY(0)} Z`;

  const depositsPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${scaleX(d.month)},${scaleY(d.deposits)}`).join(" ");
  const depositsArea = `${depositsPath} L${scaleX(maxMonth)},${scaleY(0)} L${scaleX(0)},${scaleY(0)} Z`;

  const years = maxMonth / 12;
  const yearLabels: number[] = [];
  if (years <= 5) {
    for (let y = 0; y <= years; y++) yearLabels.push(y);
  } else if (years <= 10) {
    [0, 2.5, 5, 7.5, years].forEach(y => { if (!yearLabels.includes(y)) yearLabels.push(y); });
  } else if (years <= 20) {
    [0, 2.5, 5, 7.5, 10, 15, years].forEach(y => { if (!yearLabels.includes(y)) yearLabels.push(y); });
  } else {
    [0, 5, 10, 15, 20, years].forEach(y => { if (!yearLabels.includes(y)) yearLabels.push(y); });
  }
  yearLabels.sort((a, b) => a - b);

  const findClosest = (mouseX: number) => {
    const relX = Math.max(0, Math.min(1, (mouseX - padding.left) / chartW));
    const targetMonth = relX * maxMonth;
    let closest = 0;
    let closestDist = Infinity;
    data.forEach((d, i) => {
      const dist = Math.abs(d.month - targetMonth);
      if (dist < closestDist) { closestDist = dist; closest = i; }
    });
    return closest;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;
    setHoverIndex(findClosest(mouseX));
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.touches[0].clientX - rect.left) / rect.width) * width;
    setHoverIndex(findClosest(mouseX));
  };

  const hoverData = hoverIndex !== null ? data[hoverIndex] : null;
  const hoverX = hoverData ? scaleX(hoverData.month) : 0;
  const hoverYearLabel = hoverData ? (hoverData.month / 12) : 0;
  const hoverInterest = hoverData ? hoverData.balance - hoverData.deposits : 0;
  const tooltipFlip = hoverX > width * 0.68;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full cursor-crosshair"
      style={{ maxHeight: height }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverIndex(null)}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setHoverIndex(null)}
    >
      <defs>
        <linearGradient id="mp2GreenGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00c853" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#00c853" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="mp2GrayGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#888" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#888" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={depositsArea} fill="url(#mp2GrayGrad)" />
      <path d={depositsPath} fill="none" stroke="#ccc" strokeWidth="1.5" />
      <path d={balanceArea} fill="url(#mp2GreenGrad)" />
      <path d={balancePath} fill="none" stroke="#00c853" strokeWidth="2.5" strokeLinejoin="round" />
      {yearLabels.map((y) => (
        <text key={y} x={scaleX(y * 12)} y={height - 4} textAnchor="middle" fontSize="13" fontWeight="600" fill="#888" fontFamily="Plus Jakarta Sans, sans-serif">
          {y % 1 === 0 ? y : y.toFixed(1)}yr
        </text>
      ))}
      {hoverIndex === null && (
        <text x={scaleX(maxMonth) - 4} y={scaleY(maxBalance) - 10} textAnchor="end" fontSize="15" fontWeight="800" fill="#00c853" fontFamily="Plus Jakarta Sans, sans-serif">
          {formatPeso(maxBalance)}
        </text>
      )}
      {hoverData && (
        <>
          <line x1={hoverX} y1={padding.top} x2={hoverX} y2={padding.top + chartH} stroke="#1a1a1a" strokeWidth="1" strokeDasharray="4 3" opacity="0.3" />
          <circle cx={hoverX} cy={scaleY(hoverData.balance)} r="5" fill="#00c853" stroke="white" strokeWidth="2" />
          <circle cx={hoverX} cy={scaleY(hoverData.deposits)} r="4" fill="#ccc" stroke="white" strokeWidth="2" />
          <g transform={`translate(${tooltipFlip ? hoverX - 170 : hoverX + 10}, ${Math.max(padding.top, scaleY(hoverData.balance) - 50)})`}>
            <rect width="160" height="90" rx="10" fill="#1a1a1a" opacity="0.92" />
            <text x="12" y="20" fontSize="12" fill="#888" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="600">
              Year {hoverYearLabel % 1 === 0 ? hoverYearLabel.toFixed(0) : hoverYearLabel.toFixed(1)}
            </text>
            <text x="12" y="40" fontSize="15" fill="white" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="800">
              {formatPeso(hoverData.balance)}
            </text>
            <text x="12" y="58" fontSize="11" fill="#888" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="500">
              Deposited: {formatPeso(hoverData.deposits)}
            </text>
            <text x="12" y="76" fontSize="11" fill="#00c853" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700">
              Dividends: {formatPeso(hoverInterest)}
            </text>
          </g>
        </>
      )}
    </svg>
  );
}

// ─── Historical Rate Chart ────────────────────────────────────────

function HistoryChart({ height = 220 }: { height?: number }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 600;
  const padding = { top: 24, right: 12, bottom: 32, left: 12 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxRate = Math.max(...MP2_HISTORY.map((d) => d.rate));
  const barWidth = chartW / MP2_HISTORY.length;
  const barGap = 4;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full cursor-pointer"
      style={{ maxHeight: height }}
      onMouseLeave={() => setHoverIdx(null)}
      onTouchEnd={() => setHoverIdx(null)}
    >
      {MP2_HISTORY.map((d, i) => {
        const x = padding.left + i * barWidth + barGap / 2;
        const barH = (d.rate / (maxRate * 1.15)) * chartH;
        const y = padding.top + chartH - barH;
        const isHovered = hoverIdx === i;
        const isRecent = i >= MP2_HISTORY.length - 5;

        return (
          <g key={d.year}
            onMouseEnter={() => setHoverIdx(i)}
            onTouchStart={() => setHoverIdx(i)}
          >
            <rect
              x={x} y={y}
              width={barWidth - barGap}
              height={barH}
              rx="4"
              fill={isHovered ? "#00c853" : isRecent ? "#00c853" : "#e0e0e0"}
              opacity={isHovered ? 1 : isRecent ? 0.6 : 0.8}
              className="transition-all duration-150"
            />
            {/* Rate on top of bar */}
            <text
              x={x + (barWidth - barGap) / 2}
              y={y - 6}
              textAnchor="middle"
              fontSize={isHovered ? "13" : "10"}
              fontWeight={isHovered ? "800" : "600"}
              fill={isHovered ? "#00c853" : "#aaa"}
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              {d.rate}%
            </text>
            {/* Year label */}
            <text
              x={x + (barWidth - barGap) / 2}
              y={height - 6}
              textAnchor="middle"
              fontSize="10"
              fontWeight={isHovered ? "700" : "500"}
              fill={isHovered ? "#1a1a1a" : "#aaa"}
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              {`'${String(d.year).slice(2)}`}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────

export default function MP2CalculatorPage() {
  const [monthly, setMonthly] = useState<number | null>(null);
  const [years, setYears] = useState<number | null>(null);
  const [rateMode, setRateMode] = useState<"latest" | "5yr" | "10yr">("latest");

  const rate = rateMode === "latest" ? MP2_HISTORY[MP2_HISTORY.length - 1].rate
    : rateMode === "5yr" ? AVG_5YR : AVG_10YR;

  const isReady = monthly !== null && monthly > 0 && years !== null;
  const result = useMemo(() => isReady ? computeMP2(monthly, rate, years) : null, [monthly, rate, years, isReady]);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (isReady && result) {
      setShowResult(false);
      const t = setTimeout(() => setShowResult(true), 80);
      return () => clearTimeout(t);
    } else {
      setShowResult(false);
    }
  }, [isReady, result]);

  const interestPct = result && result.finalBalance > 0 ? ((result.totalInterest / result.finalBalance) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-[#f5f5f5] glow-bg">
      {/* Nav */}
      <nav className="flex justify-between items-center px-4 sm:px-6 py-4 max-w-[720px] mx-auto">
        <Link href="/" className="no-underline">
          <span className="text-[#00e401]" style={{fontFamily:"var(--font-old-english)"}}>Sentral</span>
        </Link>
        <NavMenu />
      </nav>

      <main className="max-w-[720px] mx-auto px-4 sm:px-6 pb-8">
        {/* Page title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a1a1a] tracking-tight mb-4">Pag-IBIG MP2 Calculator</h1>

        {/* Inputs — hidden when result is showing */}
        {!(isReady && result) && (
        <div className="space-y-3 mb-3">
          {/* Monthly contribution */}
          <div className="bg-white rounded-[20px] p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">Monthly contribution</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {MONTHLY_PRESETS.map((p) => (
                <button key={p.value} onClick={() => setMonthly(p.value)}
                  className={`py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                    monthly === p.value ? "bg-[#1a1a1a] text-white" : "bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#e8e8e8]"
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
                  value={formatWithCommas(monthly ?? 0)}
                  onChange={(e) => setMonthly(parseFormatted(e.target.value))}
                  className="flex-1 bg-transparent text-sm font-bold text-[#1a1a1a] outline-none"
                  placeholder="0"
                />
              </div>
            </div>
            <p className="text-[10px] text-[#aaa] mt-2">Minimum ₱500/month</p>
          </div>

          {/* Dividend rate assumption */}
          <div className="bg-white rounded-[20px] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888]">Projected dividend rate</p>
              <p className="text-2xl font-extrabold text-[#00c853]">{rate.toFixed(2)}%</p>
            </div>
            <div className="flex bg-[#f5f5f5] rounded-full p-1">
              {([
                ["latest", `Latest (${MP2_HISTORY[MP2_HISTORY.length - 1].rate}%)`],
                ["5yr", `5yr avg (${AVG_5YR.toFixed(1)}%)`],
                ["10yr", `10yr avg (${AVG_10YR.toFixed(1)}%)`],
              ] as const).map(([val, label]) => (
                <button key={val} onClick={() => setRateMode(val as "latest" | "5yr" | "10yr")}
                  className={`flex-1 py-2 rounded-full text-[11px] font-semibold transition-all ${
                    rateMode === val ? "bg-[#00c853] text-white" : "text-[#888] hover:text-[#1a1a1a]"
                  }`}>{label}</button>
              ))}
            </div>
          </div>

          {/* Time period */}
          <div className="bg-white rounded-[20px] p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">Savings period</p>
            <div className="grid grid-cols-4 gap-2">
              {YEAR_OPTIONS.map((y) => (
                <button key={y} onClick={() => setYears(y)}
                  className={`py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                    years === y ? "bg-[#1a1a1a] text-white" : "bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#e8e8e8]"
                  }`}>{y}yr</button>
              ))}
            </div>
            <p className="text-[10px] text-[#aaa] mt-2">MP2 has a 5-year lock-in. You can renew for another 5 years.</p>
          </div>
        </div>
        )}

        {/* Hero result card + Growth Chart — only when inputs selected */}
        {isReady && result && (
        <>
        {/* Input summary + edit */}
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-[12px] text-[#888]">
            ₱{formatWithCommas(monthly!)}/mo · {rate.toFixed(2)}% rate · {years}yr
          </p>
          <button
            onClick={() => setYears(null)}
            className="text-[12px] font-semibold text-[#00c853] hover:text-[#00a844] transition-colors"
          >Change ↻</button>
        </div>

        <div className="bg-[#1565C0] rounded-[20px] p-6 sm:p-8 mb-3 relative overflow-hidden transition-all duration-700 ease-out"
          style={{
            transform: showResult ? "scale(1) translateY(0)" : "scale(0.92) translateY(20px)",
            opacity: showResult ? 1 : 0,
          }}>
          {/* Scattered emojis */}
          <div className="absolute inset-0 pointer-events-none select-none" style={{ filter: "blur(2px)" }} aria-hidden="true">
            {['💵','🏠','🏡','🏦','🏛️','❤️'].map((e, i) => (
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
            <p className="text-[13px] font-bold uppercase tracking-[1px] text-white/80 mb-2 transition-all duration-500 delay-200"
              style={{ opacity: showResult ? 1 : 0, transform: showResult ? "translateY(0)" : "translateY(10px)" }}>
              Your savings after {years} {years === 1 ? "year" : "years"}
            </p>
            <p className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white">
              <ScrollingPeso value={result.finalBalance} />
            </p>
            <div className="flex justify-center mt-4 transition-all duration-500 delay-300"
              style={{ opacity: showResult ? 1 : 0, transform: showResult ? "translateY(0)" : "translateY(10px)" }}>
              <div className="bg-white/15 backdrop-blur-md rounded-2xl px-6 py-4 flex gap-8">
                <div className="text-center">
                  <p className="text-[12px] font-semibold text-white/70 uppercase tracking-[0.5px]">Contributed</p>
                  <p className="text-xl font-extrabold text-white"><ScrollingPeso value={result.totalDeposits} /></p>
                </div>
                <div className="text-center">
                  <p className="text-[12px] font-semibold text-[#FFD600]/80 uppercase tracking-[0.5px]">Dividends (tax-free)</p>
                  <p className="text-xl font-extrabold text-[#FFD600]"><ScrollingPeso value={result.totalInterest} /></p>
                </div>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4 max-w-[300px] mx-auto transition-all duration-500 delay-500"
              style={{ opacity: showResult ? 1 : 0 }}>
              <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full rounded-full bg-white transition-all duration-[2000ms] ease-out" style={{ width: showResult ? `${interestPct}%` : "0%" }} />
              </div>
              <p className="text-[12px] font-semibold text-white/80 mt-1">{interestPct}% of your total is from dividends</p>
            </div>
          </div>
        </div>

        {/* Growth Chart */}
        <div className="bg-white rounded-[20px] p-5 sm:p-6 mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">Projected growth</p>
          <GrowthChart data={result.data} />
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-[3px] rounded-full bg-[#00c853]" />
              <span className="text-[10px] text-[#888]">Total value</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-[3px] rounded-full bg-[#ccc]" />
              <span className="text-[10px] text-[#888]">Contributions only</span>
            </div>
          </div>
        </div>
        </>
        )}

        {/* Historical Dividend Rates */}
        <div className="bg-white rounded-[20px] p-5 sm:p-6 mb-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888]">MP2 dividend rate history</p>
            <p className="text-[11px] text-[#888]">Avg: <span className="font-bold text-[#1a1a1a]">{AVG_ALL.toFixed(2)}%</span></p>
          </div>
          <HistoryChart />
          <div className="flex justify-center gap-4 mt-3">
            <span className="text-[10px] text-[#888]">5yr avg: <span className="font-bold text-[#1a1a1a]">{AVG_5YR.toFixed(2)}%</span></span>
            <span className="text-[10px] text-[#888]">10yr avg: <span className="font-bold text-[#1a1a1a]">{AVG_10YR.toFixed(2)}%</span></span>
          </div>
        </div>


        {/* Info card */}
        <div className="mt-3 bg-white rounded-[20px] p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">About Pag-IBIG MP2</p>
          <div className="space-y-2 text-[13px] text-[#666] leading-relaxed">
            <p><span className="font-bold text-[#1a1a1a]">Tax-free dividends.</span> MP2 earnings are exempt from income tax, making it one of the highest-yielding government savings programs.</p>
            <p><span className="font-bold text-[#1a1a1a]">5-year lock-in.</span> Your contributions are locked for 5 years. After maturity, you can withdraw or renew for another term.</p>
            <p><span className="font-bold text-[#1a1a1a]">Dividends vary yearly.</span> The rates shown are historical — future rates depend on fund performance. This calculator uses a fixed rate for projection purposes.</p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-3 bg-white rounded-[20px] p-5 sm:p-6 text-center">
          <p className="text-sm text-[#888] mb-3">Compare with savings accounts and time deposits</p>
          <Link href="/rates"
            className="inline-block bg-[#00c853] text-white font-bold text-sm px-6 py-3 rounded-full hover:bg-[#00a844] transition-colors no-underline">
            Compare rates →
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-sm font-bold text-[#00e401]" style={{fontFamily:"var(--font-old-english)"}}>Sentral</span>
          <p className="text-[10px] text-[#aaa] max-w-md sm:text-right leading-relaxed">
            This calculator is for illustrative purposes only. MP2 dividend rates vary each year based on fund performance. Always verify with Pag-IBIG Fund directly.
          </p>
        </footer>
      </main>
    </div>
  );
}
