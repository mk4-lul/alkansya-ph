import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alkansya.ph — Compare Philippine Bank Interest Rates",
  description:
    "Compare savings and time deposit rates across BDO, BPI, Metrobank, Maya, CIMB, Tonik, GoTyme, SeaBank and more. See how much more you could earn by switching banks.",
  keywords: [
    "Philippine bank rates",
    "savings interest rate Philippines",
    "time deposit rates PH",
    "best savings account Philippines",
    "neobank rates Philippines",
    "Maya bank rate",
    "CIMB rate",
    "Tonik rate",
    "BDO savings rate",
    "BPI savings rate",
  ],
  openGraph: {
    title: "Alkansya.ph — Where Should You Park Your Money?",
    description:
      "Traditional banks give you 0.0625%. Digital banks give you 50× more. Compare all PH bank rates in one place.",
    type: "website",
    locale: "en_PH",
    url: "https://alkansya.ph",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alkansya.ph — Compare PH Bank Rates",
    description: "See exactly how much you're missing out on.",
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
