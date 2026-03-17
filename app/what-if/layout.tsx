import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "What If Nag-Invest Ka Nalang? — Alkansya.ph",
  description: "Kung bumili ka nalang ng gold o bitcoin instead of your old purchases, magkano na sana pera mo ngayon? Pang-guilt trip lang 'to.",
  openGraph: {
    title: "What If Nag-Invest Ka Nalang? — Alkansya.ph",
    description: "Kung bumili ka nalang ng gold o bitcoin instead... magkano na sana?",
    url: "https://alkansya.ph/what-if",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
