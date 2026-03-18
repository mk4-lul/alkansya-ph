import type { Metadata } from "next";
import Link from "next/link";
import NavMenu from "@/components/NavMenu";

export const metadata: Metadata = {
  title: "Alkansya.ph — Free Financial Tools for Filipinos",
  description: "Compare bank interest rates, calculate compound interest, project Pag-IBIG MP2 dividends, and explore investment returns. Free tools built for Filipinos.",
  openGraph: {
    title: "Alkansya.ph — Free Financial Tools for Filipinos",
    description: "Compare bank rates, calculate compound interest, and more. Built for Filipinos.",
    url: "https://alkansya.ph",
  },
};

const OTHER_TOOLS = [
  {
    href: "/compound",
    emoji: "📈",
    title: "Compounding Calculator",
    description: "See how your money grows with compound interest over time",
    tag: "calculator",
  },
  {
    href: "/mp2",
    emoji: "🏛️",
    title: "Pag-IBIG MP2 Income Calculator",
    description: "Tax-free government savings — project your MP2 dividends",
    tag: "calculator",
  },
  {
    href: "/investment",
    emoji: "🔮",
    title: "Historical Investment Calculator",
    description: "What if you invested in Bitcoin, gold, or stocks years ago?",
    tag: "9 assets",
  },
  {
    href: "/utang",
    emoji: "💸",
    title: "Magkano Ang Nawawala Mo Sa Pag-Utang",
    description: "Alamin ang totoong cost ng utang mo — credit card, 5-6, online lending",
    tag: "calculator",
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
        <div className="space-y-2">
          {/* USD/PHP — top card */}
          <Link href="/usdphp"
            className="flex items-center gap-4 bg-white rounded-[20px] px-5 py-5 no-underline hover:bg-[#fafafa] transition-colors group">
            <span className="text-3xl shrink-0">💱</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-[15px] font-bold text-[#1a1a1a]">USD to PHP Converter</p>
                <span className="text-[10px] font-semibold text-[#00c853] bg-[#00c853]/10 px-2 py-0.5 rounded-full">forex</span>
              </div>
              <p className="text-[12px] text-[#888] leading-relaxed">Live exchange rate with historical chart — updated every minute</p>
            </div>
            <span className="text-[#ccc] text-lg group-hover:text-[#1a1a1a] transition-colors shrink-0">→</span>
          </Link>

          {/* Compare Rates */}
          <Link href="/rates"
            className="flex items-center gap-4 bg-white rounded-[20px] px-5 py-5 no-underline hover:bg-[#fafafa] transition-colors group">
            <span className="text-3xl shrink-0">💰</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-[15px] font-bold text-[#1a1a1a]">Compare Bank Interest Rates</p>
                <span className="text-[10px] font-semibold text-[#00c853] bg-[#00c853]/10 px-2 py-0.5 rounded-full">17 banks</span>
              </div>
              <p className="text-[12px] text-[#888] leading-relaxed">Find the best savings and time deposit rates across Philippine banks</p>
            </div>
            <span className="text-[#ccc] text-lg group-hover:text-[#1a1a1a] transition-colors shrink-0">→</span>
          </Link>

          {/* Other tools */}
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

        {/* Meme tools — 2 columns */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          {[
            {
              href: "/afford", emoji: "🛍️", title: "Afford ko ba 'to?",
              description: "Alamin kung kaya mo ba bago bilhin",
              tag: "calculator",
              gradient: "linear-gradient(135deg, #FF9800 0%, #FFE0B2 100%)",
            },
            {
              href: "/what-if", emoji: "🥇", title: "What if nag-invest ka nalang?",
              description: "Sana nag-invest ka nalang...",
              tag: "data",
              gradient: "linear-gradient(135deg, #FFD600 0%, #FFF9C4 100%)",
            },
            {
              href: "/gkk", emoji: "💰", title: "Gaano ako kayaman?",
              description: "Nasaan ka sa income ranking ng mga Pilipino?",
              tag: "data",
              gradient: "linear-gradient(135deg, #00c853 0%, #B9F6CA 100%)",
            },
          ].map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="flex items-start gap-3 rounded-[20px] px-4 py-4 no-underline group hover:scale-[1.01] transition-transform overflow-hidden"
              style={{ background: tool.gradient }}>
              <span className="text-2xl shrink-0 mt-0.5">{tool.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <p className="text-[13px] font-bold text-[#1a1a1a] leading-tight">{tool.title}</p>
                  <span className="text-[9px] font-semibold text-[#1a1a1a]/50 bg-[#1a1a1a]/10 px-1.5 py-0.5 rounded-full">{tool.tag}</span>
                </div>
                <p className="text-[11px] text-[#1a1a1a]/50 leading-snug">{tool.description}</p>
              </div>
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
