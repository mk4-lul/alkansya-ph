import { getBanksWithRates, BankWithRates } from "@/lib/supabase";
import HeroCalculator from "@/components/HeroCalculator";
import RateTable from "@/components/RateTable";

export const revalidate = 3600;

const FALLBACK_BANKS: BankWithRates[] = [
  { id: "bpi", name: "BPI", type: "traditional", logo: "🏛️", source_url: "https://www.bpi.com.ph", notes: "Regular savings passbook", has_promo: false, promo_rate: null, promo_terms: null, savings_rate: 0.0625, savings_min_rate: 0.0625, savings_tiers: [{ rate: 0.0625, min_deposit: 0, max_deposit: null }], time_deposit_rates: [{ term_days: 30, rate: 0.25 }, { term_days: 90, rate: 0.5 }, { term_days: 180, rate: 0.75 }, { term_days: 360, rate: 1.0 }], last_verified: "2026-03-10T00:00:00Z" },
  { id: "bdo", name: "BDO", type: "traditional", logo: "🏛️", source_url: "https://www.bdo.com.ph", notes: "Peso savings account", has_promo: false, promo_rate: null, promo_terms: null, savings_rate: 0.0625, savings_min_rate: 0.0625, savings_tiers: [{ rate: 0.0625, min_deposit: 0, max_deposit: null }], time_deposit_rates: [{ term_days: 30, rate: 0.25 }, { term_days: 90, rate: 0.375 }, { term_days: 180, rate: 0.625 }, { term_days: 360, rate: 0.875 }], last_verified: "2026-03-10T00:00:00Z" },
  { id: "metrobank", name: "Metrobank", type: "traditional", logo: "🏛️", source_url: "https://www.metrobank.com.ph", notes: "Regular savings", has_promo: false, promo_rate: null, promo_terms: null, savings_rate: 0.0625, savings_min_rate: 0.0625, savings_tiers: [{ rate: 0.0625, min_deposit: 0, max_deposit: null }], time_deposit_rates: [{ term_days: 30, rate: 0.375 }, { term_days: 90, rate: 0.5 }, { term_days: 180, rate: 0.875 }, { term_days: 360, rate: 1.125 }], last_verified: "2026-03-09T00:00:00Z" },
  { id: "unionbank", name: "UnionBank", type: "traditional", logo: "🏛️", source_url: "https://www.unionbankph.com", notes: "Regular savings", has_promo: false, promo_rate: null, promo_terms: null, savings_rate: 0.1, savings_min_rate: 0.1, savings_tiers: [{ rate: 0.1, min_deposit: 0, max_deposit: null }], time_deposit_rates: [{ term_days: 30, rate: 0.375 }, { term_days: 90, rate: 0.5 }, { term_days: 180, rate: 0.75 }, { term_days: 360, rate: 1.0 }], last_verified: "2026-03-08T00:00:00Z" },
  { id: "securitybank", name: "Security Bank", type: "traditional", logo: "🏛️", source_url: "https://www.securitybank.com", notes: "Build Up savings", has_promo: false, promo_rate: null, promo_terms: null, savings_rate: 0.1, savings_min_rate: 0.1, savings_tiers: [{ rate: 0.1, min_deposit: 0, max_deposit: null }], time_deposit_rates: [{ term_days: 30, rate: 0.25 }, { term_days: 90, rate: 0.5 }, { term_days: 180, rate: 0.75 }, { term_days: 360, rate: 1.0 }], last_verified: "2026-03-08T00:00:00Z" },
  { id: "rcbc", name: "RCBC", type: "traditional", logo: "🏛️", source_url: "https://www.rcbc.com", notes: "Regular savings", has_promo: false, promo_rate: null, promo_terms: null, savings_rate: 0.1, savings_min_rate: 0.1, savings_tiers: [{ rate: 0.1, min_deposit: 0, max_deposit: null }], time_deposit_rates: [{ term_days: 30, rate: 0.375 }, { term_days: 90, rate: 0.5 }, { term_days: 180, rate: 0.875 }, { term_days: 360, rate: 1.125 }], last_verified: "2026-03-07T00:00:00Z" },
  { id: "pnb", name: "PNB", type: "traditional", logo: "🏛️", source_url: "https://www.pnb.com.ph", notes: "Top Saver: higher rate at ₱50k+", has_promo: false, promo_rate: null, promo_terms: null, savings_rate: 0.5, savings_min_rate: 0.1, savings_tiers: [{ rate: 0.1, min_deposit: 0, max_deposit: 49999 }, { rate: 0.5, min_deposit: 50000, max_deposit: null }], time_deposit_rates: [{ term_days: 30, rate: 0.5 }, { term_days: 90, rate: 0.75 }, { term_days: 180, rate: 1.0 }, { term_days: 360, rate: 1.25 }], last_verified: "2026-03-08T00:00:00Z" },
  { id: "landbank", name: "Landbank", type: "traditional", logo: "🏛️", source_url: "https://www.landbank.com", notes: "Regular savings", has_promo: false, promo_rate: null, promo_terms: null, savings_rate: 0.1, savings_min_rate: 0.1, savings_tiers: [{ rate: 0.1, min_deposit: 0, max_deposit: null }], time_deposit_rates: [{ term_days: 30, rate: 0.25 }, { term_days: 90, rate: 0.375 }, { term_days: 180, rate: 0.625 }, { term_days: 360, rate: 0.875 }], last_verified: "2026-03-07T00:00:00Z" },
  { id: "maya", name: "Maya Bank", type: "digital", logo: "💚", source_url: "https://www.maya.ph", notes: "Base 3.50%; up to 6% with Maya Savings goals", has_promo: false, promo_rate: null, promo_terms: null, savings_rate: 6.0, savings_min_rate: 3.5, savings_tiers: [{ rate: 3.5, min_deposit: 0, max_deposit: 100000 }, { rate: 6.0, min_deposit: 100001, max_deposit: null }], time_deposit_rates: [{ term_days: 30, rate: 4.0 }, { term_days: 90, rate: 4.5 }, { term_days: 180, rate: 5.0 }, { term_days: 360, rate: 5.5 }], last_verified: "2026-03-11T00:00:00Z" },
  { id: "cimb", name: "CIMB", type: "digital", logo: "🔴", source_url: "https://www.cimb.com.ph", notes: "UpSave account", has_promo: true, promo_rate: 8.0, promo_terms: "New depositors, limited period, max ₱200k", savings_rate: 2.5, savings_min_rate: 2.5, savings_tiers: [{ rate: 2.5, min_deposit: 0, max_deposit: null }], time_deposit_rates: [{ term_days: 30, rate: 3.5 }, { term_days: 90, rate: 4.0 }, { term_days: 180, rate: 4.5 }, { term_days: 360, rate: 5.0 }], last_verified: "2026-03-11T00:00:00Z" },
  { id: "tonik", name: "Tonik", type: "digital", logo: "🟡", source_url: "https://www.tonik.com", notes: "4%–4.5% on Solo/Group Stash", has_promo: false, promo_rate: null, promo_terms: null, savings_rate: 4.5, savings_min_rate: 4.0, savings_tiers: [{ rate: 4.0, min_deposit: 0, max_deposit: 50000 }, { rate: 4.5, min_deposit: 50001, max_deposit: null }], time_deposit_rates: [{ term_days: 30, rate: 4.0 }, { term_days: 90, rate: 4.5 }, { term_days: 180, rate: 5.5 }, { term_days: 360, rate: 6.0 }], last_verified: "2026-03-10T00:00:00Z" },
  { id: "gotyme", name: "GoTyme", type: "digital", logo: "🟢", source_url: "https://www.gotyme.com.ph", notes: "Standard savings, no lock-in", has_promo: false, promo_rate: null, promo_terms: null, savings_rate: 3.5, savings_min_rate: 3.5, savings_tiers: [{ rate: 3.5, min_deposit: 0, max_deposit: null }], time_deposit_rates: [{ term_days: 30, rate: 3.5 }, { term_days: 90, rate: 4.0 }, { term_days: 180, rate: 4.5 }, { term_days: 360, rate: 5.0 }], last_verified: "2026-03-10T00:00:00Z" },
  { id: "seabank", name: "SeaBank", type: "digital", logo: "🔵", source_url: "https://www.seabank.ph", notes: "Tiered rate by balance", has_promo: false, promo_rate: null, promo_terms: null, savings_rate: 4.0, savings_min_rate: 3.0, savings_tiers: [{ rate: 3.0, min_deposit: 0, max_deposit: 50000 }, { rate: 4.0, min_deposit: 50001, max_deposit: null }], time_deposit_rates: [{ term_days: 30, rate: 3.5 }, { term_days: 90, rate: 4.0 }, { term_days: 180, rate: 4.5 }, { term_days: 360, rate: 5.0 }], last_verified: "2026-03-09T00:00:00Z" },
  { id: "gcash_gsave", name: "GCash GSave", type: "digital", logo: "💙", source_url: "https://www.gcash.com", notes: "Powered by CIMB, via GCash app", has_promo: false, promo_rate: null, promo_terms: null, savings_rate: 2.6, savings_min_rate: 2.6, savings_tiers: [{ rate: 2.6, min_deposit: 0, max_deposit: null }], time_deposit_rates: [], last_verified: "2026-03-10T00:00:00Z" },
];

async function getData(): Promise<BankWithRates[]> {
  try {
    const banks = await getBanksWithRates();
    if (banks.length > 0) return banks;
  } catch (e) {
    console.error("Supabase fetch failed, using fallback data:", e);
  }
  return FALLBACK_BANKS;
}

export default async function HomePage() {
  const banks = await getData();
  const tradBanks = banks.filter((b) => b.type === "traditional");
  const digiBanks = banks.filter((b) => b.type === "digital");
  const avgTraditional = tradBanks.reduce((s, b) => s + b.savings_rate, 0) / tradBanks.length;
  const avgDigital = digiBanks.reduce((s, b) => s + b.savings_rate, 0) / digiBanks.length;
  const multiplier = Math.round(avgDigital / avgTraditional);

  return (
    <div className="min-h-screen bg-[#f6f4f0]">
      {/* Nav */}
      <nav className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 max-w-[960px] mx-auto border-b border-[#e5e0d8]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-sm sm:text-base font-bold text-white"
            style={{ background: "linear-gradient(135deg, #c8940a, #a87a08)" }}>₱</div>
          <span className="font-display text-lg sm:text-[22px] font-extrabold tracking-tight text-[#1a1a1a]">
            alkansya<span className="text-[#c8940a]">.ph</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[2px] text-[#6b6560] hidden sm:inline">Updated weekly</span>
          <div className="w-2 h-2 rounded-full bg-[#0a8f65] animate-pulse-dot" />
        </div>
      </nav>

      <main className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Hero */}
        <div className="mb-8 sm:mb-12 animate-slide-up">
          <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[3px] text-[#c8940a] mb-2">
            Compare PH Bank Rates
          </p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold leading-[1.1] mb-3 tracking-tight text-[#1a1a1a]">
            Saan mo ilalagay
            <br />
            ang <span className="text-[#c8940a]">pera</span> mo?
          </h1>
          
          <HeroCalculator banks={banks} />
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-px bg-[#e5e0d8] rounded-xl sm:rounded-2xl overflow-hidden mb-8 sm:mb-10 shadow-sm">
          {[
            { label: "Avg. Traditional", value: `${avgTraditional.toFixed(3)}%`, color: "text-[#6b6560]" },
            { label: "Avg. Digital", value: `${avgDigital.toFixed(1)}%`, color: "text-[#0a8f65]" },
            { label: "Difference", value: `${multiplier}×`, color: "text-[#c8940a]" },
          ].map((stat, i) => (
            <div key={i} className="bg-white py-3 sm:py-5 px-2 sm:px-6 text-center">
              <p className="font-mono text-[7px] sm:text-[9px] uppercase tracking-[1px] sm:tracking-[2px] text-[#9a9490] mb-1">
                {stat.label}
              </p>
              <p className={`font-display text-lg sm:text-2xl md:text-3xl font-extrabold ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Rate table */}
        <RateTable banks={banks} />

        {/* PDIC notice */}
        <div className="mt-5 sm:mt-6 p-3 sm:p-5 rounded-xl bg-white border border-[#e5e0d8] flex gap-2 sm:gap-3 shadow-sm">
          <span className="text-base sm:text-lg">🛡️</span>
          <div>
            <p className="font-display text-xs sm:text-[13px] font-semibold text-[#1a1a1a] mb-1">
              PDIC Insured up to ₱500,000
            </p>
            <p className="font-mono text-[10px] sm:text-[11px] text-[#6b6560] leading-relaxed">
              All banks listed are BSP-licensed and PDIC-insured. Your deposits
              are protected up to ₱500,000 per depositor per bank. Digital banks
              carry the same protection as traditional banks.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-[#e5e0d8] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3">
          <div>
            <p className="font-display text-sm font-bold text-[#6b6560]">
              alkansya<span className="text-[#c8940a]">.ph</span>
            </p>
            <p className="font-mono text-[9px] sm:text-[10px] text-[#9a9490] mt-1">
              Making smarter savings accessible to every Filipino.
            </p>
          </div>
          <p className="font-mono text-[8px] sm:text-[9px] text-[#b0aaa4]">
            Rates are indicative and may not reflect real-time changes. Always verify directly with your bank before making financial decisions. Alkansya.ph is an independent informational tool — not a financial advisor, broker, or bank. We are not liable for any losses, damages, or issues arising from the use of this site or any third-party platform listed herein.
          </p>
        </footer>
      </main>
    </div>
  );
}
