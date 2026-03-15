"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatPeso } from "@/lib/utils";

const BANK_PRESETS = [
  { label: "Maya 6%", rate: 6.0 },
  { label: "Tonik 4.5%", rate: 4.5 },
  { label: "UNOBank 3.5%", rate: 3.5 },
  { label: "GoTyme 3%", rate: 3.0 },
  { label: "CIMB 2.5%", rate: 2.5 },
  { label: "BPI 0.09%", rate: 0.0925 },
];

const YEAR_OPTIONS = [1, 2, 3, 5, 10, 15, 20, 30];

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

    // Store data points — every month for short periods, quarterly for long
    if (years <= 5 || m % 3 === 0 || m === months) {
      data.push({ month: m, balance, deposits: totalDeposits, interest: totalInterest });
    }
  }

  return { finalBalance: balance, totalDeposits, totalInterest, data };
}

function MiniChart({ data, height = 200 }: { data: { month: number; balance: number; deposits: number }[]; height?: number }) {
  if (data.length < 2) return null;

  const width = 600;
  const padding = { top: 20, right: 20, bottom: 30, left: 20 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxBalance = Math.max(...data.map((d) => d.balance));
  const maxMonth = data[data.length - 1].month;

  const scaleX = (month: number) => padding.left + (month / maxMonth) * chartW;
  const scaleY = (val: number) => padding.top + chartH - (val / maxBalance) * chartH;

  // Balance line (green area)
  const balancePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${scaleX(d.month)},${scaleY(d.balance)}`).join(" ");
  const balanceArea = `${balancePath} L${scaleX(maxMonth)},${scaleY(0)} L${scaleX(0)},${scaleY(0)} Z`;

  // Deposits line (gray area)
  const depositsPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${scaleX(d.month)},${scaleY(d.deposits)}`).join(" ");
  const depositsArea = `${depositsPath} L${scaleX(maxMonth)},${scaleY(0)} L${scaleX(0)},${scaleY(0)} Z`;

  // Year labels
  const years = maxMonth / 12;
  const yearLabels: number[] = [];
  if (years <= 5) {
    for (let y = 0; y <= years; y++) yearLabels.push(y);
  } else {
    const step = years <= 15 ? 5 : 10;
    for (let y = 0; y <= years; y += step) yearLabels.push(y);
    if (!yearLabels.includes(years)) yearLabels.push(years);
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: height }}>
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
      {/* Deposit area */}
      <path d={depositsArea} fill="url(#grayGrad)" />
      <path d={depositsPath} fill="none" stroke="#ccc" strokeWidth="1.5" />
      {/* Balance area */}
      <path d={balanceArea} fill="url(#greenGrad)" />
      <path d={balancePath} fill="none" stroke="#00c853" strokeWidth="2.5" strokeLinejoin="round" />
      {/* Year labels */}
      {yearLabels.map((y) => (
        <text key={y} x={scaleX(y * 12)} y={height - 6} textAnchor="middle" fontSize="11" fill="#888" fontFamily="Plus Jakarta Sans, sans-serif">
          {y}yr
        </text>
      ))}
      {/* End value label */}
      <text x={scaleX(maxMonth) - 4} y={scaleY(maxBalance) - 8} textAnchor="end" fontSize="13" fontWeight="700" fill="#00c853" fontFamily="Plus Jakarta Sans, sans-serif">
        {formatPeso(maxBalance)}
      </text>
    </svg>
  );
}

export default function CalculatorPage() {
  const [initial, setInitial] = useState(100000);
  const [monthly, setMonthly] = useState(5000);
  const [rate, setRate] = useState(6.0);
  const [years, setYears] = useState(10);
  const [customRate, setCustomRate] = useState("");

  const result = useMemo(() => computeGrowth(initial, monthly, rate, years), [initial, monthly, rate, years]);

  const interestPct = result.finalBalance > 0 ? ((result.totalInterest / result.finalBalance) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Nav */}
      <nav className="flex justify-between items-center px-4 sm:px-6 py-4 max-w-[720px] mx-auto">
        <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-[#1a1a1a] no-underline">
          alkansya<span className="text-[#00c853]">.ph</span>
        </Link>
        <Link href="/" className="text-[12px] font-semibold text-[#888] hover:text-[#1a1a1a] transition-colors no-underline">
          ← Compare rates
        </Link>
      </nav>

      <main className="max-w-[720px] mx-auto px-4 sm:px-6 pb-8">
        {/* Hero */}
        <div className="bg-[#00c853] rounded-[20px] p-6 sm:p-8 mb-3 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
            {['📈','💰','🪙','💸','📊','💎','🤑','📈','💰','🪙','💸','📊','💎','🤑','📈','💰','🪙','💸','📊','💎','🤑','📈','💰','🪙','💸','📊','💎','🤑','📈','💰'].map((e, i) => (
              <span key={i} className="absolute text-[22px] sm:text-[28px]" style={{
                left: `${(i * 17.3 + i * i * 3.7) % 100}%`,
                top: `${(i * 13.1 + i * i * 2.3) % 100}%`,
                opacity: 0.75,
                transform: `rotate(${(i * 37) % 360}deg)`,
              }}>{e}</span>
            ))}
          </div>
          <div className="relative text-center">
            <p className="text-lg font-bold text-white/80 mb-1">Compound interest calculator</p>
            <p className="text-[13px] text-white/50">See how your money grows over time</p>
          </div>
        </div>

        {/* Result card — BIG number */}
        <div className="bg-white rounded-[20px] p-6 sm:p-8 mb-3 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-2">Your money after {years} {years === 1 ? "year" : "years"}</p>
          <p className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#1a1a1a]">
            {formatPeso(result.finalBalance)}
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <div>
              <p className="text-[11px] text-[#888] uppercase tracking-[0.5px]">Deposited</p>
              <p className="text-lg font-bold text-[#1a1a1a]">{formatPeso(result.totalDeposits)}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#00c853] uppercase tracking-[0.5px]">Interest earned</p>
              <p className="text-lg font-bold text-[#00c853]">{formatPeso(result.totalInterest)}</p>
            </div>
          </div>
          {/* Interest percentage bar */}
          <div className="mt-4 max-w-[300px] mx-auto">
            <div className="h-2 rounded-full bg-[#f5f5f5] overflow-hidden">
              <div className="h-full rounded-full bg-[#00c853] transition-all duration-500" style={{ width: `${interestPct}%` }} />
            </div>
            <p className="text-[11px] text-[#888] mt-1">{interestPct}% of your final balance is interest</p>
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

        {/* Inputs */}
        <div className="space-y-3">
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
              <input
                type="number"
                value={initial || ""}
                onChange={(e) => setInitial(Number(e.target.value) || 0)}
                className="flex-1 bg-[#f5f5f5] rounded-xl px-3 py-2 text-sm font-bold text-[#1a1a1a] outline-none focus:ring-2 focus:ring-[#00c853]"
                placeholder="₱0"
              />
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
              <input
                type="number"
                value={monthly || ""}
                onChange={(e) => setMonthly(Number(e.target.value) || 0)}
                className="flex-1 bg-[#f5f5f5] rounded-xl px-3 py-2 text-sm font-bold text-[#1a1a1a] outline-none focus:ring-2 focus:ring-[#00c853]"
                placeholder="₱0"
              />
            </div>
          </div>

          {/* Interest rate */}
          <div className="bg-white rounded-[20px] p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">Interest rate (per year)</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {BANK_PRESETS.map((p) => (
                <button key={p.rate} onClick={() => { setRate(p.rate); setCustomRate(""); }}
                  className={`py-2.5 rounded-xl text-[12px] font-bold transition-all ${
                    rate === p.rate && !customRate
                      ? "bg-[#00c853] text-white"
                      : "bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#e8e8e8]"
                  }`}>{p.label}</button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-[#888]">Custom:</span>
              <input
                type="number"
                step="0.1"
                value={customRate}
                onChange={(e) => { setCustomRate(e.target.value); setRate(Number(e.target.value) || 0); }}
                className="flex-1 bg-[#f5f5f5] rounded-xl px-3 py-2 text-sm font-bold text-[#1a1a1a] outline-none focus:ring-2 focus:ring-[#00c853]"
                placeholder="e.g. 5.5"
              />
              <span className="text-sm font-bold text-[#888]">%</span>
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

        {/* Compare CTA */}
        <div className="mt-3 bg-white rounded-[20px] p-5 sm:p-6 text-center">
          <p className="text-sm text-[#888] mb-3">Want to find the best rate for your money?</p>
          <Link href="/"
            className="inline-block bg-[#00c853] text-white font-bold text-sm px-6 py-3 rounded-full hover:bg-[#00a844] transition-colors no-underline">
            Compare bank rates →
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-sm font-bold text-[#888]">alkansya<span className="text-[#00c853]">.ph</span></span>
          <p className="text-[10px] text-[#aaa] max-w-md sm:text-right leading-relaxed">
            This calculator is for illustrative purposes only. Actual returns may vary based on compounding frequency, taxes, and bank-specific terms.
          </p>
        </footer>
      </main>
    </div>
  );
}
