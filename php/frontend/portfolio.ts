import type { PortfolioProject } from "@/lib/content-schema";

type PublicProject = Omit<PortfolioProject, "caseStudy">;

// Keep the server-rendered introduction, texture and project images in place.
// Filtering only needs to move existing rows; replacing the whole page made
// the browser paint its largest element again after React loaded.
export function enhancePortfolio(projects: PublicProject[]) {
  const root = document.getElementById("portfolio-view");
  const page = root?.querySelector<HTMLElement>(".figma-portfolio-page");
  const filters = root?.querySelector<HTMLElement>('[aria-label="Фильтр проектов"]');
  const list = document.getElementById("archive-projects");
  const all = root?.querySelector<HTMLAnchorElement>('a[href="#archive-projects"]');
  if (!page || !filters || !list || !page.dataset.expandedClass) return;
  const expandedClass = page.dataset.expandedClass;
  const activeClass = filters.querySelector('[aria-pressed="true"]')?.className || "";
  const buttons = Array.from(filters.querySelectorAll<HTMLButtonElement>("button"));
  const rows = Array.from(list.children) as HTMLElement[];
  const archive = new Map(projects.map(project => [project.id, project]));
  const featuredCount = projects.filter(project => project.published && project.portfolioPlacement === "featured").slice(0, 6).length;
  const ids = ["all", "tilda", "landing", "multipage", "commerce", "interface"];
  all?.setAttribute("role", "button");
  all?.setAttribute("aria-expanded", "false");
  all?.setAttribute("aria-controls", "featured-projects archive-projects");

  buttons.forEach((button, index) => button.addEventListener("click", () => {
    const filter = ids[index];
    const visible = rows.filter(row => {
      const project = archive.get(row.dataset.projectId || "");
      return project && (filter === "all" || (filter === "tilda" ? project.platform.toLowerCase() === "tilda" : project.filters.includes(filter as PublicProject["filters"][number])));
    });
    list.replaceChildren(...visible);
    buttons.forEach(candidate => {
      const selected = candidate === button;
      candidate.className = selected ? activeClass : "";
      candidate.setAttribute("aria-pressed", String(selected));
      const icon = candidate.querySelector("img");
      if (icon) icon.src = selected ? "/assets/figma/tilda-filter-active.svg" : "/assets/figma/property1-tilda.svg";
    });
    page.classList.remove(expandedClass);
    if (all) {
      all.style.display = featuredCount > 4 || visible.length > 5 ? "" : "none";
      all.setAttribute("aria-expanded", "false");
    }
    const headerHeight = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
    window.scrollTo({ top: Math.max(0, window.scrollY + filters.getBoundingClientRect().top - headerHeight - 20), behavior: "instant" });
  }));
  all?.addEventListener("click", event => {
    event.preventDefault();
    page.classList.add(expandedClass);
    all.setAttribute("aria-expanded", "true");
    all.style.display = "none";
  });
  all?.addEventListener("keydown", event => {
    if (event.key === " ") { event.preventDefault(); all.click(); }
  });
}
