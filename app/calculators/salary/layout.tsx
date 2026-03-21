import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Magkano Sahod Abroad? — Alkansya.ph",
  description: "Compare estimated salaries for Filipino professionals abroad. Nurse, engineer, BPO, caregiver, and more — across 12 countries.",
  openGraph: {
    title: "Magkano Sahod Abroad? — Alkansya.ph",
    description: "Compare estimated salaries for Filipino professionals abroad.",
    url: "https://alkansya.ph/salary",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
