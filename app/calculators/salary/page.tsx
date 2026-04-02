"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import NavMenu from "@/components/NavMenu";

// ─── Data ────────────────────────────────────────────────────────
// All salary ranges in PHP thousands per month.
// Sources: Indeed, Glassdoor, PayScale, ERI SalaryExpert, OFW forums,
// government salary tables (PSA, BLS, NHS, etc.), 2024-2025 data.
// Converted at approximate rates: USD 57, CAD 42, GBP 72, AUD 38,
// AED 15.5, SAR 15.2, SGD 43, JPY 0.38, KRW 0.042, NZD 34, EUR 62.

interface Profession {
  id: string;
  name: string;
  emoji: string;
}

const PROFESSIONS: Profession[] = [
  { id: "nurse", name: "Nurse", emoji: "🏥" },
  { id: "swe", name: "Software Engineer", emoji: "💻" },
  { id: "bpo", name: "BPO / Call Center", emoji: "🎧" },
  { id: "caregiver", name: "Caregiver", emoji: "🤲" },
  { id: "seaman", name: "Seaman", emoji: "🚢" },
  { id: "teacher", name: "Teacher", emoji: "📚" },
  { id: "accountant", name: "Accountant", emoji: "📊" },
  { id: "engineer", name: "Engineer", emoji: "🔧" },
  { id: "chef", name: "Chef / Cook", emoji: "👨‍🍳" },
  { id: "hotel", name: "Hospitality", emoji: "🏨" },
  { id: "factory", name: "Factory Worker", emoji: "🏭" },
  { id: "construction", name: "Construction", emoji: "👷" },
];

type Experience = "entry" | "mid" | "senior";
const EXP_OPTIONS: { id: Experience; label: string; desc: string }[] = [
  { id: "entry", label: "0–2 years", desc: "Entry level" },
  { id: "mid", label: "3–7 years", desc: "Mid level" },
  { id: "senior", label: "8+ years", desc: "Senior level" },
];

interface Country {
  id: string;
  name: string;
  flag: string;
  currency: string;
  rate: number; // to PHP
  col: number; // cost of living index, PH = 100
  visa: "none" | "easy" | "moderate" | "hard";
  visaNote: string;
}

const COUNTRIES: Country[] = [
  { id: "ph", name: "Philippines", flag: "🇵🇭", currency: "PHP", rate: 1, col: 100, visa: "none", visaNote: "Home country" },
  { id: "us", name: "USA", flag: "🇺🇸", currency: "USD", rate: 57, col: 350, visa: "hard", visaNote: "Employer petition required. Long processing (1–5+ years). NCLEX for nurses, H-1B lottery for tech." },
  { id: "ca", name: "Canada", flag: "🇨🇦", currency: "CAD", rate: 42, col: 310, visa: "moderate", visaNote: "Express Entry for skilled workers. Caregiver and nurse pathways available. PR possible in 1–2 years." },
  { id: "uk", name: "United Kingdom", flag: "🇬🇧", currency: "GBP", rate: 72, col: 340, visa: "moderate", visaNote: "Skilled Worker visa with employer sponsor. Health & Care visa fast-tracked for nurses/caregivers." },
  { id: "au", name: "Australia", flag: "🇦🇺", currency: "AUD", rate: 38, col: 320, visa: "moderate", visaNote: "Skilled migration (189/190). Employer-sponsored (482). Nurses and engineers on shortage list." },
  { id: "ae", name: "UAE", flag: "🇦🇪", currency: "AED", rate: 15.5, col: 280, visa: "easy", visaNote: "Employer-sponsored. Fast processing (weeks). No income tax. Housing often included." },
  { id: "sa", name: "Saudi Arabia", flag: "🇸🇦", currency: "SAR", rate: 15.2, col: 200, visa: "easy", visaNote: "Employer-sponsored (iqama). Fast processing. No income tax. Housing/transport often included." },
  { id: "sg", name: "Singapore", flag: "🇸🇬", currency: "SGD", rate: 43, col: 350, visa: "moderate", visaNote: "Employment Pass (professionals) or S Pass (mid-skilled). Employer must apply. Competitive quotas." },
  { id: "jp", name: "Japan", flag: "🇯🇵", currency: "JPY", rate: 0.38, col: 300, visa: "moderate", visaNote: "Specified Skilled Worker visa. Japanese language ability (N4+) often required. TITP program for some roles." },
  { id: "kr", name: "South Korea", flag: "🇰🇷", currency: "KRW", rate: 0.042, col: 270, visa: "moderate", visaNote: "Employment Permit System (E-9). Korean language test (EPS-TOPIK) required for factory/construction." },
  { id: "nz", name: "New Zealand", flag: "🇳🇿", currency: "NZD", rate: 34, col: 290, visa: "moderate", visaNote: "Skilled Migrant Category. Accredited Employer Work Visa. Nurses/engineers on Green List for residency." },
  { id: "de", name: "Germany", flag: "🇩🇪", currency: "EUR", rate: 62, col: 300, visa: "moderate", visaNote: "Skilled Worker visa or EU Blue Card. Recognition of qualifications required. German language helps." },
];

// Salary data: [entryMin, entryMax, midMin, midMax, seniorMin, seniorMax, confidence]
// Values in PHP thousands. Confidence: 1=high, 2=medium, 3=low
type SalaryRow = [number, number, number, number, number, number, number];

const S: Record<string, Record<string, SalaryRow>> = {
  nurse: {
    ph: [12, 18, 18, 28, 28, 40, 1],
    us: [250, 310, 340, 460, 460, 630, 1],
    ca: [190, 250, 250, 340, 340, 420, 1],
    uk: [145, 200, 200, 290, 290, 400, 1],
    au: [190, 250, 250, 340, 340, 420, 1],
    ae: [60, 95, 95, 140, 140, 200, 1],
    sa: [55, 85, 85, 130, 130, 180, 1],
    sg: [85, 130, 130, 175, 175, 260, 2],
    jp: [115, 150, 150, 200, 200, 270, 2],
    kr: [85, 120, 120, 170, 170, 230, 2],
    nz: [140, 190, 190, 250, 250, 340, 1],
    de: [155, 210, 210, 280, 280, 370, 1],
  },
  swe: {
    ph: [15, 25, 25, 50, 50, 100, 1],
    us: [340, 460, 570, 800, 800, 1250, 1],
    ca: [250, 340, 380, 550, 550, 800, 1],
    uk: [220, 310, 310, 460, 460, 680, 1],
    au: [230, 310, 340, 480, 480, 680, 1],
    ae: [125, 190, 190, 280, 280, 400, 2],
    sa: [100, 155, 155, 230, 230, 340, 2],
    sg: [175, 260, 260, 400, 400, 600, 1],
    jp: [150, 220, 230, 360, 360, 530, 2],
    kr: [130, 190, 190, 300, 300, 460, 2],
    nz: [170, 240, 260, 370, 370, 520, 2],
    de: [190, 280, 280, 400, 400, 560, 1],
  },
  bpo: {
    ph: [12, 18, 18, 28, 28, 45, 1],
    us: [160, 200, 200, 285, 285, 400, 2],
    ca: [130, 170, 170, 230, 230, 310, 2],
    uk: [115, 160, 160, 220, 220, 310, 2],
    au: [140, 190, 190, 260, 260, 340, 2],
    ae: [45, 75, 75, 110, 110, 160, 2],
    sa: [35, 55, 55, 85, 85, 130, 3],
    sg: [65, 95, 95, 140, 140, 210, 2],
    jp: [80, 115, 115, 160, 160, 230, 3],
    kr: [65, 95, 95, 130, 130, 190, 3],
    nz: [105, 140, 150, 200, 200, 280, 3],
    de: [120, 165, 165, 230, 230, 310, 3],
  },
  caregiver: {
    ph: [6, 10, 10, 15, 15, 22, 1],
    us: [140, 185, 185, 230, 230, 285, 2],
    ca: [100, 140, 140, 185, 185, 230, 1],
    uk: [95, 140, 140, 190, 190, 250, 2],
    au: [115, 155, 155, 200, 200, 260, 2],
    ae: [25, 40, 40, 60, 60, 85, 1],
    sa: [20, 35, 35, 50, 50, 75, 1],
    sg: [25, 35, 35, 50, 50, 70, 1],
    jp: [65, 95, 95, 130, 130, 170, 2],
    kr: [55, 80, 80, 110, 110, 150, 2],
    nz: [95, 130, 130, 170, 170, 220, 2],
    de: [95, 130, 130, 175, 175, 230, 2],
  },
  seaman: {
    ph: [18, 30, 30, 55, 55, 120, 1],
    us: [170, 285, 285, 400, 400, 570, 2],
    ca: [145, 230, 230, 340, 340, 510, 3],
    uk: [145, 230, 230, 340, 340, 510, 2],
    au: [170, 260, 260, 380, 380, 570, 3],
    ae: [55, 95, 95, 145, 145, 230, 2],
    sa: [50, 85, 85, 130, 130, 200, 2],
    sg: [85, 130, 130, 200, 200, 310, 2],
    jp: [115, 170, 170, 260, 260, 400, 2],
    kr: [95, 145, 145, 220, 220, 340, 2],
    nz: [130, 200, 200, 310, 310, 460, 3],
    de: [145, 220, 220, 340, 340, 510, 2],
  },
  teacher: {
    ph: [12, 18, 18, 25, 25, 38, 1],
    us: [200, 260, 260, 340, 340, 460, 1],
    ca: [170, 230, 230, 310, 310, 420, 1],
    uk: [145, 200, 200, 270, 270, 370, 1],
    au: [175, 240, 240, 310, 310, 400, 1],
    ae: [55, 85, 85, 125, 125, 185, 2],
    sa: [45, 70, 70, 105, 105, 155, 2],
    sg: [90, 130, 130, 185, 185, 260, 2],
    jp: [95, 140, 140, 200, 200, 285, 2],
    kr: [85, 125, 125, 175, 175, 250, 2],
    nz: [130, 175, 180, 245, 245, 340, 1],
    de: [155, 210, 210, 280, 280, 370, 1],
  },
  accountant: {
    ph: [12, 18, 18, 32, 32, 55, 1],
    us: [260, 340, 370, 510, 510, 740, 1],
    ca: [190, 260, 280, 380, 380, 540, 1],
    uk: [170, 230, 250, 360, 360, 500, 1],
    au: [190, 260, 280, 380, 380, 530, 1],
    ae: [60, 95, 110, 160, 160, 250, 2],
    sa: [50, 80, 85, 130, 130, 200, 2],
    sg: [105, 150, 170, 250, 250, 370, 1],
    jp: [115, 165, 180, 260, 260, 380, 2],
    kr: [95, 140, 150, 220, 220, 330, 2],
    nz: [140, 200, 210, 290, 290, 400, 2],
    de: [155, 220, 240, 340, 340, 470, 1],
  },
  engineer: {
    ph: [12, 18, 18, 32, 32, 55, 1],
    us: [285, 400, 400, 570, 570, 800, 1],
    ca: [220, 310, 330, 460, 460, 630, 1],
    uk: [180, 250, 270, 380, 380, 530, 1],
    au: [220, 300, 320, 440, 440, 610, 1],
    ae: [75, 120, 130, 200, 200, 310, 2],
    sa: [60, 100, 105, 165, 165, 260, 2],
    sg: [115, 170, 185, 280, 280, 400, 2],
    jp: [115, 175, 185, 280, 280, 420, 2],
    kr: [95, 145, 155, 230, 230, 350, 2],
    nz: [170, 240, 250, 350, 350, 480, 2],
    de: [185, 260, 270, 380, 380, 530, 1],
  },
  chef: {
    ph: [8, 13, 13, 20, 20, 35, 1],
    us: [155, 200, 200, 285, 285, 460, 2],
    ca: [120, 170, 170, 230, 230, 340, 2],
    uk: [110, 155, 155, 220, 220, 340, 2],
    au: [130, 175, 180, 250, 250, 360, 2],
    ae: [30, 50, 55, 85, 85, 140, 2],
    sa: [25, 40, 45, 70, 70, 115, 2],
    sg: [50, 80, 85, 125, 125, 190, 2],
    jp: [75, 110, 115, 165, 165, 250, 2],
    kr: [65, 95, 95, 140, 140, 210, 2],
    nz: [100, 145, 150, 210, 210, 310, 1],
    de: [110, 155, 160, 230, 230, 340, 2],
  },
  hotel: {
    ph: [8, 12, 12, 18, 18, 30, 1],
    us: [140, 185, 200, 280, 280, 400, 2],
    ca: [110, 150, 155, 220, 220, 310, 2],
    uk: [100, 140, 145, 200, 200, 290, 2],
    au: [120, 165, 175, 240, 240, 340, 2],
    ae: [25, 45, 50, 80, 80, 130, 2],
    sa: [20, 35, 40, 65, 65, 105, 2],
    sg: [45, 70, 75, 115, 115, 175, 2],
    jp: [65, 100, 105, 155, 155, 230, 2],
    kr: [55, 80, 85, 125, 125, 185, 2],
    nz: [90, 125, 135, 190, 190, 270, 2],
    de: [100, 140, 150, 210, 210, 300, 2],
  },
  factory: {
    ph: [8, 11, 11, 15, 15, 22, 1],
    us: [160, 200, 200, 260, 260, 340, 2],
    ca: [125, 165, 170, 220, 220, 280, 2],
    uk: [110, 150, 155, 200, 200, 260, 2],
    au: [130, 175, 180, 230, 230, 300, 2],
    ae: [20, 35, 35, 55, 55, 80, 1],
    sa: [18, 30, 30, 45, 45, 70, 1],
    sg: [35, 55, 55, 80, 80, 115, 2],
    jp: [75, 105, 110, 150, 150, 200, 1],
    kr: [70, 100, 100, 140, 140, 185, 1],
    nz: [100, 140, 145, 190, 190, 250, 2],
    de: [115, 160, 165, 220, 220, 290, 2],
  },
  construction: {
    ph: [8, 12, 12, 18, 18, 30, 1],
    us: [170, 230, 230, 315, 315, 430, 2],
    ca: [145, 200, 210, 285, 285, 390, 2],
    uk: [120, 170, 175, 240, 240, 330, 2],
    au: [155, 210, 220, 300, 300, 400, 2],
    ae: [20, 35, 35, 55, 55, 85, 1],
    sa: [18, 30, 30, 50, 50, 75, 1],
    sg: [35, 55, 55, 85, 85, 125, 2],
    jp: [80, 115, 120, 170, 170, 240, 2],
    kr: [75, 105, 110, 155, 155, 220, 2],
    nz: [115, 165, 170, 240, 240, 330, 2],
    de: [125, 175, 180, 250, 250, 345, 2],
  },
};

// Sources per country
const SOURCES: Record<string, string[]> = {
  ph: ["https://ph.indeed.com/career/salaries", "https://ph.jobstreet.com/career-advice/salary"],
  us: ["https://www.bls.gov/oes/", "https://www.indeed.com/career/salaries"],
  ca: ["https://www.jobbank.gc.ca/wagereport", "https://ca.indeed.com/career/salaries"],
  uk: ["https://www.ons.gov.uk/surveys/informationforhouseholdsandindividuals/householdandindividualsurveys/annualsurveyofhoursandearningsashe", "https://uk.indeed.com/career/salaries"],
  au: ["https://www.abs.gov.au/", "https://au.indeed.com/career/salaries"],
  ae: ["https://www.glassdoor.com/Salaries/dubai-salary-SRCH_IL.0,5_IM977.htm", "https://www.bayt.com/en/uae/salaries/"],
  sa: ["https://www.glassdoor.com/Salaries/saudi-arabia-salary-SRCH_IL.0,12_IN207.htm"],
  sg: ["https://www.mom.gov.sg/", "https://sg.indeed.com/career/salaries"],
  jp: ["https://www.glassdoor.com/Salaries/japan-salary-SRCH_IL.0,5_IN123.htm"],
  kr: ["https://www.glassdoor.com/Salaries/south-korea-salary-SRCH_IL.0,11_IN135.htm"],
  nz: ["https://www.careers.govt.nz/jobs-database/", "https://nz.indeed.com/career/salaries"],
  de: ["https://www.glassdoor.com/Salaries/germany-salary-SRCH_IL.0,7_IN96.htm", "https://de.indeed.com/career/salaries"],
};

// ─── Helpers ─────────────────────────────────────────────────────

function fmt(n: number): string {
  return Math.round(n).toLocaleString("en-PH");
}

function fmtK(v: number): string {
  if (v >= 1000) return `₱${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}M`;
  return `₱${fmt(v * 1000)}`;
}

function fmtRange(min: number, max: number): string {
  return `₱${fmt(min * 1000)} – ₱${fmt(max * 1000)}`;
}

function getConfLabel(c: number): { text: string; color: string; bg: string } {
  if (c === 1) return { text: "Reliable data", color: "#00c853", bg: "rgba(0,200,83,0.1)" };
  if (c === 2) return { text: "Good estimate", color: "#FF9800", bg: "rgba(255,152,0,0.1)" };
  return { text: "Rough estimate", color: "#888", bg: "rgba(136,136,136,0.1)" };
}

function getVisaLabel(v: string): { text: string; color: string; bg: string } {
  if (v === "none") return { text: "No visa needed", color: "#00c853", bg: "rgba(0,200,83,0.1)" };
  if (v === "easy") return { text: "Easy", color: "#00c853", bg: "rgba(0,200,83,0.1)" };
  if (v === "moderate") return { text: "Moderate", color: "#FF9800", bg: "rgba(255,152,0,0.1)" };
  return { text: "Hard", color: "#D32F2F", bg: "rgba(211,47,47,0.1)" };
}

function getColLabel(col: number): { text: string; color: string } {
  if (col <= 120) return { text: "Very affordable", color: "#00c853" };
  if (col <= 200) return { text: "Affordable", color: "#00c853" };
  if (col <= 280) return { text: "Moderate", color: "#FF9800" };
  if (col <= 340) return { text: "Expensive", color: "#D32F2F" };
  return { text: "Very expensive", color: "#D32F2F" };
}

// ─── Component ───────────────────────────────────────────────────

export default function SalaryPage() {
  const [profId, setProfId] = useState<string | null>(null);
  const [exp, setExp] = useState<Experience | null>(null);
  const [countryId, setCountryId] = useState<string | null>(null);
  const [fadeOut, setFadeOut] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);
  const [showResult, setShowResult] = useState(false);

  const profession = PROFESSIONS.find((p) => p.id === profId);
  const country = COUNTRIES.find((c) => c.id === countryId);
  const phBaseline = COUNTRIES[0];

  const isReady = profId && exp && countryId;

  function animatedPick(setter: () => void) {
    setFadeOut(true);
    setTimeout(() => {
      setter();
      setFadeOut(false);
      setFadeIn(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setFadeIn(true)));
    }, 200);
  }

  // Trigger result animation
  useEffect(() => {
    if (isReady) {
      setShowResult(false);
      const t = setTimeout(() => setShowResult(true), 80);
      return () => clearTimeout(t);
    } else {
      setShowResult(false);
    }
  }, [isReady, profId, exp, countryId]);

  const result = useMemo(() => {
    if (!profId || !exp || !countryId) return null;
    const row = S[profId]?.[countryId];
    const phRow = S[profId]?.ph;
    if (!row || !phRow) return null;

    const idx = exp === "entry" ? 0 : exp === "mid" ? 2 : 4;
    const min = row[idx];
    const max = row[idx + 1];
    const conf = row[6];
    const phMin = phRow[idx];
    const phMax = phRow[idx + 1];
    const multiplier = phMin > 0 ? min / phMin : 0;

    return { min, max, conf, phMin, phMax, multiplier };
  }, [profId, exp, countryId]);

  function handleReset() {
    setProfId(null);
    setExp(null);
    setCountryId(null);
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <nav className="flex justify-between items-center px-4 sm:px-6 py-4 max-w-[720px] mx-auto">
        <Link href="/" className="no-underline">
          <span className="text-[#00e401]" style={{fontFamily:"var(--font-old-english)"}}>Sentral</span>
        </Link>
        <NavMenu />
      </nav>

      <main className="max-w-[720px] mx-auto px-4 sm:px-6 pb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a1a1a] tracking-tight mb-4">Magkano sahod abroad?</h1>

        {/* Inputs — one at a time, animated */}
        {!isReady && (
        <div
          className="transition-all duration-200 ease-out mb-16"
          style={{
            opacity: fadeOut ? 0 : fadeIn ? 1 : 0,
            transform: fadeOut ? "translateY(-10px) scale(0.98)" : fadeIn ? "translateY(0) scale(1)" : "translateY(10px) scale(0.98)",
          }}
        >
          {/* Step 1: Profession */}
          {!profId && (
          <div className="bg-white rounded-[20px] p-5 pb-7 sm:p-6 sm:pb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">Profession</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PROFESSIONS.map((p) => (
                <button key={p.id} onClick={() => animatedPick(() => setProfId(p.id))}
                  className="py-3 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#e8e8e8]">
                  <span className="text-base">{p.emoji}</span> {p.name}
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Step 2: Experience */}
          {profId && !exp && (
          <>
          <div className="flex items-center justify-between px-1 mb-1">
            <p className="text-[12px] text-[#888]">{profession?.emoji} {profession?.name}</p>
            <button onClick={() => animatedPick(() => setProfId(null))} className="text-[12px] font-semibold text-[#00c853]">Change ↻</button>
          </div>
          <div className="bg-white rounded-[20px] p-5 pb-7 sm:p-6 sm:pb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">Experience</p>
            <div className="grid grid-cols-3 gap-2">
              {EXP_OPTIONS.map((e) => (
                <button key={e.id} onClick={() => animatedPick(() => setExp(e.id))}
                  className="py-3 rounded-xl text-[12px] font-bold transition-all bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#e8e8e8]">
                  <span className="block">{e.label}</span>
                  <span className="text-[10px] font-normal text-[#aaa]">{e.desc}</span>
                </button>
              ))}
            </div>
          </div>
          </>
          )}

          {/* Step 3: Country */}
          {profId && exp && !countryId && (
          <>
          <div className="flex items-center justify-between px-1 mb-1">
            <p className="text-[12px] text-[#888]">{profession?.emoji} {profession?.name} · {EXP_OPTIONS.find(e => e.id === exp)?.label}</p>
            <button onClick={() => animatedPick(() => setExp(null))} className="text-[12px] font-semibold text-[#00c853]">Change ↻</button>
          </div>
          <div className="bg-white rounded-[20px] p-5 pb-7 sm:p-6 sm:pb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">Country</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COUNTRIES.map((c) => (
                <button key={c.id} onClick={() => { setCountryId(c.id); }}
                  className="py-3 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#e8e8e8]">
                  <span className="text-base">{c.flag}</span> {c.name}
                </button>
              ))}
            </div>
          </div>
          </>
          )}
        </div>
        )}

        {/* Result */}
        {isReady && result && country && profession && (
        <>
          {/* Summary line */}
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-[12px] text-[#888]">
              {profession.emoji} {profession.name} · {EXP_OPTIONS.find(e => e.id === exp)?.label} · {country.flag} {country.name}
            </p>
            <button onClick={handleReset}
              className="text-[12px] font-semibold text-[#00c853] hover:text-[#00a844] transition-colors"
            >Change ↻</button>
          </div>

          {/* Salary card */}
          <div className="bg-[#1a1a1a] rounded-[20px] p-6 sm:p-8 mb-3 transition-all duration-700 ease-out"
            style={{
              transform: showResult ? "scale(1) translateY(0)" : "scale(0.92) translateY(20px)",
              opacity: showResult ? 1 : 0,
            }}>
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[1px] text-white/40 mb-1 transition-all duration-500 delay-200"
                style={{ opacity: showResult ? 1 : 0, transform: showResult ? "translateY(0)" : "translateY(10px)" }}>
                Estimated monthly salary
              </p>
              <p className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-1 transition-all duration-500 delay-300"
                style={{ opacity: showResult ? 1 : 0 }}>
                ₱{fmt(result.min * 1000)} <span className="text-white/30 font-bold">–</span> ₱{fmt(result.max * 1000)}
              </p>
              <p className="text-[11px] font-semibold text-white/30 mb-4 transition-all duration-500 delay-300"
                style={{ opacity: showResult ? 1 : 0 }}>
                per month in {country.name}
              </p>

              {/* Confidence badge */}
              {(() => {
                const c = getConfLabel(result.conf);
                return (
                  <span className="text-[10px] font-semibold px-3 py-1 rounded-full"
                    style={{ color: c.color, background: c.bg }}>{c.text}</span>
                );
              })()}

              {/* vs Philippines */}
              {countryId !== "ph" && (
              <div className="mt-5 bg-white/10 rounded-2xl px-5 py-4">
                <div className="flex justify-between items-center">
                  <div className="text-left">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Same role in PH</p>
                    <p className="text-base font-extrabold text-white/70">₱{fmt(result.phMin * 1000)} – ₱{fmt(result.phMax * 1000)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Multiplier</p>
                    <p className={`text-lg font-extrabold ${result.multiplier >= 1 ? "text-[#00c853]" : "text-[#ff5252]"}`}>
                      {result.multiplier.toFixed(1)}×
                    </p>
                  </div>
                </div>
              </div>
              )}
            </div>

            {/* Warning */}
            <p className="text-[10px] text-white/25 text-center mt-4 leading-relaxed max-w-xs mx-auto">
              Actual offers can be lower depending on employer, city, and qualifications. Treat the lower number as the realistic starting point.
            </p>
          </div>

          {/* Country details */}
          <div className="bg-white rounded-[20px] p-5 sm:p-6 mb-3 transition-all duration-500 delay-300"
            style={{ opacity: showResult ? 1 : 0, transform: showResult ? "translateY(0)" : "translateY(15px)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">{country.flag} {country.name}</p>
            <div className="space-y-3">
              {/* Cost of living */}
              <div className="flex items-center justify-between py-2 border-b border-black/5">
                <div>
                  <p className="text-sm font-bold text-[#1a1a1a]">Cost of living</p>
                  <p className="text-[10px] text-[#aaa]">Relative to Philippines = 100</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold" style={{ color: getColLabel(country.col).color }}>
                    {getColLabel(country.col).text}
                  </p>
                  <p className="text-[10px] text-[#aaa]">{country.col}/100 index</p>
                </div>
              </div>

              {/* Visa */}
              <div className="flex items-center justify-between py-2 border-b border-black/5">
                <div>
                  <p className="text-sm font-bold text-[#1a1a1a]">Visa difficulty</p>
                  <p className="text-[10px] text-[#aaa] max-w-[260px]">{country.visaNote}</p>
                </div>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ml-3"
                  style={{ color: getVisaLabel(country.visa).color, background: getVisaLabel(country.visa).bg }}>
                  {getVisaLabel(country.visa).text}
                </span>
              </div>

              {/* Currency */}
              <div className="flex items-center justify-between py-2">
                <p className="text-sm font-bold text-[#1a1a1a]">Currency</p>
                <p className="text-sm text-[#888]">{country.currency} (₱{country.rate}/{country.currency === "PHP" ? "—" : "1 " + country.currency})</p>
              </div>
            </div>
          </div>

          {/* All countries comparison */}
          {countryId !== "ph" && (
          <div className="bg-white rounded-[20px] p-5 sm:p-6 mb-3 transition-all duration-500 delay-500"
            style={{ opacity: showResult ? 1 : 0, transform: showResult ? "translateY(0)" : "translateY(15px)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-3">
              {profession.name} salary across countries
            </p>
            <div className="space-y-2">
              {COUNTRIES.filter(c => c.id !== "ph").map((c) => {
                const row = S[profId]?.[c.id];
                if (!row) return null;
                const idx = exp === "entry" ? 0 : exp === "mid" ? 2 : 4;
                const rMin = row[idx];
                const rMax = row[idx + 1];
                const maxMid = Math.max(...COUNTRIES.filter(cc => cc.id !== "ph").map((cc) => {
                  const r = S[profId]?.[cc.id];
                  return r ? r[idx + 1] : 0;
                }));
                const pct = maxMid > 0 ? (rMin / maxMid) * 100 : 0;
                const active = c.id === countryId;

                return (
                  <button key={c.id} onClick={() => setCountryId(c.id)}
                    className={`w-full text-left py-2 px-3 rounded-xl transition-colors ${active ? "bg-[#00c853]/10" : "hover:bg-[#f5f5f5]"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {active && <span className="w-1.5 h-1.5 rounded-full bg-[#00c853]" />}
                        <span className="text-[12px] font-bold text-[#1a1a1a]">{c.flag} {c.name}</span>
                      </div>
                      <span className={`text-[11px] font-extrabold ${active ? "text-[#1a1a1a]" : "text-[#888]"}`}>
                        ₱{fmt(rMin * 1000)}<span className="font-normal text-[#aaa]"> – ₱{fmt(rMax * 1000)}</span>/mo
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#f0f0f0] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(3, pct)}%`, background: active ? "#00c853" : "#ccc" }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          )}

          {/* Sources */}
          <div className="bg-white rounded-[20px] p-5 sm:p-6 mb-3 transition-all duration-500 delay-700"
            style={{ opacity: showResult ? 1 : 0, transform: showResult ? "translateY(0)" : "translateY(15px)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#888] mb-2">Sources</p>
            <div className="space-y-1">
              {(SOURCES[countryId] || []).map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className="block text-[11px] text-[#00c853] no-underline hover:underline truncate">
                  {url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              ))}
            </div>
            <p className="text-[10px] text-[#aaa] mt-2">
              Salary ranges are estimates based on aggregated public data from job sites, government agencies, and OFW community reports. Actual salaries vary by employer, city, and qualifications.
            </p>
          </div>

          {/* Try again */}
          <div className="text-center mt-6 mb-6">
            <button onClick={handleReset}
              className="px-6 py-2.5 rounded-full text-sm font-bold text-[#888] bg-white hover:bg-[#f0f0f0] transition-colors"
            >Try again ↻</button>
          </div>
        </>
        )}

        {/* Methodology */}
        <div className="mb-3 px-1">
          <p className="text-[10px] text-[#aaa] leading-relaxed">
            <span className="font-semibold text-[#888]">Paano ito kina-calculate?</span> Salary ranges are compiled from Indeed, Glassdoor, PayScale, ERI SalaryExpert, government labor statistics, and OFW community data (2024–2025). Converted to PHP at approximate current exchange rates. Cost of living index is relative to the Philippines. This is for reference only — actual offers depend on employer, city, qualifications, and negotiation.
          </p>
        </div>

        {/* Link */}
        <p className="text-center mb-6">
          <Link href="/" className="text-[12px] text-[#888] no-underline border-b border-[#ccc] pb-px hover:text-[#1a1a1a] hover:border-[#1a1a1a] transition-colors">
            Check our other tools
          </Link>
        </p>

        <footer className="mt-8 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-sm font-bold text-[#00e401]" style={{fontFamily:"var(--font-old-english)"}}>Sentral</span>
          <p className="text-[10px] text-[#aaa] max-w-md sm:text-right leading-relaxed">
            Salary data from public sources. Not recruitment or immigration advice.
          </p>
        </footer>
      </main>
    </div>
  );
}
