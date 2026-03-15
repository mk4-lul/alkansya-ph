"use client";

import { useState, useMemo, useEffect } from "react";
import { BankWithRates, flagRate } from "@/lib/supabase";
import {
  formatPeso,
  formatPesoShort,
  calcInterest,
  timeAgo,
  getRateForAmount,
  getTdRateForAmount,
  getUniqueTdTerms,
  getBestTdRate,
  formatRateRange,
  TERM_LABELS,
} from "@/lib/utils";

function FlagButton({ bankId }: { bankId: string }) {
  const [flagged, setFlagged] = useState(false);
  if (flagged) return <span className="text-[11px] text-[#00c853] font-medium">Flagged</span>;
  return (
    <button onClick={(e) => { e.stopPropagation(); flagRate(bankId); setFlagged(true); }}
      className="text-[11px] text-[#888] hover:text-[#1a1a1a] transition-colors"
      title="Flag this rate as outdated">
      Flag
    </button>
  );
}

function BankRow({
  bank,
  depositType,
  amount,
  isHighlighted,
}: {
  bank: BankWithRates;
  depositType: "savings" | "time_deposit";
  amount: number;
  isHighlighted: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (isHighlighted) setExpanded(true);
  }, [isHighlighted]);

  const displayRate = depositType === "savings"
    ? getRateForAmount(bank.savings_tiers, amount)
    : amount > 0
      ? getBestTdRate(bank.time_deposit_rates, amount)
      : bank.time_deposit_rates.length > 0 ? Math.max(...bank.time_deposit_rates.map(r => r.rate)) : 0;

  const earnings = calcInterest(amount, displayRate);
  const hasRange = bank.savings_min_rate !== bank.savings_rate;
  const rateText = depositType === "savings" && hasRange && amount === 0
    ? formatRateRange(bank.savings_min_rate, bank.savings_rate) : `${displayRate}%`;

  const isHigh = displayRate >= 2;
  const isMid = displayRate >= 0.5;
  const rateColor = isHigh ? "text-[#00c853]" : isMid ? "text-[#1a1a1a]" : "text-[#888]";

  const sourceUrl = depositType === "time_deposit" && bank.td_source_url ? bank.td_source_url : bank.source_url;

  return (
    <div
      id={`bank-${bank.id}`}
      className={`bg-white rounded-2xl overflow-hidden transition-all ${isHighlighted ? "animate-bank-highlight ring-2 ring-[#00c853]" : ""}`}>
      {/* Row */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#fafafa] transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center text-lg shrink-0">{bank.logo}</div>
          <div>
            <p className="text-sm font-bold text-[#1a1a1a]">{bank.name}</p>
            <p className="text-[11px] text-[#888]">{bank.type === "digital" ? "Digital" : "Traditional"}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-xl sm:text-2xl font-extrabold tracking-tight ${rateColor}`}>{rateText}</p>
          {amount > 0 && <p className="text-[11px] text-[#888] font-medium">{formatPeso(earnings)}/yr</p>}
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-5 pb-5 animate-fade-in">
          {/* Savings products */}
          {depositType === "savings" && bank.savings_products.length > 0 && (
            <div className="mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-2">
                {bank.savings_products.length > 1 ? "Savings products" : "Savings rate"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {bank.savings_products.map((product, pi) => (
                  <div key={pi} className="bg-[#f5f5f5] rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 flex items-center justify-between">
                      <p className="text-[13px] font-bold text-[#1a1a1a]">{product.name}</p>
                      <p className={`text-sm font-extrabold ${
                        product.best_rate >= 2 ? "text-[#00c853]" : product.best_rate >= 0.5 ? "text-[#1a1a1a]" : "text-[#888]"
                      }`}>
                        {product.min_rate === product.best_rate ? `${product.best_rate}%` : `${product.min_rate}%–${product.best_rate}%`}
                      </p>
                    </div>
                    <div className="px-4 pb-2.5">
                      {product.tiers.map((tier, ti) => {
                        const tierLabel = tier.max_deposit
                          ? `${formatPesoShort(tier.min_deposit)} – ${formatPesoShort(tier.max_deposit)}`
                          : tier.min_deposit > 0 ? `${formatPesoShort(tier.min_deposit)}+` : "Any amount";
                        const tierEarnings = calcInterest(Math.max(amount, tier.min_deposit), tier.rate);
                        const isActive = amount > 0 && amount >= tier.min_deposit && (tier.max_deposit === null || amount <= tier.max_deposit);

                        return (
                          <div key={ti} className={`flex items-center justify-between py-1.5 ${
                            ti > 0 ? "border-t border-black/5" : ""
                          } ${isActive ? "text-[#1a1a1a]" : "text-[#888]"}`}>
                            <div className="flex items-center gap-2">
                              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#00c853]" />}
                              <span className="text-[11px]">{tierLabel}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-sm font-bold ${
                                tier.rate >= 2 ? "text-[#00c853]" : tier.rate >= 0.5 ? "text-[#1a1a1a]" : "text-[#888]"
                              }`}>{tier.rate}%</span>
                              {amount > 0 && <span className="text-[10px] text-[#888] w-[5rem] text-right">{formatPeso(tierEarnings)}/yr</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time deposit terms */}
          {depositType === "time_deposit" && bank.time_deposit_rates.length > 0 && (
            <div className="mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-2">Time deposit terms</p>
              <div className="flex flex-wrap gap-2">
                {getUniqueTdTerms(bank.time_deposit_rates).map((term) => {
                  const rate = amount > 0 ? getTdRateForAmount(bank.time_deposit_rates, term, amount) : bank.time_deposit_rates.find(r => r.term_days === term)?.rate || 0;
                  return (
                    <div key={term} className="bg-[#f5f5f5] rounded-xl px-4 py-3 text-center min-w-[80px]">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#888]">{TERM_LABELS[term] || `${term}d`}</p>
                      <p className={`text-lg font-extrabold mt-0.5 ${rate >= 2 ? "text-[#00c853]" : "text-[#1a1a1a]"}`}>{rate}%</p>
                      {amount > 0 && <p className="text-[10px] text-[#888]">{formatPeso(calcInterest(amount, rate, term))}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {depositType === "time_deposit" && bank.time_deposit_rates.length === 0 && (
            <div className="bg-[#f5f5f5] rounded-xl px-4 py-3 mb-4 max-w-sm">
              <p className="text-sm text-[#888]">{bank.name} doesn&apos;t offer time deposit products.</p>
            </div>
          )}

          {/* Footer: verified + source + flag */}
          <div className="flex items-center gap-3 flex-wrap text-[11px] text-[#888]">
            <span>
              Verified {timeAgo(bank.last_verified)} · {sourceUrl ? (
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer"
                  className="underline hover:text-[#1a1a1a]" onClick={(e) => e.stopPropagation()}>source</a>
              ) : "manual"}
            </span>
            <FlagButton bankId={bank.id} />
            {bank.has_promo && bank.promo_terms && (
              <span className="px-2 py-0.5 bg-red-50 text-red-500 rounded-full text-[10px] font-medium">*{bank.promo_terms}</span>
            )}
            {bank.notes && <span className="text-[#aaa]">{bank.notes}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RateTable({
  banks,
  amount,
  highlightBankId,
  onHighlightDone,
}: {
  banks: BankWithRates[];
  amount: number;
  highlightBankId: string | null;
  onHighlightDone: () => void;
}) {
  const [depositType, setDepositType] = useState<"savings" | "time_deposit">("savings");
  const [bankType, setBankType] = useState<"all" | "traditional" | "digital">("all");
  const [showTdInfo, setShowTdInfo] = useState(false);

  const filtered = useMemo(() => {
    let list = [...banks];
    if (bankType !== "all") list = list.filter((b) => b.type === bankType);
    list.sort((a, b) => {
      const rateA = depositType === "savings"
        ? getRateForAmount(a.savings_tiers, amount)
        : getBestTdRate(a.time_deposit_rates, amount);
      const rateB = depositType === "savings"
        ? getRateForAmount(b.savings_tiers, amount)
        : getBestTdRate(b.time_deposit_rates, amount);
      return rateB - rateA;
    });
    return list;
  }, [banks, depositType, bankType, amount]);

  return (
    <div>
      {/* Tabs + Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="flex bg-white rounded-full p-1">
          <button onClick={() => setDepositType("savings")}
            className={`px-4 py-2 rounded-full text-[12px] font-semibold transition-all ${
              depositType === "savings" ? "bg-[#1a1a1a] text-white" : "text-[#888] hover:text-[#1a1a1a]"
            }`}>Savings</button>
          <button onClick={() => setDepositType("time_deposit")}
            className={`px-4 py-2 rounded-full text-[12px] font-semibold transition-all ${
              depositType === "time_deposit" ? "bg-[#1a1a1a] text-white" : "text-[#888] hover:text-[#1a1a1a]"
            }`}>
            Time deposit
            <span onClick={(e) => { e.stopPropagation(); setShowTdInfo(true); }}
              className="inline-flex items-center justify-center w-4 h-4 ml-1 rounded-full border border-current text-[9px] opacity-40 hover:opacity-100 transition-opacity"
              title="What is a time deposit?">i</span>
          </button>
        </div>
        <div className="flex bg-white rounded-full p-1">
          {([["all", "All"], ["digital", "Digital"], ["traditional", "Trad."]] as const).map(([val, label]) => (
            <button key={val} onClick={() => setBankType(val as "all" | "traditional" | "digital")}
              className={`px-3 py-2 rounded-full text-[12px] font-semibold transition-all ${
                bankType === val ? "bg-[#1a1a1a] text-white" : "text-[#888] hover:text-[#1a1a1a]"
              }`}>{label}</button>
          ))}
        </div>
      </div>

      {/* Bank list */}
      <div className="space-y-2">
        {filtered.map((bank) => (
          <BankRow
            key={bank.id}
            bank={bank}
            depositType={depositType}
            amount={amount}
            isHighlighted={highlightBankId === bank.id}
          />
        ))}
        {filtered.length === 0 && <p className="text-center py-8 text-sm text-[#888]">No banks match your filters</p>}
      </div>

      {/* TD Info Modal */}
      {showTdInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setShowTdInfo(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowTdInfo(false)}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#f5f5f5] text-[#888] hover:text-[#1a1a1a] transition-colors text-lg">
              &times;
            </button>
            <p className="text-base font-bold text-[#1a1a1a] mb-2">What is a time deposit?</p>
            <p className="text-sm text-[#888] leading-relaxed">
              A time deposit is a safe, fixed-term savings account where your money is locked in for a specific period in exchange for a higher interest rate than regular savings.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
