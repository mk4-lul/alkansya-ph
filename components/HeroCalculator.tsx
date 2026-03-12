"use client";

import { useState, useEffect, useRef } from "react";
import { BankWithRates } from "@/lib/supabase";
import { formatPeso, calcInterest, getRateForAmount, AMOUNT_BRACKETS } from "@/lib/utils";

function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    const duration = 800;

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * value);
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    }

    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [value]);

  return (
    <span>
      {prefix}
      {display.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
      {suffix}
    </span>
  );
}

export default function HeroCalculator({
  banks,
}: {
  banks: BankWithRates[];
}) {
  const tradBanks = banks.filter((b) => b.type === "traditional");
  const digiBanks = banks.filter((b) => b.type === "digital");

  const [fromBankId, setFromBankId] = useState(tradBanks[0]?.id || "bdo");
  const [amount, setAmount] = useState(100000);

  const fromBank = banks.find((b) => b.id === fromBankId);

  const bestDigi = [...digiBanks].sort((a, b) => {
    const rateA = getRateForAmount(a.savings_tiers, amount);
    const rateB = getRateForAmount(b.savings_tiers, amount);
    return rateB - rateA;
  })[0];

  if (!fromBank || !bestDigi) return null;

  const fromRate = getRateForAmount(fromBank.savings_tiers, amount);
  const bestRate = getRateForAmount(bestDigi.savings_tiers, amount);
  const currentEarnings = calcInterest(amount, fromRate);
  const bestEarnings = calcInterest(amount, bestRate);
  const diff = bestEarnings - currentEarnings;

  return (
    <div className="relative overflow-hidden rounded-3xl p-8 md:p-10"
      style={{ background: "linear-gradient(135deg, #1a2332 0%, #243447 40%, #2d4a5e 100%)" }}>
      {/* Decorative glows */}
      <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(200,148,10,0.15) 0%, transparent 70%)" }} />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(10,143,101,0.1) 0%, transparent 70%)" }} />

      <div className="relative z-10">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-amber-400 mb-2">
          Opportunity Cost Calculator
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-7 leading-tight">
          How much are you{" "}
          <span className="text-amber-400">leaving on the table</span>?
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[2px] text-white/50 mb-1.5">
              Your Current Bank
            </label>
            <select
              value={fromBankId}
              onChange={(e) => setFromBankId(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-white/15 bg-white/10 text-white font-display text-sm cursor-pointer"
            >
              {tradBanks.map((b) => (
                <option key={b.id} value={b.id} style={{ background: "#243447" }}>
                  {b.name} ({getRateForAmount(b.savings_tiers, amount)}%)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[2px] text-white/50 mb-1.5">
              Deposit Amount
            </label>
            <select
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3.5 py-3 rounded-xl border border-white/15 bg-white/10 text-white font-display text-sm cursor-pointer"
            >
              {AMOUNT_BRACKETS.map((a) => (
                <option key={a.value} value={a.value} style={{ background: "#243447" }}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results card */}
        <div className="rounded-2xl p-6 border"
          style={{ background: "rgba(0,0,0,0.2)", borderColor: "rgba(255,195,0,0.15)" }}>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center mb-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[2px] text-white/40 mb-1">
                {fromBank.name} ({fromRate}%)
              </p>
              <p className="font-display text-xl md:text-2xl font-bold text-white/50">
                <AnimatedNumber value={currentEarnings} prefix="₱" />
              </p>
              <p className="font-mono text-[10px] text-white/30">per year</p>
            </div>
            <div className="text-2xl text-white/20">→</div>
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-[2px] text-emerald-400 mb-1">
                {bestDigi.name} ({bestRate}%)
              </p>
              <p className="font-display text-xl md:text-2xl font-bold text-emerald-400">
                <AnimatedNumber value={bestEarnings} prefix="₱" />
              </p>
              <p className="font-mono text-[10px] text-white/30">per year</p>
            </div>
          </div>

          <div className="rounded-xl px-5 py-4 border-l-[3px] border-l-amber-400"
            style={{ background: "linear-gradient(90deg, rgba(200,148,10,0.15), rgba(200,148,10,0.03))" }}>
            <p className="font-display text-sm text-white/70">
              You&apos;re missing out on
            </p>
            <p className="font-display text-3xl md:text-4xl font-extrabold text-amber-400 mt-1">
              <AnimatedNumber value={diff} prefix="₱" suffix="/year" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
