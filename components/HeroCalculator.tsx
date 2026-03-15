"use client";

import { useState, useEffect, useRef } from "react";
import { BankWithRates } from "@/lib/supabase";
import { formatPeso, calcInterest, getRateForAmount, AMOUNT_BRACKETS } from "@/lib/utils";

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(value);
  const prevValue = useRef(value);
  const raf = useRef<number>(0);

  useEffect(() => {
    const from = prevValue.current;
    const to = value;
    prevValue.current = value;
    if (from === to) { setDisplay(to); return; }
    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / 600, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  return (
    <span>
      {prefix}{display.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{suffix}
    </span>
  );
}

function MoneyPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="money-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <circle cx="30" cy="30" r="18" fill="none" stroke="#c8940a" strokeWidth="0.5" />
          <circle cx="30" cy="30" r="12" fill="none" stroke="#c8940a" strokeWidth="0.3" />
          <text x="30" y="34" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#c8940a">₱</text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#money-grid)" />
    </svg>
  );
}

export default function HeroCalculator({
  banks,
  amount,
  onAmountChange,
  onBankClick,
}: {
  banks: BankWithRates[];
  amount: number;
  onAmountChange: (amount: number) => void;
  onBankClick: (bankId: string) => void;
}) {
  const hasAmount = amount > 0;

  const top3 = hasAmount
    ? [...banks]
        .sort((a, b) => getRateForAmount(b.savings_tiers, amount) - getRateForAmount(a.savings_tiers, amount))
        .slice(0, 3)
    : [];

  const medals = ["🥇", "🥈", "🥉"];
  const rateColors = ["text-amber-400", "text-white/80", "text-white/60"];
  const earningsColors = ["text-emerald-300", "text-emerald-300/80", "text-emerald-300/60"];
  const cardAnimations = ["animate-card-pop-1", "animate-card-pop-2", "animate-card-pop-3"];

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl"
      style={{ background: "linear-gradient(135deg, #0f2419 0%, #14332a 40%, #1a4035 100%)" }}>

      {/* Money pattern background */}
      <MoneyPattern />

      {/* Decorative glows */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(200,148,10,0.12) 0%, transparent 70%)" }} />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(10,143,101,0.1) 0%, transparent 70%)" }} />

      <div className={`relative z-10 p-5 sm:p-8 md:p-10 ${!hasAmount ? "flex flex-col items-center justify-center min-h-[140px] sm:min-h-[160px]" : ""}`}>

        {/* Centered state — no amount selected */}
        {!hasAmount && (
          <div className="text-center">
            <p className="font-display text-sm sm:text-base text-white/50 mb-3">How much are you saving?</p>
            <select value={amount} onChange={(e) => onAmountChange(Number(e.target.value))}
              className="px-5 py-3 sm:py-3.5 rounded-xl border-2 border-amber-400/30 bg-white/10 font-display text-base sm:text-lg font-semibold cursor-pointer hover:border-amber-400/50 transition-colors text-amber-400/70 min-w-[240px]">
              <option value={0} style={{ background: "#14332a" }}>Select deposit amount</option>
              {AMOUNT_BRACKETS.map((a) => (
                <option key={a.value} value={a.value} style={{ background: "#14332a" }}>{a.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Active state — amount selected, show dropdown + results */}
        {hasAmount && (
          <>
            <div className="mb-5 sm:mb-6 max-w-xs">
              <select value={amount} onChange={(e) => onAmountChange(Number(e.target.value))}
                className="w-full px-4 py-3 sm:py-3.5 rounded-xl border-2 border-amber-400/30 bg-white/10 font-display text-base sm:text-lg font-semibold cursor-pointer hover:border-amber-400/50 transition-colors text-white">
                {AMOUNT_BRACKETS.map((a) => (
                  <option key={a.value} value={a.value} style={{ background: "#14332a" }}>{a.label}</option>
                ))}
              </select>
            </div>

            {top3.length > 0 && (
              <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 border" style={{ background: "rgba(0,0,0,0.2)", borderColor: "rgba(200,148,10,0.15)" }}>
                <p className="font-display text-[11px] uppercase tracking-[2px] text-white/40 mb-4">Best rates for your amount</p>
                <div key={amount} className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {top3.map((bank, i) => {
                    const rate = getRateForAmount(bank.savings_tiers, amount);
                    const earnings = calcInterest(amount, rate);
                    const isFirst = i === 0;

                    return (
                      <div key={bank.id}
                        onClick={() => onBankClick(bank.id)}
                        className={`rounded-xl px-4 py-3.5 sm:py-4 border cursor-pointer transition-all duration-200 hover:scale-[1.02] ${cardAnimations[i]} ${
                          isFirst
                            ? "border-amber-400/30 bg-amber-400/[0.08] hover:border-amber-400/50"
                            : "border-white/10 bg-white/[0.03] hover:border-white/25"
                        }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-base">{medals[i]}</span>
                          <p className="font-display text-sm font-semibold text-white">{bank.name}</p>
                        </div>
                        <p className={`font-display text-2xl sm:text-3xl font-extrabold ${rateColors[i]}`}>{rate}%</p>
                        <p className={`font-display text-sm font-bold mt-1 ${earningsColors[i]}`}>
                          <AnimatedNumber value={earnings} prefix="₱" suffix="/yr" />
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
