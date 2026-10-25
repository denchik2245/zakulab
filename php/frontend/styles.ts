// A single, deterministic class map is shared by PHP templates and browser components.
import header from "@/components/site-header.module.css";
import footer from "@/php/styles/footer.module.css";
import home from "@/components/home-page.module.css";
import portfolio from "@/php/styles/portfolio-page.module.css";
import project from "@/php/styles/portfolio-project.module.css";
import reviews from "@/php/styles/reviews-page.module.css";
import review from "@/components/review-card.module.css";
import services from "@/php/styles/services-section.module.css";
import social from "@/components/social-links.module.css";
import breadcrumbs from "@/php/styles/breadcrumbs.module.css";
import style from "@/components/style-check.module.css";
import legal from "@/php/styles/legal-document.module.css";
import casePage from "@/php/styles/case-page.module.css";
import popup from "@/components/service-order-button.module.css";

export const styles = { header, footer, home, portfolio, project, reviews, review, services, social, breadcrumbs, style, legal, case: casePage, popup };
