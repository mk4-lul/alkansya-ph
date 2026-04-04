"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import SiteHeader from "@/components/SiteHeader";

const FALLBACK_RATE = 57;

const PERIODS = [
{ label: "1Y", days: "365" },
{ label: "ALL", days: "all" },
] as const;

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
      const p = Math.min((now - start) / 2500, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  return <span>{prefix}{display.toLocaleString("en-PH", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>;
}

function RateChart({ data }: { data: [number, number][] }) {
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

const padTop = 20, padBot = 30, padLeft = 45, padRight = 10;
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
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  ctx.font = "10px Inter, system-ui, sans-serif";
  ctx.textAlign = "right";
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = padTop + (chartH / gridLines) * i;
    const val = max - (range / gridLines) * i;
    ctx.fillStyle = "rgba(26,26,26,0.4)";
    ctx.fillText("₱" + val.toFixed(2), padLeft - 6, y + 3);
    ctx.strokeStyle = "rgba(26,26,26,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(w - padRight, y);
    ctx.stroke();
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(26,26,26,0.4)";
  const labelCount = Math.min(5, data.length);
  for (let i = 0; i < labelCount; i++) {
    const idx = Math.floor((i / (labelCount - 1)) * (data.length - 1));
    ctx.fillText(formatDateLabel(new Date(data[idx][0])), points[idx].x, h - 8);
  }

  const clipX = padLeft + chartW * progress;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, clipX + 2, h);
  ctx.clip();

  ctx.beginPath();
  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  ctx.lineTo(lastPt.x, padTop + chartH);
  ctx.lineTo(points[0].x, padTop + chartH);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
  grad.addColorStop(0, "rgba(26,26,26,0.15)");
  grad.addColorStop(1, "rgba(26,26,26,0.02)");
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.restore();

  if (progress < 1) return;

  ctx.beginPath();
  ctx.arc(lastPt.x, lastPt.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#1a1a1a";
  ctx.fill();

  const hi = hoverIdxRef.current;
  if (hi >= 0 && hi < points.length) {
    const hp = points[hi];
    const hd = data[hi];
    const date = new Date(hd[0]);

    ctx.strokeStyle = "rgba(26,26,26,0.3)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(hp.x, padTop);
    ctx.lineTo(hp.x, padTop + chartH);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(hp.x, hp.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#1a1a1a";
    ctx.fill();
    ctx.strokeStyle = "rgba(26,26,26,0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const dateLabel = totalDays > 365
      ? `${date.toLocaleString("en", { month: "short" })} ${date.getDate()}, ${date.getFullYear()}`
      : `${date.toLocaleString("en", { month: "short" })} ${date.getDate()}`;
    const priceLabel = "₱" + hd[1].toFixed(2);

    const tw = 130, th = 52, tr = 10;
    const flipX = hp.x > w * 0.65;
    const tx = flipX ? hp.x - tw - 10 : hp.x + 10;
    const ty = Math.max(padTop, Math.min(hp.y - th / 2, padTop + chartH - th));

    ctx.fillStyle = "rgba(26,26,26,0.92)";
    ctx.beginPath();
    ctx.moveTo(tx + tr, ty);
    ctx.lineTo(tx + tw - tr, ty);
    ctx.arcTo(tx + tw, ty, tx + tw, ty + tr, tr);
    ctx.lineTo(tx + tw, ty + th - tr);
    ctx.arcTo(tx + tw, ty + th, tx + tw - tr, ty + th, tr);
    ctx.lineTo(tx + tr, ty + th);
    ctx.arcTo(tx, ty + th, tx, ty + th - tr, tr);
    ctx.lineTo(tx, ty + tr);
    ctx.arcTo(tx, ty, tx + tr, ty, tr);
    ctx.closePath();
    ctx.fill();

    ctx.textAlign = "left";
    ctx.font = "600 11px Inter, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(dateLabel, tx + 12, ty + 20);
    ctx.font = "800 15px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#fff";
    ctx.fillText(priceLabel, tx + 12, ty + 40);
  }
}

setDotPos(null);
hoverIdxRef.current = -1;
const start = performance.now();
const duration = 600;

function tick(now: number) {
  const elapsed = now - start;
  const p = Math.min(elapsed / duration, 1);
  const eased = 1 - Math.pow(1 - p, 3);
  draw(eased);
  if (p < 1) {
    rafRef.current = requestAnimationFrame(tick);
  } else {
    setDotPos({ x: (lastPt.x / w) * 100, y: (lastPt.y / h) * 100 });
  }
}
cancelAnimationFrame(rafRef.current);
rafRef.current = requestAnimationFrame(tick);

function findClosest(clientX: number) {
  const r = canvas!.getBoundingClientRect();
  const relX = (clientX - r.left - padLeft) / chartW;
  return Math.max(0, Math.min(data.length - 1, Math.round(relX * (data.length - 1))));
}
function onMove(clientX: number) {
  hoverIdxRef.current = findClosest(clientX);
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
}, [data]);

return (
<div className="relative">
<canvas
ref={canvasRef}
className="w-full h-[200px] sm:h-[240px] cursor-crosshair"
style={{ display: "block" }}
/>
{dotPos && (
<span className="absolute pointer-events-none" style={{ left: `${dotPos.x}%`, top: `${dotPos.y}%`, transform: "translate(-50%, -50%)" }}>
  <span className="block w-[8px] h-[8px] rounded-full bg-[#1a1a1a]" />
  <span className="absolute inset-[-4px] rounded-full bg-[#1a1a1a]/40 animate-pulse-dot" />
</span>
)}
</div>
);
}

export default function UsdPhpPage() {
const [rate, setRate] = useState(FALLBACK_RATE);
const [live, setLive] = useState(false);
const [historyData, setHistoryData] = useState<[number, number][]>([]);
const [usd, setUsd] = useState("1");
const [php, setPhp] = useState("");
const [direction, setDirection] = useState<"usd" | "php">("usd");
const [period, setPeriod] = useState("all");
const [lastUpdated, setLastUpdated] = useState<string>("");
const hasAnimated = useRef(false);
const introRaf = useRef<number>(0);

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

useEffect(() => {
async function loadHistory() {
try {
const res = await fetch("/api/usdphp-history");
if (!res.ok) throw new Error(res.statusText);
const data = await res.json();
if (data?.prices?.length) setHistoryData(data.prices as [number, number][]);
} catch { /* no history data */ }
}
loadHistory();
}, []);

const chartData = useMemo(() => {
if (historyData.length === 0) return [];

let pts: [number, number][];
if (period === "all") {
pts = historyData;
} else {
const now = Date.now();
const cutoff = now - Number(period) * 86400000;
const sliced = historyData.filter(d => d[0] >= cutoff);
pts = sliced.length >= 2 ? sliced : historyData.slice(-10);
}
const maxPoints = 150;
const step = Math.max(1, Math.floor(pts.length / maxPoints));
const sampled = pts.filter((_, i) => i % step === 0);
if (sampled.length > 0 && sampled[sampled.length - 1][0] !== pts[pts.length - 1][0]) {
sampled.push(pts[pts.length - 1]);
}
return sampled;
}, [historyData, period]);

useEffect(() => {
if (direction === "usd") {
const v = parseFloat(usd);
if (isNaN(v) || v === 0) { setPhp(""); return; }
const target = v * rate;

if (!hasAnimated.current && rate !== FALLBACK_RATE) {
  hasAnimated.current = true;
  const start = performance.now();
  cancelAnimationFrame(introRaf.current);
  function tick(now: number) {
    const p = Math.min((now - start) / 2500, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    setPhp((target * eased).toFixed(2));
    if (p < 1) introRaf.current = requestAnimationFrame(tick);
  }
  introRaf.current = requestAnimationFrame(tick);
} else {
  setPhp(target.toFixed(2));
}
}
}, [usd, rate, direction]);

useEffect(() => {
if (direction === "php") {
const v = parseFloat(php);
setUsd(isNaN(v) || v === 0 ? "" : (v / rate).toFixed(2));
}
}, [php, rate, direction]);

const chartMin = chartData.length > 0 ? Math.min(...chartData.map(d => d[1])) : 0;
const chartMax = chartData.length > 0 ? Math.max(...chartData.map(d => d[1])) : 0;
const chartStart = chartData.length > 0 ? chartData[0][1] : 0;
const chartChange = chartStart > 0 ? ((rate - chartStart) / chartStart * 100) : 0;

return (
<div className="min-h-screen bg-[#00c853]">
      <SiteHeader dark />

  <main className="max-w-[720px] mx-auto px-4 sm:px-6 pb-8">

    <div className="text-center mb-2">
      <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#1a1a1a]/50 mb-3">USD / PHP</p>
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <div className="flex items-center border border-white/30 rounded-2xl px-4 py-3 h-[60px] sm:h-[80px] w-[42%] overflow-hidden">
          <span className="text-3xl sm:text-5xl font-black text-white/50 mr-1 shrink-0">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={usd}
            onFocus={() => setDirection("usd")}
            onChange={(e) => { setDirection("usd"); setUsd(e.target.value); }}
            className={`bg-transparent font-black text-white outline-none placeholder-white/30 text-right min-w-0 flex-1 transition-[font-size] duration-200 ${
              usd.length > 7 ? "text-base sm:text-xl" : usd.length > 5 ? "text-xl sm:text-2xl" : "text-3xl sm:text-5xl"
            }`}
            placeholder="1"
          />
        </div>
        <span className="text-2xl sm:text-4xl font-black text-white/30 shrink-0">=</span>
        <div className="flex items-center border border-white/30 rounded-2xl px-4 py-3 h-[60px] sm:h-[80px] w-[42%] overflow-hidden">
          <span className="text-3xl sm:text-5xl font-black text-white/50 mr-1 shrink-0">₱</span>
          <input
            type="text"
            inputMode="decimal"
            value={php}
            onFocus={() => setDirection("php")}
            onChange={(e) => { setDirection("php"); setPhp(e.target.value); }}
            className={`bg-transparent font-black text-white outline-none placeholder-white/30 text-right min-w-0 flex-1 transition-[font-size] duration-200 ${
              php.length > 8 ? "text-base sm:text-xl" : php.length > 6 ? "text-xl sm:text-2xl" : "text-3xl sm:text-5xl"
            }`}
            placeholder="0"
          />
        </div>
      </div>
      {live && (
        <p className="text-[11px] text-[#1a1a1a]/40 mt-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1a1a1a]/50 mr-1 animate-pulse" />
          Updated {lastUpdated}
        </p>
      )}
    </div>

    <div className="bg-white/10 backdrop-blur-sm rounded-[20px] p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#1a1a1a]/50">Historical rate</p>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button key={p.days} onClick={() => setPeriod(p.days)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                period === p.days ? "bg-[#1a1a1a] text-white" : "bg-[#1a1a1a]/10 text-[#1a1a1a]/50"
              }`}>{p.label}</button>
          ))}
        </div>
      </div>

      {chartData.length > 0 ? (
        <>
          <RateChart data={chartData} />
          <div className="flex justify-between mt-3 text-[10px] text-[#1a1a1a]/40">
            <span>Low: ₱{chartMin.toFixed(2)}</span>
            <span className={chartChange >= 0 ? "text-[#1a1a1a]/70" : "text-red-600"}>
              {chartChange >= 0 ? "+" : ""}{chartChange.toFixed(2)}%
            </span>
            <span>High: ₱{chartMax.toFixed(2)}</span>
          </div>
        </>
      ) : (
        <div className="h-[200px] flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[#1a1a1a]/30 border-t-[#1a1a1a] rounded-full animate-spin" />
        </div>
      )}
    </div>

    <div className="bg-white/10 backdrop-blur-sm rounded-[20px] p-5 mb-4">
      <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#1a1a1a]/50 mb-3">Quick reference</p>
      <div className="grid grid-cols-2 gap-2">
        {[1, 5, 10, 20, 50, 100, 500, 1000].map((v) => (
          <div key={v} className="flex justify-between text-sm py-1.5 border-b border-[#1a1a1a]/5 last:border-0">
            <span className="text-[#1a1a1a]/50 font-medium">${v}</span>
            <span className="text-[#1a1a1a] font-bold"><AnimatedRate value={v * rate} /></span>
          </div>
        ))}
      </div>
    </div>

    <footer className="text-center pt-4">
      <p className="text-[10px] text-[#1a1a1a]/25 leading-relaxed max-w-md mx-auto">
        Live rate from USDT/PHP via CoinGecko. Historical chart from ECB via Frankfurter. May differ slightly from bank rates.
      </p>
    </footer>
  </main>
</div>
);
}
