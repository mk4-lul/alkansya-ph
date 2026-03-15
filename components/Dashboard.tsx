"use client";

import { useState } from "react";
import { BankWithRates } from "@/lib/supabase";
import HeroCalculator from "./HeroCalculator";
import RateTable from "./RateTable";

export default function Dashboard({
  banks,
}: {
  banks: BankWithRates[];
  avgTraditional: number;
  avgDigital: number;
  multiplier: number;
}) {
  const [amount, setAmount] = useState(0);
  const [highlightBankId, setHighlightBankId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <HeroCalculator
        banks={banks}
        amount={amount}
        onAmountChange={setAmount}
        onBankClick={(bankId) => {
          setHighlightBankId(bankId);
          setTimeout(() => setHighlightBankId(null), 2000);
          document.getElementById(`bank-${bankId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }}
      />
      <RateTable banks={banks} amount={amount} highlightBankId={highlightBankId} onHighlightDone={() => setHighlightBankId(null)} />
    </div>
  );
}
