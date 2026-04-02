import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "USD to PHP Converter — Live Rate — Sentral",
  description: "Live USD to PHP exchange rate with historical chart. Convert US dollars to Philippine pesos instantly. Updated every minute.",
  openGraph: {
    title: "USD to PHP — Live Rate — Sentral",
    description: "Live USD/PHP rate with 1Y/ALL chart. Updated every minute.",
    url: "https://sentral.ph/usdphp",
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
