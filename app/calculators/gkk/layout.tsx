import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gaano Ako Kayaman? — Alkansya.ph",
  description: "Alamin kung nasaan ka sa income ranking ng mga Pilipino. Based on 2023 Family Income and Expenditure Survey (PSA).",
  openGraph: {
    title: "Gaano Ako Kayaman? — Alkansya.ph",
    description: "Alamin kung nasaan ka sa income ranking ng mga Pilipino.",
    url: "https://alkansya.ph/gkk",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
