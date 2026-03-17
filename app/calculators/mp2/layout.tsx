import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pag-IBIG MP2 Calculator — Alkansya.ph",
  description: "Project your Pag-IBIG MP2 dividends and savings growth. Tax-free government savings program calculator for Filipinos.",
  openGraph: {
    title: "Pag-IBIG MP2 Calculator — Alkansya.ph",
    description: "Project your Pag-IBIG MP2 dividends. Tax-free government savings.",
    url: "https://alkansya.ph/mp2",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
