import Image from "next/image";
import type { VerifiedReview } from "@/lib/reviews";
import type { SiteSettings } from "@/lib/site-settings";
import { externalUrl } from "@/lib/external-url";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { TgIcon, WebIcon, ArrowIcon } from "@/components/review-icons";
import styles from "./reviews-page.module.css";

function ReviewCard({ review }: { review: VerifiedReview }) {
  return <article className={styles.card}>
    <Image className={`${styles.cardImage}${review.id === "figma-ivan" ? ` ${styles.trainImage}` : ""}`} src={review.image || "/assets/figma/rectangle25.png"} alt="" fill sizes="(max-width: 700px) 100vw, 50vw" />
    <div className={styles.shade} aria-hidden="true" />
    <span className={styles.category}>{review.project.name || review.author.company || "Совместный проект"}</span>
    <div className={styles.cardPanel}>
      <div className={styles.author}><strong>{review.author.name}</strong><span>{review.author.role}</span></div>
      <blockquote>«{review.text}»</blockquote>
      <div className={styles.links}>
        <a href={review.profile.url} target="_blank" rel="noreferrer">
          <TgIcon className={styles.linkIcon} />
          <span><small>Профиль</small><strong>{review.profile.label.replace(/^@/, "")}</strong></span>
          <ArrowIcon className={styles.linkArrow} />
        </a>
        <a href={externalUrl(review.project.url)} target="_blank" rel="noreferrer">
          <WebIcon className={styles.linkIcon} />
          <span><small>Ссылка на проект</small><strong>{review.project.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</strong></span>
          <ArrowIcon className={styles.linkArrow} />
        </a>
      </div>
    </div>
  </article>;
}

export function ReviewsPageView({ reviews, site }: { reviews: VerifiedReview[]; site: SiteSettings }) {
  return <div className={`figma-reviews-page ${styles.page}`} id="top">
    <section className={styles.intro}>
      <div className={styles.heading}><Breadcrumbs current="Отзывы" /><h1>Отзывы тех,<br />с кем мы работали</h1></div>
      <div className={styles.cta}><span><small>Работали вместе?</small><strong>Поделитесь впечатлениями о сотрудничестве</strong></span><a href={`mailto:${site.email}?subject=${encodeURIComponent("Отзыв о сотрудничестве")}`}>Оставить отзыв</a></div>
    </section>
    <section className={styles.grid} aria-label="Отзывы клиентов">{reviews.map((review) => <ReviewCard review={review} key={review.id} />)}</section>
  </div>;
}
