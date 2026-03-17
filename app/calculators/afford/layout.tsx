import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Afford Ko Ba 'To? — Alkansya.ph",
  description: "Alamin kung kaya mo ba bago bilhin. Sahod, ipon, at presyo — simple calculator para sa mga Pilipino.",
  openGraph: {
    title: "Afford Ko Ba 'To? — Alkansya.ph",
    description: "Alamin kung kaya mo ba bago bilhin.",
    url: "https://alkansya.ph/afford",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
