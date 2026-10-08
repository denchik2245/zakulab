import type { PortfolioProject, SiteSettings } from "@/lib/site-settings";
import { hasCasePlaceholders } from "@/lib/cases";

export type PublicProject = Omit<PortfolioProject, "caseStudy">;
export type ServicesContent = Pick<SiteSettings, "servicesTitle" | "servicesText" | "services" | "smallTasksTitle" | "smallTasks" | "telegramUrl" | "maxUrl" | "vkUrl" | "popups">;
export type PortfolioContent = ServicesContent & { portfolioProjects: PublicProject[] };

export function publicProject(project: PortfolioProject): PublicProject {
  let url = project.url;
  if (project.caseStudy?.status === "published" && !hasCasePlaceholders(project.caseStudy)) url = `/cases/${project.caseStudy.slug}`;
  else if (url.startsWith("/cases/")) url = project.caseStudy?.url || "";
  if (url === "#") url = "";
  return { id: project.id, title: project.title, description: project.description, image: project.image, url,
    platform: project.platform, tags: project.tags, filters: project.filters, homePlacement: project.homePlacement,
    portfolioPlacement: project.portfolioPlacement, published: project.published, order: project.order };
}

export function publicPortfolio(site: SiteSettings): PortfolioContent {
  return {
    portfolioProjects: site.portfolioProjects.filter((project) => project.published && project.portfolioPlacement !== "hidden").map(publicProject),
    servicesTitle: site.servicesTitle, servicesText: site.servicesText, services: site.services,
    smallTasksTitle: site.smallTasksTitle, smallTasks: site.smallTasks,
    telegramUrl: site.telegramUrl, maxUrl: site.maxUrl, vkUrl: site.vkUrl, popups: site.popups,
  };
}
