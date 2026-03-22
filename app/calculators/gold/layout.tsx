import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Global Gold Price in PHP — Alkansya.ph",
  description: "Live global gold price in Philippine Pesos. Track historical gold prices with interactive charts. Updated daily.",
  openGraph: {
    title: "Global Gold Price in PHP — Alkansya.ph",
    description: "Live global gold price in Philippine Pesos with historical charts.",
    url: "https://alkansya.ph/gold",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
