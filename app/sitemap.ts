import type { MetadataRoute } from "next";
import { getPublishedCases } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://zakulab.ru";
  const cases = await getPublishedCases();
  return [
    { url: base, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/projects`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/style-check`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/reviews`, changeFrequency: "monthly", priority: 0.6 },
    ...cases.map((item) => ({ url: `${base}/cases/${item.slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
