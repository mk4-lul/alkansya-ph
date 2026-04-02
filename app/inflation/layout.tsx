import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Philippine Inflation Calculator — How Much Has the Peso Lost? | Sentral",
  description:
    "Calculate how inflation has affected the Philippine peso from 1959 to today. Based on official PSA Consumer Price Index (CPI) data. See how much ₱100 in any year is worth today.",
  keywords: [
    "Philippine inflation calculator",
    "inflation Philippines",
    "peso purchasing power",
    "CPI Philippines",
    "Philippine peso inflation",
    "halaga ng piso",
    "presyo ng bilihin",
    "inflation rate Philippines",
    "purchasing power calculator",
    "peso value over time",
  ],
  openGraph: {
    title: "Philippine Inflation Calculator — How Much Has the Peso Lost?",
    description: "₱100 in 2000 is worth ₱255 today. Calculate inflation for any year from 1959 to present using official CPI data.",
    url: "https://sentral.ph/inflation",
    type: "website",
    locale: "en_PH",
    siteName: "Sentral",
  },
  twitter: {
    card: "summary_large_image",
    title: "Philippine Inflation Calculator — Sentral",
    description: "How much has the peso really lost? Calculate using official PSA CPI data from 1959 to present.",
  },
  alternates: {
    canonical: "https://sentral.ph/inflation",
  },
  robots: "index, follow",
};

export default function InflationLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Philippine Inflation Calculator",
            description: "Calculate how inflation has affected the Philippine peso from 1959 to today using official CPI data.",
            url: "https://sentral.ph/inflation",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Any",
            isPartOf: {
              "@type": "WebSite",
              name: "Sentral",
              url: "https://sentral.ph",
            },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://sentral.ph" },
                { "@type": "ListItem", position: 2, name: "Inflation Calculator", item: "https://sentral.ph/inflation" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  );
}
