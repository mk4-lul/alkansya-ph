"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import NavMenu from "@/components/NavMenu";

// ─── Price Data ──────────────────────────────────────────────────
// Yearly mean prices (USD)
const GOLD_USD: Record<number, number> = {
  2012: 1670, 2013: 1410, 2014: 1266, 2015: 1160, 2016: 1250,
  2017: 1260, 2018: 1270, 2019: 1393, 2020: 1770,
};
const BTC_USD: Record<number, number> = {
  2012: 8, 2013: 140, 2014: 530, 2015: 272, 2016: 567,
  2017: 4000, 2018: 7600, 2019: 7350, 2020: 11100,
};
// USD/PHP yearly average
const USDPHP: Record<number, number> = {
  2012: 42, 2013: 42, 2014: 44, 2015: 45, 2016: 47,
  2017: 50, 2018: 53, 2019: 52, 2020: 50,
};
// Fallback prices if API fails
const FALLBACK_GOLD = 3000;
const FALLBACK_BTC = 85000;
const FALLBACK_USDPHP = 57;

function useLivePrices() {
  const [prices, setPrices] = useState({
    gold: FALLBACK_GOLD,
    btc: FALLBACK_BTC,
    usdphp: FALLBACK_USDPHP,
    live: false,
  });

  useEffect(() => {
    async function fetchPrices() {
      try {
        // BTC + USD/PHP from CoinGecko
        const btcRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,php");
        const btcData = await btcRes.json();
        const btcUsd = btcData?.bitcoin?.usd || FALLBACK_BTC;
        const btcPhp = btcData?.bitcoin?.php || btcUsd * FALLBACK_USDPHP;
        const usdphp = btcPhp / btcUsd;

        // Gold from metals.dev free endpoint
        let goldUsd = FALLBACK_GOLD;
        try {
          const goldRes = await fetch("https://api.metals.dev/v1/latest?api_key=demo&currency=USD&unit=toz");
          const goldData = await goldRes.json();
          goldUsd = goldData?.metals?.gold || FALLBACK_GOLD;
        } catch {
          // Try alternative
          try {
            const altRes = await fetch("https://data-asg.goldprice.org/dbXRates/USD");
            const altData = await altRes.json();
            goldUsd = altData?.items?.[0]?.xauPrice || FALLBACK_GOLD;
          } catch {
            goldUsd = FALLBACK_GOLD;
          }
        }

        setPrices({ gold: goldUsd, btc: btcUsd, usdphp: Math.round(usdphp), live: true });
      } catch {
        setPrices({ gold: FALLBACK_GOLD, btc: FALLBACK_BTC, usdphp: FALLBACK_USDPHP, live: false });
      }
    }
    fetchPrices();
  }, []);

  return prices;
}

// ─── Items ───────────────────────────────────────────────────────
interface Item {
  id: string;
  name: string;
  year: number;
  price: number; // PHP
  category: string;
  color: string;
}

const COLORS = [
  "#FF3B7A", "#FF6B35", "#FFD600", "#00E676", "#00BCD4", "#7C4DFF",
  "#FF4081", "#FF9100", "#FFEA00", "#69F0AE", "#18FFFF", "#B388FF",
  "#F50057", "#FF6D00", "#C6FF00", "#1DE9B6", "#00B8D4", "#651FFF",
  "#D500F9", "#FF1744", "#00E5FF", "#76FF03", "#FFAB00", "#536DFE",
];

function getColor(i: number): string {
  return COLORS[i % COLORS.length];
}

const ITEMS: Item[] = [
  // Phones
  { id: "cherry-mobile-flare-2013", name: "Cherry Mobile Flare", year: 2013, price: 3999, category: "📱 Phones", color: getColor(0) },
  { id: "iphone-5s-2013", name: "iPhone 5s", year: 2013, price: 35000, category: "📱 Phones", color: getColor(1) },
  { id: "samsung-galaxy-s5-2014", name: "Samsung Galaxy S5", year: 2014, price: 28000, category: "📱 Phones", color: getColor(2) },
  { id: "iphone-6-2014", name: "iPhone 6", year: 2014, price: 38000, category: "📱 Phones", color: getColor(3) },
  { id: "oppo-f1-plus-2016", name: "OPPO F1 Plus", year: 2016, price: 16000, category: "📱 Phones", color: getColor(4) },
  { id: "iphone-7-2016", name: "iPhone 7", year: 2016, price: 35000, category: "📱 Phones", color: getColor(5) },
  { id: "samsung-galaxy-s8-2017", name: "Samsung Galaxy S8", year: 2017, price: 35000, category: "📱 Phones", color: getColor(6) },
  { id: "iphone-x-2017", name: "iPhone X", year: 2017, price: 60000, category: "📱 Phones", color: getColor(7) },
  { id: "pocophone-f1-2018", name: "Pocophone F1", year: 2018, price: 18000, category: "📱 Phones", color: getColor(8) },
  { id: "iphone-11-2019", name: "iPhone 11", year: 2019, price: 50000, category: "📱 Phones", color: getColor(9) },

  // Gadgets & Tech
  { id: "cherry-mobile-calculator-2012", name: "Cherry Mobile calculator phone", year: 2012, price: 500, category: "🎮 Gadgets", color: getColor(10) },
  { id: "gameboy-advance-2012", name: "Gameboy Advance", year: 2012, price: 1500, category: "🎮 Gadgets", color: getColor(11) },
  { id: "gameboy-advance-sp-2012", name: "Gameboy Advance SP", year: 2012, price: 2500, category: "🎮 Gadgets", color: getColor(12) },
  { id: "psp-3000-2012", name: "PSP 3000", year: 2012, price: 5000, category: "🎮 Gadgets", color: getColor(13) },
  { id: "cdr-king-earphones-2012", name: "CD-R King earphones", year: 2012, price: 150, category: "🎮 Gadgets", color: getColor(14) },
  { id: "cdr-king-usb-hub-2013", name: "CD-R King USB hub", year: 2013, price: 150, category: "🎮 Gadgets", color: getColor(15) },
  { id: "cdr-king-webcam-2013", name: "CD-R King webcam", year: 2013, price: 280, category: "🎮 Gadgets", color: getColor(16) },
  { id: "ipad-mini-1-2012", name: "iPad Mini 1st gen", year: 2012, price: 18000, category: "🎮 Gadgets", color: getColor(17) },
  { id: "razer-deathadder-2014", name: "Razer DeathAdder", year: 2014, price: 2500, category: "🎮 Gadgets", color: getColor(18) },
  { id: "razer-blackwidow-2015", name: "Razer BlackWidow", year: 2015, price: 5000, category: "🎮 Gadgets", color: getColor(19) },
  { id: "razer-kraken-2016", name: "Razer Kraken", year: 2016, price: 4000, category: "🎮 Gadgets", color: getColor(20) },
  { id: "ps4-2014", name: "PS4", year: 2014, price: 22000, category: "🎮 Gadgets", color: getColor(21) },
  { id: "beats-solo2-2015", name: "Beats Solo2", year: 2015, price: 9000, category: "🎮 Gadgets", color: getColor(22) },
  { id: "macbook-air-2015", name: "MacBook Air", year: 2015, price: 55000, category: "🎮 Gadgets", color: getColor(23) },
  { id: "nintendo-switch-2017", name: "Nintendo Switch", year: 2017, price: 17000, category: "🎮 Gadgets", color: getColor(0) },
  { id: "airpods-gen1-2017", name: "AirPods Gen 1", year: 2017, price: 9000, category: "🎮 Gadgets", color: getColor(1) },

  // Shoes
  { id: "converse-chuck-taylor-2012", name: "Converse Chuck Taylor", year: 2012, price: 2500, category: "👟 Shoes", color: getColor(2) },
  { id: "nike-roshe-run-2013", name: "Nike Roshe Run", year: 2013, price: 4500, category: "👟 Shoes", color: getColor(3) },
  { id: "adidas-stan-smith-2015", name: "Adidas Stan Smith", year: 2015, price: 4500, category: "👟 Shoes", color: getColor(4) },
  { id: "adidas-superstar-2015", name: "Adidas Superstar", year: 2015, price: 4000, category: "👟 Shoes", color: getColor(5) },
  { id: "vans-old-skool-2016", name: "Vans Old Skool", year: 2016, price: 3000, category: "👟 Shoes", color: getColor(6) },
  { id: "adidas-nmd-2016", name: "Adidas NMD", year: 2016, price: 7500, category: "👟 Shoes", color: getColor(7) },
  { id: "nike-huarache-2016", name: "Nike Huarache", year: 2016, price: 6000, category: "👟 Shoes", color: getColor(8) },
  { id: "adidas-yeezy-350-2017", name: "Adidas Yeezy 350 v2", year: 2017, price: 12000, category: "👟 Shoes", color: getColor(9) },
  { id: "nike-air-max-97-2017", name: "Nike Air Max 97 Silver Bullet", year: 2017, price: 8000, category: "👟 Shoes", color: getColor(10) },
  { id: "fila-disruptor-2-2018", name: "Fila Disruptor 2", year: 2018, price: 4500, category: "👟 Shoes", color: getColor(11) },

  // Fashion
  { id: "havaianas-2012", name: "Havaianas", year: 2012, price: 1000, category: "👕 Fashion", color: getColor(12) },
  { id: "bench-varsity-jacket-2013", name: "Bench varsity jacket", year: 2013, price: 1500, category: "👕 Fashion", color: getColor(13) },
  { id: "bench-body-spray-2013", name: "Bench body spray collection", year: 2013, price: 500, category: "👕 Fashion", color: getColor(14) },
  { id: "herschel-backpack-2014", name: "Herschel backpack", year: 2014, price: 3000, category: "👕 Fashion", color: getColor(17) },
  { id: "jansport-backpack-2014", name: "Jansport backpack", year: 2014, price: 2500, category: "👕 Fashion", color: getColor(18) },
  { id: "longchamp-le-pliage-2014", name: "Longchamp Le Pliage", year: 2014, price: 5000, category: "👕 Fashion", color: getColor(19) },
  { id: "champion-hoodie-2018", name: "Champion hoodie", year: 2018, price: 3500, category: "👕 Fashion", color: getColor(21) },

  // Accessories
  { id: "blue-magic-teddy-bear-2012", name: "Blue Magic teddy bear", year: 2012, price: 300, category: "💍 Accessories", color: getColor(22) },
  { id: "unisilver-ring-2012", name: "UniSilver ring", year: 2012, price: 500, category: "💍 Accessories", color: getColor(23) },
  { id: "unisilver-bracelet-2012", name: "UniSilver bracelet", year: 2012, price: 800, category: "💍 Accessories", color: getColor(0) },
  { id: "unisilver-necklace-2012", name: "UniSilver necklace", year: 2012, price: 1200, category: "💍 Accessories", color: getColor(1) },
  { id: "gatsby-wax-2013", name: "Gatsby hair wax", year: 2013, price: 200, category: "💍 Accessories", color: getColor(2) },
  { id: "ray-ban-wayfarer-2013", name: "Ray-Ban Wayfarer", year: 2013, price: 7000, category: "💍 Accessories", color: getColor(3) },
  { id: "casio-g-shock-2013", name: "Casio G-Shock", year: 2013, price: 5000, category: "💍 Accessories", color: getColor(4) },
  { id: "fossil-watch-2014", name: "Fossil watch", year: 2014, price: 7000, category: "💍 Accessories", color: getColor(6) },
  { id: "pandora-bracelet-2015", name: "Pandora bracelet", year: 2015, price: 5000, category: "💍 Accessories", color: getColor(8) },
  { id: "daniel-wellington-2015", name: "Daniel Wellington watch", year: 2015, price: 6000, category: "💍 Accessories", color: getColor(9) },
  { id: "sunnies-studios-2017", name: "Sunnies Studios sunglasses", year: 2017, price: 1500, category: "💍 Accessories", color: getColor(10) },
  { id: "hydroflask-2019", name: "HydroFlask", year: 2019, price: 2000, category: "💍 Accessories", color: getColor(11) },

  // Gaming
  { id: "ragnarok-online-2012", name: "Ragnarok Online card", year: 2012, price: 350, category: "🕹 Gaming", color: getColor(12) },
  { id: "mu-online-2012", name: "MU Online card", year: 2012, price: 100, category: "🕹 Gaming", color: getColor(14) },
  { id: "gunbound-2012", name: "GunBound card", year: 2012, price: 50, category: "🕹 Gaming", color: getColor(15) },
  { id: "yugioh-booster-2013", name: "Yu-Gi-Oh booster box", year: 2013, price: 2500, category: "🕹 Gaming", color: getColor(16) },
  { id: "pokemon-cards-2014", name: "Pokémon cards booster box", year: 2014, price: 3000, category: "🕹 Gaming", color: getColor(17) },
  { id: "mtg-booster-2013", name: "Magic: The Gathering booster box", year: 2013, price: 5000, category: "🕹 Gaming", color: getColor(18) },
  { id: "nba-2k-2015", name: "NBA 2K (yearly)", year: 2015, price: 2500, category: "🕹 Gaming", color: getColor(20) },
  { id: "dota2-battle-pass-2016", name: "DOTA 2 Battle Pass", year: 2016, price: 500, category: "🕹 Gaming", color: getColor(21) },

  // Random Trends
  { id: "funko-pop-2016", name: "Funko Pop ×5", year: 2016, price: 3000, category: "🎲 Random", color: getColor(22) },
  { id: "fidget-spinner-2017", name: "Fidget spinner", year: 2017, price: 300, category: "🎲 Random", color: getColor(23) },
  { id: "kpop-album-2017", name: "K-Pop album (BTS/BP)", year: 2017, price: 1500, category: "🎲 Random", color: getColor(0) },
  { id: "instax-film-2018", name: "Instax film 10-pack", year: 2018, price: 4000, category: "🎲 Random", color: getColor(1) },
  { id: "sunnies-face-2018", name: "Sunnies Face lipstick set", year: 2018, price: 800, category: "🎲 Random", color: getColor(2) },
  { id: "led-strip-lights-2019", name: "LED strip lights", year: 2019, price: 500, category: "🎲 Random", color: getColor(3) },
  { id: "mechanical-keyboard-2019", name: "Mechanical keyboard", year: 2019, price: 3000, category: "🎲 Random", color: getColor(4) },
  { id: "instax-mini-9-2018", name: "Instax Mini 9", year: 2018, price: 4000, category: "🎲 Random", color: getColor(5) },

  // Automobiles
  { id: "honda-wave-100-2012", name: "2nd-hand Honda Wave 100", year: 2012, price: 15000, category: "🏍 Sasakyan", color: getColor(6) },
  { id: "honda-xrm-125-2013", name: "2nd-hand Honda XRM 125", year: 2013, price: 25000, category: "🏍 Sasakyan", color: getColor(7) },
  { id: "yamaha-mio-sporty-2014", name: "2nd-hand Yamaha Mio Sporty", year: 2014, price: 30000, category: "🏍 Sasakyan", color: getColor(8) },
  { id: "honda-beat-2016", name: "2nd-hand Honda Beat", year: 2016, price: 35000, category: "🏍 Sasakyan", color: getColor(9) },
  { id: "suzuki-raider-150-2015", name: "2nd-hand Suzuki Raider 150", year: 2015, price: 45000, category: "🏍 Sasakyan", color: getColor(10) },
  { id: "yamaha-nmax-2017", name: "2nd-hand Yamaha NMAX", year: 2017, price: 65000, category: "🏍 Sasakyan", color: getColor(11) },
  { id: "suzuki-alto-2015", name: "2nd-hand Suzuki Alto", year: 2015, price: 100000, category: "🏍 Sasakyan", color: getColor(12) },
  { id: "mitsubishi-mirage-2014", name: "2nd-hand Mitsubishi Mirage", year: 2014, price: 120000, category: "🏍 Sasakyan", color: getColor(13) },
  { id: "honda-city-2013", name: "2nd-hand Honda City", year: 2013, price: 130000, category: "🏍 Sasakyan", color: getColor(14) },
  { id: "toyota-vios-2013", name: "2nd-hand Toyota Vios", year: 2013, price: 150000, category: "🏍 Sasakyan", color: getColor(15) },
];

// ─── Calculation ─────────────────────────────────────────────────
function calcValue(item: Item, asset: "gold" | "bitcoin", goldNow: number, btcNow: number, usdphpNow: number): number {
  const usdphpThen = USDPHP[item.year] || 45;
  const priceUsd = item.price / usdphpThen;

  if (asset === "gold") {
    const goldThen = GOLD_USD[item.year] || 1300;
    const ozBought = priceUsd / goldThen;
    return ozBought * goldNow * usdphpNow;
  } else {
    const btcThen = BTC_USD[item.year] || 1000;
    const btcBought = priceUsd / btcThen;
    return btcBought * btcNow * usdphpNow;
  }
}

function formatPeso(v: number): string {
  if (v >= 1_000_000_000) return `₱${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `₱${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1000) return `₱${Math.round(v).toLocaleString("en-PH")}`;
  return `₱${v.toFixed(2)}`;
}

function calcAssetAmount(item: Item, asset: "gold" | "bitcoin"): string {
  const usdphpThen = USDPHP[item.year] || 45;
  const priceUsd = item.price / usdphpThen;
  if (asset === "gold") {
    const oz = priceUsd / (GOLD_USD[item.year] || 1300);
    return `${oz.toFixed(oz >= 1 ? 2 : 4)} oz Gold`;
  } else {
    const btc = priceUsd / (BTC_USD[item.year] || 1000);
    return `${btc.toFixed(btc >= 1 ? 2 : 4)} Bitcoin`;
  }
}

// ─── Component ───────────────────────────────────────────────────
export default function WhatIfPage() {
  const [asset, setAsset] = useState<"gold" | "bitcoin">("gold");
  const [index, setIndex] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [show, setShow] = useState(true);
  const prices = useLivePrices();

  const item = ITEMS[index];
  const value = calcValue(item, asset, prices.gold, prices.btc, prices.usdphp);
  const multiplier = value / item.price;

  const shuffle = useCallback(() => {
    setShow(false);
    setTimeout(() => {
      let next = index;
      while (next === index) next = Math.floor(Math.random() * ITEMS.length);
      setIndex(next);
      setImgError(false);
      setShow(true);
    }, 300);
  }, [index]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.code === "Space") { e.preventDefault(); shuffle(); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shuffle]);

  const assetLabel = asset === "gold" ? "gold" : "bitcoin";
  const assetEmoji = asset === "gold" ? "🥇" : "₿";
  const assetColor = asset === "gold" ? "#FFD600" : "#FF9800";

  return (
    <div className="h-[100dvh] bg-white flex flex-col overflow-hidden">
      {/* Nav */}
      <nav className="flex justify-between items-center px-4 py-2 max-w-[600px] mx-auto w-full shrink-0">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-[#1a1a1a] no-underline">
          alkansya<span className="text-[#00c853]">.ph</span>
        </Link>
        <NavMenu />
      </nav>

      {/* Toggle */}
      <div className="flex justify-center gap-1 shrink-0 mb-2">
        <button onClick={() => setAsset("gold")}
          className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
            asset === "gold" ? "bg-[#FFD600] text-[#1a1a1a]" : "bg-[#f0f0f0] text-[#888]"
          }`}>🥇 Gold</button>
        <button onClick={() => setAsset("bitcoin")}
          className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
            asset === "bitcoin" ? "bg-[#FF9800] text-white" : "bg-[#f0f0f0] text-[#888]"
          }`}>₿ Bitcoin</button>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col justify-center max-w-[600px] mx-auto px-5 w-full min-h-0">
        <div className={`transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"}`}>

          {/* The text */}
          <p className="text-2xl sm:text-[36px] font-black text-[#1a1a1a] leading-[1.15] tracking-tight mb-4">
            kung bumili ka nalang ng{" "}
            <span style={{ borderBottom: `4px solid ${assetColor}` }}>{assetLabel}</span>
            {" "}instead of a{" "}
            <span style={{ borderBottom: "4px solid #2196F3" }}>{item.name}</span>
          </p>

          {/* You'd have */}
          <p className="text-2xl sm:text-[36px] font-black text-[#1a1a1a] leading-[1.15] tracking-tight mb-5">
            meron ka sanang{" "}
            <span style={{ borderBottom: "4px solid #00c853" }}>
              {formatPeso(value)}
            </span>
          </p>

          {/* Item image + asset amount */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] flex items-center justify-center shrink-0">
              {!imgError ? (
                <img
                  src={`/items/${item.id}.png`}
                  alt={item.name}
                  className="w-full h-full object-contain"
                  style={{ filter: `drop-shadow(2px 0 0 ${item.color}) drop-shadow(-2px 0 0 ${item.color}) drop-shadow(0 2px 0 ${item.color}) drop-shadow(0 -2px 0 ${item.color})` }}
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="text-5xl">{item.category.split(" ")[0]}</span>
              )}
            </div>
            <span className="text-2xl font-black text-[#1a1a1a]">=</span>
            <div>
              <p className="text-xl sm:text-2xl font-black" style={{ color: assetColor }}>
                {calcAssetAmount(item, asset)}
              </p>
            </div>
          </div>

          {/* Details — single line */}
          <p className="text-xs text-[#888] mb-4">
            <span className="font-bold">₱{item.price.toLocaleString("en-PH")}</span> · {item.year} · {multiplier.toFixed(1)}× return
          </p>
        </div>

        {/* Shuffle button */}
        <button
          onClick={shuffle}
          className="w-full py-3.5 rounded-2xl text-sm font-black text-white transition-all active:scale-[0.97] shrink-0"
          style={{ background: assetColor }}
        >
          isa pa nga. 🔀
        </button>
      </main>

      {/* Footer */}
      <footer className="text-center py-2 px-4 shrink-0">
        <p className="text-[9px] text-[#ccc]">
          Pang-guilt trip lang &apos;to, hindi financial advice.
        </p>
      </footer>
    </div>
  );
}
