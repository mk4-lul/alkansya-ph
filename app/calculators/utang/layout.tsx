import type { Metadata } from "next";

export const metadata: Metadata = {

  title: "Magkano Nawawala Sa'yo? — Utang Calculator — Alkansya.ph",

  description: "Alamin kung magkano talaga nawawala sa'yo sa interest ng utang mo. Credit card, motor, online lending, 5-6. Free calculator para sa mga Pilipino.",

  openGraph: {

    title: "Magkano Nawawala Sa'yo? — Alkansya.ph",

    description: "Alamin kung magkano talaga nawawala sa'yo sa interest ng utang mo.",

    url: "https://alkansya.ph/utang",

  },

};

export default function Layout({ children }: { children: React.ReactNode }) {

  return children;

}
