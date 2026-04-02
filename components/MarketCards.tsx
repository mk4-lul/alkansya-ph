"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`;

function WaveLines({ color = "rgba(255,255,255,0.08)" }: { color?: string }) {
  return (
    <svg className="absolute right-[-20%] top-[-20%] h-[140%] w-[80%]" viewBox="0 0 100 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: "rotate(62deg)" }}>
      <style>{`
        @keyframes drift1 { 0%,100% { d: path("M60,-10 C40,40 80,80 50,120 30,160 70,180 60,210"); } 50% { d: path("M60,-10 C80,30 40,70 70,110 90,150 50,190 60,210"); } }
        @keyframes drift2 { 0%,100% { d: path("M75,-10 C55,50 95,90 65,130 45,170 85,190 75,210"); } 50% { d: path("M75,-10 C95,40 55,80 85,120 100,160 60,200 75,210"); } }
        @keyframes drift3 { 0%,100% { d: path("M90,-10 C70,45 100,85 80,125 60,165 95,195 90,210"); } 50% { d: path("M90,-10 C100,35 70,75 95,115 105,155 75,205 90,210"); } }
        .d1 { animation: drift1 48s ease-in-out infinite; }
        .d2 { animation: drift2 60s ease-in-out infinite; }
        .d3 { animation: drift3 72s ease-in-out infinite; }
      `}</style>
      <path className="d1" d="M60,-10 C40,40 80,80 50,120 30,160 70,180 60,210" fill="none" stroke={color} strokeWidth="1.2" />
      <path className="d2" d="M75,-10 C55,50 95,90 65,130 45,170 85,190 75,210" fill="none" stroke={color} strokeWidth="0.9" />
      <path className="d3" d="M90,-10 C70,45 100,85 80,125 60,165 95,195 90,210" fill="none" stroke={color} strokeWidth="0.6" />
    </svg>
  );
}

export default function MarketCards() {
  const [usdPhp, setUsdPhp] = useState(0);
  const [usdChange, setUsdChange] = useState<number | null>(null);
  const [goldUsd, setGoldUsd] = useState(0);
  const [goldChange, setGoldChange] = useState<number | null>(null);

  useEffect(() => {
    async function fetch_prices() {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=tether,pax-gold&vs_currencies=php,usd&include_24hr_change=true"
        );
        const data = await res.json();
        if (data?.tether?.php) setUsdPhp(data.tether.php);
        if (data?.tether?.php_24h_change != null) setUsdChange(data.tether.php_24h_change);
        if (data?.["pax-gold"]?.usd) setGoldUsd(data["pax-gold"].usd);
        if (data?.["pax-gold"]?.usd_24h_change != null) setGoldChange(data["pax-gold"].usd_24h_change);
      } catch {}
    }
    fetch_prices();
  }, []);

  const goldPhp = goldUsd * usdPhp;
  const goldPerGram = goldPhp / 31.1035;

  function Badge({ change }: { change: number | null }) {
    if (change == null) return null;
    const up = change >= 0;
    return (
      <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
        up ? "bg-white/20 text-white" : "bg-black/10 text-white/90"
      }`}>
        <span className="text-[10px]">{up ? "▲" : "▼"}</span>
        {Math.abs(change).toFixed(1)}%
      </span>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {/* Gold */}
      <Link
        href="/gold"
        className="relative overflow-hidden rounded-[20px] px-4 pt-4 pb-5 no-underline hover:scale-[1.02] transition-transform"
        style={{ background: "linear-gradient(135deg, #FFE082 0%, #C8940A 60%, #8B6914 100%)" }}
      >
        <div className="absolute inset-0 rounded-[20px]" style={{ backgroundImage: NOISE_SVG, backgroundSize: "128px 128px" }} />
        <WaveLines color="rgba(255,255,255,0.12)" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">🥇</span>
              <p className="text-[10px] font-semibold uppercase tracking-[1px] text-white/60">Gold / Gram</p>
            </div>
            <Badge change={goldChange} />
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
        <WaveLines color="rgba(255,255,255,0.1)" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">💱</span>
              <p className="text-[10px] font-semibold uppercase tracking-[1px] text-white/60">USD / PHP</p>
            </div>
            <Badge change={usdChange} />
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
