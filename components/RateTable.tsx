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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FlagButton({ bankId }: { bankId: string }) {
  const [flagged, setFlagged] = useState(false);

  if (flagged) {
    return (
      <span className="font-mono text-[10px] text-alkansya-gold">✓ Flagged</span>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        flagRate(bankId);
        setFlagged(true);
      }}
      className="border border-white/10 rounded-md px-2 py-0.5 font-mono text-[10px] text-white/35 hover:text-white/60 hover:border-white/20 transition-colors"
      title="Flag this rate as outdated"
    >
      ⚑ Flag
    </button>
  );
}

function BankRow({
  bank,
  depositType,
  amount,
}: {
  bank: BankWithRates;
  depositType: "savings" | "time_deposit";
  amount: number;
}) {
  const [expanded, setExpanded] = useState(false);

  // For display: use tier-matched rate for savings, 360d rate for TD
  const displayRate =
    depositType === "savings"
      ? getRateForAmount(bank.savings_tiers, amount)
      : bank.time_deposit_rates.find((r) => r.term_days === 360)?.rate ||
        bank.savings_rate;

  const earnings = calcInterest(amount, displayRate);
  const isDigital = bank.type === "digital";
  const barWidth = Math.min((displayRate / 6) * 100, 100);

  // Rate range for savings
  const hasMultipleTiers = bank.savings_tiers.length > 1;
  const rateRangeText =
    depositType === "savings" && hasMultipleTiers
      ? formatRateRange(bank.savings_min_rate, bank.savings_rate)
      : `${displayRate}%`;

  const rateColor =
    displayRate >= 2
      ? "text-alkansya-green"
      : displayRate >= 0.5
      ? "text-alkansya-gold"
      : "text-white/40";

  const barBg =
    displayRate >= 2
      ? "linear-gradient(90deg, #00d296, #00b377)"
      : displayRate >= 0.5
      ? "linear-gradient(90deg, #ffc300, #e6a800)"
      : "rgba(255,255,255,0.15)";

  return (
    <div className="border-b border-white/5">
      <div
        onClick={() => setExpanded(!expanded)}
        className="grid items-center px-4 py-3.5 cursor-pointer bank-row transition-colors"
        style={{
          gridTemplateColumns: "minmax(140px, 1.2fr) 100px 1fr 120px 50px",
        }}
      >
        {/* Bank name */}
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{bank.logo}</span>
          <div>
            <p className="font-display text-sm font-semibold text-white">
              {bank.name}
            </p>
            <span
              className={`inline-block font-mono text-[9px] uppercase tracking-[1.5px] px-1.5 py-0.5 rounded mt-0.5 ${
                isDigital
                  ? "bg-alkansya-green/10 text-alkansya-green"
                  : "bg-white/5 text-white/40"
              }`}
            >
              {isDigital ? "Digital" : "Traditional"}
            </span>
          </div>
        </div>

        {/* Rate — show range for savings if multiple tiers */}
        <div className="text-right">
          <p className={`font-display text-lg font-extrabold ${rateColor}`}>
            {rateRangeText}
          </p>
          {bank.has_promo && depositType === "savings" && (
            <span className="font-mono text-[9px] text-alkansya-red">
              up to {bank.promo_rate}%*
            </span>
          )}
        </div>

        {/* Bar */}
        <div className="px-4">
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full rate-bar-fill"
              style={{ width: `${barWidth}%`, background: barBg }}
            />
          </div>
        </div>

        {/* Earnings */}
        <div className="text-right">
          <p className="font-mono text-[13px] text-white/70">
            {formatPeso(earnings)}
          </p>
          <p className="font-mono text-[9px] text-white/30">/year</p>
        </div>

        {/* Expand arrow */}
        <div
          className={`text-center text-xs text-white/30 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        >
          ▼
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pl-14 animate-fade-in">
          {/* Savings tiers */}
          {depositType === "savings" && bank.savings_tiers.length > 0 && (
            <div className="mb-3">
              <p className="font-mono text-[9px] uppercase tracking-[1.5px] text-white/40 mb-2">
                Savings Rate Tiers
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {bank.savings_tiers.map((tier, i) => {
                  const tierLabel = tier.max_deposit
                    ? `${formatPesoShort(tier.min_deposit)} – ${formatPesoShort(tier.max_deposit)}`
                    : `${formatPesoShort(tier.min_deposit)}+`;
                  const tierEarnings = calcInterest(
                    Math.max(amount, tier.min_deposit),
                    tier.rate
                  );
                  const isActive =
                    amount >= tier.min_deposit &&
                    (tier.max_deposit === null || amount <= tier.max_deposit);

                  return (
                    <div
                      key={i}
                      className={`rounded-xl p-3 border ${
                        isActive
                          ? "bg-white/[0.06] border-alkansya-gold/30"
                          : "bg-white/[0.02] border-white/[0.06]"
                      }`}
                    >
                      <p className="font-mono text-[9px] uppercase tracking-[1.5px] text-white/40">
                        {tierLabel}
                      </p>
                      <p
                        className={`font-display text-lg font-bold mt-1 ${
                          tier.rate >= 2 ? "text-alkansya-green" : tier.rate >= 0.5 ? "text-alkansya-gold" : "text-white/50"
                        }`}
                      >
                        {tier.rate}%
                      </p>
                      <p className="font-mono text-[10px] text-white/30">
                        {formatPeso(tierEarnings)}/yr
                      </p>
                      {isActive && (
                        <span className="inline-block mt-1 font-mono text-[8px] uppercase tracking-[1px] text-alkansya-gold/70">
                          Your tier
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Single savings rate (no tiers) */}
          {depositType === "savings" && bank.savings_tiers.length <= 1 && (
            <div className="mb-3">
              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06] inline-block">
                <p className="font-mono text-[9px] uppercase tracking-[1.5px] text-white/40">
                  Savings Rate
                </p>
                <p className={`font-display text-lg font-bold mt-1 ${
                  displayRate >= 2 ? "text-alkansya-green" : displayRate >= 0.5 ? "text-alkansya-gold" : "text-white/50"
                }`}>
                  {displayRate}%
                </p>
                <p className="font-mono text-[10px] text-white/30">
                  {formatPeso(earnings)}/yr on {formatPesoShort(amount)}
                </p>
              </div>
            </div>
          )}

          {/* Time deposit rates */}
          {depositType === "time_deposit" && bank.time_deposit_rates.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {bank.time_deposit_rates.map((td) => {
                const tdDays = td.term_days;
                const tdEarnings = calcInterest(amount, td.rate, tdDays);
                return (
                  <div
                    key={td.term_days}
                    className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]"
                  >
                    <p className="font-mono text-[9px] uppercase tracking-[1.5px] text-white/40">
                      {TERM_LABELS[tdDays] || `${tdDays}d`}
                    </p>
                    <p
                      className={`font-display text-lg font-bold mt-1 ${
                        td.rate >= 2 ? "text-alkansya-green" : "text-alkansya-gold"
                      }`}
                    >
                      {td.rate}%
                    </p>
                    <p className="font-mono text-[10px] text-white/30">
                      {formatPeso(tdEarnings)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {depositType === "time_deposit" && bank.time_deposit_rates.length === 0 && (
            <p className="font-mono text-[11px] text-white/30 mb-3">
              No time deposit products available
            </p>
          )}

          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-mono text-[10px] text-white/30">
              Verified {timeAgo(bank.last_verified)} ·{" "}
              {bank.source_url ? (
                <a
                  href={bank.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-white/50"
                  onClick={(e) => e.stopPropagation()}
                >
                  source
                </a>
              ) : (
                "manual"
              )}
            </span>
            <FlagButton bankId={bank.id} />
            {bank.has_promo && bank.promo_terms && (
              <span className="font-mono text-[10px] px-2 py-0.5 bg-alkansya-red/10 text-alkansya-red rounded-md">
                *{bank.promo_terms}
              </span>
            )}
            {bank.notes && (
              <span className="font-mono text-[10px] text-white/25">
                {bank.notes}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main table
// ---------------------------------------------------------------------------

export default function RateTable({ banks }: { banks: BankWithRates[] }) {
  const [depositType, setDepositType] = useState<"savings" | "time_deposit">(
    "savings"
  );
  const [bankType, setBankType] = useState<"all" | "traditional" | "digital">(
    "all"
  );
  const [amount, setAmount] = useState(100000);
  const [sortBy, setSortBy] = useState("rate_desc");

  const filtered = useMemo(() => {
    let list = [...banks];
    if (bankType !== "all") list = list.filter((b) => b.type === bankType);

    list.sort((a, b) => {
      const rateA =
        depositType === "savings"
          ? getRateForAmount(a.savings_tiers, amount)
          : a.time_deposit_rates.find((r) => r.term_days === 360)?.rate ||
            a.savings_rate;
      const rateB =
        depositType === "savings"
          ? getRateForAmount(b.savings_tiers, amount)
          : b.time_deposit_rates.find((r) => r.term_days === 360)?.rate ||
            b.savings_rate;

      if (sortBy === "rate_desc") return rateB - rateA;
      if (sortBy === "rate_asc") return rateA - rateB;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return rateB - rateA;
    });

    return list;
  }, [banks, depositType, bankType, sortBy, amount]);

  const toggleBtn = (
    isActive: boolean
  ): string =>
    `px-4 py-2 rounded-lg border-none cursor-pointer font-display text-[13px] font-semibold transition-all ${
      isActive
        ? "bg-alkansya-gold/15 text-alkansya-gold"
        : "bg-transparent text-white/40 hover:text-white/60"
    }`;

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Deposit type toggle */}
        <div className="flex bg-white/[0.04] rounded-xl p-0.5 border border-white/[0.06]">
          <button
            onClick={() => setDepositType("savings")}
            className={toggleBtn(depositType === "savings")}
          >
            Savings
          </button>
          <button
            onClick={() => setDepositType("time_deposit")}
            className={toggleBtn(depositType === "time_deposit")}
          >
            Time Deposit
          </button>
        </div>

        {/* Bank type toggle */}
        <div className="flex bg-white/[0.04] rounded-xl p-0.5 border border-white/[0.06]">
          {(
            [
              ["all", "All Banks"],
              ["traditional", "Traditional"],
              ["digital", "Digital"],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setBankType(val)}
              className={toggleBtn(bankType === val)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Amount selector */}
        <select
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="px-3.5 py-2 rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/70 font-display text-[13px] cursor-pointer"
        >
          {AMOUNT_BRACKETS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/70 font-display text-[13px] cursor-pointer ml-auto"
        >
          <option value="rate_desc">Highest Rate</option>
          <option value="rate_asc">Lowest Rate</option>
          <option value="name">Bank Name</option>
        </select>
      </div>

      {/* Table header */}
      <div
        className="grid px-4 py-2.5 border-b border-white/[0.08]"
        style={{
          gridTemplateColumns: "minmax(140px, 1.2fr) 100px 1fr 120px 50px",
        }}
      >
        {["Bank", "Rate", "", "Earn / yr", ""].map((h, i) => (
          <p
            key={i}
            className={`m-0 font-mono text-[9px] uppercase tracking-[2px] text-white/25 ${
              i === 1 || i === 3 ? "text-right" : ""
            }`}
          >
            {h}
          </p>
        ))}
      </div>

      {/* Bank rows */}
      <div className="bg-white/[0.015] rounded-b-2xl border border-white/[0.04] border-t-0 overflow-hidden">
        {filtered.map((bank) => (
          <BankRow
            key={bank.id}
            bank={bank}
            depositType={depositType}
            amount={amount}
          />
        ))}
        {filtered.length === 0 && (
          <p className="text-center py-8 font-mono text-sm text-white/30">
            No banks match your filters
          </p>
        )}
      </div>
    </div>
  );
}
