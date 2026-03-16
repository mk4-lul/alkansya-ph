"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { formatPeso } from "@/lib/utils";
import NavMenu from "@/components/NavMenu";
import ScrollingPeso from "@/components/ScrollingPeso";

const YEAR_OPTIONS = [1, 2, 3, 5, 10, 15, 20, 30];

function formatWithCommas(n: number): string {
  if (!n) return "";
  return n.toLocaleString("en-PH");
}

function parseFormatted(s: string): number {
  return Number(s.replace(/[^0-9]/g, "")) || 0;
}

const INITIAL_PRESETS = [
  { label: "₱0", value: 0 },
  { label: "₱10k", value: 10000 },
  { label: "₱50k", value: 50000 },
  { label: "₱100k", value: 100000 },
  { label: "₱500k", value: 500000 },
  { label: "₱1M", value: 1000000 },
];

const MONTHLY_PRESETS = [
  { label: "₱0", value: 0 },
  { label: "₱1k", value: 1000 },
  { label: "₱5k", value: 5000 },
  { label: "₱10k", value: 10000 },
  { label: "₱25k", value: 25000 },
  { label: "₱50k", value: 50000 },
];

function computeGrowth(initial: number, monthly: number, annualRate: number, years: number) {
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;
  const data: { month: number; balance: number; deposits: number; interest: number }[] = [];

  let balance = initial;
  let totalDeposits = initial;
  let totalInterest = 0;

  data.push({ month: 0, balance, deposits: totalDeposits, interest: 0 });

  for (let m = 1; m <= months; m++) {
    const interestThisMonth = balance * monthlyRate;
    balance += interestThisMonth + monthly;
    totalDeposits += monthly;
    totalInterest += interestThisMonth;

    if (years <= 5 || m % 3 === 0 || m === months) {
      data.push({ month: m, balance, deposits: totalDeposits, interest: totalInterest });
    }
  }

  return { finalBalance: balance, totalDeposits, totalInterest, data };
}

function MiniChart({ data, height = 300 }: { data: { month: number; balance: number; deposits: number }[]; height?: number }) {
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
  const scaleY = (val: number) => padding.top + chartH - (val / maxBalance) * chartH;

  const balancePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${scaleX(d.month)},${scaleY(d.balance)}`).join(" ");
  const balanceArea = `${balancePath} L${scaleX(maxMonth)},${scaleY(0)} L${scaleX(0)},${scaleY(0)} Z`;

  const depositsPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${scaleX(d.month)},${scaleY(d.deposits)}`).join(" ");
  const depositsArea = `${depositsPath} L${scaleX(maxMonth)},${scaleY(0)} L${scaleX(0)},${scaleY(0)} Z`;

  const years = maxMonth / 12;
  const yearLabels: number[] = [];
  if (years <= 3) {
    for (let y = 0; y <= years; y++) yearLabels.push(y);
  } else if (years <= 5) {
    for (let y = 0; y <= years; y += 1) yearLabels.push(y);
    if (!yearLabels.includes(2.5)) yearLabels.push(2.5);
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
        <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00c853" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#00c853" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="grayGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#888" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#888" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={depositsArea} fill="url(#grayGrad)" />
      <path d={depositsPath} fill="none" stroke="#ccc" strokeWidth="1.5" />
      <path d={balanceArea} fill="url(#greenGrad)" />
      <path d={balancePath} fill="none" stroke="#00c853" strokeWidth="2.5" strokeLinejoin="round" />
      {yearLabels.map((y) => (
        <text key={y} x={scaleX(y * 12)} y={height - 4} textAnchor="middle" fontSize="13" fontWeight="600" fill="#888" fontFamily="Plus Jakarta Sans, sans-serif">
          {y % 1 === 0 ? y : y.toFixed(1)}yr
        </text>
      ))}
      {/* End value label — hide when hovering */}
      {hoverIndex === null && (
        <text x={scaleX(maxMonth) - 4} y={scaleY(maxBalance) - 10} textAnchor="end" fontSize="15" fontWeight="800" fill="#00c853" fontFamily="Plus Jakarta Sans, sans-serif">
          {formatPeso(maxBalance)}
        </text>
      )}
      {/* Hover elements */}
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
              Interest: {formatPeso(hoverInterest)}
            </text>
          </g>
        </>
      )}
    </svg>
  );
}

export default function CalculatorPage() {
  const [initial, setInitial] = useState(50000);
  const [monthly, setMonthly] = useState(5000);
  const [rate, setRate] = useState(3.0);
  const [years, setYears] = useState(10);

  const result = useMemo(() => computeGrowth(initial, monthly, rate, years), [initial, monthly, rate, years]);

  const interestPct = result.finalBalance > 0 ? ((result.totalInterest / result.finalBalance) * 100).toFixed(1) : "0";

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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a1a1a] tracking-tight mb-4">Compound interest calculator</h1>

        {/* Inputs */}
        <div className="space-y-3 mb-3">
          {/* Initial deposit */}
          <div className="bg-white rounded-[20px] p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">Initial deposit</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {INITIAL_PRESETS.map((p) => (
                <button key={p.value} onClick={() => setInitial(p.value)}
                  className={`py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                    initial === p.value ? "bg-[#1a1a1a] text-white" : "bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#e8e8e8]"
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
                  value={formatWithCommas(initial)}
                  onChange={(e) => setInitial(parseFormatted(e.target.value))}
                  className="flex-1 bg-transparent text-sm font-bold text-[#1a1a1a] outline-none"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

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
                  value={formatWithCommas(monthly)}
                  onChange={(e) => setMonthly(parseFormatted(e.target.value))}
                  className="flex-1 bg-transparent text-sm font-bold text-[#1a1a1a] outline-none"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Interest rate — SLIDER */}
          <div className="bg-white rounded-[20px] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888]">Interest rate (per year)</p>
              <p className="text-2xl font-extrabold text-[#00c853]">{rate.toFixed(1)}%</p>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #00c853 0%, #00c853 ${(rate / 15) * 100}%, #e8e8e8 ${(rate / 15) * 100}%, #e8e8e8 100%)`,
              }}
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-[#aaa]">0%</span>
              <span className="text-[10px] text-[#aaa]">15%</span>
            </div>
          </div>

          {/* Time period */}
          <div className="bg-white rounded-[20px] p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">Time period</p>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {YEAR_OPTIONS.map((y) => (
                <button key={y} onClick={() => setYears(y)}
                  className={`py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                    years === y ? "bg-[#1a1a1a] text-white" : "bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#e8e8e8]"
                  }`}>{y}yr</button>
              ))}
            </div>
          </div>
        </div>

        {/* Hero result card */}
        <div className="bg-[#00FF7F] rounded-[20px] p-6 sm:p-8 mb-3 relative overflow-hidden">
          {/* Scattered money emojis */}
          <div className="absolute inset-0 pointer-events-none select-none" style={{ filter: "blur(2px)" }} aria-hidden="true">
            {['💵','💰','💸','💎','🤑','📈'].map((e, i) => (
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
            <p className="text-[13px] font-bold uppercase tracking-[1px] text-[#1a1a1a]/60 mb-2">
              Your money after {years} {years === 1 ? "year" : "years"}
            </p>
            <p className="text-5xl sm:text-6xl font-extrabold tracking-tight text-[#1a1a1a]">
              <ScrollingPeso value={result.finalBalance} />
            </p>
            <div className="flex justify-center mt-4">
              <div className="bg-black/10 backdrop-blur-md rounded-2xl px-6 py-4 flex gap-8">
                <div className="text-center">
                  <p className="text-[12px] font-semibold text-[#1a1a1a]/50 uppercase tracking-[0.5px]">Deposited</p>
                  <p className="text-xl font-extrabold text-[#1a1a1a]"><ScrollingPeso value={result.totalDeposits} /></p>
                </div>
                <div className="text-center">
                  <p className="text-[12px] font-semibold text-[#1a1a1a]/50 uppercase tracking-[0.5px]">Interest earned</p>
                  <p className="text-xl font-extrabold text-[#1a1a1a]"><ScrollingPeso value={result.totalInterest} /></p>
                </div>
              </div>
            </div>
            {/* Interest percentage bar */}
            <div className="mt-4 max-w-[300px] mx-auto">
              <div className="h-2 rounded-full bg-black/10 overflow-hidden">
                <div className="h-full rounded-full bg-[#1a1a1a] transition-all duration-500" style={{ width: `${interestPct}%` }} />
              </div>
              <p className="text-[12px] font-semibold text-[#1a1a1a]/60 mt-1">{interestPct}% of your final balance is interest</p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-[20px] p-5 sm:p-6 mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">Growth over time</p>
          <MiniChart data={result.data} />
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-[3px] rounded-full bg-[#00c853]" />
              <span className="text-[10px] text-[#888]">Total balance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-[3px] rounded-full bg-[#ccc]" />
              <span className="text-[10px] text-[#888]">Deposits only</span>
            </div>
          </div>
        </div>

        {/* Compare CTA */}
        <div className="mt-3 bg-white rounded-[20px] p-5 sm:p-6 text-center">
          <p className="text-sm text-[#888] mb-3">Want to find the best rate for your money?</p>
          <Link href="/rates"
            className="inline-block bg-[#00c853] text-white font-bold text-sm px-6 py-3 rounded-full hover:bg-[#00a844] transition-colors no-underline">
            Compare rates →
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-sm font-bold text-[#888]">alkansya<span className="text-[#00c853]">.ph</span></span>
          <p className="text-[10px] text-[#aaa] max-w-md sm:text-right leading-relaxed">
            This calculator is for illustrative purposes only. Actual returns may vary based on compounding frequency, taxes, and platform-specific terms.
          </p>
        </footer>
      </main>

      {/* Slider thumb styling */}
      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #00c853;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #00c853;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
      `}</style>
    </div>
  );
}
