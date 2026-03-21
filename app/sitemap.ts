import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://alkansya.ph";

  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/usdphp`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/rates`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },

    { url: `${base}/compound`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/mp2`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/investment`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/afford`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/utang`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/what-if`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/gkk`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/salary`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  ];
}
