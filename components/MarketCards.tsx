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
      <Link
        href="/usdphp"
        className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-[20px] px-4 py-4 no-underline hover:scale-[1.02] transition-transform"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[1px] text-white/40 mb-1">USD / PHP</p>
        <p className="text-2xl font-black text-white tracking-tight">
          {usdPhp > 0 ? `₱${usdPhp.toFixed(2)}` : "—"}
        </p>
        <p className="text-[11px] text-white/40 mt-1">Live exchange rate →</p>
      </Link>
      <Link
        href="/gold"
        className="bg-gradient-to-br from-[#C8940A] to-[#a37a08] rounded-[20px] px-4 py-4 no-underline hover:scale-[1.02] transition-transform"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[1px] text-white/50 mb-1">Gold / Gram</p>
        <p className="text-2xl font-black text-white tracking-tight">
          {goldPerGram > 0 ? `₱${Math.round(goldPerGram).toLocaleString("en-PH")}` : "—"}
        </p>
        <p className="text-[11px] text-white/50 mt-1">Live spot price →</p>
      </Link>
    </div>
  );
}
