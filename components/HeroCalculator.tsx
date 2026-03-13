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

export default function HeroCalculator({
  banks,
  amount,
  onAmountChange,
}: {
  banks: BankWithRates[];
  amount: number;
  onAmountChange: (amount: number) => void;
}) {
  const top3 = [...banks]
    .sort((a, b) => getRateForAmount(b.savings_tiers, amount) - getRateForAmount(a.savings_tiers, amount))
    .slice(0, 3);

  if (top3.length === 0) return null;

  const medals = ["🥇", "🥈", "🥉"];
  const rateColors = ["text-amber-400", "text-white/80", "text-white/60"];
  const earningsColors = ["text-emerald-400", "text-emerald-400/80", "text-emerald-400/60"];

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10"
      style={{ background: "linear-gradient(135deg, #1a2332 0%, #243447 40%, #2d4a5e 100%)" }}>
      <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(200,148,10,0.15) 0%, transparent 70%)" }} />

      <div className="relative z-10">
        <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[3px] text-amber-400 mb-5 sm:mb-6">
          Opportunity Cost Calculator
        </p>

        {/* Deposit amount input */}
        <div className="mb-5 sm:mb-6 max-w-xs">
          <label className="block font-mono text-[10px] uppercase tracking-[2px] text-white/50 mb-1.5">Deposit Amount</label>
          <select value={amount} onChange={(e) => onAmountChange(Number(e.target.value))}
            className="w-full px-3 py-2.5 sm:py-3 rounded-xl border border-white/15 bg-white/10 text-white font-display text-sm cursor-pointer">
            {AMOUNT_BRACKETS.map((a) => (
              <option key={a.value} value={a.value} style={{ background: "#243447" }}>{a.label}</option>
            ))}
          </select>
        </div>

        {/* Top 3 banks */}
        <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 border" style={{ background: "rgba(0,0,0,0.2)", borderColor: "rgba(255,195,0,0.15)" }}>
          <p className="font-mono text-[9px] uppercase tracking-[2px] text-white/40 mb-4">Best rates for your amount</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {top3.map((bank, i) => {
              const rate = getRateForAmount(bank.savings_tiers, amount);
              const earnings = calcInterest(amount, rate);
              const isFirst = i === 0;

              return (
                <div key={bank.id} className={`rounded-xl px-4 py-3.5 sm:py-4 border ${
                  isFirst
                    ? "border-amber-400/30 bg-amber-400/[0.08]"
                    : "border-white/10 bg-white/[0.03]"
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
      </div>
    </div>
  );
}
