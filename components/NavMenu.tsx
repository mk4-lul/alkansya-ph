"use client";

import { useState } from "react";
import Link from "next/link";

const PAGES = [
  { label: "Home", href: "/", description: "All tools at a glance" },
  { label: "Compare Rates", href: "/rates", description: "Find the best rate for your money" },
  { label: "Compound Calculator", href: "/calculators/compound", description: "See how your money grows over time" },
  { label: "Pag-IBIG MP2 Calculator", href: "/calculators/mp2", description: "Tax-free government savings program" },
  { label: "Investment Calculator", href: "/calculators/investment", description: "What if you invested in Bitcoin, gold, stocks?" },
];

export default function NavMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {/* Burger button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-xl hover:bg-[#f0f0f0] transition-colors"
        aria-label="Menu">
        <span className={`block w-[18px] h-[2px] bg-[#1a1a1a] rounded-full transition-all ${open ? "rotate-45 translate-y-[7px]" : ""}`} />
        <span className={`block w-[18px] h-[2px] bg-[#1a1a1a] rounded-full transition-all ${open ? "opacity-0" : ""}`} />
        <span className={`block w-[18px] h-[2px] bg-[#1a1a1a] rounded-full transition-all ${open ? "-rotate-45 -translate-y-[7px]" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 bg-white rounded-2xl shadow-lg border border-black/5 w-[260px] p-2 animate-fade-in">
            {PAGES.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                onClick={() => setOpen(false)}
                className="flex flex-col px-4 py-3 rounded-xl hover:bg-[#f5f5f5] transition-colors no-underline">
                <span className="text-sm font-bold text-[#1a1a1a]">{page.label}</span>
                <span className="text-[11px] text-[#888]">{page.description}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
