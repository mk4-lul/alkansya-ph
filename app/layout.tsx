import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const GA_ID = "G-NTCRT0NSFX";

export const metadata: Metadata = {
  title: "Alkansya.ph — Compare Philippine Interest Rates",
  description:
    "Compare savings and time deposit rates across BDO, BPI, Metrobank, Maya, CIMB, Tonik, GoTyme, and more. See how much more you could earn by switching.",
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
      "Traditional banks give you 0.0625%. Digital banks give you 50× more. Compare all PH rates in one place.",
    type: "website",
    locale: "en_PH",
    url: "https://alkansya.ph",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alkansya.ph — Compare PH Savings & Deposit Rates",
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
      <head>
        <Script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}</Script>
      </head>
      <body className={inter.className}>
        {children}
        <Script id="glow-detect" strategy="afterInteractive">{`
          var _glowPath = '';
          function checkGlow() {
            var el = document.querySelector('main')?.parentElement || document.body;
            var bg = getComputedStyle(el).backgroundColor;
            var match = bg.match(/\\d+/g);
            if (match && match[0]==='245' && match[1]==='245' && match[2]==='245') {
              el.classList.add('glow-bg');
              if (_glowPath !== location.pathname) {
                _glowPath = location.pathname;
                el.style.setProperty('--glow-x', (Math.random() * 100) + '%');
                el.style.setProperty('--glow-y', (55 + Math.random() * 40) + '%');
              }
            } else {
              el.classList.remove('glow-bg');
              _glowPath = '';
            }
          }
          checkGlow();
          new MutationObserver(checkGlow).observe(document.body, { childList: true, subtree: true });
        `}</Script>
      </body>
    </html>
  );
}
