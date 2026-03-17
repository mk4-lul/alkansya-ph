import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compound Interest Calculator — Alkansya.ph",
  description: "See how your money grows with compound interest over time. Adjust interest rate, deposits, and time period. Free calculator for Filipinos.",
  openGraph: {
    title: "Compound Interest Calculator — Alkansya.ph",
    description: "See how your money grows with compound interest over time.",
    url: "https://alkansya.ph/compound",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
