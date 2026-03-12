"use client";

import { useState, useMemo } from "react";
import { BankWithRates, flagRate } from "@/lib/supabase";
import {
  formatPeso,
  formatPesoShort,
  calcInterest,
  timeAgo,
  getRateForAmount,
  formatRateRange,
  AMOUNT_BRACKETS,
  TERM_LABELS,
} from "@/lib/utils";

function FlagButton({ bankId }: { bankId: string }) {
  const [flagged, setFlagged] = useState(false);
  if (flagged) return <span className="font-mono text-[10px] text-[#c8940a]">✓ Flagged</span>;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); flagRate(bankId); setFlagged(true); }}
      className="border border-[#e5e0d8] rounded-md px-2 py-0.5 font-mono text-[10px] text-[#9a9490] hover:text-[#1a1a1a] hover:border-[#9a9490] transition-colors"
      title="Flag this rate as outdated"
    >
      ⚑ Flag
    </button>
  );
}

function BankRow({ bank, depositType, amount }: { bank: BankWithRates; depositType: "savings" | "time_deposit"; amount: number }) {
  const [expanded, setExpanded] = useState(false);

  const displayRate = depositType === "savings"
    ? getRateForAmount(bank.savings_tiers, amount)
    : bank.time_deposit_rates.find((r) => r.term_days === 360)?.rate || bank.savings_rate;

  const earnings = calcInterest(amount, displayRate);
  const isDigital = bank.type === "digital";
  const barWidth = Math.min((displayRate / 6) * 100, 100);
  const hasMultipleTiers = bank.savings_tiers.length > 1;
  const rateRangeText = depositType === "savings" && hasMultipleTiers
    ? formatRateRange(bank.savings_min_rate, bank.savings_rate) : `${displayRate}%`;

  const rateColor = displayRate >= 2 ? "text-[#0a8f65]" : displayRate >= 0.5 ? "text-[#c8940a]" : "text-[#9a9490]";
  const barBg = displayRate >= 2 ? "linear-gradient(90deg, #0a8f65, #0b7a57)"
    : displayRate >= 0.5 ? "linear-gradient(90deg, #c8940a, #b38308)" : "rgba(0,0,0,0.08)";

  return (
    <div className="border-b border-[#e5e0d8]">
      <div onClick={() => setExpanded(!expanded)}
        className="grid items-center px-4 py-3.5 cursor-pointer hover:bg-[#f0ece6] transition-colors"
        style={{ gridTemplateColumns: "minmax(140px, 1.2fr) 100px 1fr 120px 50px" }}>
        {/* Bank name */}
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{bank.logo}</span>
          <div>
            <p className="font-display text-sm font-semibold text-[#1a1a1a]">{bank.name}</p>
            <span className={`inline-block font-mono text-[9px] uppercase tracking-[1.5px] px-1.5 py-0.5 rounded mt-0.5 ${
              isDigital ? "bg-emerald-50 text-[#0a8f65]" : "bg-[#f0ece6] text-[#9a9490]"
            }`}>
              {isDigital ? "Digital" : "Traditional"}
            </span>
          </div>
        </div>
        {/* Rate */}
        <div className="text-right">
          <p className={`font-display text-lg font-extrabold ${rateColor}`}>{rateRangeText}</p>
          {bank.has_promo && depositType === "savings" && (
            <span className="font-mono text-[9px] text-[#d94444]">up to {bank.promo_rate}%*</span>
          )}
        </div>
        {/* Bar */}
        <div className="px-4">
          <div className="h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
            <div className="h-full rounded-full rate-bar-fill" style={{ width: `${barWidth}%`, background: barBg }} />
          </div>
        </div>
        {/* Earnings */}
        <div className="text-right">
          <p className="font-mono text-[13px] text-[#3d3835]">{formatPeso(earnings)}</p>
          <p className="font-mono text-[9px] text-[#9a9490]">/year</p>
        </div>
        {/* Arrow */}
        <div className={`text-center text-xs text-[#9a9490] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>▼</div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 pl-14 animate-fade-in">
          {/* Savings tiers */}
          {depositType === "savings" && bank.savings_tiers.length > 0 && (
            <div className="mb-3">
              <p className="font-mono text-[9px] uppercase tracking-[1.5px] text-[#9a9490] mb-2">Savings Rate Tiers</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {bank.savings_tiers.map((tier, i) => {
                  const tierLabel = tier.max_deposit
                    ? `${formatPesoShort(tier.min_deposit)} – ${formatPesoShort(tier.max_deposit)}`
                    : `${formatPesoShort(tier.min_deposit)}+`;
                  const tierEarnings = calcInterest(Math.max(amount, tier.min_deposit), tier.rate);
                  const isActive = amount >= tier.min_deposit && (tier.max_deposit === null || amount <= tier.max_deposit);
                  return (
                    <div key={i} className={`rounded-xl p-3 border ${
                      isActive ? "bg-amber-50 border-[#c8940a]/30" : "bg-[#f6f4f0] border-[#e5e0d8]"
                    }`}>
                      <p className="font-mono text-[9px] uppercase tracking-[1.5px] text-[#9a9490]">{tierLabel}</p>
                      <p className={`font-display text-lg font-bold mt-1 ${
                        tier.rate >= 2 ? "text-[#0a8f65]" : tier.rate >= 0.5 ? "text-[#c8940a]" : "text-[#9a9490]"
                      }`}>{tier.rate}%</p>
                      <p className="font-mono text-[10px] text-[#6b6560]">{formatPeso(tierEarnings)}/yr</p>
                      {isActive && <span className="inline-block mt-1 font-mono text-[8px] uppercase tracking-[1px] text-[#c8940a]">Your tier</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Single rate */}
          {depositType === "savings" && bank.savings_tiers.length <= 1 && (
            <div className="mb-3">
              <div className="bg-[#f6f4f0] rounded-xl p-3 border border-[#e5e0d8] inline-block">
                <p className="font-mono text-[9px] uppercase tracking-[1.5px] text-[#9a9490]">Savings Rate</p>
                <p className={`font-display text-lg font-bold mt-1 ${
                  displayRate >= 2 ? "text-[#0a8f65]" : displayRate >= 0.5 ? "text-[#c8940a]" : "text-[#9a9490]"
                }`}>{displayRate}%</p>
                <p className="font-mono text-[10px] text-[#6b6560]">{formatPeso(earnings)}/yr on {formatPesoShort(amount)}</p>
              </div>
            </div>
          )}
          {/* Time deposit */}
          {depositType === "time_deposit" && bank.time_deposit_rates.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {bank.time_deposit_rates.map((td) => (
                <div key={td.term_days} className="bg-[#f6f4f0] rounded-xl p-3 border border-[#e5e0d8]">
                  <p className="font-mono text-[9px] uppercase tracking-[1.5px] text-[#9a9490]">{TERM_LABELS[td.term_days] || `${td.term_days}d`}</p>
                  <p className={`font-display text-lg font-bold mt-1 ${td.rate >= 2 ? "text-[#0a8f65]" : "text-[#c8940a]"}`}>{td.rate}%</p>
                  <p className="font-mono text-[10px] text-[#6b6560]">{formatPeso(calcInterest(amount, td.rate, td.term_days))}</p>
                </div>
              ))}
            </div>
          )}
          {depositType === "time_deposit" && bank.time_deposit_rates.length === 0 && (
            <p className="font-mono text-[11px] text-[#9a9490] mb-3">No time deposit products available</p>
          )}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-mono text-[10px] text-[#9a9490]">
              Verified {timeAgo(bank.last_verified)} ·{" "}
              {bank.source_url ? (
                <a href={bank.source_url} target="_blank" rel="noopener noreferrer"
                  className="underline hover:text-[#1a1a1a]" onClick={(e) => e.stopPropagation()}>source</a>
              ) : "manual"}
            </span>
            <FlagButton bankId={bank.id} />
            {bank.has_promo && bank.promo_terms && (
              <span className="font-mono text-[10px] px-2 py-0.5 bg-red-50 text-[#d94444] rounded-md">*{bank.promo_terms}</span>
            )}
            {bank.notes && <span className="font-mono text-[10px] text-[#b0aaa4]">{bank.notes}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RateTable({ banks }: { banks: BankWithRates[] }) {
  const [depositType, setDepositType] = useState<"savings" | "time_deposit">("savings");
  const [bankType, setBankType] = useState<"all" | "traditional" | "digital">("all");
  const [amount, setAmount] = useState(100000);
  const [sortBy, setSortBy] = useState("rate_desc");

  const filtered = useMemo(() => {
    let list = [...banks];
    if (bankType !== "all") list = list.filter((b) => b.type === bankType);
    list.sort((a, b) => {
      const rateA = depositType === "savings" ? getRateForAmount(a.savings_tiers, amount)
        : a.time_deposit_rates.find((r) => r.term_days === 360)?.rate || a.savings_rate;
      const rateB = depositType === "savings" ? getRateForAmount(b.savings_tiers, amount)
        : b.time_deposit_rates.find((r) => r.term_days === 360)?.rate || b.savings_rate;
      if (sortBy === "rate_desc") return rateB - rateA;
      if (sortBy === "rate_asc") return rateA - rateB;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return rateB - rateA;
    });
    return list;
  }, [banks, depositType, bankType, sortBy, amount]);

  const toggleBtn = (isActive: boolean) =>
    `px-4 py-2 rounded-lg border-none cursor-pointer font-display text-[13px] font-semibold transition-all ${
      isActive ? "bg-[#c8940a]/10 text-[#c8940a]" : "bg-transparent text-[#6b6560] hover:text-[#1a1a1a]"
    }`;

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex bg-white rounded-xl p-0.5 border border-[#e5e0d8]">
          <button onClick={() => setDepositType("savings")} className={toggleBtn(depositType === "savings")}>Savings</button>
          <button onClick={() => setDepositType("time_deposit")} className={toggleBtn(depositType === "time_deposit")}>Time Deposit</button>
        </div>
        <div className="flex bg-white rounded-xl p-0.5 border border-[#e5e0d8]">
          {([["all", "All Banks"], ["traditional", "Traditional"], ["digital", "Digital"]] as const).map(([val, label]) => (
            <button key={val} onClick={() => setBankType(val)} className={toggleBtn(bankType === val)}>{label}</button>
          ))}
        </div>
        <select value={amount} onChange={(e) => setAmount(Number(e.target.value))}
          className="px-3.5 py-2 rounded-xl border border-[#e5e0d8] bg-white text-[#3d3835] font-display text-[13px] cursor-pointer">
          {AMOUNT_BRACKETS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-[#e5e0d8] bg-white text-[#3d3835] font-display text-[13px] cursor-pointer ml-auto">
          <option value="rate_desc">Highest Rate</option>
          <option value="rate_asc">Lowest Rate</option>
          <option value="name">Bank Name</option>
        </select>
      </div>
      {/* Table header */}
      <div className="grid px-4 py-2.5 border-b border-[#e5e0d8]"
        style={{ gridTemplateColumns: "minmax(140px, 1.2fr) 100px 1fr 120px 50px" }}>
        {["Bank", "Rate", "", "Earn / yr", ""].map((h, i) => (
          <p key={i} className={`m-0 font-mono text-[9px] uppercase tracking-[2px] text-[#9a9490] ${i === 1 || i === 3 ? "text-right" : ""}`}>{h}</p>
        ))}
      </div>
      {/* Rows */}
      <div className="bg-white rounded-b-2xl border border-[#e5e0d8] border-t-0 overflow-hidden shadow-sm">
        {filtered.map((bank) => <BankRow key={bank.id} bank={bank} depositType={depositType} amount={amount} />)}
        {filtered.length === 0 && <p className="text-center py-8 font-mono text-sm text-[#9a9490]">No banks match your filters</p>}
      </div>
    </div>
  );
}
