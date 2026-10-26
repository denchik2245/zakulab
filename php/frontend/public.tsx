import { createRoot } from "react-dom/client";
import { Header } from "@/components/header";
import { enhancePortfolio } from "./portfolio";
import { ReviewsSlider } from "@/components/reviews-slider";
import { ReviewForm } from "@/components/review-form";
import { ServiceOrderButton } from "@/components/service-order-button";
import { StyleQuiz } from "@/components/style-quiz";
import { ProjectCalculator } from "@/components/project-calculator";
import type { SiteSettings, VerifiedReview } from "@/lib/content-schema";

const boot = JSON.parse(document.getElementById("site-data")?.textContent || "{}");
const browserWindow = window as Window & { zakulabImages?: Record<string, { src: string; srcset: string }> };
browserWindow.zakulabImages = { ...browserWindow.zakulabImages, ...boot.images };
const site: SiteSettings = boot.site;
function mount(id: string, node: React.ReactNode) {
  const root = document.getElementById(id);
  if (root) createRoot(root).render(node);
}
if (site) {
  const links = { telegramUrl: site.telegramUrl, maxUrl: site.maxUrl, vkUrl: site.vkUrl };
  mount("site-header", <Header {...links} />);
  // PHP already resolves published case URLs and removes editor data. Keep these destinations intact.
  if (boot.page === "projects") enhancePortfolio(site.portfolioProjects.filter(project => project.portfolioPlacement !== "hidden"));
  if (boot.page === "home") mount("reviews-slider", <ReviewsSlider reviews={boot.reviews as VerifiedReview[]} title={site.reviewsTitle} text={site.reviewsText} fallbackImage={site.reviewImage} />);
  if (boot.page === "reviews") mount("review-form", <ReviewForm title={site.popups.reviewFormTitle} description={site.popups.reviewFormDescription} />);
  if (boot.page === "style-check") mount("style-quiz", <StyleQuiz settings={site.styleChoice} popups={site.popups} socialLinks={links} />);
  if (boot.page === "calculator") mount("project-calculator", <ProjectCalculator socialLinks={links} />);
  document.querySelectorAll<HTMLElement>("[data-service-id]").forEach((element) => {
    const item = [...site.services, ...site.smallTasks].find(item => item.id === element.dataset.serviceId);
    if (item) createRoot(element).render(<ServiceOrderButton serviceTitle={item.title} {...links} popupTitlePrefix={site.popups.serviceTitlePrefix} popupTitle={site.popups.services[item.id]?.title} popupDescription={site.popups.services[item.id]?.description || site.popups.serviceDescription} />);
  });
}
try {
  const brief = localStorage.getItem("zakulab-style-brief") || "";
  document.querySelectorAll<HTMLInputElement>('input[name="visual-profile"]').forEach(input => { input.value = brief; });
} catch { /* Forms also work when browser storage is disabled. */ }
