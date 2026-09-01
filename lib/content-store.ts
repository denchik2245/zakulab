import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { getStore } from "@netlify/blobs";
import { cases as seedCases, type CaseStudy } from "@/lib/cases";
import { verifiedReviews as seedReviews, type VerifiedReview } from "@/lib/reviews";
import { defaultSiteSettings, type SiteSettings } from "@/lib/site-settings";

export type AdminContent = {
  version: 1;
  updatedAt: string;
  cases: CaseStudy[];
  reviews: VerifiedReview[];
  site: SiteSettings;
};

const localFile = path.join(process.cwd(), ".data", "zakulab-content.json");
const blobKey = "content-v1";

function seedContent(): AdminContent {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    cases: structuredClone(seedCases),
    reviews: structuredClone(seedReviews),
    site: structuredClone(defaultSiteSettings),
  };
}

function isNetlifyRuntime() {
  return process.env.NETLIFY === "true" || process.env.NETLIFY_LOCAL === "true";
}

function mergeWithDefaults(value: Partial<AdminContent>): AdminContent {
  const seed = seedContent();
  const incomingSite = value.site as Partial<SiteSettings> | undefined;
  const isLegacySite = Boolean(
    incomingSite &&
      (!("heroName" in incomingSite) ||
        !Array.isArray(incomingSite.portfolioImages)),
  );
  const site = isLegacySite
    ? seed.site
    : {
        ...seed.site,
        ...(incomingSite ?? {}),
        heroGallery: Array.isArray(incomingSite?.heroGallery)
          ? incomingSite.heroGallery
          : seed.site.heroGallery,
        stats: Array.isArray(incomingSite?.stats)
          ? incomingSite.stats
          : seed.site.stats,
        portfolioImages: Array.isArray(incomingSite?.portfolioImages)
          ? incomingSite.portfolioImages
          : seed.site.portfolioImages,
        projects: Array.isArray(incomingSite?.projects)
          ? incomingSite.projects
          : seed.site.projects,
        process: Array.isArray(incomingSite?.process)
          ? incomingSite.process
          : seed.site.process,
        services: Array.isArray(incomingSite?.services)
          ? incomingSite.services
          : seed.site.services,
        smallTasks: Array.isArray(incomingSite?.smallTasks)
          ? incomingSite.smallTasks
          : seed.site.smallTasks,
      };

  return {
    version: 1,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : seed.updatedAt,
    cases: Array.isArray(value.cases) ? value.cases : seed.cases,
    reviews: Array.isArray(value.reviews)
      ? value.reviews.map((review) => ({
          ...seed.reviews.find((seedReview) => seedReview.id === review.id),
          ...review,
        }))
      : seed.reviews,
    site,
  };
}

export async function readContent(): Promise<AdminContent> {
  if (isNetlifyRuntime()) {
    const store = getStore("zakulab-cms");
    const stored = await store.get(blobKey, { type: "json", consistency: "strong" }) as Partial<AdminContent> | null;
    return stored ? mergeWithDefaults(stored) : seedContent();
  }

  try {
    const raw = await fs.readFile(localFile, "utf8");
    return mergeWithDefaults(JSON.parse(raw) as Partial<AdminContent>);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return seedContent();
  }
}

export async function writeContent(value: AdminContent): Promise<AdminContent> {
  const content = mergeWithDefaults({ ...value, updatedAt: new Date().toISOString() });
  if (isNetlifyRuntime()) {
    const store = getStore("zakulab-cms");
    await store.setJSON(blobKey, content);
    return content;
  }

  await fs.mkdir(path.dirname(localFile), { recursive: true });
  await fs.writeFile(localFile, JSON.stringify(content, null, 2), "utf8");
  return content;
}

export async function getPublishedCases() {
  const content = await readContent();
  return content.cases.filter((item) => item.status === "published").sort((a, b) => a.index.localeCompare(b.index, "ru"));
}

export async function getPublishedReviews() {
  const content = await readContent();
  return content.reviews.filter((item) => item.status === "published" || item.status === "demo").sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getPublishedCase(slug: string) {
  return (await getPublishedCases()).find((item) => item.slug === slug);
}
