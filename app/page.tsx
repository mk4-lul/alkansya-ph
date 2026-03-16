"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import NavMenu from "@/components/NavMenu";

function CountUp({ target, duration = 1200, suffix = "" }: { target: number; duration?: number; suffix?: string }) {
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

  const display = target >= 100 ? Math.round(value) : value.toFixed(target % 1 !== 0 ? 1 : 0);

  return <span ref={ref}>{display}{suffix}</span>;
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
        {/* Compare Rates — dramatic hero card */}
        <Link href="/rates" className="block bg-[#1a1a1a] rounded-[20px] p-8 sm:p-10 mb-3 relative overflow-hidden no-underline group">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }} />

          <div className="relative">
            {/* Headline */}
            <p className="text-[13px] font-bold uppercase tracking-[1.5px] text-[#00c853] mb-6">Compare Rates</p>

            {/* The big story */}
            <div className="mb-8">
              <p className="text-white/50 text-sm font-semibold mb-2">Digital banks pay up to</p>
              <div className="flex items-baseline gap-2">
                <p className="text-6xl sm:text-7xl font-extrabold tracking-tighter text-[#00c853] leading-none">
                  <CountUp target={60} suffix="×" />
                </p>
                <p className="text-white/40 text-sm font-semibold">more than traditional</p>
              </div>
            </div>

            {/* Visual comparison bars */}
            <div className="space-y-3 mb-8">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-white/40">Traditional avg</span>
                  <span className="text-[13px] font-extrabold text-white/50">0.10%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-white/20 transition-all duration-1000" style={{ width: "2%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-[#00c853]/70">Digital best</span>
                  <span className="text-[13px] font-extrabold text-[#00c853]">6.00%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-[#00c853] transition-all duration-1000" style={{ width: "100%" }} />
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <div className="bg-white/[0.06] rounded-xl px-4 py-2.5">
                  <p className="text-lg font-extrabold text-white"><CountUp target={17} /></p>
                  <p className="text-[10px] text-white/40 font-semibold">banks</p>
                </div>
                <div className="bg-white/[0.06] rounded-xl px-4 py-2.5">
                  <p className="text-lg font-extrabold text-white"><CountUp target={10} /></p>
                  <p className="text-[10px] text-white/40 font-semibold">traditional</p>
                </div>
                <div className="bg-white/[0.06] rounded-xl px-4 py-2.5">
                  <p className="text-lg font-extrabold text-white"><CountUp target={7} /></p>
                  <p className="text-[10px] text-white/40 font-semibold">digital</p>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#00c853] flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-white text-xl font-bold">→</span>
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
