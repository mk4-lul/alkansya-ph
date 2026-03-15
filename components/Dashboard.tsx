"use client";

import { useState } from "react";
import { BankWithRates } from "@/lib/supabase";
import HeroCalculator from "@/components/HeroCalculator";
import RateTable from "@/components/RateTable";

export default function Dashboard({ banks, avgTraditional, avgDigital, multiplier }: {
  banks: BankWithRates[];
  avgTraditional: number;
  avgDigital: number;
  multiplier: number;
}) {
  const [amount, setAmount] = useState<number>(0);
  const [highlightBankId, setHighlightBankId] = useState<string | null>(null);

  const handleBankClick = (bankId: string) => {
    setHighlightBankId(null);
    // Small delay so React clears the old highlight before setting the new one
    setTimeout(() => {
      setHighlightBankId(bankId);
      const el = document.getElementById(`bank-${bankId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 50);
  };

  return (
    <>
      <div className="mb-8 sm:mb-12 animate-slide-up">
        <p className="font-display text-[10px] sm:text-[11px] uppercase tracking-[3px] text-[#c8940a] mb-2">
          Compare PH Bank Rates
        </p>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold leading-[1.1] mb-6 sm:mb-8 tracking-tight text-[#1a1a1a]">
          Saan mo ilalagay
          <br />
          ang <span className="text-[#c8940a]">pera</span> mo?
        </h1>
        <HeroCalculator banks={banks} amount={amount} onAmountChange={setAmount} onBankClick={handleBankClick} />
      </div>

      <div className="grid grid-cols-3 gap-px bg-[#e5e0d8] rounded-xl sm:rounded-2xl overflow-hidden mb-8 sm:mb-10 shadow-sm">
        {[
          { label: "Avg. Traditional", value: `${avgTraditional.toFixed(3)}%`, color: "text-[#6b6560]" },
          { label: "Avg. Digital", value: `${avgDigital.toFixed(1)}%`, color: "text-[#0a8f65]" },
          { label: "Difference", value: `${multiplier}×`, color: "text-[#c8940a]" },
        ].map((stat, i) => (
          <div key={i} className="bg-white py-3 sm:py-5 px-2 sm:px-6 text-center">
            <p className="font-display text-[7px] sm:text-[9px] uppercase tracking-[1px] sm:tracking-[2px] text-[#9a9490] mb-1">{stat.label}</p>
            <p className={`font-display text-lg sm:text-2xl md:text-3xl font-extrabold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <RateTable banks={banks} amount={amount} highlightBankId={highlightBankId} onHighlightDone={() => setHighlightBankId(null)} />
    </>
  );
}
