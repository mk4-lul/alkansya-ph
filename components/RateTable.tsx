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
  if (flagged) return <span className="font-mono text-[10px] text-[#c8940a]">✓ Flagged</span>;
  return (
    <button onClick={(e) => { e.stopPropagation(); flagRate(bankId); setFlagged(true); }}
      className="border border-[#e5e0d8] rounded-md px-2 py-0.5 font-mono text-[10px] text-[#9a9490] hover:text-[#1a1a1a] hover:border-[#9a9490] transition-colors"
      title="Flag this rate as outdated">
      ⚑ Flag
    </button>
  );
}

function BankRow({ bank, depositType, amount, highlight }: {
  bank: BankWithRates;
  depositType: "savings" | "time_deposit";
  amount: number;
  highlight: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (highlight) setExpanded(true);
  }, [highlight]);

  const displayRate = depositType === "savings"
    ? getRateForAmount(bank.savings_tiers, amount)
    : getBestTdRate(bank.time_deposit_rates, amount);

  const earnings = calcInterest(amount, displayRate);
  const isDigital = bank.type === "digital";
  const barWidth = Math.min((displayRate / 6) * 100, 100);
  const hasRange = bank.savings_min_rate !== bank.savings_rate;
  const rateRangeText = depositType === "savings" && hasRange
    ? formatRateRange(bank.savings_min_rate, bank.savings_rate) : `${displayRate}%`;

  const rateColor = displayRate >= 2 ? "text-[#0a8f65]" : displayRate >= 0.5 ? "text-[#c8940a]" : "text-[#9a9490]";
  const barBg = displayRate >= 2 ? "linear-gradient(90deg, #0a8f65, #0b7a57)"
    : displayRate >= 0.5 ? "linear-gradient(90deg, #c8940a, #b38308)" : "rgba(0,0,0,0.08)";

  const tdTerms = getUniqueTdTerms(bank.time_deposit_rates);
  const sourceUrl = depositType === "time_deposit" && bank.td_source_url ? bank.td_source_url : bank.source_url;

  return (
    <div id={`bank-${bank.id}`} className={`border-b border-[#e5e0d8] ${highlight ? "animate-bank-highlight" : ""}`}>
      {/* Desktop row */}
      <div onClick={() => setExpanded(!expanded)}
        className="hidden sm:grid items-center px-4 py-3.5 cursor-pointer hover:bg-[#f0ece6] transition-colors"
        style={{ gridTemplateColumns: "minmax(140px, 1.2fr) 180px 1fr 120px 40px" }}>
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{bank.logo}</span>
          <div>
            <p className="font-display text-sm font-semibold text-[#1a1a1a]">{bank.name}</p>
            <span className={`inline-block font-mono text-[9px] uppercase tracking-[1.5px] px-1.5 py-0.5 rounded mt-0.5 ${
              isDigital ? "bg-emerald-50 text-[#0a8f65]" : "bg-[#f0ece6] text-[#9a9490]"}`}>
              {isDigital ? "Digital" : "Traditional"}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-display text-lg font-extrabold whitespace-nowrap ${rateColor}`}>{rateRangeText}</p>
          {bank.has_promo && depositType === "savings" && (
            <span className="font-mono text-[9px] text-[#d94444]">up to {bank.promo_rate}%*</span>
          )}
        </div>
        <div className="px-4">
          <div className="h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
            <div className="h-full rounded-full rate-bar-fill" style={{ width: `${barWidth}%`, background: barBg }} />
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-[13px] text-[#3d3835]">{formatPeso(earnings)}</p>
          <p className="font-mono text-[9px] text-[#9a9490]">/year</p>
        </div>
        <div className={`text-center text-xs text-[#9a9490] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>▼</div>
      </div>

      {/* Mobile card */}
      <div onClick={() => setExpanded(!expanded)}
        className="sm:hidden px-4 py-3 cursor-pointer hover:bg-[#f0ece6] transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{bank.logo}</span>
            <div>
              <p className="font-display text-sm font-semibold text-[#1a1a1a]">{bank.name}</p>
              <span className={`inline-block font-mono text-[8px] uppercase tracking-[1.5px] px-1.5 py-0.5 rounded ${
                isDigital ? "bg-emerald-50 text-[#0a8f65]" : "bg-[#f0ece6] text-[#9a9490]"}`}>
                {isDigital ? "Digital" : "Traditional"}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className={`font-display text-lg font-extrabold whitespace-nowrap ${rateColor}`}>{rateRangeText}</p>
            {bank.has_promo && depositType === "savings" && (
              <span className="font-mono text-[8px] text-[#d94444]">up to {bank.promo_rate}%*</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
            <div className="h-full rounded-full rate-bar-fill" style={{ width: `${barWidth}%`, background: barBg }} />
          </div>
          <p className="font-mono text-[11px] text-[#3d3835] whitespace-nowrap">{formatPeso(earnings)}<span className="text-[#9a9490]">/yr</span></p>
          <span className={`text-[10px] text-[#9a9490] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>▼</span>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 sm:pl-14 animate-fade-in">
          {/* Savings products */}
          {depositType === "savings" && bank.savings_products.length > 0 && (
            <div className="mb-3">
              <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-[#9a9490] mb-2.5">
                {bank.savings_products.length > 1 ? "Savings Products" : "Savings Rate"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                {bank.savings_products.map((product, pi) => (
                  <div key={pi} className="bg-[#f6f4f0] rounded-xl border border-[#e5e0d8] overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-[#e5e0d8] flex items-center justify-between">
                      <p className="font-display text-sm font-semibold text-[#1a1a1a]">{product.name}</p>
                      <p className={`font-display text-[15px] font-bold ${
                        product.best_rate >= 2 ? "text-[#0a8f65]" : product.best_rate >= 0.5 ? "text-[#c8940a]" : "text-[#9a9490]"
                      }`}>
                        {product.min_rate === product.best_rate ? `${product.best_rate}%` : `${product.min_rate}%–${product.best_rate}%`}
                      </p>
                    </div>
                    <div className="px-4 py-2.5">
                      {product.tiers.map((tier, ti) => {
                        const tierLabel = tier.max_deposit
                          ? `${formatPesoShort(tier.min_deposit)} – ${formatPesoShort(tier.max_deposit)}`
                          : tier.min_deposit > 0 ? `${formatPesoShort(tier.min_deposit)}+` : "Any amount";
                        const tierEarnings = calcInterest(Math.max(amount, tier.min_deposit), tier.rate);
                        const isActive = amount >= tier.min_deposit && (tier.max_deposit === null || amount <= tier.max_deposit);

                        return (
                          <div key={ti} className={`flex items-center justify-between py-2 ${
                            ti > 0 ? "border-t border-[#e5e0d8]/50" : ""
                          } ${isActive ? "text-[#1a1a1a]" : "text-[#9a9490]"}`}>
                            <div className="flex items-center gap-2">
                              {isActive && <span className="w-2 h-2 rounded-full bg-[#c8940a]" />}
                              <span className="font-mono text-[11px]">{tierLabel}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`font-display text-base font-bold ${
                                tier.rate >= 2 ? "text-[#0a8f65]" : tier.rate >= 0.5 ? "text-[#c8940a]" : "text-[#9a9490]"
                              }`}>{tier.rate}%</span>
                              <span className="font-mono text-[10px] text-[#9a9490] w-[5.5rem] text-right">{formatPeso(tierEarnings)}/yr</span>
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

          {/* Time deposit */}
          {depositType === "time_deposit" && tdTerms.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 mb-3">
              {tdTerms.map((term) => {
                const rate = getTdRateForAmount(bank.time_deposit_rates, term, amount);
                return (
                  <div key={term} className="bg-[#f6f4f0] rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-[#e5e0d8]">
                    <p className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[1.5px] text-[#9a9490]">{TERM_LABELS[term] || `${term}d`}</p>
                    <p className={`font-display text-base sm:text-lg font-bold mt-0.5 ${rate >= 2 ? "text-[#0a8f65]" : "text-[#c8940a]"}`}>{rate}%</p>
                    <p className="font-mono text-[9px] sm:text-[10px] text-[#6b6560]">{formatPeso(calcInterest(amount, rate, term))}</p>
                  </div>
                );
              })}
            </div>
          )}

          {depositType === "time_deposit" && tdTerms.length === 0 && (
            <div className="bg-[#f6f4f0] rounded-xl border border-[#e5e0d8] px-4 py-3 mb-3">
              <p className="font-display text-sm text-[#9a9490]">{bank.name} doesn&apos;t offer time deposit products.</p>
            </div>
          )}

          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <span className="font-mono text-[9px] sm:text-[10px] text-[#9a9490]">
              Verified {timeAgo(bank.last_verified)} ·{" "}
              {sourceUrl ? (
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer"
                  className="underline hover:text-[#1a1a1a]" onClick={(e) => e.stopPropagation()}>source</a>
              ) : "manual"}
            </span>
            <FlagButton bankId={bank.id} />
            {bank.has_promo && bank.promo_terms && (
              <span className="font-mono text-[9px] sm:text-[10px] px-2 py-0.5 bg-red-50 text-[#d94444] rounded-md">*{bank.promo_terms}</span>
            )}
            {bank.notes && <span className="font-mono text-[9px] sm:text-[10px] text-[#b0aaa4]">{bank.notes}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RateTable({ banks, amount, highlightBankId, onHighlightDone }: {
  banks: BankWithRates[];
  amount: number;
  highlightBankId: string | null;
  onHighlightDone: () => void;
}) {
  const [depositType, setDepositType] = useState<"savings" | "time_deposit">("savings");
  const [bankType, setBankType] = useState<"all" | "traditional" | "digital">("all");
  const [showTdInfo, setShowTdInfo] = useState(false);

  useEffect(() => {
    if (highlightBankId) {
      const timer = setTimeout(() => onHighlightDone(), 2200);
      return () => clearTimeout(timer);
    }
  }, [highlightBankId, onHighlightDone]);

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

  const toggleBtn = (isActive: boolean) =>
    `px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border-none cursor-pointer font-display text-[12px] sm:text-[13px] font-semibold transition-all ${
      isActive ? "bg-[#c8940a]/10 text-[#c8940a]" : "bg-transparent text-[#6b6560] hover:text-[#1a1a1a]"
    }`;

  return (
    <div>
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="flex bg-white rounded-xl p-0.5 border border-[#e5e0d8]">
          <button onClick={() => setDepositType("savings")} className={toggleBtn(depositType === "savings")}>Savings</button>
          <button onClick={() => setDepositType("time_deposit")} className={toggleBtn(depositType === "time_deposit")}>
            Time Deposit
            <span onClick={(e) => { e.stopPropagation(); setShowTdInfo(true); }}
              className="inline-flex items-center justify-center w-4 h-4 ml-1 rounded-full border border-current text-[9px] font-mono opacity-50 hover:opacity-100 transition-opacity"
              title="What is a time deposit?">i</span>
          </button>
        </div>
        <div className="flex bg-white rounded-xl p-0.5 border border-[#e5e0d8]">
          {([["all", "All"], ["traditional", "Trad."], ["digital", "Digital"]] as const).map(([val, label]) => (
            <button key={val} onClick={() => setBankType(val as any)} className={toggleBtn(bankType === val)}>{label}</button>
          ))}
        </div>
      </div>

      <div className="hidden sm:grid px-4 py-2.5 border-b border-[#e5e0d8]"
        style={{ gridTemplateColumns: "minmax(140px, 1.2fr) 180px 1fr 120px 40px" }}>
        {["Bank", "Rate", "", "Earn / yr", ""].map((h, i) => (
          <p key={i} className={`m-0 font-mono text-[9px] uppercase tracking-[2px] text-[#9a9490] ${i === 1 || i === 3 ? "text-right" : ""}`}>{h}</p>
        ))}
      </div>

      <div className="bg-white rounded-2xl sm:rounded-b-2xl sm:rounded-t-none border border-[#e5e0d8] sm:border-t-0 overflow-hidden shadow-sm">
        {filtered.map((bank) => (
          <BankRow
            key={bank.id}
            bank={bank}
            depositType={depositType}
            amount={amount}
            highlight={highlightBankId === bank.id}
          />
        ))}
        {filtered.length === 0 && <p className="text-center py-8 font-mono text-sm text-[#9a9490]">No banks match your filters</p>}
      </div>

      {showTdInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setShowTdInfo(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowTdInfo(false)}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#f0ece6] text-[#9a9490] hover:text-[#1a1a1a] transition-colors text-lg">
              ×
            </button>
            <p className="font-display text-base font-bold text-[#1a1a1a] mb-2">What is a Time Deposit?</p>
            <p className="font-display text-sm text-[#6b6560] leading-relaxed">
              A time deposit is a safe, fixed-term, high-interest savings account where money is locked in for a specific period.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
