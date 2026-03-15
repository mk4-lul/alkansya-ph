import { getBanksWithRates, BankWithRates, TimeDepositRate } from "@/lib/supabase";
import Dashboard from "@/components/Dashboard";
import Link from "next/link";

export const revalidate = 3600;

function fb(
  id: string, name: string, type: "traditional" | "digital", logo: string,
  url: string, tdUrl: string | null, notes: string,
  hasPromo: boolean, promoRate: number | null, promoTerms: string | null,
  products: { name: string; tiers: { rate: number; min_deposit: number; max_deposit: number | null }[] }[],
  td: TimeDepositRate[],
  verified: string,
  ratings: { avg: number; play: number; app: number }
): BankWithRates {
  const allTiers = products.flatMap((p) => p.tiers);
  const rates = allTiers.map((t) => t.rate);
  return {
    id, name, type, logo, source_url: url, td_source_url: tdUrl, notes,
    has_promo: hasPromo, promo_rate: promoRate, promo_terms: promoTerms,
    avg_app_rating: ratings.avg, play_store_rating: ratings.play, app_store_rating: ratings.app,
    savings_rate: rates.length > 0 ? Math.max(...rates) : 0,
    savings_min_rate: rates.length > 0 ? Math.min(...rates) : 0,
    savings_tiers: allTiers,
    savings_products: products.map((p) => ({
      name: p.name,
      tiers: p.tiers,
      best_rate: Math.max(...p.tiers.map((t) => t.rate)),
      min_rate: Math.min(...p.tiers.map((t) => t.rate)),
    })),
    time_deposit_rates: td,
    last_verified: verified,
  };
}

const FALLBACK_BANKS: BankWithRates[] = [
  fb("bpi", "BPI", "traditional", "/logos/bpi.png",
    "https://www.bpi.com.ph/personal/bank/deposits/deposit-rates-savings-and-checking",
    "https://www.bpi.com.ph/personal/bank/time-deposit-accounts/peso-auto-renew",
    "Multiple savings products", false, null, null,
    [
      { name: "#SaveUp", tiers: [{ rate: 0.0925, min_deposit: 5000, max_deposit: null }] },
      { name: "#MySaveUp", tiers: [{ rate: 0.0925, min_deposit: 5000, max_deposit: null }] },
      { name: "Jumpstart Savings", tiers: [{ rate: 0.0625, min_deposit: 2000, max_deposit: null }] },
      { name: "Maxi-Saver", tiers: [{ rate: 0.125, min_deposit: 2000000, max_deposit: null }] },
      { name: "Saver-Plus", tiers: [{ rate: 0.0625, min_deposit: 50000, max_deposit: null }] },
    ],
    [
      { term_days: 35, rate: 0.250, min_deposit: 50000, max_deposit: 499999 },
      { term_days: 35, rate: 0.500, min_deposit: 5000000, max_deposit: null },
      { term_days: 365, rate: 0.750, min_deposit: 5000000, max_deposit: null },
    ],
    "2026-03-14T00:00:00Z",
    { avg: 4.8, play: 4.8, app: 4.7 }),

  fb("bdo", "BDO", "traditional", "/logos/bdo.png",
    "https://www.bdo.com.ph/personal/accounts/savings/peso-savings",
    "https://www.bdo.com.ph/personal/accounts/time-deposit/peso-time-deposit",
    "Multiple savings products", false, null, null,
    [
      { name: "Passbook Savings", tiers: [{ rate: 0.0625, min_deposit: 0, max_deposit: null }] },
      { name: "Optimum Savings", tiers: [{ rate: 0.25, min_deposit: 30000, max_deposit: 99999 }, { rate: 0.375, min_deposit: 100000, max_deposit: null }] },
    ],
    [{ term_days: 30, rate: 0.625, min_deposit: 50000, max_deposit: 299999 }, { term_days: 360, rate: 1.250, min_deposit: 10000000, max_deposit: null }],
    "2026-03-15T00:00:00Z",
    { avg: 2.9, play: 3.5, app: 2.3 }),

  fb("metrobank", "Metrobank", "traditional", "/logos/metrobank.png",
    "https://www.metrobank.com.ph/articles/deposit-rates-and-fees",
    "https://www.metrobank.com.ph/articles/time-deposit-rates-and-fees",
    "Online Time Deposit rates", false, null, null,
    [{ name: "Regular Savings", tiers: [{ rate: 0.0625, min_deposit: 0, max_deposit: null }] }],
    [{ term_days: 30, rate: 4.125, min_deposit: 10000, max_deposit: 49999 }, { term_days: 180, rate: 4.500, min_deposit: 5000000, max_deposit: null }],
    "2026-03-14T00:00:00Z",
    { avg: 3.0, play: 2.1, app: 3.8 }),

  fb("unionbank", "UnionBank", "traditional", "/logos/unionbank.png",
    "https://www.unionbankph.com/accounts",
    "https://www.unionbankph.com/accounts",
    "Regular savings", false, null, null,
    [{ name: "Regular Savings", tiers: [{ rate: 0.1, min_deposit: 0, max_deposit: null }] }],
    [{ term_days: 30, rate: 0.625, min_deposit: 50000, max_deposit: 299999 }, { term_days: 360, rate: 1.250, min_deposit: 10000000, max_deposit: null }],
    "2026-03-15T00:00:00Z",
    { avg: 4.8, play: 4.8, app: 4.7 }),

  fb("securitybank", "Security Bank", "traditional", "/logos/securitybank.png",
    "https://www.securitybank.com/personal/accounts/high-interest/",
    "https://www.securitybank.com/personal/accounts/time-deposit/time-deposit-rates/",
    "Easy Savings 0.05%, GoalSetter up to 3%", false, null, null,
    [
      { name: "Easy Savings", tiers: [{ rate: 0.05, min_deposit: 0, max_deposit: null }] },
      { name: "GoalSetter", tiers: [
        { rate: 0.50, min_deposit: 5000, max_deposit: 49999 },
        { rate: 1.00, min_deposit: 50000, max_deposit: 499999 },
        { rate: 1.50, min_deposit: 500000, max_deposit: 999999 },
        { rate: 2.00, min_deposit: 1000000, max_deposit: 4999999 },
        { rate: 3.00, min_deposit: 5000000, max_deposit: null },
      ]},
    ],
    [{ term_days: 30, rate: 0.54, min_deposit: 100000, max_deposit: 299999 }, { term_days: 365, rate: 2.47, min_deposit: 5000000, max_deposit: null }],
    "2026-03-15T00:00:00Z",
    { avg: 3.5, play: 3.2, app: 3.8 }),

  fb("rcbc", "RCBC", "traditional", "/logos/rcbc.png",
    "https://www.rcbc.com/regular-atm",
    "https://www.rcbc.com/rcbc-time-deposit",
    "Regular ATM Savings", false, null, null,
    [{ name: "Regular Savings", tiers: [{ rate: 0.15, min_deposit: 0, max_deposit: null }] }],
    [{ term_days: 30, rate: 0.500, min_deposit: 5000, max_deposit: 39999 }, { term_days: 365, rate: 1.375, min_deposit: 10000000, max_deposit: null }],
    "2026-03-15T00:00:00Z",
    { avg: 2.9, play: 3.3, app: 2.4 }),

  fb("pnb", "PNB", "traditional", "/logos/pnb.png",
    "https://www.pnb.com.ph/product-comparison/",
    "https://www.pnb.com.ph/product-comparison/",
    "Top Saver: higher rate at ₱50k+", false, null, null,
    [
      { name: "Regular Savings", tiers: [{ rate: 0.1, min_deposit: 0, max_deposit: null }] },
      { name: "Top Saver", tiers: [{ rate: 0.5, min_deposit: 50000, max_deposit: null }] },
    ],
    [{ term_days: 30, rate: 0.125, min_deposit: 25000, max_deposit: 249999 }, { term_days: 360, rate: 0.375, min_deposit: 1000000, max_deposit: null }],
    "2026-03-15T00:00:00Z",
    { avg: 2.8, play: 2.9, app: 2.6 }),

  fb("landbank", "Landbank", "traditional", "/logos/landbank.png",
    "https://www.landbank.com/personal-savings-account-with-atm",
    "https://www.landbank.com/personal-greengrowth-deposit",
    "OptiSaver Plus: 1%–4% for ₱500k+ (contact branch)", false, null, null,
    [
      { name: "Savings Account with ATM", tiers: [{ rate: 0.05, min_deposit: 0, max_deposit: null }] },
      { name: "OptiSaver Plus", tiers: [{ rate: 0.05, min_deposit: 50000, max_deposit: 499999 }] },
    ],
    [
      { term_days: 365, rate: 2.25, min_deposit: 50000, max_deposit: 499999 },
      { term_days: 365, rate: 3.25, min_deposit: 500000, max_deposit: 4999999 },
      { term_days: 365, rate: 4.25, min_deposit: 5000000, max_deposit: null },
    ],
    "2026-03-15T00:00:00Z",
    { avg: 3.8, play: 4.4, app: 3.2 }),

  fb("maya", "Maya Bank", "digital", "/logos/maya.png",
    "https://www.mayabank.ph/savings/",
    "https://www.mayabank.ph/time-deposit-plus/",
    "Base 3.50%; up to 6% with goals", false, null, null,
    [{ name: "Maya Savings", tiers: [{ rate: 3.5, min_deposit: 0, max_deposit: 100000 }, { rate: 6.0, min_deposit: 100001, max_deposit: null }] }],
    [
      { term_days: 90, rate: 5.0, min_deposit: 0, max_deposit: 1000000 },
      { term_days: 180, rate: 6.0, min_deposit: 0, max_deposit: 1000000 },
      { term_days: 365, rate: 5.5, min_deposit: 0, max_deposit: 1000000 },
    ],
    "2026-03-14T00:00:00Z",
    { avg: 4.6, play: 4.6, app: 4.6 }),

  fb("cimb", "CIMB", "digital", "/logos/cimb.png",
    "https://www.cimb.com.ph/en/personal/banking/accounts/upsave.html",
    "https://www.cimbbank.com.ph/en/products/save/maxsave.html",
    "UpSave 2.5%. MaxSave TD updated Jan 2026.", true, 8.0, "New depositors, limited period, max ₱200k",
    [{ name: "UpSave", tiers: [{ rate: 2.5, min_deposit: 0, max_deposit: null }] }],
    [
      { term_days: 90, rate: 4.75, min_deposit: 5000, max_deposit: 1000000 },
      { term_days: 180, rate: 5.25, min_deposit: 5000, max_deposit: 1000000 },
      { term_days: 365, rate: 4.75, min_deposit: 5000, max_deposit: 1000000 },
      { term_days: 730, rate: 4.50, min_deposit: 5000, max_deposit: 1000000 },
    ],
    "2026-03-15T00:00:00Z",
    { avg: 4.1, play: 4.0, app: 4.2 }),

  fb("tonik", "Tonik", "digital", "/logos/tonik.png",
    "https://tonikbank.com/deposit-interest-rates",
    "https://tonikbank.com/savings-cards/time-deposit",
    "4%–4.5% Stash savings. TD up to 8% p.a.", false, null, null,
    [{ name: "Stash", tiers: [{ rate: 4.0, min_deposit: 0, max_deposit: 50000 }, { rate: 4.5, min_deposit: 50001, max_deposit: null }] }],
    [
      { term_days: 180, rate: 6.0, min_deposit: 5000, max_deposit: 250000 },
      { term_days: 270, rate: 7.0, min_deposit: 5000, max_deposit: 250000 },
      { term_days: 365, rate: 8.0, min_deposit: 5000, max_deposit: 250000 },
      { term_days: 540, rate: 6.0, min_deposit: 5000, max_deposit: 250000 },
      { term_days: 730, rate: 6.0, min_deposit: 5000, max_deposit: 250000 },
    ],
    "2026-03-15T00:00:00Z",
    { avg: 4.7, play: 4.8, app: 4.6 }),

  fb("gotyme", "GoTyme", "digital", "/logos/gotyme.png",
    "https://www.gotyme.com.ph/save-and-invest/", null,
    "Go Save: flat 3% p.a., no conditions", false, null, null,
    [{ name: "Go Save", tiers: [{ rate: 3.0, min_deposit: 0, max_deposit: null }] }],
    [],
    "2026-03-15T00:00:00Z",
    { avg: 4.5, play: 4.6, app: 4.3 }),

  fb("maribank", "MariBank", "digital", "/logos/maribank.png",
    "https://www.maribank.ph/product/savings", null,
    "Formerly SeaBank. Daily interest crediting.", false, null, null,
    [{ name: "MariBank Savings", tiers: [{ rate: 3.25, min_deposit: 0, max_deposit: 1000000 }, { rate: 3.75, min_deposit: 1000001, max_deposit: null }] }],
    [],
    "2026-03-15T00:00:00Z",
    { avg: 4.9, play: 4.9, app: 4.9 }),

  fb("gcash_gsave", "GCash GSave", "digital", "/logos/gcash.png",
    "https://www.gcash.com/gsave", null,
    "Powered by CIMB, via GCash app", false, null, null,
    [{ name: "GSave", tiers: [{ rate: 2.6, min_deposit: 0, max_deposit: null }] }],
    [],
    "2026-03-10T00:00:00Z",
    { avg: 3.6, play: 4.2, app: 3.0 }),

  fb("maybank", "Maybank", "traditional", "/logos/maybank.png",
    "https://www.maybank.com.ph/", null,
    "ADDFLEX/ADDVANTAGE long-term TD available", false, null, null,
    [{ name: "Peso Savings", tiers: [{ rate: 0.25, min_deposit: 0, max_deposit: null }] }],
    [
      { term_days: 30, rate: 1.500, min_deposit: 25000, max_deposit: null },
      { term_days: 90, rate: 1.625, min_deposit: 25000, max_deposit: null },
      { term_days: 360, rate: 1.750, min_deposit: 25000, max_deposit: null },
      { term_days: 365, rate: 2.000, min_deposit: 0, max_deposit: null },
      { term_days: 730, rate: 2.500, min_deposit: 0, max_deposit: null },
      { term_days: 1825, rate: 2.000, min_deposit: 0, max_deposit: null },
    ],
    "2026-03-15T00:00:00Z",
    { avg: 4.2, play: 3.3, app: 5.0 }),

  fb("hsbc", "HSBC", "traditional", "/logos/hsbc.png",
    "https://www.hsbc.com.ph/accounts/interest-rates/",
    "https://www.hsbc.com.ph/accounts/interest-rates/",
    "High Yield TD for Premier/Advance (min ₱100k)", false, null, null,
    [{ name: "Peso Savings", tiers: [{ rate: 0.005, min_deposit: 0, max_deposit: null }] }],
    [
      { term_days: 30, rate: 0.125, min_deposit: 25000, max_deposit: 99999 },
      { term_days: 30, rate: 2.425, min_deposit: 100000, max_deposit: 999999 },
      { term_days: 30, rate: 2.925, min_deposit: 5000000, max_deposit: 10000000 },
      { term_days: 90, rate: 2.550, min_deposit: 100000, max_deposit: 999999 },
      { term_days: 90, rate: 3.050, min_deposit: 5000000, max_deposit: 10000000 },
      { term_days: 180, rate: 2.800, min_deposit: 100000, max_deposit: 999999 },
      { term_days: 180, rate: 3.300, min_deposit: 5000000, max_deposit: 10000000 },
      { term_days: 365, rate: 3.000, min_deposit: 100000, max_deposit: 999999 },
      { term_days: 365, rate: 3.500, min_deposit: 5000000, max_deposit: 10000000 },
    ],
    "2026-03-15T00:00:00Z",
    { avg: 3.1, play: 4.5, app: 1.7 }),

  fb("unobank", "UNOBank", "digital", "/logos/unobank.png",
    "https://www.uno.bank/savings-account/",
    "https://www.uno.bank/time-deposit/",
    "Daily interest crediting. Free insurance at ₱10k ADB.", false, null, null,
    [{ name: "#UNOready", tiers: [
      { rate: 3.00, min_deposit: 0, max_deposit: 4999 },
      { rate: 3.50, min_deposit: 5000, max_deposit: 4999999 },
      { rate: 1.00, min_deposit: 5000000, max_deposit: null },
    ]}],
    [
      { term_days: 90, rate: 4.00, min_deposit: 0, max_deposit: 500000 },
      { term_days: 180, rate: 4.25, min_deposit: 0, max_deposit: 500000 },
      { term_days: 300, rate: 4.50, min_deposit: 0, max_deposit: 500000 },
      { term_days: 365, rate: 5.50, min_deposit: 0, max_deposit: 500000 },
      { term_days: 730, rate: 5.00, min_deposit: 0, max_deposit: 500000 },
    ],
    "2026-03-15T00:00:00Z",
    { avg: 4.4, play: 4.4, app: 4.4 }),
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
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Nav */}
      <nav className="flex justify-between items-center px-4 sm:px-6 py-4 max-w-[720px] mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight text-[#1a1a1a]">
            alkansya<span className="text-[#00c853]">.ph</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/calculator" className="text-[12px] font-semibold text-[#888] hover:text-[#1a1a1a] transition-colors no-underline">
            Calculator
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-[6px] h-[6px] rounded-full bg-[#00c853] animate-pulse-dot" />
            <span className="text-[11px] text-[#888] hidden sm:inline">Updated weekly</span>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-[720px] mx-auto px-4 sm:px-6 pb-8">
        <Dashboard banks={banks} avgTraditional={avgTraditional} avgDigital={avgDigital} multiplier={multiplier} />

        {/* PDIC */}
        <div className="mt-3 bg-white rounded-2xl px-5 py-4 flex gap-3 items-start">
          <span className="text-xl">🛡️</span>
          <p className="text-[12px] text-[#888] leading-relaxed">
            <span className="font-bold text-[#1a1a1a]">PDIC insured up to ₱500,000.</span> All banks listed are BSP-licensed. Digital banks carry the same protection as traditional banks.
          </p>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-sm font-bold text-[#888]">alkansya<span className="text-[#00c853]">.ph</span></span>
          <p className="text-[10px] text-[#aaa] max-w-md sm:text-right leading-relaxed">
            Rates are indicative and may not reflect real-time changes. Always verify directly with your bank. Alkansya.ph is an independent informational tool — not a financial advisor, broker, or bank.
          </p>
        </footer>
      </main>
    </div>
  );
}
