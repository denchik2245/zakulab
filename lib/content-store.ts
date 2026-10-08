import "server-only";

import { readJSON, compareAndSetJSON } from "@/lib/atomic-store";
import { readReviewQueue, pendingReviewLifetime } from "@/lib/review-queue";
import { cases as seedCases, createLegacyCaseBlocks, hasCasePlaceholders, type CaseBlock, type CaseStudy } from "@/lib/cases";
import { verifiedReviews as seedReviews, type VerifiedReview } from "@/lib/reviews";
import { defaultSiteSettings, type SiteSettings } from "@/lib/site-settings";
import { normalizeContentUrl } from "@/lib/external-url";

export type AdminContent = {
  version: 1;
  updatedAt: string;
  reviews: VerifiedReview[];
  site: SiteSettings;
  revision?: string;
  reviewSnapshotIds?: string[];
  dismissedSubmissions?: string[];
};

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
    updatedAt: "2026-01-01T00:00:00.000Z",
    reviews: structuredClone(seedReviews),
    site,
  };
}

function normalizeCaseStudy(caseStudy: CaseStudy, previewImage = ""): CaseStudy {
  const blocks = Array.isArray(caseStudy.blocks)
    ? caseStudy.blocks.filter((block): block is CaseBlock => Boolean(block && typeof block.id === "string" && typeof block.type === "string"))
    : createLegacyCaseBlocks(caseStudy, previewImage);

  const normalized: CaseStudy = {
    ...caseStudy,
    url: normalizeContentUrl(caseStudy.url),
    whatDone: caseStudy.whatDone?.trim() || caseStudy.summary,
    blocks,
  };
  // Unfinished source copy must not become a public case page.
  return hasCasePlaceholders(normalized) ? { ...normalized, status: "draft" } : normalized;
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
        url: normalizeContentUrl(project.url),
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
        project: { ...review.project, url: normalizeContentUrl(review.project.url) },
        profile: { ...review.profile, url: normalizeContentUrl(review.profile.url) },
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
    dismissedSubmissions: value.dismissedSubmissions ?? [],
  };
}

export async function readContent(includeSubmissions = false): Promise<AdminContent> {
  const stored = await readJSON<Partial<AdminContent>>(blobKey);
  const content = stored ? mergeWithDefaults(stored.data) : seedContent();
  content.reviews = content.reviews.filter((review) => review.status !== "pending" || Date.parse(review.submittedAt) > Date.now() - pendingReviewLifetime);
  content.revision = stored?.etag ?? "initial";
  content.reviewSnapshotIds = [];
  if (includeSubmissions) {
    const submissions = (await readReviewQueue()).filter((entry) => entry && !content.dismissedSubmissions?.includes(entry.data.id));
    content.reviewSnapshotIds = submissions.map((entry) => entry!.data.id);
    const known = new Set(content.reviews.map((review) => review.id));
    content.reviews.unshift(...submissions.map((entry) => entry!.data).filter((review) => !known.has(review.id)));
  }
  return content;
}

export class ContentConflictError extends Error {}

export async function writeContent(value: AdminContent): Promise<AdminContent> {
  const stored = await readJSON<Partial<AdminContent>>(blobKey);
  if (value.revision !== (stored?.etag ?? "initial")) throw new ContentConflictError("Документ уже изменён. Обновите данные и повторите правки.");
  const content = mergeWithDefaults({ ...value, updatedAt: new Date().toISOString() });
  const queue = await readReviewQueue();
  const queuedIds = new Set(queue.flatMap((entry) => entry ? [entry.data.id] : []));
  const retainedIds = new Set(content.reviews.map((review) => review.id));
  content.dismissedSubmissions = [...new Set([
    ...(stored?.data.dismissedSubmissions ?? []),
    ...(value.reviewSnapshotIds ?? []).filter((id) => !retainedIds.has(id)),
  ])].filter((id) => queuedIds.has(id));
  if (!await compareAndSetJSON(blobKey, content, stored?.etag ?? null)) throw new ContentConflictError("Документ уже изменён. Обновите данные и повторите правки.");
  return readContent(true);
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
