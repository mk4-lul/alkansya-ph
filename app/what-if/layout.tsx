import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Investment Calculator — What If You Invested? — Alkansya.ph",
  description: "What if you invested in Bitcoin, gold, Apple, Nvidia, or Philippine stocks years ago? See your potential returns with 9 assets from 2015–2026.",
  openGraph: {
    title: "What If You Invested? — Alkansya.ph",
    description: "What if you invested in Bitcoin, gold, or stocks years ago? See your potential returns.",
    url: "https://alkansya.ph/investment",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
