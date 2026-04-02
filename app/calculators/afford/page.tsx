"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import NavMenu from "@/components/NavMenu";

function formatPeso(v: number): string {
  if (v >= 1_000_000) return `₱${(v / 1_000_000).toFixed(1)}M`;
  return `₱${Math.round(v).toLocaleString("en-PH")}`;
}
function fmtC(n: number): string { return n.toLocaleString("en-PH"); }

type Verdict = "green" | "yellow" | "red";
interface VR {
  verdict: Verdict; daysOfWork: number; percentOfIncome: number; monthsToSave: number;
  emoji: string; title: string; subtitle: string; message: string;
}

function getVerdict(income: number, price: number, savings: number): VR {
  // Special case: no income
  if (income === 0) {
    return { verdict: "red", daysOfWork: 999, percentOfIncome: 999, monthsToSave: 999,
      emoji: "🤡", title: "Ha???", subtitle: "Wala kang trabaho tapos gagastos ka?",
      message: "Ayos ka lang? Maghanap ka muna ng pera bago mag-shopping. Priorities, pre." };
  }

  // Special case: no savings
  if (savings === 0) {
    const daily = income / 22, days = price / daily, pct = (price / income) * 100;
    return { verdict: "red", daysOfWork: days, percentOfIncome: pct, monthsToSave: 999,
      emoji: "🤦", title: "Seryoso ka?", subtitle: "Wala kang naiipon tapos gagastos ka?",
      message: `${days.toFixed(0)} araw ng trabaho 'to — ${pct.toFixed(0)}% ng sahod mo. Tapos zero savings? Kupal ka?` };
  }

  const daily = income / 22, days = price / daily, pct = (price / income) * 100;
  const mos = Math.ceil(price / savings);
  let v: Verdict, e: string, t: string, s: string, m: string;

  if (pct <= 10) {
    v="green";e="✅";t="Bili na!";s="Kayang kaya naman.";
    m=`${days.toFixed(1)} araw ng trabaho lang. ${pct.toFixed(0)}% ng sahod mo. Go na.`;
  } else if (pct <= 30 && mos <= 2) {
    v="green";e="👍";t="G naman.";s="Kayang kaya.";
    m=`${days.toFixed(1)} araw ng trabaho — ${pct.toFixed(0)}% ng sahod. ${mos === 1 ? "Isang buwan" : `${mos} months`} lang na ipon.`;
  } else if (pct <= 30) {
    v="green";e="🤙";t="G lang.";s="Basta may disiplina.";
    m=`${days.toFixed(1)} araw ng trabaho. Sa ₱${fmtC(savings)}/mo na ipon, mga ${mos} months.`;
  } else if (pct <= 60 && mos <= 3) {
    v="yellow";e="🫠";t="Medyo mahal ah...";s="Pag isipan mo muna.";
    m=`${days.toFixed(0)} araw ng trabaho — ${pct.toFixed(0)}% ng sahod. ${mos} months na ipon. Ang luwag ng wallet... kasi wala nang laman.`;
  } else if (pct <= 60) {
    v="yellow";e="🤨";t="Hmm, sure ka ba?";s="Matagal na pag ipon to.";
    m=`${days.toFixed(0)} araw ng trabaho. Sa ₱${fmtC(savings)}/mo, ${mos} months bago mo mabili. Tiis muna.`;
  } else if (pct <= 100) {
    v="red";e="🚫";t="Huy, wag!";s="'Di mo pa afford pre.";
    m=`${days.toFixed(0)} araw ng trabaho — ${pct.toFixed(0)}% ng sahod. Halos buong sweldo. ${mos <= 12 ? `${mos} months ipon pa.` : "Matagal pa, pero kaya yan!"}`;
  } else if (pct <= 200) {
    v="red";e="💀";t="Luh, grabe.";s="Mas mahal pa sa sahod mo.";
    m=`${days.toFixed(0)} araw ng trabaho. Kahit di ka kumain, kulang pa rin. ${mos} months pa 'to.`;
  } else {
    v="red";e="🪦";t="Ok ka lang??";s="Ilang buwan na sahod to.";
    m=`${Math.ceil(pct/100)} months na sahod mo 'to. ${mos} months ipon. Gamitin ang brain.`;
  }
  return { verdict:v, daysOfWork:days, percentOfIncome:pct, monthsToSave:mos, emoji:e, title:t, subtitle:s, message:m };
}

function VerdictCard({ result, onTryAgain }: { result: VR; onTryAgain: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 80); return () => clearTimeout(t); }, []);

  const bg = result.verdict === "green" ? "#00c853" : result.verdict === "yellow" ? "#FFB300" : "#D32F2F";
  const tc = result.verdict === "yellow" ? "#1a1a1a" : "#fff";
  const sc = result.verdict === "yellow" ? "rgba(26,26,26,0.5)" : "rgba(255,255,255,0.6)";
  const dc = result.verdict === "yellow" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)";
  const bb = result.verdict === "yellow" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.15)";
  const bh = result.verdict === "yellow" ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.25)";

  async function handleShare() {
    const w = 600, h = 600;
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d")!;

    // Background
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 32);
    ctx.fill();

    // Measure message height first for centering
    ctx.font = "14px Inter, system-ui, sans-serif";
    const words = result.message.split(" ");
    let msgLines: string[] = [];
    let line = "";
    for (const word of words) {
      const test = line + word + " ";
      if (ctx.measureText(test).width > w - 120) {
        msgLines.push(line.trim());
        line = word + " ";
      } else {
        line = test;
      }
    }
    msgLines.push(line.trim());
    const msgHeight = msgLines.length * 20;

    // Total content height: emoji(70) + gap(15) + title(40) + gap(10) + subtitle(20) + gap(20) + message + gap(40) + stats(45)
    const contentH = 70 + 15 + 40 + 10 + 20 + 20 + msgHeight + 40 + 45;
    const brandingH = 50;
    const startY = (h - brandingH - contentH) / 2;

    ctx.textAlign = "center";

    // Emoji
    ctx.font = "70px serif";
    ctx.fillText(result.emoji, w / 2, startY + 60);

    // Title
    ctx.font = "bold 38px Inter, system-ui, sans-serif";
    ctx.fillStyle = tc;
    ctx.fillText(result.title, w / 2, startY + 60 + 15 + 38);

    // Subtitle
    const subColor = result.verdict === "yellow" ? "rgba(26,26,26,0.5)" : "rgba(255,255,255,0.6)";
    ctx.font = "600 16px Inter, system-ui, sans-serif";
    ctx.fillStyle = subColor;
    const subtitleY = startY + 60 + 15 + 38 + 10 + 18;
    ctx.fillText(result.subtitle, w / 2, subtitleY);

    // Message
    ctx.font = "14px Inter, system-ui, sans-serif";
    ctx.fillStyle = subColor;
    let msgY = subtitleY + 30;
    for (const l of msgLines) {
      ctx.fillText(l, w / 2, msgY);
      msgY += 20;
    }

    // Stats
    const statsY = msgY + 35;
    const col1 = w / 2 - 150;
    const col2 = w / 2;
    const col3 = w / 2 + 150;

    ctx.fillStyle = tc;
    ctx.font = "bold 30px Inter, system-ui, sans-serif";
    ctx.fillText(result.daysOfWork >= 999 ? "—" : result.daysOfWork.toFixed(1), col1, statsY);
    ctx.fillText(result.percentOfIncome >= 999 ? "—" : result.percentOfIncome.toFixed(0) + "%", col2, statsY);
    ctx.fillText(result.monthsToSave >= 999 ? "—" : String(result.monthsToSave), col3, statsY);

    ctx.font = "bold 9px Inter, system-ui, sans-serif";
    ctx.fillStyle = subColor;
    ctx.fillText("ARAW NG TRABAHO", col1, statsY + 18);
    ctx.fillText("NG SAHOD", col2, statsY + 18);
    ctx.fillText("MONTHS IPON", col3, statsY + 18);

    // Dividers
    ctx.strokeStyle = result.verdict === "yellow" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    const divX1 = (col1 + col2) / 2;
    const divX2 = (col2 + col3) / 2;
    ctx.beginPath(); ctx.moveTo(divX1, statsY - 22); ctx.lineTo(divX1, statsY + 22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(divX2, statsY - 22); ctx.lineTo(divX2, statsY + 22); ctx.stroke();

    // Branding — always at bottom
    ctx.font = "bold 16px Inter, system-ui, sans-serif";
    ctx.fillStyle = tc;
    ctx.fillText("sentral.ph", w / 2, h - 35);
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillStyle = result.verdict === "yellow" ? "rgba(26,26,26,0.3)" : "rgba(255,255,255,0.3)";
    ctx.fillText("Afford ko ba 'to?", w / 2, h - 16);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "afford-ko-ba-to.png", { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "Afford ko ba 'to?", text: "sentral.ph/afford" });
        } catch {}
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "afford-ko-ba-to.png"; a.click();
        URL.revokeObjectURL(url);
      }
    }, "image/png");
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center" style={{ perspective: "800px" }}>
      <div className="rounded-3xl px-5 py-6 sm:px-8 sm:py-8 w-full max-w-[520px] text-center transition-all duration-500"
        style={{ background: bg, color: tc,
          transform: show ? "scale(1) rotateX(0deg)" : "scale(0.85) rotateX(-12deg)", opacity: show ? 1 : 0,
        }}>

        <p className="text-[72px] sm:text-[90px] leading-none mb-1" style={{
          transition: "transform 0.6s cubic-bezier(0.34,1.56,0.64,1)", transform: show ? "scale(1)" : "scale(0.2)",
        }}>{result.emoji}</p>

        <p className="text-3xl sm:text-5xl font-black tracking-tight leading-none mb-1" style={{
          transition: "transform 0.5s 0.1s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s 0.1s",
          transform: show ? "translateY(0)" : "translateY(30px)", opacity: show ? 1 : 0,
        }}>{result.title}</p>

        <p className="text-sm sm:text-base font-semibold mb-3" style={{ color: sc, transition: "opacity 0.4s 0.2s", opacity: show ? 1 : 0 }}>
          {result.subtitle}
        </p>

        <p className="text-xs sm:text-[13px] leading-relaxed max-w-sm mx-auto mb-5" style={{ color: sc, transition: "opacity 0.4s 0.3s", opacity: show ? 1 : 0 }}>
          {result.message}
        </p>

        <div className="flex justify-center gap-4 sm:gap-6 mb-5" style={{
          transition: "opacity 0.4s 0.35s, transform 0.4s 0.35s", opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(10px)",
        }}>
          <div>
            <p className="text-2xl sm:text-3xl font-black">{result.daysOfWork.toFixed(1)}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: sc }}>araw ng trabaho</p>
          </div>
          <div style={{ width: 1, background: dc, alignSelf: "stretch" }} />
          <div>
            <p className="text-2xl sm:text-3xl font-black">{result.percentOfIncome.toFixed(0)}%</p>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: sc }}>ng sahod</p>
          </div>
          <div style={{ width: 1, background: dc, alignSelf: "stretch" }} />
          <div>
            <p className="text-2xl sm:text-3xl font-black">{result.monthsToSave >= 999 ? "—" : result.monthsToSave}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: sc }}>months ipon</p>
          </div>
        </div>

        <div className="flex justify-center gap-2" style={{ transition: "opacity 0.4s 0.45s", opacity: show ? 1 : 0 }}>
          <button onClick={onTryAgain}
            className="px-5 py-2.5 rounded-full text-sm font-bold transition-colors"
            style={{ background: bb, color: tc }}
            onMouseEnter={(e) => e.currentTarget.style.background = bh}
            onMouseLeave={(e) => e.currentTarget.style.background = bb}
          >Try again ↻</button>
          <button onClick={handleShare}
            className="px-5 py-2.5 rounded-full text-sm font-bold transition-colors"
            style={{ background: bb, color: tc }}
            onMouseEnter={(e) => e.currentTarget.style.background = bh}
            onMouseLeave={(e) => e.currentTarget.style.background = bb}
          >Share 📤</button>
        </div>
      </div>
    </div>
  );
}

export default function AffordCalculatorPage() {
  const [income, setIncome] = useState(0);
  const [price, setPrice] = useState(0);
  const [savings, setSavings] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const isReady = price > 0;
  const result = useMemo(() => isReady ? getVerdict(income, price, savings) : null, [income, price, savings, isReady]);

  return (
    <div className="h-[100dvh] bg-[#f5f5f5] flex flex-col overflow-hidden relative glow-bg">
      <style>{`
        input[type="range"] { -webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:999px;outline:none;cursor:pointer; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance:none;appearance:none;width:28px;height:28px;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.2);cursor:grab; }
        input[type="range"]::-webkit-slider-thumb:active { cursor:grabbing;transform:scale(1.1); }
        input[type="range"]::-moz-range-thumb { width:28px;height:28px;border-radius:50%;border:none;box-shadow:0 2px 8px rgba(0,0,0,0.2);cursor:grab; }
        .slider-green::-webkit-slider-thumb { background:#00c853; }
        .slider-green::-moz-range-thumb { background:#00c853; }
        .slider-red::-webkit-slider-thumb { background:#E53935; }
        .slider-red::-moz-range-thumb { background:#E53935; }
        .slider-orange::-webkit-slider-thumb { background:#FF9800; }
        .slider-orange::-moz-range-thumb { background:#FF9800; }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 0 0 rgba(0,200,83,0.4)} 50%{box-shadow:0 0 0 10px rgba(0,200,83,0)} }
      `}</style>

      {/* Raining emoji background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {['👕','🕶','👗','👜','🎒','💄','💍','🐶','🍺','🥂','🍾','✈️','⌚️','📱','💻','🛍️','🚗','🚲','🛵','🏍','🛻','💎','📺','🎁','🔫','🚴🏼‍♀️'].map((e, i) => (
          <span key={i} className="absolute emoji-rain text-3xl sm:text-4xl" style={{
            left: `${(i * 6.25)}%`,
            opacity: 0.1,
            '--rain-speed': `${12 + (i % 5) * 4}s`,
            '--rain-delay': `${-((i * 1.9) % 20)}s`,
            '--rain-spin': `${(i % 2 === 0 ? 1 : -1) * (10 + i * 8)}deg`,
          } as React.CSSProperties}>{e}</span>
        ))}
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex justify-between items-center px-4 py-2 max-w-[720px] mx-auto w-full shrink-0">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-[#1a1a1a] no-underline">
          <span className="text-[#00e401]" style={{fontFamily:"var(--font-old-english)"}}>Sentral</span>
        </Link>
        <NavMenu />
      </nav>

      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col justify-center max-w-[520px] mx-auto px-5 w-full min-h-0">

        {!revealed ? (
          <div>
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-[#1a1a1a] tracking-tight leading-none text-center mb-6">
              Afford ko ba &apos;to?
            </h1>

            {/* 3 Sliders */}
            <div className="space-y-6">
              {/* Sahod */}
              <div className="text-center">
                <p className="text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1">Sahod mo per month</p>
                <p className="text-2xl sm:text-3xl font-black text-[#1a1a1a] mb-2">
                  {income === 0 ? <span className="text-[#ccc]">₱—</span> : formatPeso(income)}
                </p>
                <input type="range" min="0" max="100000" step="500" value={income}
                  className="slider-green"
                  onChange={(e) => { const v = Number(e.target.value); setIncome(v); setPrice(p => Math.min(p, v * 20)); setSavings(s => Math.min(s, v)); }}
                  style={{ background: `linear-gradient(to right, #4cdf8b ${(income/100000)*100}%, #ddd ${(income/100000)*100}%)` }}
                />
              </div>

              {/* Natitipid */}
              <div className="text-center">
                <p className="text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1">Natitipid mo kada buwan</p>
                <p className="text-2xl sm:text-3xl font-black text-[#1a1a1a] mb-2">
                  {savings === 0 ? <span className="text-[#ccc]">₱—</span> : formatPeso(savings)}
                </p>
                <input type="range" min="0" max={income || 100000} step="500" value={savings}
                  className="slider-orange"
                  onChange={(e) => setSavings(Math.min(Number(e.target.value), income || 100000))}
                  style={{ background: `linear-gradient(to right, #FFB74D ${(savings/(income||1))*100}%, #ddd ${(savings/(income||1))*100}%)` }}
                />
              </div>

              {/* Presyo */}
              <div className="text-center">
                <p className="text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1">Presyo ng gusto mo</p>
                <p className="text-2xl sm:text-3xl font-black text-[#1a1a1a] mb-2">
                  {price === 0 ? <span className="text-[#ccc]">₱—</span> : formatPeso(price)}
                </p>
                <input type="range" min="0" max={income * 20 || 500000} step="250" value={price}
                  className="slider-red"
                  onChange={(e) => setPrice(Number(e.target.value))}
                  style={{ background: `linear-gradient(to right, #ef5350 ${(price/(income * 20 || 500000))*100}%, #ddd ${(price/(income * 20 || 500000))*100}%)` }}
                />
              </div>
            </div>

            {/* Button — right after sliders */}
            <div className="mt-6 text-center">
              <button
                onClick={() => isReady && setRevealed(true)}
                disabled={!isReady}
                className={`px-6 py-2.5 rounded-full text-sm font-bold tracking-tight transition-all ${
                  isReady ? "bg-[#00c853] text-white active:scale-[0.97]" : "bg-[#e0e0e0] text-[#aaa] cursor-not-allowed"
                }`}
                style={isReady ? { animation: "pulse-glow 2s ease infinite" } : undefined}
              >Afford ko ba &apos;to?</button>
            </div>
          </div>
        ) : result ? (
          <VerdictCard result={result} onTryAgain={() => { setRevealed(false); setIncome(0); setPrice(0); setSavings(0); }} />
        ) : null}
      </main>
    </div>
  );
}
