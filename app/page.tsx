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

const TRENDING = [
  {
    href: "/gkk",
    title: "Gaano ako kayaman?",
    description: "Nasaan ka sa income ranking ng mga Pilipino?",
    tag: "data",
    image: "/cards/gkk.png",
  },
  {
    href: "/what-if",
    title: "What if bitcoin nalang ang binili mo?",
    description: "Sana nag-invest ka nalang...",
    tag: "data",
    image: "/cards/whatif.png",
  },
  {
    href: "/afford",
    title: "Afford ko ba 'to?",
    description: "Alamin kung kaya mo ba bago bilhin",
    tag: "calculator",
    image: "/cards/afford.png",
  },
];

const TOOLS = [
  {
    href: "/usdphp",
    emoji: "💱",
    title: "USD to PHP Converter",
    description: "Live exchange rate with historical chart — updated every minute",
    tag: "forex",
  },
  {
    href: "/gold",
    emoji: "🥇",
    title: "Gold Price in PHP",
    description: "Live gold spot price with historical chart — updated daily",
    tag: "live",
  },
  {
    href: "/rates",
    emoji: "💰",
    title: "Compare Bank Interest Rates",
    description: "Find the best savings and time deposit rates across Philippine banks",
    tag: "17 banks",
  },
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
  {
    href: "/salary",
    emoji: "✈️",
    title: "Magkano Sahod Abroad?",
    description: "Compare estimated salaries across 12 countries",
    tag: "12 countries",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] relative">
      {/* Nav */}
      <nav className="flex justify-between items-center px-4 sm:px-6 py-4 max-w-[720px] mx-auto">
        <span className="text-xl font-extrabold tracking-tight text-[#1a1a1a]">
          alkansya<span className="text-[#00c853]">.ph</span>
        </span>
        <NavMenu />
      </nav>

      <main className="max-w-[720px] mx-auto pb-8">

        {/* Trending — horizontal scroll */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 px-4 sm:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888]">Explore</p>
            <p className="text-[12px] font-semibold text-[#aaa]">{"\u2039"} {"\u203A"}</p>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 sm:px-6 pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
            {TRENDING.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="snap-start min-w-[220px] sm:min-w-[240px] h-[300px] sm:h-[320px] rounded-[20px] shrink-0 relative overflow-hidden no-underline group hover:scale-[1.02] transition-transform"
              >
                {/* Background image */}
                <img
                  src={item.image}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Bottom gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                {/* Content at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.5px] text-white/50 bg-white/15 px-2 py-0.5 rounded-full backdrop-blur-sm">{item.tag}</span>
                  <p className="text-[17px] sm:text-[18px] font-extrabold text-white leading-tight mt-2 tracking-tight">{item.title}</p>
                  <p className="text-[11px] text-white/60 mt-1 leading-snug">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Tools */}
        <div className="px-4 sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-2">Tools</p>
          <div className="space-y-2">
            {TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="flex items-center gap-4 bg-white rounded-[20px] px-5 py-5 no-underline hover:bg-[#fafafa] transition-colors group"
              >
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
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-4 px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-sm font-bold text-[#888]">alkansya<span className="text-[#00c853]">.ph</span></span>
          <p className="text-[10px] text-[#aaa] max-w-md sm:text-right leading-relaxed">
            Independent financial tools for Filipinos. Not a financial advisor, broker, or bank.
          </p>
        </footer>
      </main>

      {/* Hide scrollbar */}
      <style>{`
        .snap-x::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
