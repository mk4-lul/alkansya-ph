"use client";

import { useEffect, useMemo, useState } from "react";
import SiteHeader from "@/components/SiteHeader";

type DebtPoint = {
  label: string;
  isoDate: string;
  debt: number;
  sourceUrl: string;
};

function formatPeso(value: number) {
  if (value >= 1e12) return `₱${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `₱${(value / 1e9).toFixed(1)}B`;
  return `₱${Math.round(value).toLocaleString("en-PH")}`;
}

function DebtChart({ points }: { points: DebtPoint[] }) {
  if (points.length < 2) return null;

  const w = 620;
  const h = 220;
  const padL = 40;
  const padR = 10;
  const padT = 14;
  const padB = 30;
  const cW = w - padL - padR;
  const cH = h - padT - padB;

  const values = points.map((p) => p.debt);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = points.map((p, i) => ({
    ...p,
    x: padL + (i / (points.length - 1)) * cW,
    y: padT + ((max - p.debt) / range) * cH,
  }));

  const path = coords.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${path} L${coords[coords.length - 1].x},${padT + cH} L${coords[0].x},${padT + cH} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      <defs>
        <linearGradient id="debtFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00c853" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#00c853" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const val = min + range * (1 - f);
        const y = padT + f * cH;
        return (
          <g key={f}>
            <line x1={padL} x2={padL + cW} y1={y} y2={y} stroke="#ececec" strokeWidth="1" />
            <text x={padL - 5} y={y + 4} textAnchor="end" fontSize="9" fill="#aaa">
              {(val / 1e12).toFixed(1)}T
            </text>
          </g>
        );
      })}

      {coords.filter((_, i) => i === 0 || i === coords.length - 1 || i % Math.ceil(coords.length / 5) === 0).map((p) => (
        <text key={p.isoDate} x={p.x} y={padT + cH + 16} textAnchor="middle" fontSize="9" fill="#aaa">
          {p.label}
        </text>
      ))}

      <path d={area} fill="url(#debtFill)" />
      <path d={path} fill="none" stroke="#00c853" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function DebtPage() {
  const [points, setPoints] = useState<DebtPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    fetch("/api/debt")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.points)) {
          setPoints(d.points);
          setUsingFallback(Boolean(d.usedFallback));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const latest = points[points.length - 1];
  const previous = points[points.length - 2];

  const trend = useMemo(() => {
    if (!latest || !previous) return null;
    const change = latest.debt - previous.debt;
    const pct = (change / previous.debt) * 100;
    return { change, pct };
  }, [latest, previous]);

  const perFilipino = latest ? latest.debt / 115_000_000 : 0;

  return (
    <div className="min-h-screen bg-[#f5f5f5] glow-bg">
      <SiteHeader />

      <main className="max-w-[720px] mx-auto px-4 sm:px-6 pb-8">
        <h1 className="text-[22px] sm:text-[26px] font-extrabold text-[#1a1a1a] tracking-tight mb-1">Philippine National Debt</h1>
        <p className="text-[13px] text-[#888] mb-6">Simple, no-BS view of the national debt based on Bureau of the Treasury releases.</p>

        <section className="bg-[#111] text-white rounded-[20px] p-5 mb-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[1px] text-white/70 font-semibold mb-1">Latest reported total</p>
          <p className="text-[40px] sm:text-[52px] font-black tracking-tight leading-none">{latest ? formatPeso(latest.debt) : "—"}</p>
          <p className="text-[12px] text-white/70 mt-2">
            {latest ? `As of ${latest.label}` : loading ? "Loading..." : "No data yet"}
          </p>
          {trend && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
              <span className={`text-[12px] font-bold ${trend.change >= 0 ? "text-[#ff8a80]" : "text-[#86efac]"}`}>
                {trend.change >= 0 ? "▲" : "▼"} {formatPeso(Math.abs(trend.change))}
              </span>
              <span className="text-[11px] text-white/70">({Math.abs(trend.pct).toFixed(2)}% vs prior report)</span>
            </div>
          )}
        </section>

        <section className="grid sm:grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-[18px] p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-[1px] text-[#888] font-semibold mb-1">Rough per Filipino share</p>
            <p className="text-[26px] font-extrabold text-[#1a1a1a]">{latest ? `₱${Math.round(perFilipino).toLocaleString("en-PH")}` : "—"}</p>
            <p className="text-[11px] text-[#888] mt-1">Using ~115M population for easy context.</p>
          </div>
          <div className="bg-white rounded-[18px] p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-[1px] text-[#888] font-semibold mb-1">Source</p>
            <p className="text-[15px] font-bold text-[#1a1a1a]">Bureau of the Treasury</p>
            <a className="text-[12px] text-[#00a844] underline mt-1 inline-block" href="https://www.treasury.gov.ph/?page_id=12407" target="_blank" rel="noreferrer">Open official data page</a>
          </div>
        </section>

        <section className="bg-white rounded-[20px] p-4 shadow-sm mb-3">
          <p className="text-[11px] uppercase tracking-[1px] text-[#888] font-semibold mb-2">Trend over time</p>
          {points.length > 1 ? <DebtChart points={points} /> : <p className="text-[13px] text-[#888] py-8 text-center">{loading ? "Loading chart..." : "Not enough data yet."}</p>}
        </section>

        {usingFallback && (
          <p className="text-[11px] text-[#a16207] bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            Couldn’t reach live BTr pages right now. Showing last known fallback points.
          </p>
        )}
      </main>
    </div>
  );
}
