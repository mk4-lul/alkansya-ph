import Link from "next/link";
import NavMenu from "@/components/NavMenu";

const TOOLS = [
  {
    href: "/rates",
    emoji: "💰",
    title: "Compare Rates",
    description: "Find the best savings and time deposit rates across 17 banks",
    tag: "17 banks",
  },
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
        {/* Hero */}
        <div className="bg-[#00c853] rounded-[20px] p-8 sm:p-12 mb-3 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
            {['💵','💰','💸','💎','🤑','📈','💵','💰','💸','💎','🤑','📈','💵','💰','💸','💎','🤑','📈','💵','💰','💸','💎','🤑','📈','💵','💰','💸','💎','🤑','📈'].map((e, i) => (
              <span key={i} className="absolute text-[22px] sm:text-[28px]" style={{
                left: `${(i * 17.3 + i * i * 3.7) % 100}%`,
                top: `${(i * 13.1 + i * i * 2.3) % 100}%`,
                opacity: 0.75,
                transform: `rotate(${(i * 37) % 360}deg)`,
              }}>{e}</span>
            ))}
          </div>
          <div className="relative text-center">
            <p className="text-lg font-bold text-white mb-2">Make your money work harder</p>
            <p className="text-[13px] text-white/70 max-w-sm mx-auto leading-relaxed">
              Compare rates, calculate returns, and find the best place for your peso.
            </p>
          </div>
        </div>

        {/* Tool cards */}
        <div className="space-y-2">
          {TOOLS.map((tool) => (
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
