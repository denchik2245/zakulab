// A single, deterministic class map is shared by PHP templates and browser components.
import header from "@/components/site-header.module.css";
import footer from "@/components/footer.module.css";
import home from "@/components/home-page.module.css";
import portfolio from "@/components/portfolio-page.module.css";
import project from "@/components/portfolio-project.module.css";
import reviews from "@/components/reviews-page.module.css";
import review from "@/components/review-card.module.css";
import services from "@/components/services-section.module.css";
import social from "@/components/social-links.module.css";
import breadcrumbs from "@/components/breadcrumbs.module.css";
import style from "@/components/style-check.module.css";
import legal from "@/components/legal-document.module.css";
import casePage from "@/app/(main)/cases/[slug]/case-page.module.css";
import popup from "@/components/service-order-button.module.css";

export const styles = { header, footer, home, portfolio, project, reviews, review, services, social, breadcrumbs, style, legal, case: casePage, popup };
