"use client";

import { useEffect, useMemo, useState } from "react";
import SiteHeader from "@/components/SiteHeader";

type DebtPoint = {
  label: string;
  isoDate: string;
  debt: number;
  sourceUrl: string;
};

type DebtGdpPoint = {
  label: string;
  isoDate: string;
  debtGdpPct: number;
  sourceUrl: string;
};

function formatPeso(value: number) {
  if (value >= 1e12) return `₱${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `₱${(value / 1e9).toFixed(1)}B`;
  return `₱${Math.round(value).toLocaleString("en-PH")}`;
}

function DebtChart({ points, debtGdpPoints }: { points: DebtPoint[]; debtGdpPoints: DebtGdpPoint[] }) {
  if (points.length < 2) return null;
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const w = 620;
  const h = 230;
  const padL = 46;
  const padR = 42;
  const padT = 16;
  const padB = 32;
  const cW = w - padL - padR;
  const cH = h - padT - padB;

  const values = points.map((p) => p.debt);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const debtGdpByIsoDate = new Map(debtGdpPoints.map((p) => [p.isoDate, p]));
  const debtGdpValues = debtGdpPoints.map((p) => p.debtGdpPct);
  const gdpMin = debtGdpValues.length ? Math.min(...debtGdpValues) : 0;
  const gdpMax = debtGdpValues.length ? Math.max(...debtGdpValues) : 100;
  const gdpRange = gdpMax - gdpMin || 1;

  const coords = points.map((p, i) => ({
    ...p,
    x: padL + (i / (points.length - 1)) * cW,
    y: padT + ((max - p.debt) / range) * cH,
  }));

  const gdpCoords = coords.flatMap((p) => {
    const gdpPoint = debtGdpByIsoDate.get(p.isoDate);
    if (!gdpPoint) return [];

    return [{
      ...gdpPoint,
      x: p.x,
      y: padT + ((gdpMax - gdpPoint.debtGdpPct) / gdpRange) * cH,
    }];
  });

  const path = coords.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const gdpPath = gdpCoords.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${path} L${coords[coords.length - 1].x},${padT + cH} L${coords[0].x},${padT + cH} Z`;

  const hoverPoint = hoverIdx !== null ? coords[hoverIdx] : null;
  const hoverDebtGdp = hoverPoint ? debtGdpByIsoDate.get(hoverPoint.isoDate) : null;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full"
      onMouseLeave={() => setHoverIdx(null)}
      onTouchEnd={() => setHoverIdx(null)}
    >
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
            <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#aaa">
              {(val / 1e12).toFixed(1)}T
            </text>
            {debtGdpValues.length > 0 && (
              <text x={padL + cW + 6} y={y + 4} textAnchor="start" fontSize="9" fill="#aaa">
                {(gdpMin + gdpRange * (1 - f)).toFixed(1)}%
              </text>
            )}
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
      {gdpCoords.length > 1 && (
        <path
          d={gdpPath}
          fill="none"
          stroke="#1e88e5"
          strokeWidth="2.2"
          strokeDasharray="7 5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      <rect
        x={padL}
        y={padT}
        width={cW}
        height={cH}
        fill="transparent"
        onMouseMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          const relX = Math.max(0, Math.min(1, (e.clientX - box.left) / box.width));
          setHoverIdx(Math.round(relX * (points.length - 1)));
        }}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          if (!touch) return;
          const box = e.currentTarget.getBoundingClientRect();
          const relX = Math.max(0, Math.min(1, (touch.clientX - box.left) / box.width));
          setHoverIdx(Math.round(relX * (points.length - 1)));
        }}
      />

      {hoverPoint && (
        <>
          <line x1={hoverPoint.x} y1={padT} x2={hoverPoint.x} y2={padT + cH} stroke="#00a844" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
          <circle cx={hoverPoint.x} cy={hoverPoint.y} r="4.5" fill="#00c853" stroke="white" strokeWidth="2" />
          {hoverDebtGdp && (
            <circle
              cx={hoverPoint.x}
              cy={padT + ((gdpMax - hoverDebtGdp.debtGdpPct) / gdpRange) * cH}
              r="4.5"
              fill="#1e88e5"
              stroke="white"
              strokeWidth="2"
            />
          )}
          <g transform={`translate(${Math.min(w - 140, Math.max(8, hoverPoint.x - 62))}, ${Math.max(8, hoverPoint.y - 58)})`}>
            <rect width="130" height={hoverDebtGdp ? "52" : "36"} rx="8" fill="#111" opacity="0.93" />
            <text x="8" y="14" fontSize="9" fill="#ddd">{hoverPoint.label}</text>
            <text x="8" y="28" fontSize="10" fill="#fff" fontWeight="700">{formatPeso(hoverPoint.debt)}</text>
            {hoverDebtGdp && <text x="8" y="42" fontSize="10" fill="#90caf9" fontWeight="700">Debt/GDP: {hoverDebtGdp.debtGdpPct.toFixed(1)}%</text>}
          </g>
        </>
      )}
    </svg>
  );
}

export default function DebtPage() {
  const [points, setPoints] = useState<DebtPoint[]>([]);
  const [debtGdpPoints, setDebtGdpPoints] = useState<DebtGdpPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/debt")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.points)) {
          setPoints(d.points);
        }
        if (Array.isArray(d?.debtGdpPoints)) {
          setDebtGdpPoints(d.debtGdpPoints);
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
          <p className="text-[11px] uppercase tracking-[1px] text-[#888] font-semibold mb-1">Trend over time</p>
          <div className="flex items-center gap-4 text-[11px] mb-2 text-[#666]">
            <span className="inline-flex items-center gap-1.5"><span className="h-[2px] w-7 bg-[#00c853] inline-block" />Debt stock</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-[2px] w-7 border-t-2 border-dashed border-[#1e88e5] inline-block" />Debt-to-GDP</span>
          </div>
          {points.length > 1 ? <DebtChart points={points} debtGdpPoints={debtGdpPoints} /> : <p className="text-[13px] text-[#888] py-8 text-center">{loading ? "Loading chart..." : "Not enough data yet."}</p>}
          <p className="text-[11px] text-[#888] mt-2">Hover or drag across the chart to inspect each data point.</p>
        </section>

      </main>
    </div>
  );
}
