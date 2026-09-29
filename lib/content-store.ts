import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { getStore } from "@netlify/blobs";
import { cases as seedCases, createLegacyCaseBlocks, type CaseBlock, type CaseStudy } from "@/lib/cases";
import { verifiedReviews as seedReviews, type VerifiedReview } from "@/lib/reviews";
import { defaultSiteSettings, type SiteSettings } from "@/lib/site-settings";

export type AdminContent = {
  version: 1;
  updatedAt: string;
  reviews: VerifiedReview[];
  site: SiteSettings;
};

const localFile = path.join(process.cwd(), ".data", "zakulab-content.json");
const blobKey = "content-v1";

function seedContent(): AdminContent {
  const site = structuredClone(defaultSiteSettings);
  site.portfolioProjects = site.portfolioProjects.map((project) => {
    const caseSlug = project.url.match(/^\/cases\/([^/?#]+)/)?.[1] ?? project.id;
    const caseStudy = seedCases.find((item) => item.slug === caseSlug);
    return caseStudy ? { ...project, caseStudy: normalizeCaseStudy(structuredClone(caseStudy), project.image) } : project;
  });
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    reviews: structuredClone(seedReviews),
    site,
  };
}

function normalizeCaseStudy(caseStudy: CaseStudy, previewImage = ""): CaseStudy {
  const blocks = Array.isArray(caseStudy.blocks) && caseStudy.blocks.length > 0
    ? caseStudy.blocks.filter((block): block is CaseBlock => Boolean(block && typeof block.id === "string" && typeof block.type === "string"))
    : createLegacyCaseBlocks(caseStudy, previewImage);

  return {
    ...caseStudy,
    whatDone: caseStudy.whatDone?.trim() || caseStudy.summary,
    blocks,
  };
}

function isNetlifyRuntime() {
  return process.env.NETLIFY === "true" || process.env.NETLIFY_LOCAL === "true";
}

function mergeWithDefaults(value: Partial<AdminContent>): AdminContent {
  const seed = seedContent();
  const legacyCases = Array.isArray((value as Partial<AdminContent> & { cases?: CaseStudy[] }).cases)
    ? (value as Partial<AdminContent> & { cases: CaseStudy[] }).cases
    : [];
  const rawSite = value.site as (Partial<SiteSettings> & {
    portfolioCards?: { id?: string; image?: string; title?: string; tags?: string[] }[];
    portfolioImages?: string[];
    projects?: { id?: string; title?: string; description?: string; url?: string; platform?: string }[];
  }) | undefined;
  const { portfolioCards: legacyCards, portfolioImages: legacyImages, projects: legacyProjects, ...incomingSite } = rawSite ?? {};
  const isLegacySite = Boolean(rawSite && !("heroName" in rawSite) && !legacyCards && !legacyImages);
  const portfolioProjects = Array.isArray(incomingSite.portfolioProjects)
    ? incomingSite.portfolioProjects.map((project, index) => ({
        ...(seed.site.portfolioProjects.find((item) => item.id === project.id) ?? seed.site.portfolioProjects[index] ?? seed.site.portfolioProjects[0]),
        ...project,
        tags: (Array.isArray(project.tags) ? [project.tags[0] ?? "", project.tags[1] ?? ""] : ["", ""]) as [string, string],
        filters: Array.isArray(project.filters) ? project.filters : [],
      }))
    : (() => {
        const projects = structuredClone(seed.site.portfolioProjects);
        const cards: { image?: string; title?: string; tags?: string[] }[] = Array.isArray(legacyCards)
          ? legacyCards
          : Array.isArray(legacyImages)
            ? legacyImages.map((image) => ({ image }))
            : [];
        const featuredOnHome = projects.filter((project) => project.homePlacement === "featured");
        cards.slice(0, 4).forEach((card, index) => {
          const target = featuredOnHome[index];
          if (!target) return;
          if (card.image) target.image = card.image;
          if (card.title) target.title = card.title;
          if (Array.isArray(card.tags)) target.tags = [card.tags[0] ?? "", card.tags[1] ?? ""];
        });
        const archived = projects.filter((project) => project.portfolioPlacement === "archive");
        if (Array.isArray(legacyProjects)) legacyProjects.forEach((project, index) => {
          const target = archived[index];
          if (!target) return;
          Object.assign(target, project);
        });
        return projects;
      })();
  legacyCases.forEach((caseStudy) => {
    const projectIndex = portfolioProjects.findIndex((project) => project.caseStudy?.slug === caseStudy.slug || project.id === caseStudy.slug || project.url === `/cases/${caseStudy.slug}`);
    if (projectIndex >= 0) {
      portfolioProjects[projectIndex] = { ...portfolioProjects[projectIndex], url: `/cases/${caseStudy.slug}`, caseStudy: { ...portfolioProjects[projectIndex].caseStudy, ...caseStudy } };
      return;
    }
    portfolioProjects.push({
      id: caseStudy.slug,
      title: caseStudy.title,
      description: caseStudy.summary,
      image: "/assets/figma/rectangle10.png",
      url: `/cases/${caseStudy.slug}`,
      platform: "",
      tags: [caseStudy.category === "commerce" ? "Интернет-магазин" : "Многостраничный", caseStudy.year],
      filters: [caseStudy.category === "commerce" ? "commerce" : "multipage"],
      homePlacement: "hidden",
      portfolioPlacement: "archive",
      published: caseStudy.status === "published",
      order: (portfolioProjects.length + 1) * 10,
      caseStudy,
    });
  });
  const site = isLegacySite
    ? seed.site
    : {
        ...seed.site,
        ...incomingSite,
        heroGallery: Array.isArray(incomingSite?.heroGallery)
          ? incomingSite.heroGallery
          : seed.site.heroGallery,
        stats: Array.isArray(incomingSite?.stats)
          ? incomingSite.stats
          : seed.site.stats,
        portfolioProjects: portfolioProjects.map((project) => project.caseStudy
          ? { ...project, caseStudy: normalizeCaseStudy(project.caseStudy, project.image) }
          : project),
        process: Array.isArray(incomingSite?.process)
          ? incomingSite.process
          : seed.site.process,
        services: Array.isArray(incomingSite?.services)
          ? incomingSite.services
          : seed.site.services,
        smallTasks: Array.isArray(incomingSite?.smallTasks)
          ? incomingSite.smallTasks
          : seed.site.smallTasks,
        styleChoice: {
          ...seed.site.styleChoice,
          ...(incomingSite.styleChoice ?? {}),
          styles: Array.isArray(incomingSite.styleChoice?.styles)
            ? incomingSite.styleChoice.styles.map((style, index) => ({
                ...(seed.site.styleChoice.styles.find((item) => item.id === style.id) ?? seed.site.styleChoice.styles[index] ?? seed.site.styleChoice.styles[0]),
                ...style,
                images: Array.isArray(style.images) ? style.images : [],
                active: style.active ?? true,
                order: Number.isFinite(style.order) ? style.order : (index + 1) * 10,
              }))
            : seed.site.styleChoice.styles,
        },
        popups: {
          ...seed.site.popups,
          ...(incomingSite.popups ?? {}),
          services: {
            ...seed.site.popups.services,
            ...(incomingSite.popups?.services ?? {}),
          },
        },
      };
  const hasLegacyReviewPlacements = Array.isArray(value.reviews) && value.reviews.some((review) => typeof review.showOnHome !== "boolean" || typeof review.showOnReviewsPage !== "boolean");
  const reviews = Array.isArray(value.reviews)
    ? value.reviews.map((review, index) => ({
        ...seed.reviews.find((seedReview) => seedReview.id === review.id),
        ...review,
        showOnHome: review.showOnHome ?? true,
        showOnReviewsPage: review.showOnReviewsPage ?? true,
        order: Number.isFinite(review.order) ? review.order : (index + 1) * 10,
      }))
    : seed.reviews;
  if (hasLegacyReviewPlacements) {
    const migratedIds = new Set(reviews.map((review) => review.id));
    reviews.push(...seed.reviews.filter((review) => !migratedIds.has(review.id)));
  }

  return {
    version: 1,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : seed.updatedAt,
    reviews,
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
  return content.site.portfolioProjects
    .filter((project) => project.published && project.caseStudy?.status === "published")
    .map((project) => ({ ...(project.caseStudy as CaseStudy), title: project.title }))
    .sort((a, b) => a.index.localeCompare(b.index, "ru"));
}

export async function getPublishedReviews() {
  const content = await readContent();
  return content.reviews.filter((item) => item.status === "published" || item.status === "demo").sort((a, b) => a.order - b.order);
}

export async function getPublishedCase(slug: string) {
  return (await getPublishedCases()).find((item) => item.slug === slug);
}
