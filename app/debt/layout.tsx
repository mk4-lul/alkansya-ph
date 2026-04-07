import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Philippine National Debt Tracker (Debt-to-GDP Included) | Sentral",
  description:
    "Track the Philippines' national government debt and debt-to-GDP ratio in one view. Uses Bureau of the Treasury releases and historical debt series data.",
  keywords: [
    "Philippine national debt",
    "Philippines debt to GDP",
    "Bureau of the Treasury debt",
    "national government debt Philippines",
    "utang ng Pilipinas",
    "public debt Philippines",
    "Philippines debt tracker",
  ],
  alternates: {
    canonical: "https://sentral.ph/debt",
  },
  openGraph: {
    title: "Philippine National Debt Tracker | Sentral",
    description:
      "See the latest Philippine national debt total, debt-to-GDP trend, and historical debt data in one clean dashboard.",
    url: "https://sentral.ph/debt",
    type: "website",
    locale: "en_PH",
    siteName: "Sentral",
  },
  twitter: {
    card: "summary_large_image",
    title: "Philippine National Debt Tracker | Sentral",
    description:
      "Latest Philippine national debt and debt-to-GDP trend, based on Bureau of the Treasury releases.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function DebtLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Dataset",
            name: "Philippine National Debt Tracker",
            description:
              "Historical and latest Philippine national government debt and debt-to-GDP values.",
            url: "https://sentral.ph/debt",
            creator: {
              "@type": "Organization",
              name: "Sentral",
              url: "https://sentral.ph",
            },
            isAccessibleForFree: true,
            variableMeasured: ["National government debt", "Debt-to-GDP ratio"],
            sourceOrganization: {
              "@type": "GovernmentOrganization",
              name: "Bureau of the Treasury",
              url: "https://www.treasury.gov.ph/",
            },
          }),
        }}
      />
      {children}
    </>
  );
}
