import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gold Price Today in Philippines (PHP) — Per Gram & Troy Oz | Sentral",
  description:
    "Live gold price in Philippine Pesos updated daily. View 24K, 22K, 21K, 18K gold rates per gram and per troy ounce. Historical gold price chart, karat pricing table, and gold calculator for Filipinos.",
  keywords: [
    "gold price philippines",
    "gold price today philippines",
    "gold price per gram philippines",
    "gold rate philippines",
    "24k gold price philippines",
    "gold price php",
    "gold price per gram php",
    "presyo ng ginto",
    "gold price today php",
    "gold karat price philippines",
    "18k gold price philippines",
    "21k gold price philippines",
    "22k gold price philippines",
    "saudi gold price philippines",
    "hong kong gold price philippines",
    "japan gold price philippines",
    "gold calculator philippines",
    "gold spot price php",
  ],
  openGraph: {
    title: "Gold Price Today in Philippines — Live PHP Rate per Gram",
    description:
      "Track live gold prices in Philippine Pesos. 24K, 22K, 21K, 18K karat rates per gram. Historical chart and gold calculator.",
    url: "https://sentral.ph/gold",
    type: "website",
    locale: "en_PH",
    siteName: "Sentral",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gold Price Today in Philippines (PHP) — Sentral",
    description: "Live gold price per gram in Philippine Pesos. 24K to 10K karat rates, historical chart, and calculator.",
  },
  alternates: {
    canonical: "https://sentral.ph/gold",
  },
  robots: "index, follow",
};

export default function GoldLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Gold Price Today in Philippines (PHP)",
            description: "Live gold price in Philippine Pesos. View 24K, 22K, 21K, 18K gold rates per gram and per troy ounce with historical chart.",
            url: "https://sentral.ph/gold",
            isPartOf: {
              "@type": "WebSite",
              name: "Sentral",
              url: "https://sentral.ph",
            },
            mainEntity: {
              "@type": "FinancialProduct",
              name: "Gold (XAU)",
              description: "Spot gold price converted to Philippine Pesos per gram and per troy ounce",
              currency: "PHP",
            },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://sentral.ph" },
                { "@type": "ListItem", position: 2, name: "Gold Price Philippines", item: "https://sentral.ph/gold" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  );
}
