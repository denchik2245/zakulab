import Image from "next/image";
import Link from "next/link";
import type { VerifiedReview } from "@/lib/reviews";
import type { SiteSettings } from "@/lib/site-settings";
import { externalUrl } from "@/lib/external-url";
import { Breadcrumbs } from "@/components/breadcrumbs";
import styles from "./reviews-page.module.css";

const navigation = [
  ["Портфолио", "/#portfolio"],
  ["Этапы", "/#process"],
  ["Отзывы", "/reviews"],
  ["Услуги и стоимость", "/#price"],
] as const;

function Arrow() { return <span className={styles.arrow}><Image src="/assets/figma/arrow-review.svg" alt="" fill sizes="20px" /></span>; }

function ReviewCard({ review }: { review: VerifiedReview }) {
  return <article className={styles.card}>
    <Image className={`${styles.cardImage}${review.id === "figma-ivan" ? ` ${styles.trainImage}` : ""}`} src={review.image || "/assets/figma/rectangle25.png"} alt="" fill sizes="(max-width: 700px) 100vw, 50vw" />
    <div className={styles.shade} aria-hidden="true" />
    <span className={styles.category}>{review.project.name || review.author.company || "Совместный проект"}</span>
    <div className={styles.cardPanel}>
      <div className={styles.author}><strong>{review.author.name}</strong><span>{review.author.role}</span></div>
      <blockquote>«{review.text}»</blockquote>
      <div className={styles.links}>
        <a href={review.profile.url} target="_blank" rel="noreferrer"><Image src="/assets/figma/tg.svg" width={36} height={36} alt="" /><span><small>Профиль</small><strong>{review.profile.label.replace(/^@/, "")}</strong></span><Arrow /></a>
        <a href={externalUrl(review.project.url)} target="_blank" rel="noreferrer"><Image src="/assets/figma/image34-vectorized.svg" width={36} height={36} alt="" /><span><small>Ссылка на проект</small><strong>{review.project.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</strong></span><Arrow /></a>
      </div>
    </div>
  </article>;
}

function Footer({ site }: { site: SiteSettings }) {
  return <footer className={styles.footer} id="contact">
    <div className={styles.footerTexture} aria-hidden="true" />
    <div className={styles.footerTop}><h2>{site.contactTitle}</h2><a className={styles.discuss} href={site.telegramUrl} target="_blank" rel="noreferrer"><span>{site.contactButton}</span><small>{`{TG}`}</small></a><a className={styles.toTop} href="#top" aria-label="Наверх"><Image src="/assets/figma/group.svg" width={20} height={10} alt="" /></a></div>
    <div className={styles.footerColumns}><div><span>Навигация</span>{navigation.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}</div><div><span>Связаться</span><a href={site.telegramUrl}>Telegram</a><a href={site.vkUrl}>VK</a><a href={site.maxUrl}>MAX</a><a href={`mailto:${site.email}`}>{site.email}</a></div><div><span>Мои фриланс биржи</span><a href={site.kworkUrl}>Kwork</a><a href={site.flUrl}>FL</a></div></div>
    <div className={styles.legal}><Link href="/privacy">Политика обработки ПД</Link><Link href="/privacy">Согласие на обработку ПД</Link></div>
    <Image className={styles.footerMark} src="/assets/figma/logo1.svg" width={500} height={500} alt="" />
  </footer>;
}

export function ReviewsPageView({ reviews, site }: { reviews: VerifiedReview[]; site: SiteSettings }) {
  return <div className={`figma-reviews-page ${styles.page}`} id="top">
    <section className={styles.intro}>
      <div className={styles.heading}><Breadcrumbs current="Отзывы" /><h1>Отзывы тех,<br />с кем мы работали</h1></div>
      <div className={styles.cta}><span><small>Работали вместе?</small><strong>Поделитесь впечатлениями о сотрудничестве</strong></span><a href={`mailto:${site.email}?subject=${encodeURIComponent("Отзыв о сотрудничестве")}`}>Оставить отзыв</a></div>
    </section>
    <section className={styles.grid} aria-label="Отзывы клиентов">{reviews.map((review) => <ReviewCard review={review} key={review.id} />)}</section>
    <Footer site={site} />
  </div>;
}
