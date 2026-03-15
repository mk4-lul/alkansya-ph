import Link from "next/link";
import NavMenu from "@/components/NavMenu";

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
        {/* Compare Rates — main hero card */}
        <Link href="/rates" className="block bg-[#00c853] rounded-[20px] p-8 sm:p-10 mb-3 relative overflow-hidden no-underline group hover:bg-[#00b84a] transition-colors">
          {/* Subtle floating ₱ symbols instead of emojis */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
            <span className="absolute text-[120px] sm:text-[160px] font-extrabold text-white/[0.04] -top-4 -right-4 leading-none">₱</span>
            <span className="absolute text-[80px] sm:text-[100px] font-extrabold text-white/[0.04] bottom-2 left-4 leading-none">₱</span>
            <span className="absolute text-[60px] font-extrabold text-white/[0.04] top-8 left-[30%] leading-none rotate-12">₱</span>
          </div>
          <div className="relative">
            <p className="text-lg font-bold text-white mb-2">Compare Rates</p>
            <p className="text-[13px] text-white/70 leading-relaxed mb-6 max-w-sm">
              Find the best savings and time deposit rates across Philippine banks — traditional and digital.
            </p>
            <div className="flex gap-3">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5">
                <p className="text-xl font-extrabold text-white">17</p>
                <p className="text-[10px] text-white/60 font-semibold">banks</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5">
                <p className="text-xl font-extrabold text-white">10</p>
                <p className="text-[10px] text-white/60 font-semibold">traditional</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5">
                <p className="text-xl font-extrabold text-white">7</p>
                <p className="text-[10px] text-white/60 font-semibold">digital</p>
              </div>
              <div className="flex-1 flex items-center justify-end">
                <span className="text-white/40 text-3xl group-hover:text-white transition-colors">→</span>
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
