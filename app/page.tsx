"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`;

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
      {/* Gold */}
      <Link
        href="/gold"
        className="relative overflow-hidden rounded-[20px] px-4 pt-4 pb-5 no-underline hover:scale-[1.02] transition-transform"
        style={{ background: "linear-gradient(135deg, #FFE082 0%, #C8940A 60%, #8B6914 100%)" }}
      >
        <div className="absolute inset-0 rounded-[20px]" style={{ backgroundImage: NOISE_SVG, backgroundSize: "128px 128px" }} />
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/15" />
        <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-lg">🥇</span>
            <p className="text-[10px] font-semibold uppercase tracking-[1px] text-white/60">Gold / Gram</p>
          </div>
          <p className="text-3xl font-black text-white tracking-tight leading-none drop-shadow-sm">
            {goldPerGram > 0 ? `₱${Math.round(goldPerGram).toLocaleString("en-PH")}` : "—"}
          </p>
          <p className="text-[11px] text-white/50 mt-2 font-medium">24K spot price per gram</p>
        </div>
      </Link>

      {/* USD/PHP */}
      <Link
        href="/usdphp"
        className="relative overflow-hidden rounded-[20px] px-4 pt-4 pb-5 no-underline hover:scale-[1.02] transition-transform"
        style={{ background: "linear-gradient(135deg, #A5D6A7 0%, #2E7D32 60%, #1B5E20 100%)" }}
      >
        <div className="absolute inset-0 rounded-[20px]" style={{ backgroundImage: NOISE_SVG, backgroundSize: "128px 128px" }} />
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/15" />
        <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-lg">💱</span>
            <p className="text-[10px] font-semibold uppercase tracking-[1px] text-white/60">USD / PHP</p>
          </div>
          <p className="text-3xl font-black text-white tracking-tight leading-none drop-shadow-sm">
            {usdPhp > 0 ? `₱${usdPhp.toFixed(2)}` : "—"}
          </p>
          <p className="text-[11px] text-white/50 mt-2 font-medium">$1.00 = ₱{usdPhp > 0 ? usdPhp.toFixed(2) : "—"}</p>
        </div>
      </Link>
    </div>
  );
}
