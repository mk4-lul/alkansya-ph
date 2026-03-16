"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import NavMenu from "@/components/NavMenu";

function formatPeso(value: number): string {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
  return `₱${Math.round(value).toLocaleString("en-PH")}`;
}
function formatWithCommas(n: number): string {
  return n.toLocaleString("en-PH");
}

type Verdict = "green" | "yellow" | "red";

interface VerdictResult {
  verdict: Verdict;
  daysOfWork: number;
  percentOfIncome: number;
  monthsToSave: number;
  emoji: string;
  title: string;
  subtitle: string;
  message: string;
}

function getVerdict(income: number, price: number, savings: number): VerdictResult {
  const dailyPay = income / 22;
  const daysOfWork = price / dailyPay;
  const percentOfIncome = (price / income) * 100;
  const monthsToSave = savings > 0 ? Math.ceil(price / savings) : 999;

  let verdict: Verdict, emoji: string, title: string, subtitle: string, message: string;

  if (percentOfIncome <= 10) {
    verdict = "green"; emoji = "✅"; title = "Bili na!"; subtitle = "Easy money.";
    message = `${daysOfWork.toFixed(1)} araw ng trabaho lang 'to. ${percentOfIncome.toFixed(0)}% ng sahod mo. Go na, walang drama.`;
  } else if (percentOfIncome <= 30 && monthsToSave <= 2) {
    verdict = "green"; emoji = "👍"; title = "G naman."; subtitle = "Kaya mo 'to.";
    message = `${daysOfWork.toFixed(1)} araw ng trabaho — ${percentOfIncome.toFixed(0)}% ng sahod mo. At ${monthsToSave === 1 ? "isang buwan" : `${monthsToSave} months`} lang ipon, mabibili mo na.`;
  } else if (percentOfIncome <= 30) {
    verdict = "green"; emoji = "🤙"; title = "G lang."; subtitle = "Basta may disiplina.";
    message = `${daysOfWork.toFixed(1)} araw ng trabaho. Kung itutuloy mo yung ₱${formatWithCommas(savings)}/mo na ipon, mga ${monthsToSave} months bago mo mabili 'to.`;
  } else if (percentOfIncome <= 60 && monthsToSave <= 3) {
    verdict = "yellow"; emoji = "🫠"; title = "Medyo mahal ah..."; subtitle = "Kaya mo, pero masasaktan ka.";
    message = `${daysOfWork.toFixed(0)} araw ng trabaho 'to — ${percentOfIncome.toFixed(0)}% ng sahod mo. Kailangan mo mag-ipon ng ${monthsToSave} months. Pag binili mo agad, ang luwag ng wallet mo... kasi wala na laman.`;
  } else if (percentOfIncome <= 60) {
    verdict = "yellow"; emoji = "🤨"; title = "Hmm, sure ka ba?"; subtitle = "Medyo matagal ang ipon.";
    message = `${daysOfWork.toFixed(0)} araw ng trabaho. Sa ₱${formatWithCommas(savings)}/mo na ipon mo, ${monthsToSave} months bago mo 'to mabili. Tiis-tiis muna.`;
  } else if (percentOfIncome <= 100) {
    verdict = "red"; emoji = "🚫"; title = "Huy, wag!"; subtitle = "'Di mo pa afford 'to, bes.";
    message = `${daysOfWork.toFixed(0)} araw ng trabaho — ${percentOfIncome.toFixed(0)}% ng sahod mo. Halos buong sweldo. ${monthsToSave <= 12 ? `Mag-ipon ka ng ${monthsToSave} months, mabibili mo rin.` : "Ang tagal pa ng ipon, pero kaya yan."}`;
  } else if (percentOfIncome <= 200) {
    verdict = "red"; emoji = "💀"; title = "Luh, grabe 'to."; subtitle = "Mas mahal pa sa sahod mo.";
    message = `${daysOfWork.toFixed(0)} araw ng trabaho. Kahit di ka kumain at di ka uminom, kulang pa rin. ${savings > 0 ? `Sa ₱${formatWithCommas(savings)}/mo, mga ${monthsToSave} months pa 'to.` : "Mag-ipon ka muna, promise worth it."}`;
  } else {
    verdict = "red"; emoji = "🪦"; title = "Pre, ano ba 'to."; subtitle = "Ilang buwan na sahod mo 'to.";
    message = `${Math.ceil(percentOfIncome / 100)} months na sahod mo 'to. ${daysOfWork.toFixed(0)} araw ng trabaho. ${savings > 0 ? `Kakailanganin mo ng ${monthsToSave} months na ipon.` : "Wala ka pang naipon. Simula muna tayo doon."} Breathe ka muna.`;
  }

  return { verdict, daysOfWork, percentOfIncome, monthsToSave, emoji, title, subtitle, message };
}

function VerdictCard({ result, onTryAgain }: { result: VerdictResult; onTryAgain: () => void }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 80);
    return () => clearTimeout(t);
  }, []);

  const bg = result.verdict === "green" ? "#00c853" : result.verdict === "yellow" ? "#FFB300" : "#D32F2F";
  const textColor = result.verdict === "yellow" ? "#1a1a1a" : "#fff";
  const subColor = result.verdict === "yellow" ? "rgba(26,26,26,0.5)" : "rgba(255,255,255,0.6)";
  const dividerColor = result.verdict === "yellow" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)";
  const btnBg = result.verdict === "yellow" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.15)";
  const btnHover = result.verdict === "yellow" ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.25)";

  return (
    <div className="flex flex-col items-center justify-center text-center px-6" style={{ perspective: "800px" }}>
      <div
        className="rounded-3xl px-6 py-10 sm:px-10 sm:py-12 w-full max-w-[520px] transition-all duration-500"
        style={{
          background: bg, color: textColor,
          transform: show ? "scale(1) rotateX(0deg)" : "scale(0.85) rotateX(-12deg)",
          opacity: show ? 1 : 0,
        }}
      >
        {/* Emoji */}
        <p className="text-[100px] sm:text-[120px] leading-none mb-2" style={{
          transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
          transform: show ? "scale(1)" : "scale(0.2)",
        }}>{result.emoji}</p>

        {/* Title */}
        <p className="text-4xl sm:text-6xl font-black tracking-tight leading-none mb-2" style={{
          transition: "transform 0.5s 0.1s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s 0.1s",
          transform: show ? "translateY(0)" : "translateY(30px)", opacity: show ? 1 : 0,
        }}>{result.title}</p>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl font-semibold mb-6" style={{
          color: subColor, transition: "opacity 0.4s 0.2s", opacity: show ? 1 : 0,
        }}>{result.subtitle}</p>

        {/* Message */}
        <p className="text-[14px] sm:text-[15px] leading-relaxed max-w-sm mx-auto mb-8" style={{
          color: subColor, transition: "opacity 0.4s 0.3s", opacity: show ? 1 : 0,
        }}>{result.message}</p>

        {/* Stats */}
        <div className="flex justify-center gap-5 sm:gap-8 mb-8" style={{
          transition: "opacity 0.4s 0.35s, transform 0.4s 0.35s",
          opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(10px)",
        }}>
          <div>
            <p className="text-3xl sm:text-4xl font-black">{result.daysOfWork.toFixed(1)}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: subColor }}>araw ng trabaho</p>
          </div>
          <div style={{ width: 1, background: dividerColor, alignSelf: "stretch" }} />
          <div>
            <p className="text-3xl sm:text-4xl font-black">{result.percentOfIncome.toFixed(0)}%</p>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: subColor }}>ng sahod</p>
          </div>
          <div style={{ width: 1, background: dividerColor, alignSelf: "stretch" }} />
          <div>
            <p className="text-3xl sm:text-4xl font-black">{result.monthsToSave >= 999 ? "—" : result.monthsToSave}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: subColor }}>months ipon</p>
          </div>
        </div>

        {/* Try again button */}
        <button
          onClick={onTryAgain}
          className="px-8 py-3 rounded-full text-sm font-bold transition-colors"
          style={{
            background: btnBg, color: textColor,
            transition: "opacity 0.4s 0.45s, background 0.2s",
            opacity: show ? 1 : 0,
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = btnHover}
          onMouseLeave={(e) => e.currentTarget.style.background = btnBg}
        >
          Try again ↻
        </button>
      </div>
    </div>
  );
}

export default function AffordCalculatorPage() {
  const [income, setIncome] = useState(0);
  const [price, setPrice] = useState(0);
  const [savings, setSavings] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const isReady = income > 0 && price > 0 && savings > 0;
  const result = useMemo(
    () => isReady ? getVerdict(income, price, savings) : null,
    [income, price, savings, isReady]
  );

  const incomePercent = (income / 200000) * 100;
  const pricePercent = (price / 500000) * 100;
  const savingsPercent = (savings / (income || 1)) * 100;

  function handleReveal() {
    if (isReady) setRevealed(true);
  }

  function handleTryAgain() {
    setRevealed(false);
    setIncome(0);
    setPrice(0);
    setSavings(0);
  }

  return (
    <div className="min-h-screen bg-[#00c853] flex flex-col">
      <style>{`
        input[type="range"] {
          -webkit-appearance: none; appearance: none;
          width: 100%; height: 6px; border-radius: 999px; outline: none; cursor: pointer;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 28px; height: 28px; border-radius: 50%; background: #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: grab;
        }
        input[type="range"]::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.15); }
        input[type="range"]::-moz-range-thumb {
          width: 28px; height: 28px; border-radius: 50%; background: #fff;
          border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: grab;
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(255,255,255,0); }
        }
      `}</style>

      {/* Nav */}
      <nav className="flex justify-between items-center px-4 sm:px-6 py-4 max-w-[520px] mx-auto w-full">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-white no-underline">
          alkansya<span className="text-white/60">.ph</span>
        </Link>
        <NavMenu dark />
      </nav>

      {/* Content */}
      <main className="flex-1 flex flex-col justify-center max-w-[520px] mx-auto px-6 sm:px-8 w-full pb-8">

        {!revealed ? (
          <>
            {/* Title */}
            <div className="text-center mb-10">
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none mb-2">
                Afford ko ba &apos;to?
              </h1>
              <p className="text-sm text-white/60">Alamin bago bilhin.</p>
            </div>

            {/* 3 Sliders */}
            <div className="space-y-7 mb-10">
              {/* Sahod */}
              <div className="text-center">
                <p className="text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Sahod mo per month</p>
                <p className="text-3xl sm:text-4xl font-black text-white mb-3">
                  {income === 0 ? <span className="text-white/30">₱—</span> : formatPeso(income)}
                </p>
                <input
                  type="range" min="0" max="200000" step="500" value={income}
                  onChange={(e) => setIncome(Number(e.target.value))}
                  style={{ background: `linear-gradient(to right, #fff 0%, #fff ${incomePercent}%, rgba(0,0,0,0.12) ${incomePercent}%, rgba(0,0,0,0.12) 100%)` }}
                />
                <div className="flex justify-between mt-1 px-0.5">
                  <span className="text-[10px] text-white/40">₱0</span>
                  <span className="text-[10px] text-white/40">₱200k</span>
                </div>
              </div>

              {/* Presyo */}
              <div className="text-center">
                <p className="text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Presyo ng gusto mo</p>
                <p className="text-3xl sm:text-4xl font-black text-white mb-3">
                  {price === 0 ? <span className="text-white/30">₱—</span> : formatPeso(price)}
                </p>
                <input
                  type="range" min="0" max="500000" step="250" value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  style={{ background: `linear-gradient(to right, #fff 0%, #fff ${pricePercent}%, rgba(0,0,0,0.12) ${pricePercent}%, rgba(0,0,0,0.12) 100%)` }}
                />
                <div className="flex justify-between mt-1 px-0.5">
                  <span className="text-[10px] text-white/40">₱0</span>
                  <span className="text-[10px] text-white/40">₱500k</span>
                </div>
              </div>

              {/* Natitipid */}
              <div className="text-center">
                <p className="text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Natitipid mo kada buwan</p>
                <p className="text-3xl sm:text-4xl font-black text-white mb-3">
                  {savings === 0 ? <span className="text-white/30">₱—</span> : formatPeso(savings)}
                </p>
                <input
                  type="range" min="0" max={income || 100000} step="500" value={savings}
                  onChange={(e) => setSavings(Math.min(Number(e.target.value), income || 100000))}
                  style={{ background: `linear-gradient(to right, #fff 0%, #fff ${savingsPercent}%, rgba(0,0,0,0.12) ${savingsPercent}%, rgba(0,0,0,0.12) 100%)` }}
                />
                <div className="flex justify-between mt-1 px-0.5">
                  <span className="text-[10px] text-white/40">₱0</span>
                  <span className="text-[10px] text-white/40">{income > 0 ? formatPeso(income) : "—"}</span>
                </div>
              </div>
            </div>

            {/* Reveal button */}
            <div className="text-center">
              <button
                onClick={handleReveal}
                disabled={!isReady}
                className={`px-10 py-4 rounded-full text-lg font-black tracking-tight transition-all ${
                  isReady
                    ? "bg-white text-[#00c853] hover:scale-105 active:scale-95"
                    : "bg-white/20 text-white/40 cursor-not-allowed"
                }`}
                style={isReady ? { animation: "pulse-glow 2s ease infinite" } : undefined}
              >
                Afford ko ba &apos;to?
              </button>
              {!isReady && (
                <p className="text-xs text-white/40 mt-3">Set all 3 sliders to continue</p>
              )}
            </div>
          </>
        ) : result ? (
          <VerdictCard result={result} onTryAgain={handleTryAgain} />
        ) : null}

        {/* Footer */}
        <footer className="mt-10 text-center">
          <p className="text-[10px] text-white/30 leading-relaxed">
            Guide lang &apos;to, hindi financial advice. Mag-isip muna bago bumili.
          </p>
        </footer>
      </main>
    </div>
  );
}
