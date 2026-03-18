import type { Metadata } from "next";

export const metadata: Metadata = {
title: "USD to PHP Converter — Live Rate — Alkansya.ph",
description: "Live USD to PHP exchange rate with historical chart. Convert US dollars to Philippine pesos instantly. Updated every minute.",
openGraph: {
title: "USD to PHP — Live Rate — Alkansya.ph",
description: "Live USD/PHP rate with 1D/1W/1M/1Y/ALL chart. Updated every minute.",
url: "https://alkansya.ph/usdphp",
},
};

export default function Layout({ children }: { children: React.ReactNode }) {
return children;
}
