"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import NavMenu from "@/components/NavMenu";

const FALLBACK_RATE = 57;

const PERIODS = [
  { label: "1D", days: "1" },
  { label: "1W", days: "7" },
  { label: "1M", days: "30" },
  { label: "1Y", days: "365" },
  { label: "ALL", days: "max" },
] as const;

// ─── Chart component ─────────────────────────────────────────────
function RateChart({ data }: { data: [number, number][] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width, h = rect.height;

    const prices = data.map(d => d[1]);
    const min = Math.min(...prices) * 0.999;
    const max = Math.max(...prices) * 1.001;
    const range = max - min || 1;

    const padTop = 20, padBot = 30, padLeft = 45, padRight = 10;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBot;

    ctx.clearRect(0, 0, w, h);

    // Grid lines + labels
    ctx.font = "10px Inter, system-ui, sans-serif";
    ctx.textAlign = "right";
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padTop + (chartH / gridLines) * i;
      const val = max - (range / gridLines) * i;
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillText(`₱${val.toFixed(2)}`, padLeft - 6, y + 3);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();
    }

    // X-axis labels
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    const labelCount = Math.min(5, data.length);
    for (let i = 0; i < labelCount; i++) {
      const idx = Math.floor((i / (labelCount - 1)) * (data.length - 1));
      const x = padLeft + (idx / (data.length - 1)) * chartW;
      const date = new Date(data[idx][0]);
      // Show year for long timeframes, date for short
      const totalDays = (data[data.length - 1][0] - data[0][0]) / 86400000;
      const label = totalDays > 365
        ? `${date.getFullYear()}`
        : totalDays > 60
          ? `${date.toLocaleString("en", { month: "short" })} ${date.getDate()}`
          : `${date.getMonth() + 1}/${date.getDate()}`;
      ctx.fillText(label, x, h - 8);
    }

    // Line
    ctx.beginPath();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    data.forEach((d, i) => {
      const x = padLeft + (i / (data.length - 1)) * chartW;
      const y = padTop + ((max - d[1]) / range) * chartH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill under line
    const lastX = padLeft + chartW;
    const lastY = padTop + ((max - data[data.length - 1][1]) / range) * chartH;
    ctx.lineTo(lastX, padTop + chartH);
    ctx.lineTo(padLeft, padTop + chartH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
    grad.addColorStop(0, "rgba(255,255,255,0.15)");
    grad.addColorStop(1, "rgba(255,255,255,0.02)");
    ctx.fillStyle = grad;
    ctx.fill();

    // Current rate dot
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[200px] sm:h-[240px]"
      style={{ display: "block" }}
    />
  );
}

// ─── Page ────────────────────────────────────────────────────────
export default function UsdPhpPage() {
  const [rate, setRate] = useState(FALLBACK_RATE);
  const [live, setLive] = useState(false);
  const [chartData, setChartData] = useState<[number, number][]>([]);
  const [usd, setUsd] = useState("1");
  const [php, setPhp] = useState("");
  const [direction, setDirection] = useState<"usd" | "php">("usd");
  const [period, setPeriod] = useState("30");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Fetch live rate
  useEffect(() => {
    async function fetchRate() {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=php");
        const data = await res.json();
        const r = data?.tether?.php;
        if (r) {
          setRate(r);
          setLive(true);
          setLastUpdated(new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }));
        }
      } catch { /* fallback */ }
    }
    fetchRate();
    const interval = setInterval(fetchRate, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch chart data
  useEffect(() => {
    async function fetchChart() {
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/tether/market_chart?vs_currency=php&days=${period}`);
        const data = await res.json();
        if (data?.prices) {
          const raw = data.prices as [number, number][];
          const maxPoints = 150;
          const step = Math.max(1, Math.floor(raw.length / maxPoints));
          const sampled = raw.filter((_: [number, number], i: number) => i % step === 0);
          // Always include the last point
          if (sampled.length > 0 && sampled[sampled.length - 1][0] !== raw[raw.length - 1][0]) {
            sampled.push(raw[raw.length - 1]);
          }
          setChartData(sampled);
        }
      } catch { /* no chart */ }
    }
    fetchChart();
  }, [period]);

  // Conversion
  useEffect(() => {
    if (direction === "usd") {
      const v = parseFloat(usd);
      setPhp(isNaN(v) ? "" : (v * rate).toFixed(2));
    }
  }, [usd, rate, direction]);

  useEffect(() => {
    if (direction === "php") {
      const v = parseFloat(php);
      setUsd(isNaN(v) ? "" : (v / rate).toFixed(2));
    }
  }, [php, rate, direction]);

  // Chart stats
  const chartMin = chartData.length > 0 ? Math.min(...chartData.map(d => d[1])) : 0;
  const chartMax = chartData.length > 0 ? Math.max(...chartData.map(d => d[1])) : 0;
  const chartStart = chartData.length > 0 ? chartData[0][1] : 0;
  const chartChange = chartStart > 0 ? ((rate - chartStart) / chartStart * 100) : 0;

  return (
    <div className="min-h-screen bg-[#00c853]">
      {/* Nav */}
      <nav className="flex justify-between items-center px-4 sm:px-6 py-4 max-w-[600px] mx-auto">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-white no-underline">
          alkansya<span className="text-white/60">.ph</span>
        </Link>
        <NavMenu dark />
      </nav>

      <main className="max-w-[600px] mx-auto px-4 sm:px-6 pb-8">

        {/* Big rate display */}
        <div className="text-center mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[1px] text-white/50 mb-1">USD / PHP</p>
          <p className="text-6xl sm:text-7xl font-black text-white tracking-tight leading-none mb-1">
            ₱{rate.toFixed(2)}
          </p>
          {live && (
            <p className="text-[11px] text-white/40">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/50 mr-1 animate-pulse" />
              Updated {lastUpdated}
            </p>
          )}
        </div>

        {/* Converter */}
        <div className="bg-white/10 backdrop-blur-sm rounded-[20px] p-5 mb-4">
          <div className="space-y-3">
            {/* USD input */}
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇺🇸</span>
              <div className="flex-1 flex items-center bg-white/10 rounded-xl px-4 py-3">
                <span className="text-sm font-bold text-white/50 mr-2">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={usd}
                  onFocus={() => setDirection("usd")}
                  onChange={(e) => { setDirection("usd"); setUsd(e.target.value); }}
                  className="flex-1 bg-transparent text-lg font-bold text-white outline-none placeholder-white/30"
                  placeholder="0"
                />
                <span className="text-xs font-semibold text-white/40">USD</span>
              </div>
            </div>

            {/* Swap indicator */}
            <div className="text-center">
              <span className="text-white/30 text-lg">↕</span>
            </div>

            {/* PHP input */}
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇵🇭</span>
              <div className="flex-1 flex items-center bg-white/10 rounded-xl px-4 py-3">
                <span className="text-sm font-bold text-white/50 mr-2">₱</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={php}
                  onFocus={() => setDirection("php")}
                  onChange={(e) => { setDirection("php"); setPhp(e.target.value); }}
                  className="flex-1 bg-transparent text-lg font-bold text-white outline-none placeholder-white/30"
                  placeholder="0"
                />
                <span className="text-xs font-semibold text-white/40">PHP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white/10 backdrop-blur-sm rounded-[20px] p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-white/50">Historical rate</p>
            <div className="flex gap-1">
              {PERIODS.map((p) => (
                <button key={p.days} onClick={() => setPeriod(p.days)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                    period === p.days ? "bg-white text-[#00c853]" : "bg-white/10 text-white/50"
                  }`}>{p.label}</button>
              ))}
            </div>
          </div>

          {chartData.length > 0 ? (
            <>
              <RateChart data={chartData} />
              <div className="flex justify-between mt-3 text-[10px] text-white/40">
                <span>Low: ₱{chartMin.toFixed(2)}</span>
                <span className={chartChange >= 0 ? "text-white/70" : "text-red-300"}>
                  {chartChange >= 0 ? "+" : ""}{chartChange.toFixed(2)}%
                </span>
                <span>High: ₱{chartMax.toFixed(2)}</span>
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-sm text-white/30">Loading chart...</p>
            </div>
          )}
        </div>

        {/* Quick reference */}
        <div className="bg-white/10 backdrop-blur-sm rounded-[20px] p-5 mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[1px] text-white/50 mb-3">Quick reference</p>
          <div className="grid grid-cols-2 gap-2">
            {[1, 5, 10, 20, 50, 100, 500, 1000].map((v) => (
              <div key={v} className="flex justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
                <span className="text-white/50 font-medium">${v}</span>
                <span className="text-white font-bold">₱{(v * rate).toLocaleString("en-PH", { maximumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center pt-4">
          <p className="text-[10px] text-white/25 leading-relaxed max-w-md mx-auto">
            Rate derived from USDT/PHP via CoinGecko. May differ slightly from bank rates. Updated every minute.
          </p>
        </footer>
      </main>
    </div>
  );
}
