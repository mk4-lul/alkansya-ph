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

  const cardAnimations = ["animate-card-pop-1", "animate-card-pop-2", "animate-card-pop-3"];

  return (
    <div className="bg-[#00c853] rounded-[20px] p-6 sm:p-8 relative overflow-hidden">
      {/* Scattered money emojis */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
        {['💵','💰','🪙','💸','₱','💎','🤑','💵','💰','🪙','💸','₱','💎','🤑','💵','💰','🪙','💸','₱','💎','🤑','💵','💰','🪙','💸','₱','💎','🤑','💵','💰','🪙','💸','₱','💎','🤑','💵','💰','🪙','💸','₱'].map((e, i) => (
          <span key={i} className="absolute text-[22px] sm:text-[28px]" style={{
            left: `${(i * 17.3 + i * i * 3.7) % 100}%`,
            top: `${(i * 13.1 + i * i * 2.3) % 100}%`,
            opacity: 0.75,
            transform: `rotate(${(i * 37) % 360}deg)`,
          }}>{e}</span>
        ))}
      </div>
      <div className="relative">
      <p className="text-center text-lg font-bold text-white/80 mb-4">How much are you saving?</p>

      {/* Amount pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-2">
        {AMOUNT_BRACKETS.map((a) => {
          const isGold = a.value >= 1000000;
          const isActive = amount === a.value;
          return (
            <button
              key={a.value}
              onClick={() => onAmountChange(a.value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                isActive
                  ? "bg-white text-[#00c853]"
                  : isGold
                    ? "bg-[#FFD600]/50 text-white hover:bg-[#FFD600]/70"
                    : "bg-white/20 text-white hover:bg-white/30"
              }`}>
              {a.label}
            </button>
          );
        })}
      </div>

      {/* Top 3 banks */}
      {hasAmount && top3.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[1px] text-white/60 mb-3 text-center">Best rates for you</p>
          <div key={amount} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {top3.map((bank, i) => {
              const rate = getRateForAmount(bank.savings_tiers, amount);
              const earnings = calcInterest(amount, rate);
              const isFirst = i === 0;

              return (
                <div
                  key={bank.id}
                  onClick={() => onBankClick(bank.id)}
                  className={`rounded-2xl px-5 py-4 cursor-pointer transition-all hover:scale-[1.02] ${cardAnimations[i]} ${
                    isFirst
                      ? "bg-white text-[#1a1a1a]"
                      : "bg-white/15 text-white"
                  }`}>
                  <p className={`text-sm font-bold`}>{bank.name}</p>
                  <p className="text-3xl font-extrabold tracking-tight mt-1">{rate}%</p>
                  <p className={`text-sm font-semibold mt-1 ${isFirst ? "text-[#888]" : "text-white/70"}`}>
                    <AnimatedNumber value={earnings} prefix="₱" suffix="/yr" />
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
