"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function MarketCards() {
  const [usdPhp, setUsdPhp] = useState(0);
  const [goldUsd, setGoldUsd] = useState(0);

  useEffect(() => {
    async function fetch_prices() {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=tether,pax-gold&vs_currencies=php,usd"
        );
        const data = await res.json();
        if (data?.tether?.php) setUsdPhp(data.tether.php);
        if (data?.["pax-gold"]?.usd) setGoldUsd(data["pax-gold"].usd);
      } catch {}
    }
    fetch_prices();
  }, []);

  const goldPhp = goldUsd * usdPhp;
  const goldPerGram = goldPhp / 31.1035;

  return (
    <div className="grid grid-cols-2 gap-2">
      {/* USD/PHP */}
      <Link
        href="/usdphp"
        className="relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#333] rounded-[20px] px-4 pt-4 pb-5 no-underline hover:scale-[1.02] transition-transform"
      >
        {/* Decorative circle */}
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/5" />
        <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-white/[0.03]" />
        <div className="relative">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-lg">💱</span>
            <p className="text-[10px] font-semibold uppercase tracking-[1px] text-white/40">USD / PHP</p>
          </div>
          <p className="text-3xl font-black text-white tracking-tight leading-none">
            {usdPhp > 0 ? `₱${usdPhp.toFixed(2)}` : "—"}
          </p>
          <p className="text-[11px] text-white/30 mt-2 font-medium">$1.00 = ₱{usdPhp > 0 ? usdPhp.toFixed(2) : "—"}</p>
        </div>
      </Link>

      {/* Gold */}
      <Link
        href="/gold"
        className="relative overflow-hidden bg-gradient-to-br from-[#C8940A] to-[#9a7208] rounded-[20px] px-4 pt-4 pb-5 no-underline hover:scale-[1.02] transition-transform"
      >
        {/* Decorative circle */}
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-white/[0.05]" />
        <div className="relative">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-lg">🥇</span>
            <p className="text-[10px] font-semibold uppercase tracking-[1px] text-white/50">Gold / Gram</p>
          </div>
          <p className="text-3xl font-black text-white tracking-tight leading-none">
            {goldPerGram > 0 ? `₱${Math.round(goldPerGram).toLocaleString("en-PH")}` : "—"}
          </p>
          <p className="text-[11px] text-white/40 mt-2 font-medium">24K spot price per gram</p>
        </div>
      </Link>
    </div>
  );
}
