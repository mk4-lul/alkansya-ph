"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import NavMenu from "@/components/NavMenu";
import ScrollingPeso from "@/components/ScrollingPeso";

// ─── Loan types ──────────────────────────────────────────────────
interface LoanType {
  id: string;
  name: string;
  emoji: string;
  monthlyRate: number; // decimal, e.g. 0.035 = 3.5%
  description: string;
  savage: string;
}

const LOAN_TYPES: LoanType[] = [
  {
    id: "cc", name: "Credit Card", emoji: "💳",
    monthlyRate: 0.035,
    description: "3.5% per month / 42% per year",
    savage: "Minimum payment lang? Tawang-tawa ang bangko sa'yo.",
  },
  {
    id: "motor", name: "Motor Installment", emoji: "🏍",
    monthlyRate: 0.015,
    description: "1.5% per month / 18% per year",
    savage: "Ang motor nag-dedepréciate, ang utang nag-aaccumulate.",
  },
  {
    id: "online", name: "Online Lending App", emoji: "📱",
    monthlyRate: 0.04,
    description: "4% per month / 48% per year",
    savage: "Isang click lang mag-utang. Isang taon mag-bayad.",
  },
  {
    id: "cinco", name: "5-6 Lending", emoji: "🦈",
    monthlyRate: 0.04,
    description: "~4% per month (borrow 5, pay 6)",
    savage: "Nag-5-6 ka pa. Alam mo na yan eh.",
  },
  {
    id: "custom", name: "Custom", emoji: "✏️",
    monthlyRate: 0,
    description: "Ikaw bahala sa rate",
    savage: "Sige, i-compute mo sarili mong pagkakamali.",
  },
];

const AMOUNT_PRESETS = [
  { label: "₱5K", value: 5000 },
  { label: "₱10K", value: 10000 },
  { label: "₱20K", value: 20000 },
  { label: "₱50K", value: 50000 },
  { label: "₱100K", value: 100000 },
  { label: "₱200K", value: 200000 },
];

const TERM_PRESETS = [3, 6, 12, 18, 24, 36, 48, 60];

// ─── Calculation ─────────────────────────────────────────────────
function calcLoan(principal: number, monthlyRate: number, months: number) {
  if (monthlyRate === 0 || months === 0) return { monthlyPayment: 0, totalPaid: 0, totalInterest: 0, interestPct: 0 };

  // Standard amortization
  const mp = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  const totalPaid = mp * months;
  const totalInterest = totalPaid - principal;
  const interestPct = (totalInterest / principal) * 100;

  return { monthlyPayment: mp, totalPaid, totalInterest, interestPct };
}

function formatPeso(v: number): string {
  if (v >= 1_000_000) return `₱${(v / 1_000_000).toFixed(2)}M`;
  return `₱${Math.round(v).toLocaleString("en-PH")}`;
}

type Verdict = "green" | "yellow" | "red";

function getVerdict(interestPct: number): { verdict: Verdict; emoji: string; title: string; subtitle: string; message: string } {
  if (interestPct <= 5) return {
    verdict: "green", emoji: "😌", title: "Chill lang.",
    subtitle: "Hindi naman ganun kalaki.",
    message: "Mababa pa interest mo. Pero next time, kung kaya cash — cash na.",
  };
  if (interestPct <= 15) return {
    verdict: "yellow", emoji: "😬", title: "Medyo masakit na.",
    subtitle: "Pinapayaman mo na yung nagpautang.",
    message: "Yung interest mo, pwede nang pang-grocery ng ilang buwan. Bayaran mo na agad.",
  };
  if (interestPct <= 30) return {
    verdict: "yellow", emoji: "🫠", title: "Grabe ka ba.",
    subtitle: "Binibigay mo na yung pera mo for free.",
    message: "Halos third ng utang mo napupunta sa interest. Parang nagbabayad ka ng renta sa sarili mong pera.",
  };
  if (interestPct <= 60) return {
    verdict: "red", emoji: "💀", title: "Patay ka na.",
    subtitle: "Mas malaki na interest kaysa pwede mong ipunin.",
    message: "Kung inipon mo nalang 'to, may pang-down payment ka na sa bahay. Pero hindi. Binigay mo sa bangko.",
  };
  if (interestPct <= 100) return {
    verdict: "red", emoji: "🪦", title: "RIP wallet.",
    subtitle: "Nagbabayad ka na ng doble.",
    message: "Binayaran mo ng halos doble yung pinautang sa'yo. Congrats, pinagtrabahuhan mo yung bangko nang libre.",
  };
  return {
    verdict: "red", emoji: "🔥", title: "Diyos ko po.",
    subtitle: "Mas malaki pa bayad mo kaysa utang mo.",
    message: "Nagbayad ka ng " + Math.ceil(interestPct) + "% na interest. Kung binigay mo nalang sa kanya yung pera at humingi ng konti, mas okay pa.",
  };
}

// ─── Component ───────────────────────────────────────────────────
export default function UtangPage() {
  const [loanType, setLoanType] = useState<LoanType | null>(null);
  const [customRate, setCustomRate] = useState(3);
  const [amount, setAmount] = useState<number | null>(null);
  const [term, setTerm] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const monthlyRate = loanType?.id === "custom" ? customRate / 100 : (loanType?.monthlyRate ?? 0);
  const isReady = loanType !== null && amount !== null && amount > 0 && term !== null && monthlyRate > 0;
  const result = useMemo(() => isReady ? calcLoan(amount, monthlyRate, term) : null, [amount, monthlyRate, term, isReady]);
  const verdict = useMemo(() => result ? getVerdict(result.interestPct) : null, [result]);

  // Auto-reveal
  useEffect(() => {
    if (isReady && !revealed && result) {
      setRevealed(true);
      setShowResult(false);
      setTimeout(() => setShowResult(true), 80);
    }
  }, [isReady, revealed, result]);

  function handleTryAgain() {
    setRevealed(false);
    setLoanType(null);
    setAmount(null);
    setTerm(null);
    setCustomRate(3);
  }

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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a1a1a] tracking-tight mb-4">Magkano nawawala sa&apos;yo?</h1>

        {!revealed ? (
        <div className="space-y-3">
          {/* Loan type */}
          <div className="bg-white rounded-[20px] p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">Saan ka nag-utang?</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LOAN_TYPES.map((lt) => (
                <button key={lt.id} onClick={() => setLoanType(lt)}
                  className={`py-3 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                    loanType?.id === lt.id ? "bg-[#1a1a1a] text-white" : "bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#e8e8e8]"
                  }`}>
                  <span className="text-base">{lt.emoji}</span> {lt.name}
                </button>
              ))}
            </div>
            {loanType && (
              <p className="text-[11px] text-[#888] mt-3 text-center">
                {loanType.description}
              </p>
            )}
            {loanType?.id === "custom" && (
              <div className="mt-3">
                <p className="text-[10px] font-bold text-[#888] uppercase tracking-wider mb-2 text-center">Monthly interest rate</p>
                <div className="flex items-center gap-3">
                  <input type="range" min="0.5" max="10" step="0.1" value={customRate}
                    onChange={(e) => setCustomRate(Number(e.target.value))}
                    className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right, #D32F2F ${(customRate / 10) * 100}%, #e8e8e8 ${(customRate / 10) * 100}%)` }}
                  />
                  <span className="text-sm font-black text-[#1a1a1a] w-14 text-right">{customRate.toFixed(1)}%</span>
                </div>
                <p className="text-[10px] text-[#aaa] mt-1 text-center">{(customRate * 12).toFixed(1)}% per year</p>
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="bg-white rounded-[20px] p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">Magkano inutang mo?</p>
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
                  value={amount ? amount.toLocaleString("en-PH") : ""}
                  onChange={(e) => {
                    const v = Number(e.target.value.replace(/[^0-9]/g, ""));
                    setAmount(v || null);
                  }}
                  className="flex-1 bg-transparent text-sm font-bold text-[#1a1a1a] outline-none"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Term */}
          <div className="bg-white rounded-[20px] p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">Ilang buwan babayaran?</p>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {TERM_PRESETS.map((m) => (
                <button key={m} onClick={() => setTerm(m)}
                  className={`py-2.5 rounded-xl text-[12px] font-bold transition-all ${
                    term === m ? "bg-[#1a1a1a] text-white" : "bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#e8e8e8]"
                  }`}>{m}mo</button>
              ))}
            </div>
          </div>
        </div>
        ) : result && verdict ? (
        <>
          {/* Verdict card */}
          <div className="rounded-[20px] p-6 sm:p-8 mb-3 relative overflow-hidden transition-all duration-700 ease-out" style={{
            background: verdict.verdict === "green" ? "#00c853" : verdict.verdict === "yellow" ? "#FFB300" : "#D32F2F",
            transform: showResult ? "scale(1) translateY(0)" : "scale(0.92) translateY(20px)",
            opacity: showResult ? 1 : 0,
          }}>
            <div className="text-center" style={{ color: verdict.verdict === "yellow" ? "#1a1a1a" : "#fff" }}>
              <p className="text-[72px] leading-none mb-2">{verdict.emoji}</p>
              <p className="text-3xl sm:text-4xl font-black tracking-tight leading-none mb-1">{verdict.title}</p>
              <p className="text-sm font-semibold mb-4" style={{
                color: verdict.verdict === "yellow" ? "rgba(26,26,26,0.5)" : "rgba(255,255,255,0.6)"
              }}>{verdict.subtitle}</p>

              {/* The big number */}
              <p className="text-[10px] font-semibold uppercase tracking-[1px] mb-1" style={{
                color: verdict.verdict === "yellow" ? "rgba(26,26,26,0.4)" : "rgba(255,255,255,0.5)"
              }}>Nawawala sa&apos;yo</p>
              <p className="text-5xl sm:text-6xl font-black tracking-tight mb-4"><ScrollingPeso value={result.totalInterest} /></p>

              {/* Stats */}
              <div className="flex justify-center gap-4 sm:gap-6 mb-5">
                <div>
                  <p className="text-xl sm:text-2xl font-black">{formatPeso(amount!)}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{
                    color: verdict.verdict === "yellow" ? "rgba(26,26,26,0.4)" : "rgba(255,255,255,0.5)"
                  }}>inutang</p>
                </div>
                <div style={{ width: 1, background: verdict.verdict === "yellow" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)", alignSelf: "stretch" }} />
                <div>
                  <p className="text-xl sm:text-2xl font-black">{formatPeso(result.totalPaid)}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{
                    color: verdict.verdict === "yellow" ? "rgba(26,26,26,0.4)" : "rgba(255,255,255,0.5)"
                  }}>binayaran</p>
                </div>
                <div style={{ width: 1, background: verdict.verdict === "yellow" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)", alignSelf: "stretch" }} />
                <div>
                  <p className="text-xl sm:text-2xl font-black">{formatPeso(result.monthlyPayment)}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{
                    color: verdict.verdict === "yellow" ? "rgba(26,26,26,0.4)" : "rgba(255,255,255,0.5)"
                  }}>per month</p>
                </div>
              </div>

              {/* Savage message */}
              <p className="text-xs leading-relaxed max-w-sm mx-auto mb-2" style={{
                color: verdict.verdict === "yellow" ? "rgba(26,26,26,0.5)" : "rgba(255,255,255,0.6)"
              }}>{verdict.message}</p>

              {loanType && (
                <p className="text-[10px] italic" style={{
                  color: verdict.verdict === "yellow" ? "rgba(26,26,26,0.3)" : "rgba(255,255,255,0.35)"
                }}>&ldquo;{loanType.savage}&rdquo;</p>
              )}
            </div>
          </div>

          {/* Breakdown card */}
          <div className="bg-white rounded-[20px] p-5 sm:p-6 mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-4">Breakdown ng bayad mo</p>

            {/* Visual bar */}
            <div className="h-8 rounded-full overflow-hidden flex mb-4">
              <div className="bg-[#1a1a1a] flex items-center justify-center"
                style={{ width: `${(amount! / result.totalPaid) * 100}%` }}>
                <span className="text-[10px] font-bold text-white px-2 truncate">Utang</span>
              </div>
              <div className="bg-[#D32F2F] flex items-center justify-center"
                style={{ width: `${(result.totalInterest / result.totalPaid) * 100}%` }}>
                <span className="text-[10px] font-bold text-white px-2 truncate">Interest</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#888]">Inutang</span>
                <span className="font-bold text-[#1a1a1a]">{formatPeso(amount!)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#D32F2F] font-semibold">+ Interest ({result.interestPct.toFixed(1)}%)</span>
                <span className="font-bold text-[#D32F2F]">{formatPeso(result.totalInterest)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-sm">
                <span className="text-[#888]">Kabuuang binayaran</span>
                <span className="font-extrabold text-[#1a1a1a]">{formatPeso(result.totalPaid)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#888]">Monthly payment</span>
                <span className="font-bold text-[#1a1a1a]">{formatPeso(result.monthlyPayment)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#888]">Interest rate</span>
                <span className="font-bold text-[#1a1a1a]">{(monthlyRate * 100).toFixed(1)}%/mo ({(monthlyRate * 1200).toFixed(1)}%/yr)</span>
              </div>
            </div>
          </div>

          {/* What if you saved instead */}
          <div className="bg-white rounded-[20px] p-5 sm:p-6 mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-2">Kung inipon mo nalang sana</p>
            <p className="text-[10px] text-[#aaa] mb-4">
              Yung {formatPeso(result.totalInterest)} na napunta sa interest — kung inipon mo nalang sa digital bank na 6% per year:
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[1, 3, 5].map((yr) => {
                const futureValue = result.totalInterest * Math.pow(1 + 0.06, yr);
                return (
                  <div key={yr} className="bg-[#f5f5f5] rounded-xl px-3 py-3 text-center">
                    <p className="text-lg sm:text-xl font-black text-[#00c853]">{formatPeso(futureValue)}</p>
                    <p className="text-[10px] font-semibold text-[#888]">after {yr} {yr === 1 ? "year" : "years"}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-[#aaa] mt-3 text-center italic">
              Binigay mo sa nagpautang. Sana binigay mo sa sarili mo.
            </p>
          </div>

          {/* Try again */}
          <div className="text-center mt-2 mb-3">
            <button onClick={handleTryAgain}
              className="px-6 py-2.5 rounded-full text-sm font-bold text-[#888] bg-white hover:bg-[#f0f0f0] transition-colors"
            >Try again ↻</button>
          </div>
        </>
        ) : null}

        {/* CTA */}
        <div className="mt-3 bg-white rounded-[20px] p-5 sm:p-6 text-center">
          <p className="text-sm text-[#888] mb-3">Gusto mo na mag-ipon imbes mag-utang?</p>
          <Link href="/rates"
            className="inline-block bg-[#00c853] text-white font-bold text-sm px-6 py-3 rounded-full hover:bg-[#00a844] transition-colors no-underline">
            Tingnan ang best rates →
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-sm font-bold text-[#00e401]" style={{fontFamily:"var(--font-old-english)"}}>Sentral</span>
          <p className="text-[10px] text-[#aaa] max-w-md sm:text-right leading-relaxed">
            Standard amortization formula. Actual rates may vary by lender. Hindi &apos;to financial advice — pang-guilt trip lang &apos;to.
          </p>
        </footer>
      </main>
    </div>
  );
}
