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
    title: "Compound Calculator",
    description: "See how your money grows with compound interest over time",
    tag: "calculator",
  },
  {
    href: "/mp2",
    emoji: "🏛️",
    title: "Pag-IBIG MP2",
    description: "Tax-free government savings — project your MP2 dividends",
    tag: "tax-free",
  },
  {
    href: "/investment",
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
        {/* All tools */}
        <div className="space-y-2">
          {/* Compare Rates */}
          <Link href="/rates"
            className="flex items-center gap-4 bg-white rounded-[20px] px-5 py-5 no-underline hover:bg-[#fafafa] transition-colors group">
            <span className="text-3xl shrink-0">💰</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-[15px] font-bold text-[#1a1a1a]">Compare Rates</p>
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
          <Link href="/afford"
            className="flex items-center gap-3 rounded-[20px] px-4 py-4 no-underline group hover:scale-[1.01] transition-transform overflow-hidden"
            style={{ background: "linear-gradient(135deg, #FF9800 0%, #FFB74D 50%, #fff 100%)" }}>
            <span className="text-2xl shrink-0">🛍️</span>
            <p className="text-[13px] font-bold text-[#1a1a1a] leading-tight">Afford ko ba &apos;to?</p>
          </Link>
          <Link href="/what-if"
            className="flex items-center gap-3 rounded-[20px] px-4 py-4 no-underline group hover:scale-[1.01] transition-transform overflow-hidden"
            style={{ background: "linear-gradient(135deg, #FFD600 0%, #FFF176 50%, #fff 100%)" }}>
            <span className="text-2xl shrink-0">🥇</span>
            <p className="text-[13px] font-bold text-[#1a1a1a] leading-tight">What if nag-invest ka nalang?</p>
          </Link>
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
