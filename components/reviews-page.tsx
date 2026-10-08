import type { VerifiedReview } from "@/lib/reviews";
import type { SiteSettings } from "@/lib/site-settings";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ReviewCard } from "@/components/review-card";
import { ReviewForm } from "@/components/review-form";
import styles from "./reviews-page.module.css";

export function ReviewsPageView({ reviews, site }: { reviews: VerifiedReview[]; site: SiteSettings }) {
  return <div className={`figma-reviews-page site-mobile-layout ${styles.page}`} id="top">
    <section className={styles.intro}>
      <div className={styles.heading}><Breadcrumbs current="Отзывы" /><h1>Отзывы тех,<br className={styles.desktopBreak} /> с кем мы работали</h1></div>
      <div className={styles.cta}><span><small>Работали вместе?</small><strong>Поделитесь впечатлениями о сотрудничестве</strong></span><ReviewForm title={site.popups.reviewFormTitle} description={site.popups.reviewFormDescription} /></div>
    </section>
    <section className={styles.grid} aria-label="Отзывы клиентов">{reviews.map((review, index) => <ReviewCard review={review} priority={index === 0} key={review.id} />)}</section>
  </div>;
}
