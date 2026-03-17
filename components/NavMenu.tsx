"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const PAGES = [
  { label: "Home", href: "/", description: "All tools at a glance" },
  { label: "Compare Rates", href: "/rates", description: "Find the best rate for your money" },
  { label: "Compound Calculator", href: "/calculators/compound", description: "See how your money grows over time" },
  { label: "Pag-IBIG MP2 Calculator", href: "/calculators/mp2", description: "Tax-free government savings program" },
  { label: "Investment Calculator", href: "/calculators/investment", description: "What if you invested in Bitcoin, gold, stocks?" },
  { label: "Afford ko ba 'to?", href: "/calculators/afford", description: "Alamin bago bilhin" },
  { label: "What if nag-invest ka nalang?", href: "/what-if", description: "Sana nag-invest ka nalang..." },
];

export default function NavMenu({ dark = false }: { dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const lineColor = dark ? "bg-white" : "bg-[#1a1a1a]";
  const hoverBg = dark ? "hover:bg-white/10" : "hover:bg-[#f0f0f0]";

  return (
    <div className="relative">
      {/* Burger button */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-xl ${hoverBg} transition-colors`}
        aria-label="Menu">
        <span className={`block w-[18px] h-[2px] ${lineColor} rounded-full transition-all ${open ? "rotate-45 translate-y-[7px]" : ""}`} />
        <span className={`block w-[18px] h-[2px] ${lineColor} rounded-full transition-all ${open ? "opacity-0" : ""}`} />
        <span className={`block w-[18px] h-[2px] ${lineColor} rounded-full transition-all ${open ? "-rotate-45 -translate-y-[7px]" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 bg-white rounded-2xl shadow-lg border border-black/5 w-[260px] p-2 animate-fade-in">
            {PAGES.map((page) => {
              const isCurrent = pathname === page.href;
              return isCurrent ? (
                <div
                  key={page.href}
                  className="flex flex-col px-4 py-3 rounded-xl opacity-40 cursor-default">
                  <span className="text-sm font-bold text-[#1a1a1a]">{page.label}</span>
                  <span className="text-[11px] text-[#888]">{page.description}</span>
                </div>
              ) : (
                <Link
                  key={page.href}
                  href={page.href}
                  onClick={() => setOpen(false)}
                  className="flex flex-col px-4 py-3 rounded-xl hover:bg-[#f5f5f5] transition-colors no-underline">
                  <span className="text-sm font-bold text-[#1a1a1a]">{page.label}</span>
                  <span className="text-[11px] text-[#888]">{page.description}</span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
