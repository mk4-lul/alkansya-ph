import { getBanksWithRates, BankWithRates } from "@/lib/supabase";
import HeroCalculator from "@/components/HeroCalculator";
import RateTable from "@/components/RateTable";

// Revalidate every hour (ISR)
export const revalidate = 3600;

// Fallback data — single tier per bank for now, tiers added via Supabase
const FALLBACK_BANKS: BankWithRates[] = [
  { id: "bpi", name: "BPI", type: "traditional", logo: "🏛️", source_url: "https://www.bpi.com.ph", notes: "Regular savings passbook", has_promo: false, promo_rate: null, promo_terms: null, savings_rate: 0.0625, savings_min_rate: 0.0625, savings_tiers: [{ rate: 0.0625, min_deposit: 0, max_deposit: null }], time_deposit_rates: [{ term_days: 30, rate: 0.25 }, { term_days: 90, rate: 0.5 }, { term_days: 180, rate: 0.75 }, { term_days: 360, rate: 1.0 }], last_verified: "2026-03-10T00:00:00Z" },
  { id: "bdo", name: "BDO", type: "traditional", logo: "🏛️", source_url: "https://www.bdo.com.ph", notes: "Peso savings account", has_promo: false, promo_rate: null, promo_terms: null, savings_rate: 0.0625, savings_min_rate: 0.0625, savings_tiers: [{ rate: 0.0625, min_deposit: 0, max_deposit: null }], time_deposit_rates: [{ term_days: 30, rate: 0.25 }, { term_days: 90, rate: 0.375 }, { term_days: 180, rate: 0.625 }, { term_days: 360, rate: 0.875 }], last_verified: "2026-03-10T00:00:00Z" },
  { id: "metrobank", name: "Metrobank", type: "traditional", logo: "🏛️", source_url: "https://www.metrobank.com.ph", notes: "Regular savings", has_promo: false, promo_rate: null, promo_terms: null, savings_rate: 0.0625, savings_min_rate: 0.0625, savings_tiers: [{ rate: 0.0625, min_deposit: 0, max_deposit: null }], time_deposit_rates: [{ term_days: 30, rate: 0.375 }, { term_days: 90, rate: 0.5 }, { term_days: 180, rate: 0.875 }, { term_days: 360, rate: 1.125 }], last_verified: "2026-03-09T00:00:00Z" },
  { id: "unionbank", name: "UnionBank", type: "traditional", logo: "🏛️", source_url: "https://www.unionbankph.com", notes: "Regular savings", has_promo: false, promo_rate: null, promo_terms: null, savings_rate: 0.1, savings_min_rate: 0.1, savings_tiers: [{ rate: 0.1, min_deposit: 0, max_deposit: null }], time_deposit_rates: [{ term_days: 30, rate: 0.375 }, { term_days: 90, rate: 0.5 }, { term_days: 180, rate: 0.75 }, { term_days: 360, rate: 1.0 }], last_verified: "2026-03-08T00:00:00Z" },
  { id: "securitybank", name: "Security Bank", type: "traditional", logo: "🏛️", source_url: "https://www.securitybank.com", notes: "Build Up savings", has_promo: false, promo_rate: null, promo_terms: null, savings_rate: 0.1, savings_min_rate: 0.1, savings_tiers: [{ rate: 0.1, min_deposit: 0, max_deposit: null }], time_deposit_rates: [{ term_days: 30, rate: 0.25 }, { term_days: 90, rate: 0.5 }, { term_days: 180, rate: 0.75 }, { term_days: 360, rate: 1.0 }], last_verified: "2026-03-08T00:00:00Z" },
  { id: "rcbc", name: "RCBC", type: "traditional", logo: "🏛️", source_url: "https://www.rcbc.com", notes: "Regular savings", has_promo: false, promo_rate: null, promo_terms: null, savings_rate: 0.1, savings_min_rate: 0.1, savings_tiers: [{ rate: 0.1, min_deposit: 0, max_deposit: null }], time_deposit_rates: [{ term_days: 30, rate: 0.375 }, { term_days: 90, rate: 0.5 }, { term_days: 180, rate: 0.875 }, { term_days: 360, rate: 1.125 }], last_verified: "2026-03-07T00:00:00Z" },
  { id: "pnb", name: "PNB", type: "traditional", logo: "🏛️", source_url: "https://www.pnb.com.ph", notes: "Top Saver account", has_promo: false, promo_rate: null, promo_terms: null, savings_rate: 0.5, savings_min_rate: 0.5, savings_tiers: [{ rate: 0.5, min_deposit: 0, max_deposit: null }], time_deposit_rates: [{ term_days: 30, rate: 0.5 }, { term_days: 90, rate: 0.75 }, { term_days: 180, rate: 1.0 }, { term_days: 360, rate: 1.25 }], last_verified: "2026-03-08T00:00:00Z" },
  { id: "landbank", name: "Landbank", type: "traditional", logo: "🏛️", source_url: "https://www.landbank.com", notes: "Regular savings", has_promo: false, promo_rate: null, promo_terms: null, savings_rate: 0.1, savings_min_rate: 0.1, savings_tiers: [{ rate: 0.1, min_deposit: 0, max_deposit: null }], time_deposit_rates: [{ term_days: 30, rate: 0.25 }, { term_days: 90, rate: 0.375 }, { term_days: 180, rate: 0.625 }, { term_days: 360, rate: 0.875 }], last_verified: "2026-03-07T00:00:00Z" },
  { id: "maya", name: "Maya Bank", type: "digital", logo: "💚", source_url: "https://www.maya.ph", notes: "Personal savings", has_promo: false, promo_rate: null, promo_terms: null, savings_rate: 3.5, savings_min_rate: 3.5, savings_tiers: [{ rate: 3.5, min_deposit: 0, max_deposit: null }], time_deposit_rates: [{ term_days: 30, rate: 4.0 }, { term_days: 90, rate: 4.5 }, { term_days: 180, rate: 5.0 }, { term_days: 360, rate: 5.5 }], last_verified: "2026-03-11T00:00:00Z" },
  { id: "cimb", name: "CIMB", type: "digital", logo: "🔴", source_url: "https://www.cimb.com.ph", notes: "UpSave account", has_promo: true, promo_rate: 8.0, promo_terms: "New depositors, limited period, max ₱200k", savings_rate: 2.5, savings_min_rate: 2.5, savings_tiers: [{ rate: 2.5, min_deposit: 0, max_deposit: null }], time_deposit_rates: [{ term_days: 30, rate: 3.5 }, { term_days: 90, rate: 4.0 }, { term_days: 180, rate: 4.5 }, { term_days: 360, rate: 5.0 }], last_verified: "2026-03-11T00:00:00Z" },
  { id: "tonik", name: "Tonik", type: "digital", logo: "🟡", source_url: "https://www.tonik.com", notes: "Stash accounts available", has_promo: false, promo_rate: null, promo_terms: null, savings_rate: 3.0, savings_min_rate: 3.0, savings_tiers: [{ rate: 3.0, min_deposit: 0, max_deposit: null }], time_deposit_rates: [{ term_days: 30, rate: 4.0 }, { term_days: 90, rate: 4.5 }, { term_days: 180, rate: 5.5 }, { term_days: 360, rate: 6.0 }], last_verified: "2026-03-10T00:00:00Z" },
  { id: "gotyme", name: "GoTyme", type: "digital", logo: "🟢", source_url: "https://www.gotyme.com.ph", notes: "Referral program available", has_promo: false, promo_rate: null, promo_terms: null, savings_rate: 3.0, savings_min_rate: 3.0, savings_tiers: [{ rate: 3.0, min_deposit: 0, max_deposit: null }], time_deposit_rates: [{ term_days: 30, rate: 3.5 }, { term_days: 90, rate: 4.0 }, { term_days: 180, rate: 4.5 }, { term_days: 360, rate: 5.0 }], last_verified: "2026-03-10T00:00:00Z" },
  { id: "seabank", name: "SeaBank", type: "digital", logo: "🔵", source_url: "https://www.seabank.ph", notes: "Linked with Shopee", has_promo: false, promo_rate: null, promo_terms: null, savings_rate: 3.0, savings_min_rate: 3.0, savings_tiers: [{ rate: 3.0, min_deposit: 0, max_deposit: null }], time_deposit_rates: [{ term_days: 30, rate: 3.5 }, { term_days: 90, rate: 4.0 }, { term_days: 180, rate: 4.5 }, { term_days: 360, rate: 5.0 }], last_verified: "2026-03-09T00:00:00Z" },
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

  const avgTraditional =
    banks.filter((b) => b.type === "traditional").reduce((s, b) => s + b.savings_rate, 0) /
    banks.filter((b) => b.type === "traditional").length;
  const avgDigital =
    banks.filter((b) => b.type === "digital").reduce((s, b) => s + b.savings_rate, 0) /
    banks.filter((b) => b.type === "digital").length;
  const multiplier = Math.round(avgDigital / avgTraditional);

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="flex justify-between items-center px-6 py-4 max-w-[960px] mx-auto border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold"
            style={{
              background: "linear-gradient(135deg, #ffc300, #e6a800)",
              color: "#080e1a",
            }}
          >
            ₱
          </div>
          <span className="font-display text-[22px] font-extrabold tracking-tight text-white">
            alkansya<span className="text-alkansya-gold">.ph</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[2px] text-white/30 hidden sm:inline">
            Updated weekly
          </span>
          <div className="w-2 h-2 rounded-full bg-alkansya-green animate-pulse-dot" />
        </div>
      </nav>

      <main className="max-w-[960px] mx-auto px-6 py-8">
        {/* Hero */}
        <div className="mb-12 animate-slide-up">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-alkansya-gold mb-2">
            Compare PH Bank Rates
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-black leading-[1.05] mb-3 tracking-tight">
            Saan mo ilalagay
            <br />
            ang <span className="text-alkansya-gold">pera</span> mo?
          </h1>
          <p className="font-display text-base md:text-lg text-white/50 max-w-[520px] leading-relaxed mb-8">
            Traditional banks give you 0.0625%. Digital banks give you 50× more.
            See exactly how much you&apos;re missing out on.
          </p>
          <HeroCalculator banks={banks} />
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden mb-10">
          {[
            {
              label: "Avg. Traditional",
              value: `${avgTraditional.toFixed(3)}%`,
              color: "text-white/40",
            },
            {
              label: "Avg. Digital",
              value: `${avgDigital.toFixed(1)}%`,
              color: "text-alkansya-green",
            },
            {
              label: "Difference",
              value: `${multiplier}×`,
              color: "text-alkansya-gold",
            },
          ].map((stat, i) => (
            <div key={i} className="bg-alkansya-card py-5 px-6 text-center">
              <p className="font-mono text-[9px] uppercase tracking-[2px] text-white/35 mb-1.5">
                {stat.label}
              </p>
              <p
                className={`font-display text-2xl md:text-3xl font-extrabold ${stat.color}`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Rate table */}
        <RateTable banks={banks} />

        {/* PDIC notice */}
        <div className="mt-6 p-4 md:p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex gap-3">
          <span className="text-lg">🛡️</span>
          <div>
            <p className="font-display text-[13px] font-semibold text-white/70 mb-1">
              PDIC Insured up to ₱500,000
            </p>
            <p className="font-mono text-[11px] text-white/35 leading-relaxed">
              All banks listed are BSP-licensed and PDIC-insured. Your deposits
              are protected up to ₱500,000 per depositor per bank. Digital banks
              carry the same protection as traditional banks.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-white/[0.06] flex justify-between items-center flex-wrap gap-3">
          <div>
            <p className="font-display text-sm font-bold text-white/50">
              alkansya<span className="text-alkansya-gold">.ph</span>
            </p>
            <p className="font-mono text-[10px] text-white/20 mt-1">
              Making smarter savings accessible to every Filipino.
            </p>
          </div>
          <p className="font-mono text-[9px] text-white/15">
            Rates shown are indicative. Always verify with your bank. Not
            financial advice.
          </p>
        </footer>
      </main>
    </div>
  );
}
