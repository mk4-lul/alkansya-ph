"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import NavMenu from "@/components/NavMenu";

function formatWithCommas(n: number): string {
  if (!n) return "";
  return n.toLocaleString("en-PH");
}
function parseFormatted(s: string): number {
  return Number(s.replace(/[^0-9]/g, "")) || 0;
}
function formatPeso(value: number): string {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
  return `₱${Math.round(value).toLocaleString("en-PH")}`;
}

const INCOME_PRESETS = [
  { label: "₱12k", value: 12000 },
  { label: "₱15k", value: 15000 },
  { label: "₱20k", value: 20000 },
  { label: "₱25k", value: 25000 },
  { label: "₱30k", value: 30000 },
  { label: "₱40k", value: 40000 },
  { label: "₱50k", value: 50000 },
  { label: "₱75k", value: 75000 },
  { label: "₱100k", value: 100000 },
];

const PRICE_PRESETS = [
  { label: "₱500", value: 500 },
  { label: "₱1k", value: 1000 },
  { label: "₱2.5k", value: 2500 },
  { label: "₱5k", value: 5000 },
  { label: "₱10k", value: 10000 },
  { label: "₱15k", value: 15000 },
  { label: "₱25k", value: 25000 },
  { label: "₱50k", value: 50000 },
  { label: "₱100k", value: 100000 },
];

const INSTALLMENT_TERMS = [
  { label: "3mo", months: 3 },
  { label: "6mo", months: 6 },
  { label: "12mo", months: 12 },
  { label: "24mo", months: 24 },
];

type Verdict = "green" | "yellow" | "red";

interface VerdictResult {
  verdict: Verdict;
  daysOfWork: number;
  percentOfIncome: number;
  totalCost: number;
  monthlyPayment: number;
  interestCost: number;
  saveMonths: number;
  savePerMonth: number;
  emoji: string;
  title: string;
  subtitle: string;
  message: string;
}

function getVerdict(income: number, price: number, payMethod: "cash" | "installment", installmentMonths: number): VerdictResult {
  const dailyPay = income / 22;
  const isInstallment = payMethod === "installment";
  const interestRate = 0.02;
  const totalCost = isInstallment ? price * (1 + interestRate * installmentMonths) : price;
  const interestCost = totalCost - price;
  const monthlyPayment = isInstallment ? totalCost / installmentMonths : 0;
  const daysOfWork = price / dailyPay;
  const percentOfIncome = (price / income) * 100;
  const monthlySaving = income * 0.2;
  const saveMonths = Math.ceil(price / monthlySaving);
  const savePerMonth = Math.ceil(price / Math.max(saveMonths, 1));

  let verdict: Verdict;
  let emoji: string;
  let title: string;
  let subtitle: string;
  let message: string;

  if (isInstallment) {
    const monthlyPercent = (monthlyPayment / income) * 100;
    if (monthlyPercent <= 10) {
      verdict = "green"; emoji = "🤙";
      title = "G lang!";
      subtitle = "Kaya naman pala.";
      message = `₱${formatWithCommas(Math.round(monthlyPayment))} lang per month — ${monthlyPercent.toFixed(0)}% ng sahod mo. Basta wag mag-stack ng maraming installment.`;
    } else if (monthlyPercent <= 25) {
      verdict = "yellow"; emoji = "🤨";
      title = "Hmm, sure ka ba?";
      subtitle = "Hindi naman bawal, pero...";
      message = `₱${formatWithCommas(Math.round(monthlyPayment))}/mo — ${monthlyPercent.toFixed(0)}% ng sahod mo. May dagdag pang ₱${formatWithCommas(Math.round(interestCost))} sa interest. Ang sakit nun.`;
    } else {
      verdict = "red"; emoji = "💀";
      title = "Wag muna, pre.";
      subtitle = "Masakit 'to sa bulsa.";
      message = `₱${formatWithCommas(Math.round(monthlyPayment))}/mo?! ${monthlyPercent.toFixed(0)}% ng sahod mo! Plus ₱${formatWithCommas(Math.round(interestCost))} sa interest. Nagbabayad ka na ng pang-ibang tao na sweldo.`;
    }
  } else {
    if (percentOfIncome <= 10) {
      verdict = "green"; emoji = "✅";
      title = "Bili na!";
      subtitle = "Easy money.";
      message = `${daysOfWork.toFixed(1)} araw ng trabaho lang. ${percentOfIncome.toFixed(0)}% ng sahod mo. Walang drama, go.`;
    } else if (percentOfIncome <= 30) {
      verdict = "green"; emoji = "👍";
      title = "G naman.";
      subtitle = "Kaya mo, basta may ipon ka pa.";
      message = `${daysOfWork.toFixed(1)} araw ng trabaho — ${percentOfIncome.toFixed(0)}% ng sahod mo. Hindi siya cheap pero afford mo naman.`;
    } else if (percentOfIncome <= 60) {
      verdict = "yellow"; emoji = "🫠";
      title = "Medyo mahal ah...";
      subtitle = "Kaya mo, pero masasaktan ka.";
      message = `${daysOfWork.toFixed(0)} araw ng trabaho. ${percentOfIncome.toFixed(0)}% ng buong sahod mo. Pag binili mo 'to — ang luwag ng wallet mo. Kasi wala na laman.`;
    } else if (percentOfIncome <= 100) {
      verdict = "red"; emoji = "🚫";
      title = "Huy, wag!";
      subtitle = "'Di mo pa afford, bes.";
      message = `${daysOfWork.toFixed(0)} araw ng trabaho — ${percentOfIncome.toFixed(0)}% ng sahod mo. Halos buong sweldo mo sa isang bagay. Pano na pagkain?`;
    } else {
      verdict = "red"; emoji = "💀";
      title = "Luh, grabe 'to.";
      subtitle = "Mas mahal pa sa sahod mo.";
      message = `${daysOfWork.toFixed(0)} araw ng trabaho. Kahit 'di ka kumain at 'di ka uminom, kulang pa rin. ${percentOfIncome > 200 ? "Ilang buwan na sahod mo 'to ah." : "Mag-ipon muna."}`;
    }
  }

  return { verdict, daysOfWork, percentOfIncome, totalCost, monthlyPayment, interestCost, saveMonths, savePerMonth, emoji, title, subtitle, message };
}

function VerdictCard({ result, price, payMethod }: { result: VerdictResult; price: number; payMethod: string }) {
  const [show, setShow] = useState(false);
  const prevKey = useRef("");
  const key = `${result.title}-${result.percentOfIncome.toFixed(0)}`;

  useEffect(() => {
    if (key !== prevKey.current) {
      setShow(false);
      prevKey.current = key;
      const t = setTimeout(() => setShow(true), 80);
      return () => clearTimeout(t);
    }
  }, [key]);

  const bg = result.verdict === "green" ? "#00c853" : result.verdict === "yellow" ? "#FFB300" : "#D32F2F";
  const textColor = result.verdict === "yellow" ? "#1a1a1a" : "#fff";
  const subColor = result.verdict === "yellow" ? "rgba(26,26,26,0.5)" : "rgba(255,255,255,0.6)";

  return (
    <div className="mt-6 mb-4" style={{ perspective: "800px" }}>
      <div
        className="rounded-3xl px-6 py-8 sm:px-10 sm:py-10 text-center transition-all duration-500"
        style={{
          background: bg,
          color: textColor,
          transform: show ? "scale(1) rotateX(0deg)" : "scale(0.9) rotateX(-10deg)",
          opacity: show ? 1 : 0,
        }}
      >
        {/* Big emoji */}
        <p className="text-[80px] sm:text-[100px] leading-none mb-2" style={{
          transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
          transform: show ? "scale(1)" : "scale(0.3)",
        }}>
          {result.emoji}
        </p>

        {/* Title */}
        <p className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-1" style={{
          transition: "transform 0.5s 0.1s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s 0.1s",
          transform: show ? "translateY(0)" : "translateY(20px)",
          opacity: show ? 1 : 0,
        }}>
          {result.title}
        </p>

        {/* Subtitle */}
        <p className="text-base sm:text-lg font-semibold mb-5" style={{
          color: subColor,
          transition: "opacity 0.4s 0.2s",
          opacity: show ? 1 : 0,
        }}>
          {result.subtitle}
        </p>

        {/* Message */}
        <p className="text-sm sm:text-[15px] leading-relaxed max-w-md mx-auto mb-6" style={{
          color: subColor,
          transition: "opacity 0.4s 0.3s",
          opacity: show ? 1 : 0,
        }}>
          {result.message}
        </p>

        {/* Stats strip */}
        <div className="flex justify-center gap-4 sm:gap-6" style={{
          transition: "opacity 0.4s 0.35s, transform 0.4s 0.35s",
          opacity: show ? 1 : 0,
          transform: show ? "translateY(0)" : "translateY(10px)",
        }}>
          <div>
            <p className="text-2xl sm:text-3xl font-black">{result.daysOfWork.toFixed(1)}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: subColor }}>araw ng trabaho</p>
          </div>
          <div style={{ width: 1, background: result.verdict === "yellow" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)" }} />
          <div>
            <p className="text-2xl sm:text-3xl font-black">{result.percentOfIncome.toFixed(0)}%</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: subColor }}>ng sahod</p>
          </div>
          {payMethod === "installment" && (
            <>
              <div style={{ width: 1, background: result.verdict === "yellow" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)" }} />
              <div>
                <p className="text-2xl sm:text-3xl font-black">{formatPeso(result.totalCost)}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: subColor }}>babayaran talaga</p>
              </div>
            </>
          )}
        </div>

        {/* Installment breakdown */}
        {payMethod === "installment" && (
          <div className="mt-5 pt-5 flex justify-center gap-6" style={{
            borderTop: `1px solid ${result.verdict === "yellow" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.15)"}`,
            transition: "opacity 0.4s 0.4s",
            opacity: show ? 1 : 0,
          }}>
            <div>
              <p className="text-lg font-black">{formatPeso(result.monthlyPayment)}</p>
              <p className="text-[10px] font-semibold" style={{ color: subColor }}>per month</p>
            </div>
            <div>
              <p className="text-lg font-black">{formatPeso(result.interestCost)}</p>
              <p className="text-[10px] font-semibold" style={{ color: subColor }}>interest</p>
            </div>
            <div>
              <p className="text-lg font-black">+{((result.interestCost / price) * 100).toFixed(0)}%</p>
              <p className="text-[10px] font-semibold" style={{ color: subColor }}>extra mo</p>
            </div>
          </div>
        )}
      </div>

      {/* Saving plan */}
      {result.verdict !== "green" && show && (
        <div className="mt-4 bg-[#111] rounded-2xl p-5 text-center" style={{
          animation: "fadeSlideUp 0.5s 0.5s both",
        }}>
          <p className="text-[11px] text-white/40 font-semibold uppercase tracking-wider mb-2">💡 Instead</p>
          <p className="text-sm text-white/70 leading-relaxed">
            Mag-ipon ka ng <span className="text-[#00c853] font-bold">{formatPeso(result.savePerMonth)}/month</span> —
            sa <span className="text-[#00c853] font-bold">{result.saveMonths} {result.saveMonths === 1 ? "month" : "months"}</span>,
            mabibili mo na &apos;to. Walang utang. Walang interest.
          </p>
          {payMethod === "installment" && result.interestCost > 0 && (
            <p className="text-xs text-white/40 mt-2">
              Makakatipid ka pa ng {formatPeso(result.interestCost)} na sana mapupunta sa interest. Pang-samgyup na &apos;yun.
            </p>
          )}
        </div>
      )}

      {result.verdict === "green" && payMethod === "installment" && result.interestCost > 100 && show && (
        <div className="mt-4 bg-[#111] rounded-2xl p-5 text-center" style={{
          animation: "fadeSlideUp 0.5s 0.5s both",
        }}>
          <p className="text-[11px] text-white/40 font-semibold uppercase tracking-wider mb-2">💡 Alam mo ba</p>
          <p className="text-sm text-white/70 leading-relaxed">
            Kaya mo naman, pero ₱{formatWithCommas(Math.round(result.interestCost))} ang mapupunta sa interest.
            Kung mag-iipon ka ng <span className="text-[#00c853] font-bold">{formatPeso(result.savePerMonth)}/mo</span>,
            mabibili mo &apos;to sa <span className="text-[#00c853] font-bold">{result.saveMonths} months</span> — at yung interest money, sa&apos;yo na.
          </p>
        </div>
      )}
    </div>
  );
}

export default function AffordCalculatorPage() {
  const [income, setIncome] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [payMethod, setPayMethod] = useState<"cash" | "installment">("cash");
  const [installmentMonths, setInstallmentMonths] = useState(12);

  const isReady = income !== null && income > 0 && price !== null && price > 0;
  const result = useMemo(
    () => isReady ? getVerdict(income, price, payMethod, installmentMonths) : null,
    [income, price, payMethod, installmentMonths, isReady]
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Nav */}
      <nav className="flex justify-between items-center px-4 sm:px-6 py-4 max-w-[520px] mx-auto">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-white no-underline">
          alkansya<span className="text-[#00c853]">.ph</span>
        </Link>
        <NavMenu dark />
      </nav>

      <main className="max-w-[520px] mx-auto px-4 sm:px-6 pb-12">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none mb-2">
            Afford ko ba &apos;to?
          </h1>
          <p className="text-sm text-white/30">Alamin bago bilhin.</p>
        </div>

        {/* Income */}
        <div className="mb-5">
          <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Sahod mo per month</p>
          <div className="flex flex-wrap gap-1.5">
            {INCOME_PRESETS.map((p) => (
              <button key={p.value} onClick={() => setIncome(p.value)}
                className={`px-3.5 py-2 rounded-full text-sm font-bold transition-all ${
                  income === p.value
                    ? "bg-white text-[#0a0a0a]"
                    : "bg-white/[0.07] text-white/50 hover:bg-white/[0.12] hover:text-white/70"
                }`}>{p.label}</button>
            ))}
          </div>
          <div className="mt-2 flex items-center bg-white/[0.07] rounded-xl px-3 py-2.5 max-w-[200px]">
            <span className="text-sm font-bold text-white/30 mr-1">₱</span>
            <input
              type="text"
              inputMode="numeric"
              value={formatWithCommas(income ?? 0)}
              onChange={(e) => setIncome(parseFormatted(e.target.value))}
              className="flex-1 bg-transparent text-sm font-bold text-white outline-none"
              placeholder="or type here"
            />
          </div>
        </div>

        {/* Price */}
        <div className="mb-5">
          <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Presyo ng gusto mo</p>
          <div className="flex flex-wrap gap-1.5">
            {PRICE_PRESETS.map((p) => (
              <button key={p.value} onClick={() => setPrice(p.value)}
                className={`px-3.5 py-2 rounded-full text-sm font-bold transition-all ${
                  price === p.value
                    ? "bg-white text-[#0a0a0a]"
                    : "bg-white/[0.07] text-white/50 hover:bg-white/[0.12] hover:text-white/70"
                }`}>{p.label}</button>
            ))}
          </div>
          <div className="mt-2 flex items-center bg-white/[0.07] rounded-xl px-3 py-2.5 max-w-[200px]">
            <span className="text-sm font-bold text-white/30 mr-1">₱</span>
            <input
              type="text"
              inputMode="numeric"
              value={formatWithCommas(price ?? 0)}
              onChange={(e) => setPrice(parseFormatted(e.target.value))}
              className="flex-1 bg-transparent text-sm font-bold text-white outline-none"
              placeholder="or type here"
            />
          </div>
        </div>

        {/* Payment */}
        <div className="mb-2">
          <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Pano mo babayaran?</p>
          <div className="flex gap-2">
            <button onClick={() => setPayMethod("cash")}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                payMethod === "cash"
                  ? "bg-white text-[#0a0a0a]"
                  : "bg-white/[0.07] text-white/50 hover:bg-white/[0.12]"
              }`}>Isang bagsak</button>
            <button onClick={() => setPayMethod("installment")}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                payMethod === "installment"
                  ? "bg-white text-[#0a0a0a]"
                  : "bg-white/[0.07] text-white/50 hover:bg-white/[0.12]"
              }`}>Hulugan</button>
          </div>
          {payMethod === "installment" && (
            <div className="flex gap-1.5 mt-2">
              {INSTALLMENT_TERMS.map((t) => (
                <button key={t.months} onClick={() => setInstallmentMonths(t.months)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    installmentMonths === t.months
                      ? "bg-white/20 text-white"
                      : "bg-white/[0.05] text-white/30 hover:bg-white/[0.1]"
                  }`}>{t.label}</button>
              ))}
            </div>
          )}
        </div>

        {/* Verdict */}
        {isReady && result && (
          <VerdictCard result={result} price={price} payMethod={payMethod} />
        )}

        {/* CTA */}
        <div className="text-center mt-8">
          <p className="text-xs text-white/20 mb-3">Gusto mo lumaki savings mo?</p>
          <Link href="/rates"
            className="inline-block bg-[#00c853] text-white font-bold text-sm px-6 py-3 rounded-full hover:bg-[#00a844] transition-colors no-underline">
            Compare rates →
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-10 pt-4 text-center">
          <p className="text-[10px] text-white/15 leading-relaxed">
            Guide lang &apos;to, hindi financial advice. Installment rates are estimates. Always check the total cost bago mag-sign up.
          </p>
        </footer>
      </main>
    </div>
  );
}
