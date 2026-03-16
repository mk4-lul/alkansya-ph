"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import NavMenu from "@/components/NavMenu";

function CountUp({ target, duration = 1000, suffix = "", decimals = 0 }: { target: number; duration?: number; suffix?: string; decimals?: number }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          function tick(now: number) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(target * eased);
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{value.toFixed(decimals)}{suffix}</span>;
}

const OTHER_TOOLS = [
  {
    href: "/calculators/compound",
    emoji: "📈",
    title: "Compound Calculator",
    description: "See how your money grows with compound interest over time",
    tag: "calculator",
  },
  {
    href: "/calculators/mp2",
    emoji: "🏛️",
    title: "Pag-IBIG MP2",
    description: "Tax-free government savings — project your MP2 dividends",
    tag: "tax-free",
  },
  {
    href: "/calculators/investment",
    emoji: "🔮",
    title: "Investment Calculator",
    description: "What if you invested in Bitcoin, gold, or stocks years ago?",
    tag: "9 assets",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Nav */}
      <nav className="flex justify-between items-center px-4 sm:px-6 py-4 max-w-[720px] mx-auto">
        <span className="text-xl font-extrabold tracking-tight text-[#1a1a1a]">
          alkansya<span className="text-[#00c853]">.ph</span>
        </span>
        <NavMenu />
      </nav>

      <main className="max-w-[720px] mx-auto px-4 sm:px-6 pb-8">
        {/* Compare Rates — hero card */}
        <Link href="/rates" className="block bg-[#00c853] rounded-[20px] p-8 sm:p-10 mb-3 relative overflow-hidden no-underline group hover:bg-[#00b84a] transition-colors">
          {/* Animated floating ₱ watermarks */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
            <span className="absolute text-[140px] sm:text-[180px] font-extrabold text-white/[0.06] -top-6 -right-6 leading-none emoji-float" style={{
              '--base-rotate': 'rotate(-12deg)',
              '--float-duration': '8s',
              '--float-delay': '0s',
            } as React.CSSProperties}>₱</span>
            <span className="absolute text-[90px] sm:text-[110px] font-extrabold text-white/[0.05] bottom-0 left-2 leading-none emoji-float" style={{
              '--base-rotate': 'rotate(8deg)',
              '--float-duration': '10s',
              '--float-delay': '-3s',
            } as React.CSSProperties}>₱</span>
            <span className="absolute text-[60px] sm:text-[70px] font-extrabold text-white/[0.04] top-10 left-[35%] leading-none emoji-float" style={{
              '--base-rotate': 'rotate(15deg)',
              '--float-duration': '12s',
              '--float-delay': '-6s',
            } as React.CSSProperties}>₱</span>
          </div>

          <div className="relative">
            {/* Title + description */}
            <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">Compare Rates</p>
            <p className="text-[13px] text-white/70 leading-relaxed mb-8 max-w-sm">
              Find the best savings and time deposit rates across Philippine banks.
            </p>

            {/* Rate range — the big visual */}
            <div className="flex items-end gap-1 mb-8">
              <p className="text-5xl sm:text-6xl font-extrabold tracking-tighter text-white leading-none">
                <CountUp target={0.005} decimals={3} suffix="%" />
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-white/40 pb-1 px-2">→</p>
              <p className="text-5xl sm:text-6xl font-extrabold tracking-tighter text-white leading-none">
                <CountUp target={6.0} decimals={1} suffix="%" />
              </p>
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2.5">
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5">
                  <p className="text-xl font-extrabold text-white"><CountUp target={17} /></p>
                  <p className="text-[10px] text-white/50 font-semibold">banks</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5">
                  <p className="text-xl font-extrabold text-white"><CountUp target={10} /></p>
                  <p className="text-[10px] text-white/50 font-semibold">traditional</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5">
                  <p className="text-xl font-extrabold text-white"><CountUp target={7} /></p>
                  <p className="text-[10px] text-white/50 font-semibold">digital</p>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <span className="text-white text-xl">→</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Other tools */}
        <div className="space-y-2">
          {OTHER_TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="flex items-center gap-4 bg-white rounded-[20px] px-5 py-5 no-underline hover:bg-[#fafafa] transition-colors group">
              <span className="text-3xl shrink-0">{tool.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[15px] font-bold text-[#1a1a1a]">{tool.title}</p>
                  <span className="text-[10px] font-semibold text-[#00c853] bg-[#00c853]/10 px-2 py-0.5 rounded-full">{tool.tag}</span>
                </div>
                <p className="text-[12px] text-[#888] leading-relaxed">{tool.description}</p>
              </div>
              <span className="text-[#ccc] text-lg group-hover:text-[#1a1a1a] transition-colors shrink-0">→</span>
            </Link>
          ))}
        </div>

        {/* Afford ko ba 'to — meme card */}
        <Link href="/calculators/afford"
          className="block mt-2 rounded-[20px] px-5 py-4 no-underline group hover:scale-[1.01] transition-transform overflow-hidden relative"
          style={{ background: "linear-gradient(135deg, #FF9800 0%, #FFB74D 50%, #fff 100%)" }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛍️</span>
            <div className="flex-1">
              <p className="text-[15px] font-black text-[#1a1a1a]">Afford ko ba &apos;to?</p>
            </div>
            <span className="text-[#1a1a1a]/30 text-lg group-hover:text-[#1a1a1a] transition-colors shrink-0">→</span>
          </div>
        </Link>

        {/* Footer */}
        <footer className="mt-8 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-sm font-bold text-[#888]">alkansya<span className="text-[#00c853]">.ph</span></span>
          <p className="text-[10px] text-[#aaa] max-w-md sm:text-right leading-relaxed">
            Independent financial tools for Filipinos. Not a financial advisor, broker, or bank.
          </p>
        </footer>
      </main>
    </div>
  );
}
