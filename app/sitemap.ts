import type { MetadataRoute } from "next";
import { cases } from "@/lib/cases";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://zakulab.ru";
  return [
    { url: base, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/reviews`, changeFrequency: "monthly", priority: 0.6 },
    ...cases.map((item) => ({ url: `${base}/cases/${item.slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
