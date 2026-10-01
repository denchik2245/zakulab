"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { externalUrl } from "@/lib/external-url";
import { typographic } from "@/lib/typographic";
import type { VerifiedReview } from "@/lib/reviews";
import styles from "./home-page.module.css";

import { TgIcon, WebIcon, ArrowIcon } from "./review-icons";

function SliderArrow({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg className={direction === "previous" ? styles.reviewControlArrowPrevious : undefined} viewBox="0 0 48 48" aria-hidden="true">
      <path d="M17.3332 24H30.6666M25.6666 19L30.6666 24L25.6666 29" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type ReviewsSliderProps = {
  reviews: VerifiedReview[];
  title: string;
  text: string;
  fallbackImage: string;
};

export function ReviewsSlider({ reviews, title, text, fallbackImage }: ReviewsSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeReview = reviews[activeIndex];
  const total = reviews.length;

  const showPrevious = () => setActiveIndex((index) => Math.max(0, index - 1));
  const showNext = () => setActiveIndex((index) => Math.min(total - 1, index + 1));

  return (
    <section className={styles.reviews} id="reviews" aria-labelledby="reviews-title">
      <div className={styles.reviewsTexture} aria-hidden="true" />
      <div className={styles.reviewsCopy}>
        <div className={styles.sectionTitle}>
          <span className={styles.reviewsEyebrowDesktop}>{`{ОТЗЫВЫ}`}</span>
          <span className={styles.reviewsEyebrowMobile}>{`{Отзывы}`}</span>
          <h2 id="reviews-title">{typographic(title)}</h2>
        </div>
        <p>{typographic(text)}</p>
        <div className={styles.reviewControls}>
          <strong aria-live="polite">
            <span className={styles.desktopText}>{total ? activeIndex + 1 : 0}/{total}</span>
            <span className={styles.mobileText}>{total ? activeIndex + 1 : 0}/8</span>
          </strong>
          <span>
            <button type="button" onClick={showPrevious} disabled={activeIndex === 0} aria-label="Предыдущий отзыв">
              <SliderArrow direction="previous" />
            </button>
            <button type="button" onClick={showNext} disabled={!total || activeIndex === total - 1} aria-label="Следующий отзыв">
              <SliderArrow direction="next" />
            </button>
          </span>
        </div>
        <Link className={styles.reviewButton} href="/reviews"><span>Все отзывы</span><small><span className={styles.desktopText}>{`{${total}}`}</span><span className={styles.mobileText}>{`{8}`}</span></small></Link>
      </div>

      <div className={styles.reviewCard} aria-live="polite">
        {activeReview ? (
          <div className={styles.reviewSlide} key={activeReview.id}>
            <div className={styles.reviewPhoto}>
              <Image src={activeReview.image || fallbackImage} alt="" fill sizes="960px" quality={90} priority={activeIndex === 0} />
            </div>
            <div className={styles.reviewBody}>
              <div className={styles.reviewAuthor}>
                <strong>{typographic(activeReview.author.name)}</strong>
                <span>
                  <span className={styles.desktopText}>{typographic(activeReview.author.role || activeReview.author.company)}</span>
                  <span className={styles.mobileText}>{typographic(activeIndex === 0 ? "Руководитель маркетинга" : activeReview.author.role || activeReview.author.company)}</span>
                </span>
              </div>
              <blockquote>
                <span className={styles.desktopText}>«{typographic(activeReview.text)}»</span>
                <span className={styles.mobileText}>
                  {activeIndex === 0 ? <>«{typographic(activeReview.text.replace(/\.$/, ""))}».</> : <>«{typographic(activeReview.text)}»</>}
                </span>
              </blockquote>
              <div className={styles.reviewLinks}>
                <a href={activeReview.profile.url} target="_blank" rel="noreferrer">
                  <TgIcon className={styles.reviewLinkIcon} />
                  <span>Профиль<strong><span className={styles.desktopText}>{activeReview.profile.label}</span><span className={styles.mobileText}>{activeIndex === 0 ? "alexey_demo" : activeReview.profile.label}</span></strong></span>
                  <ArrowIcon className={styles.reviewLinkArrow} />
                </a>
                <a href={externalUrl(activeReview.project.url)} target="_blank" rel="noreferrer">
                  <WebIcon className={styles.reviewLinkIcon} />
                  <span>{typographic("Ссылка на проект")}<strong><span className={styles.desktopText}>{activeReview.project.url}</span><span className={styles.mobileText}>{activeIndex === 0 ? "kuzin-partners.ru" : activeReview.project.url}</span></strong></span>
                  <ArrowIcon className={styles.reviewLinkArrow} />
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.reviewBody}><blockquote>{typographic("Отзывы временно недоступны.")}</blockquote></div>
        )}
      </div>
    </section>
  );
}
