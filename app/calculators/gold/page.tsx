"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import NavMenu from "@/components/NavMenu";

const FALLBACK_GOLD_USD = 3000;
const FALLBACK_USDPHP = 57;

const PERIODS = [
  { label: "1M", days: "30" },
  { label: "1Y", days: "365" },
  { label: "5Y", days: "1825" },
  { label: "ALL", days: "all" },
] as const;

// --- Animated number ---
function AnimatedRate({ value, decimals = 2, prefix = "₱" }: { value: number; decimals?: number; prefix?: string }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const raf = useRef<number>(0);

  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = value;
    if (from === to) { setDisplay(to); return; }
    const start = performance.now();
    function tick(now: number) {
      const p = Math.min((now - start) / 1500, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  return <span>{prefix}{display.toLocaleString("en-PH", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>;
}

// --- Chart component (same structure as usdphp) ---
function GoldChart({ data, color = "white" }: { data: [number, number][]; color?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dotPos, setDotPos] = useState<{ x: number; y: number } | null>(null);
  const hoverIdxRef = useRef(-1);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const w = rect.width, h = rect.height;

    const prices = data.map(d => d[1]);
    const min = Math.min(...prices) * 0.999;
    const max = Math.max(...prices) * 1.001;
    const range = max - min || 1;

    const padTop = 20, padBot = 30, padLeft = 55, padRight = 10;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBot;
    const totalDays = (data[data.length - 1][0] - data[0][0]) / 86400000;

    const points = data.map((d, i) => ({
      x: padLeft + (i / (data.length - 1)) * chartW,
      y: padTop + ((max - d[1]) / range) * chartH,
    }));
    const lastPt = points[points.length - 1];

    function formatDateLabel(date: Date) {
      if (totalDays > 365) return `${date.getFullYear()}`;
      if (totalDays > 60) return `${date.toLocaleString("en", { month: "short" })} ${date.getDate()}`;
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }

    function draw(progress: number) {
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Y-axis labels
      ctx.font = "600 10px Inter, system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.textAlign = "right";
      const ySteps = 5;
      for (let i = 0; i <= ySteps; i++) {
        const val = min + (range * i) / ySteps;
        const y = padTop + chartH - (chartH * i) / ySteps;
        ctx.fillText(`₱${Math.round(val).toLocaleString("en-PH")}`, padLeft - 8, y + 3);
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(padLeft, y); ctx.lineTo(w - padRight, y); ctx.stroke();
      }

      // X-axis labels
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      const xLabels = 5;
      for (let i = 0; i <= xLabels; i++) {
        const idx = Math.floor((i / xLabels) * (data.length - 1));
        const date = new Date(data[idx][0]);
        ctx.fillText(formatDateLabel(date), points[idx].x, h - 6);
      }

      // Line
      const drawCount = Math.ceil(points.length * progress);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      for (let i = 0; i < drawCount; i++) {
        if (i === 0) ctx.moveTo(points[i].x, points[i].y);
        else ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();

      // Fill
      if (drawCount > 1) {
        ctx.lineTo(points[drawCount - 1].x, padTop + chartH);
        ctx.lineTo(points[0].x, padTop + chartH);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
        grad.addColorStop(0, "rgba(255,255,255,0.12)");
        grad.addColorStop(1, "rgba(255,255,255,0.01)");
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Hover
      const hi = hoverIdxRef.current;
      if (hi >= 0 && hi < points.length) {
        const pt = points[hi];
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 1;
        ctx.moveTo(pt.x, padTop); ctx.lineTo(pt.x, padTop + chartH);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Tooltip
        const val = data[hi][1];
        const date = new Date(data[hi][0]);
        const label = `₱${Math.round(val).toLocaleString("en-PH")}`;
        const dateStr = date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
        const tw = Math.max(ctx.measureText(label).width, ctx.measureText(dateStr).width) + 20;
        const tx = pt.x > w * 0.7 ? pt.x - tw - 10 : pt.x + 10;
        const ty = Math.max(padTop, pt.y - 30);

        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.beginPath();
        ctx.roundRect(tx, ty, tw, 46, 8);
        ctx.fill();

        ctx.fillStyle = "white";
        ctx.font = "800 13px Inter, system-ui, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(label, tx + 10, ty + 18);
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.font = "500 10px Inter, system-ui, sans-serif";
        ctx.fillText(dateStr, tx + 10, ty + 36);
      }

      ctx.restore();
    }

    // Animate in
    const startTime = performance.now();
    function animate(now: number) {
      const p = Math.min((now - startTime) / 1200, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      draw(eased);
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    }
    rafRef.current = requestAnimationFrame(animate);

    function onMove(clientX: number) {
      const r = canvas!.getBoundingClientRect();
      const mx = clientX - r.left;
      const relX = Math.max(0, Math.min(1, (mx - padLeft) / chartW));
      const idx = Math.round(relX * (data.length - 1));
      hoverIdxRef.current = idx;
      const pt = points[idx];
      setDotPos(null);
      draw(1);
    }

    function onLeave() {
      hoverIdxRef.current = -1;
      setDotPos({ x: (lastPt.x / w) * 100, y: (lastPt.y / h) * 100 });
      draw(1);
    }

    const handleMouse = (e: MouseEvent) => onMove(e.clientX);
    const handleTouch = (e: TouchEvent) => { if (e.touches.length) onMove(e.touches[0].clientX); };
    const handleLeave = () => onLeave();

    canvas.addEventListener("mousemove", handleMouse);
    canvas.addEventListener("touchmove", handleTouch);
    canvas.addEventListener("mouseleave", handleLeave);
    canvas.addEventListener("touchend", handleLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("mousemove", handleMouse);
      canvas.removeEventListener("touchmove", handleTouch);
      canvas.removeEventListener("mouseleave", handleLeave);
      canvas.removeEventListener("touchend", handleLeave);
    };
  }, [data, color]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full h-[200px] sm:h-[240px] cursor-crosshair"
        style={{ display: "block" }}
      />
      {dotPos && (
        <span className="absolute pointer-events-none" style={{ left: `${dotPos.x}%`, top: `${dotPos.y}%`, transform: "translate(-50%, -50%)" }}>
          <span className="block w-[8px] h-[8px] rounded-full bg-white" />
          <span className="absolute inset-[-4px] rounded-full bg-white/40 animate-pulse-dot" />
        </span>
      )}
    </div>
  );
}

// --- Page ---
export default function GoldPage() {
  const [goldUsd, setGoldUsd] = useState(FALLBACK_GOLD_USD);
  const [usdPhp, setUsdPhp] = useState(FALLBACK_USDPHP);
  const [live, setLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [period, setPeriod] = useState("30");
  const [oz, setOz] = useState("");
  const [grams, setGrams] = useState("1");
  const [unit, setUnit] = useState<"oz" | "g">("g");
  const [displayUnit, setDisplayUnit] = useState<"g" | "oz">("g");

  const goldPhp = goldUsd * usdPhp;
  const goldPhpPerGram = goldPhp / 31.1035;
  const displayPrice = displayUnit === "g" ? goldPhpPerGram : goldPhp;
  const displaySuffix = displayUnit === "g" ? "/g" : "/oz";

  // Fetch live gold price + USD/PHP from CoinGecko
  useEffect(() => {
    async function fetchPrices() {
      try {
        const [gRes, pRes] = await Promise.all([
          fetch("https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd"),
          fetch("https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=php"),
        ]);
        const gData = await gRes.json();
        const pData = await pRes.json();
        if (gData?.["pax-gold"]?.usd) setGoldUsd(gData["pax-gold"].usd);
        if (pData?.tether?.php) setUsdPhp(pData.tether.php);
      } catch { /* use fallback values */ }
      setLive(true);
      setLastUpdated(new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }));
    }
    fetchPrices();
    const interval = setInterval(fetchPrices, 120000);
    return () => clearInterval(interval);
  }, []);

  // Fetch historical gold data from our own Supabase via API route
  const [historyUsd, setHistoryUsd] = useState<[number, number][]>([]);
  const historyFetched = useRef(false);

  useEffect(() => {
    if (historyFetched.current) return;
    historyFetched.current = true;

    async function loadHistory() {
      try {
        const res = await fetch("/api/gold-history");
        if (!res.ok) return;
        const data = await res.json();
        if (data?.prices?.length) {
          setHistoryUsd(data.prices as [number, number][]);
        }
      } catch { /* silent */ }
    }
    loadHistory();
  }, []);

  // Convert USD history to PHP at render time
  const historyData = useMemo(() => {
    if (historyUsd.length === 0 || usdPhp === 0) return [] as [number, number][];
    return historyUsd.map(([ts, usd]) => [ts, usd * usdPhp] as [number, number]);
  }, [historyUsd, usdPhp]);

  // Chart data based on period — append live price to bridge any data gap
  const chartData = useMemo(() => {
    if (historyData.length === 0) return [];
    // Append today's live price
    const withLive = [...historyData];
    const today = Date.now();
    const lastTs = withLive[withLive.length - 1][0];
    if (today - lastTs > 86400000 && goldPhp > 0) {
      withLive.push([today, goldPhp]);
    }

    let pts: [number, number][];
    if (period === "all") {
      pts = withLive;
    } else {
      const cutoff = Date.now() - Number(period) * 86400000;
      const sliced = withLive.filter(d => d[0] >= cutoff);
      pts = sliced.length >= 2 ? sliced : withLive.slice(-30);
    }
    const maxPoints = 200;
    const step = Math.max(1, Math.floor(pts.length / maxPoints));
    const sampled = pts.filter((_, i) => i % step === 0);
    if (sampled.length > 0 && sampled[sampled.length - 1][0] !== pts[pts.length - 1][0]) {
      sampled.push(pts[pts.length - 1]);
    }
    return sampled;
  }, [historyData, period, goldPhp]);

  // Conversion
  useEffect(() => {
    if (unit === "oz") {
      const v = parseFloat(oz);
      setGrams(isNaN(v) || v === 0 ? "" : (v * goldPhp).toFixed(0));
    }
  }, [oz, goldPhp, unit]);

  useEffect(() => {
    if (unit === "g") {
      const v = parseFloat(grams);
      setOz(isNaN(v) || v === 0 ? "" : (v / goldPhpPerGram).toFixed(4));
    }
  }, [grams, goldPhpPerGram, unit]);

  // Chart stats
  const displayDiv = displayUnit === "g" ? 31.1035 : 1;
  const displayChartData = useMemo(() => {
    if (displayDiv === 1) return chartData;
    return chartData.map(([ts, val]) => [ts, val / displayDiv] as [number, number]);
  }, [chartData, displayDiv]);
  const chartMin = displayChartData.length > 0 ? Math.min(...displayChartData.map(d => d[1])) : 0;
  const chartMax = displayChartData.length > 0 ? Math.max(...displayChartData.map(d => d[1])) : 0;
  const chartStart = chartData.length > 0 ? chartData[0][1] : 0;
  const chartChange = chartStart > 0 ? ((goldPhp - chartStart) / chartStart * 100) : 0;

  // Performance over fixed periods
  const performance = useMemo(() => {
    if (historyData.length === 0 || goldPhp === 0) return [];
    const now = Date.now();
    const periods = [
      { label: "1D", days: 1 },
      { label: "1W", days: 7 },
      { label: "1M", days: 30 },
      { label: "3M", days: 90 },
      { label: "1Y", days: 365 },
    ];
    return periods.map(({ label, days }) => {
      const cutoff = now - days * 86400000;
      // Find the closest data point to the cutoff
      let closest = historyData[0];
      let minDiff = Math.abs(historyData[0][0] - cutoff);
      for (const pt of historyData) {
        const diff = Math.abs(pt[0] - cutoff);
        if (diff < minDiff) { minDiff = diff; closest = pt; }
        if (pt[0] > cutoff) break;
      }
      const pct = closest[1] > 0 ? ((goldPhp - closest[1]) / closest[1]) * 100 : 0;
      return { label, pct };
    });
  }, [historyData, goldPhp]);

  return (
    <div className="min-h-screen bg-[#C8940A]">
      {/* Nav */}
      <nav className="flex justify-between items-center px-4 sm:px-6 py-4 max-w-[720px] mx-auto">
        <Link href="/" className="no-underline">
          <span className="text-white text-2xl leading-none" style={{fontFamily:"var(--font-old-english)"}}>Sentral</span>
        </Link>
        <NavMenu dark />
      </nav>

      <main className="max-w-[720px] mx-auto px-4 sm:px-6 pb-8">

        {/* Price display */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <div className="flex bg-white/15 rounded-full p-0.5">
              <button onClick={() => setDisplayUnit("g")}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                  displayUnit === "g" ? "bg-white text-[#C8940A]" : "text-white/50"
                }`}>per gram</button>
              <button onClick={() => setDisplayUnit("oz")}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                  displayUnit === "oz" ? "bg-white text-[#C8940A]" : "text-white/50"
                }`}>per troy oz</button>
            </div>
          </div>
          <h1 className="text-[11px] font-semibold uppercase tracking-[1px] text-white/50 mb-2">
            Gold Price Today in Philippines {displayUnit === "g" ? "per Gram" : "per Troy Oz"}
          </h1>
          <p className="text-5xl sm:text-6xl font-black tracking-tight text-white">
            <AnimatedRate value={displayPrice} decimals={displayUnit === "g" ? 0 : 0} />
          </p>
          <p className="text-lg font-bold text-white/50 mt-1">
            <AnimatedRate value={displayUnit === "g" ? goldUsd / 31.1035 : goldUsd} decimals={2} prefix="$" /> USD
          </p>
          {live && (
            <p className="text-[11px] text-white/45 mt-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/50 mr-1 animate-pulse" />
              Updated {lastUpdated}
            </p>
          )}
        </div>

        {/* Chart */}
        <div className="bg-white/15 backdrop-blur-sm rounded-[20px] p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[1px] text-white/50">Gold Price Chart in PHP {displayUnit === "g" ? "/ Gram" : "/ Troy Oz"}</h2>
            <div className="flex gap-1">
              {PERIODS.map((p) => (
                <button key={p.days} onClick={() => setPeriod(p.days)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                    period === p.days ? "bg-white text-[#C8940A]" : "bg-white/15 text-white/50"
                  }`}>{p.label}</button>
              ))}
            </div>
          </div>

          {displayChartData.length > 0 ? (
            <>
              <GoldChart data={displayChartData} />
              <div className="flex justify-between mt-3 text-[11px] text-white/50">
                <span>Low: ₱{Math.round(chartMin).toLocaleString("en-PH")}</span>
                <span>High: ₱{Math.round(chartMax).toLocaleString("en-PH")}</span>
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Gold Calculator */}
        <div className="bg-gradient-to-br from-white to-amber-50 rounded-[20px] p-5 mb-4 shadow-md">
          <h2 className="text-[11px] font-semibold uppercase tracking-[1px] text-[#996515] mb-3">Gold Calculator (PHP)</h2>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Weight input — narrow */}
            <div className="w-[110px] sm:w-[130px] shrink-0">
              <div className="flex items-center bg-black/5 rounded-xl px-3 py-3 h-[48px]">
                {(() => {
                  const val = unit === "oz" ? oz : grams;
                  const len = val.length;
                  const fontSize = len > 8 ? "text-xs" : len > 6 ? "text-sm" : len > 4 ? "text-base" : "text-lg";
                  return (
                    <input
                      type="text"
                      inputMode="decimal"
                      value={val}
                      onFocus={() => setUnit(unit)}
                      onChange={(e) => {
                        if (unit === "oz") { setUnit("oz"); setOz(e.target.value); }
                        else { setUnit("g"); setGrams(e.target.value); }
                      }}
                      className={`bg-transparent font-extrabold ${fontSize} text-[#1a1a1a] outline-none min-w-0 flex-1 placeholder-black/30 transition-[font-size] duration-200`}
                      placeholder="1"
                    />
                  );
                })()}
                <div className="flex bg-black/5 rounded-full p-0.5 ml-1 shrink-0">
                  <button onClick={() => { setUnit("oz"); setOz("1"); }}
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                      unit === "oz" ? "bg-[#C8940A] text-white" : "text-[#999]"
                    }`}>oz</button>
                  <button onClick={() => { setUnit("g"); setGrams("1"); }}
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                      unit === "g" ? "bg-[#C8940A] text-white" : "text-[#999]"
                    }`}>g</button>
                </div>
              </div>
            </div>
            <span className="text-xl font-black text-black/20 shrink-0">=</span>
            {/* PHP output — takes remaining space, same height */}
            <div className="flex-1 min-w-0">
              <div className="bg-black/5 rounded-xl px-4 py-3 h-[48px] flex items-center">
                {(() => {
                  const v = unit === "oz" ? parseFloat(oz) : parseFloat(grams);
                  const total = isNaN(v) || v === 0 ? 0 : unit === "oz" ? v * goldPhp : v * goldPhpPerGram;
                  const formatted = `₱${Math.round(total).toLocaleString("en-PH")}`;
                  const len = formatted.length;
                  const fontSize = len > 14 ? "text-sm" : len > 11 ? "text-base" : len > 8 ? "text-xl" : "text-2xl";
                  return <p className={`${fontSize} font-extrabold text-[#1a1a1a] truncate transition-[font-size] duration-200`}>{formatted}</p>;
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Karat pricing */}
        <div className="bg-gradient-to-br from-white to-amber-50 rounded-[20px] p-5 mb-4 shadow-md">
          <h2 className="text-[11px] font-semibold uppercase tracking-[1px] text-[#996515] mb-3">Gold Price by Karat in Philippines</h2>
          <div className="space-y-0">
            {[
              { k: 24, purity: 1, note: "HK 足金 (Chuk Kam) 999.9 standard, bars, coins" },
              { k: 23, purity: 23/24, note: "Thai gold standard (ทองคำ 96.5%)" },
              { k: 22, purity: 22/24, note: "Saudi gold, Indian jewelry" },
              { k: 21, purity: 21/24, note: "Saudi gold, Middle East standard" },
              { k: 18, purity: 18/24, note: "PH & Japan (K18) standard, HK karat jewelry" },
              { k: 14, purity: 14/24, note: "Common in PH & Japan (K14), everyday wear" },
              { k: 10, purity: 10/24, note: "Budget jewelry, Japan K10" },
            ].map((row) => {
              const price = displayUnit === "g" ? goldPhpPerGram * row.purity : goldPhp * row.purity;
              const suffix = displayUnit === "g" ? "/g" : "/oz";
              return (
                <div key={row.k} className="flex items-center justify-between py-2.5 border-b border-black/5 last:border-0">
                  <div>
                    <p className="text-sm font-bold text-[#1a1a1a]">{row.k}K</p>
                    <p className="text-[11px] text-[#999]">{row.note}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-[#1a1a1a]">
                      ₱{Math.round(price).toLocaleString("en-PH")}{suffix}
                    </p>
                    <p className="text-[11px] text-[#999]">{(row.purity * 100).toFixed(1)}% pure</p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-[#999] mt-3 leading-relaxed">
            Karat prices are calculated from 24K spot. Jewelry store prices will be higher due to labor, design, and markup.
            Saudi gold is typically 21K or 22K — ask your OFW to check the stamp.
          </p>
        </div>

        {/* Performance */}
        {performance.length > 0 && (
          <div className="bg-gradient-to-br from-white to-amber-50 rounded-[20px] p-5 mb-4 shadow-md">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#996515] mb-3">Performance</p>
            <div className="flex justify-between">
              {performance.map((p) => (
                <div key={p.label} className="text-center flex-1">
                  <p className="text-[11px] font-semibold text-[#999] mb-1">{p.label}</p>
                  <p className={`text-sm font-extrabold ${p.pct >= 0 ? "text-[#16a34a]" : "text-[#dc2626]"}`}>
                    {p.pct >= 0 ? "+" : ""}{p.pct.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick reference */}
        <div className="bg-gradient-to-br from-white to-amber-50 rounded-[20px] p-5 mb-4 shadow-md">
          <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#996515] mb-3">Quick reference</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "1 gram", val: goldPhpPerGram },
              { label: "5 grams", val: goldPhpPerGram * 5 },
              { label: "10 grams", val: goldPhpPerGram * 10 },
              { label: "1/4 oz", val: goldPhp * 0.25 },
              { label: "1/2 oz", val: goldPhp * 0.5 },
              { label: "1 oz", val: goldPhp },
              { label: "50 grams", val: goldPhpPerGram * 50 },
              { label: "100 grams", val: goldPhpPerGram * 100 },
            ].map((r) => (
              <div key={r.label} className="flex justify-between text-sm py-1.5 border-b border-black/5 last:border-0">
                <span className="text-[#999] font-medium">{r.label}</span>
                <span className="text-[#1a1a1a] font-bold">₱{Math.round(r.val).toLocaleString("en-PH")}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SEO Content */}
        <section className="mt-6 mb-4">
          <div className="bg-gradient-to-br from-white to-amber-50 rounded-[20px] p-5 shadow-md">
            <h2 className="text-[13px] font-bold text-[#1a1a1a] mb-2">Gold Price in the Philippines Today</h2>
            <p className="text-[12px] text-[#666] leading-relaxed mb-3">
              This page shows the live gold price in Philippine Pesos (PHP), updated daily from global spot markets. Gold prices are displayed per gram and per troy ounce for 24K, 23K, 22K, 21K, 18K, 14K, and 10K purity levels. The price is derived from the international gold spot price (XAU/USD) and the current USD to PHP exchange rate.
            </p>
            <h3 className="text-[12px] font-bold text-[#1a1a1a] mb-1">Karat Guide for Filipino Gold Buyers</h3>
            <p className="text-[12px] text-[#666] leading-relaxed mb-3">
              In the Philippines, 18K gold is the most common purity for locally sold jewelry. OFWs frequently bring home 21K and 22K Saudi gold from the Middle East, 24K Chuk Kam (足金) from Hong Kong gold shops like Chow Tai Fook and Chow Sang Sang, and K18 Japanese gold kihei chains. Thai gold is typically 23K (96.5% purity). Karat prices shown above are calculated from the 24K spot price — actual jewelry store prices will be higher due to labor, design, and retail markup.
            </p>
            <h3 className="text-[12px] font-bold text-[#1a1a1a] mb-1">About This Tool</h3>
            <p className="text-[12px] text-[#666] leading-relaxed">
              Sentral provides free financial tools for Filipinos. Gold spot price is sourced via CoinGecko (PAX Gold). Historical data covers 2000 to present. USD/PHP exchange rate is sourced from CoinGecko USDT/PHP. This tool is for informational purposes only and is not financial advice.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-2 pb-4">
          <p className="text-[11px] text-white/40 leading-relaxed max-w-md mx-auto">
            © {new Date().getFullYear()} Sentral — Free financial tools for Filipinos
          </p>
        </footer>
      </main>
    </div>
  );
}
