"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import NavMenu from "@/components/NavMenu";
import ScrollingPeso from "@/components/ScrollingPeso";

function formatWithCommas(n: number): string {
  if (!n) return "";
  return n.toLocaleString("en-PH");
}

function parseFormatted(s: string): number {
  return Number(s.replace(/[^0-9]/g, "")) || 0;
}

function formatPeso(value: number): string {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(2)}M`;
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
  { label: "3 months", months: 3 },
  { label: "6 months", months: 6 },
  { label: "12 months", months: 12 },
  { label: "24 months", months: 24 },
];

type Verdict = "green" | "yellow" | "red";

function getVerdict(income: number, price: number, payMethod: "cash" | "installment", installmentMonths: number) {
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
  let title: string;
  let subtitle: string;
  let message: string;

  if (isInstallment) {
    const monthlyPercent = (monthlyPayment / income) * 100;
    if (monthlyPercent <= 10) {
      verdict = "green";
      title = "G lang! 🤙";
      subtitle = "Kaya naman pala.";
      message = `₱${formatWithCommas(Math.round(monthlyPayment))} lang per month — ${monthlyPercent.toFixed(0)}% ng sahod mo. Basta wag ka mag-stack ng maraming installment ha.`;
    } else if (monthlyPercent <= 25) {
      verdict = "yellow";
      title = "Hmm, sure ka ba? 🤨";
      subtitle = "Hindi naman bawal, pero...";
      message = `₱${formatWithCommas(Math.round(monthlyPayment))} per month yan — ${monthlyPercent.toFixed(0)}% ng sahod mo. Tapos may dagdag na ₱${formatWithCommas(Math.round(interestCost))} na interest. Parang ang sakit naman nun.`;
    } else {
      verdict = "red";
      title = "Wag muna, pre. 😭";
      subtitle = "Masakit 'to sa bulsa.";
      message = `₱${formatWithCommas(Math.round(monthlyPayment))} per month?! ${monthlyPercent.toFixed(0)}% ng sahod mo yun! Tapos ₱${formatWithCommas(Math.round(interestCost))} pa ang interest. Nagbabayad ka ng pang-ibang tao na sahod.`;
    }
  } else {
    if (percentOfIncome <= 10) {
      verdict = "green";
      title = "Bili na! ✅";
      subtitle = "Easy money lang 'to.";
      message = `${daysOfWork.toFixed(1)} araw ng trabaho lang 'to. ${percentOfIncome.toFixed(0)}% ng sahod mo. Kayang-kaya, walang drama.`;
    } else if (percentOfIncome <= 30) {
      verdict = "green";
      title = "G lang naman 👍";
      subtitle = "Kaya mo naman, basta ayon.";
      message = `${daysOfWork.toFixed(1)} araw ng trabaho 'to — ${percentOfIncome.toFixed(0)}% ng sahod mo. Hindi siya mura-mura, pero afford mo naman. Basta may naka-save ka pa.`;
    } else if (percentOfIncome <= 60) {
      verdict = "yellow";
      title = "Medyo mahal ah 🫠";
      subtitle = "Kaya mo, pero masasaktan ka.";
      message = `Halos ${daysOfWork.toFixed(0)} araw ng trabaho mo 'to — ${percentOfIncome.toFixed(0)}% ng buong sahod mo sa isang buwan. Pag binili mo 'to, ang luwag ng wallet mo... kasi wala na laman.`;
    } else if (percentOfIncome <= 100) {
      verdict = "red";
      title = "Huy, wag! 🚫";
      subtitle = "'Di mo pa afford 'to, bes.";
      message = `${daysOfWork.toFixed(0)} araw ng trabaho 'to — ${percentOfIncome.toFixed(0)}% ng sahod mo. Parang binibigay mo yung halos buong sweldo mo sa isang bagay. Pano na pagkain mo?`;
    } else {
      verdict = "red";
      title = "Luh, grabe 'to 💀";
      subtitle = "Mas mahal pa sa sahod mo.";
      message = `Bes, ${daysOfWork.toFixed(0)} araw ng trabaho 'to — more than your entire monthly pay. Kahit 'di ka kumain, 'di ka uminom, kulang pa rin. ${percentOfIncome > 200 ? "Ilang buwan na sahod mo 'to ah." : "Mag-ipon ka muna, promise worth it."}`;
    }
  }

  return { verdict, daysOfWork, percentOfIncome, totalCost, monthlyPayment, interestCost, saveMonths, savePerMonth, title, subtitle, message };
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

  const verdictColors: Record<Verdict, { bg: string; text: string; subtext: string; bar: string; frosted: string }> = {
    green: { bg: "bg-[#00c853]", text: "text-white", subtext: "text-white/70", bar: "bg-white", frosted: "bg-white/15" },
    yellow: { bg: "bg-[#FFB300]", text: "text-[#1a1a1a]", subtext: "text-[#1a1a1a]/60", bar: "bg-[#1a1a1a]", frosted: "bg-black/10" },
    red: { bg: "bg-[#D32F2F]", text: "text-white", subtext: "text-white/70", bar: "bg-white", frosted: "bg-white/15" },
  };

  const verdictEmojis: Record<Verdict, string[]> = {
    green: ['✅', '💚', '🤙', '💰', '🎉'],
    yellow: ['🫠', '🤨', '😬', '💭', '⚠️'],
    red: ['💀', '🚫', '😭', '💸', '🪦'],
  };

  const colors = result ? verdictColors[result.verdict] : verdictColors.green;
  const emojis = result ? verdictEmojis[result.verdict] : verdictEmojis.green;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Nav */}
      <nav className="flex justify-between items-center px-4 sm:px-6 py-4 max-w-[720px] mx-auto">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-[#1a1a1a] no-underline">
          alkansya<span className="text-[#00c853]">.ph</span>
        </Link>
        <NavMenu />
      </nav>

      <main className="max-w-[720px] mx-auto px-4 sm:px-6 pb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a1a1a] tracking-tight mb-4">Afford ko ba &apos;to? 🛍️</h1>

        {/* Inputs */}
        <div className="space-y-3 mb-3">
          {/* Monthly income */}
          <div className="bg-white rounded-[20px] p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-1">Magkano sahod mo?</p>
            <p className="text-[10px] text-[#aaa] mb-3">Monthly take-home pay — yung natatanggap mo talaga after tax at deductions</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {INCOME_PRESETS.map((p) => (
                <button key={p.value} onClick={() => setIncome(p.value)}
                  className={`py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                    income === p.value ? "bg-[#1a1a1a] text-white" : "bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#e8e8e8]"
                  }`}>{p.label}</button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-[#888]">Exact:</span>
              <div className="flex-1 flex items-center bg-[#f5f5f5] rounded-xl px-3 py-2">
                <span className="text-sm font-bold text-[#888] mr-1">₱</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatWithCommas(income ?? 0)}
                  onChange={(e) => setIncome(parseFormatted(e.target.value))}
                  className="flex-1 bg-transparent text-sm font-bold text-[#1a1a1a] outline-none"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Item price */}
          <div className="bg-white rounded-[20px] p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-1">Magkano yung gusto mo bilhin?</p>
            <p className="text-[10px] text-[#aaa] mb-3">Presyo ng item — kung sale price, yun ang ilagay mo</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {PRICE_PRESETS.map((p) => (
                <button key={p.value} onClick={() => setPrice(p.value)}
                  className={`py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                    price === p.value ? "bg-[#1a1a1a] text-white" : "bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#e8e8e8]"
                  }`}>{p.label}</button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-[#888]">Exact:</span>
              <div className="flex-1 flex items-center bg-[#f5f5f5] rounded-xl px-3 py-2">
                <span className="text-sm font-bold text-[#888] mr-1">₱</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatWithCommas(price ?? 0)}
                  onChange={(e) => setPrice(parseFormatted(e.target.value))}
                  className="flex-1 bg-transparent text-sm font-bold text-[#1a1a1a] outline-none"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div className="bg-white rounded-[20px] p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">Pano mo babayaran?</p>
            <div className="flex bg-[#f5f5f5] rounded-full p-1 mb-3">
              <button onClick={() => setPayMethod("cash")}
                className={`flex-1 py-2.5 rounded-full text-[13px] font-bold transition-all ${
                  payMethod === "cash" ? "bg-[#1a1a1a] text-white" : "text-[#888]"
                }`}>Isang bagsak</button>
              <button onClick={() => setPayMethod("installment")}
                className={`flex-1 py-2.5 rounded-full text-[13px] font-bold transition-all ${
                  payMethod === "installment" ? "bg-[#1a1a1a] text-white" : "text-[#888]"
                }`}>Installment / Hulugan</button>
            </div>

            {payMethod === "installment" && (
              <div>
                <p className="text-[10px] text-[#aaa] mb-2">Ilang buwan?</p>
                <div className="grid grid-cols-4 gap-2">
                  {INSTALLMENT_TERMS.map((t) => (
                    <button key={t.months} onClick={() => setInstallmentMonths(t.months)}
                      className={`py-2 rounded-xl text-[12px] font-bold transition-all ${
                        installmentMonths === t.months ? "bg-[#1a1a1a] text-white" : "bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#e8e8e8]"
                      }`}>{t.label}</button>
                  ))}
                </div>
                <p className="text-[10px] text-[#aaa] mt-2">Estimate lang — based sa ~2%/month add-on rate (ShopeePay, Home Credit, BillEase, etc.)</p>
              </div>
            )}
          </div>
        </div>

        {/* Verdict card */}
        {isReady && result && (
        <>
        <div className={`${colors.bg} rounded-[20px] p-6 sm:p-8 mb-3 relative overflow-hidden`}>
          {/* Floating emojis */}
          <div className="absolute inset-0 pointer-events-none select-none" style={{ filter: "blur(2px)" }} aria-hidden="true">
            {emojis.map((e, i) => (
              <span key={i} className="absolute text-[28px] sm:text-[34px] emoji-float" style={{
                left: `${(i * 47 + 13) % 100}%`,
                top: `${(i * 31 + 7) % 100}%`,
                opacity: 0.75,
                '--base-rotate': `rotate(${(i * 37) % 360}deg)`,
                '--float-duration': `${6 + (i % 5) * 2}s`,
                '--float-delay': `${-((i * 1.3) % 8)}s`,
              } as React.CSSProperties}>{e}</span>
            ))}
          </div>

          <div className="relative">
            {/* Verdict */}
            <p className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${colors.text} mb-1`}>
              {result.title}
            </p>
            <p className={`text-[14px] font-semibold ${colors.subtext} mb-4`}>
              {result.subtitle}
            </p>

            {/* Message */}
            <p className={`text-[14px] ${colors.subtext} leading-relaxed mb-5 max-w-lg`}>
              {result.message}
            </p>

            {/* Key stats */}
            <div className={`${colors.frosted} backdrop-blur-md rounded-2xl px-5 py-4`}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className={`text-[11px] ${colors.subtext} font-semibold`}>Ilang araw na trabaho</p>
                  <p className={`text-2xl font-extrabold ${colors.text}`}>{result.daysOfWork.toFixed(1)} araw</p>
                </div>
                <div>
                  <p className={`text-[11px] ${colors.subtext} font-semibold`}>% ng sahod mo</p>
                  <p className={`text-2xl font-extrabold ${colors.text}`}>{result.percentOfIncome.toFixed(0)}%</p>
                </div>
                {payMethod === "installment" && (
                  <div>
                    <p className={`text-[11px] ${colors.subtext} font-semibold`}>Babayaran mo talaga</p>
                    <p className={`text-2xl font-extrabold ${colors.text}`}><ScrollingPeso value={result.totalCost} /></p>
                  </div>
                )}
              </div>

              {/* Income bar */}
              <div className="mt-4">
                <div className="h-3 rounded-full bg-black/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colors.bar} transition-all duration-700`}
                    style={{ width: `${Math.min(result.percentOfIncome, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className={`text-[10px] ${colors.subtext}`}>₱0</span>
                  <span className={`text-[10px] ${colors.subtext}`}>buong sahod mo</span>
                </div>
              </div>
            </div>

            {/* Installment breakdown */}
            {payMethod === "installment" && (
              <div className={`${colors.frosted} backdrop-blur-md rounded-2xl px-5 py-4 mt-3`}>
                <p className={`text-[11px] ${colors.subtext} font-semibold uppercase tracking-[0.5px] mb-2`}>Breakdown ng hulugan</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className={`text-[10px] ${colors.subtext}`}>Per month</p>
                    <p className={`text-lg font-extrabold ${colors.text}`}><ScrollingPeso value={result.monthlyPayment} /></p>
                  </div>
                  <div>
                    <p className={`text-[10px] ${colors.subtext}`}>Dagdag na interest</p>
                    <p className={`text-lg font-extrabold ${colors.text}`}><ScrollingPeso value={result.interestCost} /></p>
                  </div>
                  <div>
                    <p className={`text-[10px] ${colors.subtext}`}>Extra na babayaran</p>
                    <p className={`text-lg font-extrabold ${colors.text}`}>{((result.interestCost / price) * 100).toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Saving plan — for yellow and red */}
        {result.verdict !== "green" && (
          <div className="bg-white rounded-[20px] p-5 sm:p-6 mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">💡 Eto suggestion ko</p>
            <div className="bg-[#f5f5f5] rounded-xl p-4">
              <p className="text-sm text-[#1a1a1a] leading-relaxed">
                Mag-ipon ka ng <span className="font-extrabold text-[#00c853]">{formatPeso(result.savePerMonth)}/month</span> —
                in <span className="font-extrabold text-[#00c853]">{result.saveMonths} {result.saveMonths === 1 ? "month" : "months"}</span>,
                mabibili mo na &apos;to. Walang utang, walang interest.
              </p>
            </div>
            {payMethod === "installment" && result.interestCost > 0 && (
              <p className="text-[11px] text-[#888] mt-2">
                Plus, makakatipid ka ng <span className="font-bold text-[#00c853]">{formatPeso(result.interestCost)}</span> na sana mapupunta sa interest. Pang-samgyup na &apos;yun.
              </p>
            )}
          </div>
        )}

        {/* Green installment — still show the interest reality */}
        {result.verdict === "green" && payMethod === "installment" && result.interestCost > 100 && (
          <div className="bg-white rounded-[20px] p-5 sm:p-6 mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">💡 Alam mo ba</p>
            <div className="bg-[#f5f5f5] rounded-xl p-4">
              <p className="text-sm text-[#1a1a1a] leading-relaxed">
                Kaya mo naman, pero ₱{formatWithCommas(Math.round(result.interestCost))} ang mapupunta sa interest.
                Kung mag-iipon ka ng <span className="font-extrabold text-[#00c853]">{formatPeso(result.savePerMonth)}/month</span>,
                mabibili mo &apos;to sa <span className="font-extrabold text-[#00c853]">{result.saveMonths} months</span> — at yung interest money, sa&apos;yo na &apos;yun.
              </p>
            </div>
          </div>
        )}
        </>
        )}

        {/* CTA */}
        <div className="mt-3 bg-white rounded-[20px] p-5 sm:p-6 text-center">
          <p className="text-sm text-[#888] mb-3">Gusto mo lumaki savings mo?</p>
          <Link href="/rates"
            className="inline-block bg-[#00c853] text-white font-bold text-sm px-6 py-3 rounded-full hover:bg-[#00a844] transition-colors no-underline">
            Compare rates →
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-sm font-bold text-[#888]">alkansya<span className="text-[#00c853]">.ph</span></span>
          <p className="text-[10px] text-[#aaa] max-w-md sm:text-right leading-relaxed">
            Guide lang &apos;to, hindi financial advice. Installment rates are estimates — iba-iba per provider. Always check the total cost bago mag-sign up.
          </p>
        </footer>
      </main>
    </div>
  );
}
