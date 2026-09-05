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
          <span>{`{ОТЗЫВЫ}`}</span>
          <h2 id="reviews-title">{typographic(title)}</h2>
        </div>
        <p>{typographic(text)}</p>
        <div className={styles.reviewControls}>
          <strong aria-live="polite">{total ? activeIndex + 1 : 0}/{total}</strong>
          <span>
            <button type="button" onClick={showPrevious} disabled={activeIndex === 0} aria-label="Предыдущий отзыв">
              <SliderArrow direction="previous" />
            </button>
            <button type="button" onClick={showNext} disabled={!total || activeIndex === total - 1} aria-label="Следующий отзыв">
              <SliderArrow direction="next" />
            </button>
          </span>
        </div>
        <Link className={styles.reviewButton} href="/reviews"><span>Все отзывы</span><small>{`{${total}}`}</small></Link>
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
                <span>{typographic(activeReview.author.role || activeReview.author.company)}</span>
              </div>
              <blockquote>«{typographic(activeReview.text)}»</blockquote>
              <div className={styles.reviewLinks}>
                <a href={activeReview.profile.url} target="_blank" rel="noreferrer">
                  <TgIcon className={styles.reviewLinkIcon} />
                  <span>Профиль<strong>{activeReview.profile.label}</strong></span>
                  <ArrowIcon className={styles.reviewLinkArrow} />
                </a>
                <a href={externalUrl(activeReview.project.url)} target="_blank" rel="noreferrer">
                  <WebIcon className={styles.reviewLinkIcon} />
                  <span>{typographic("Ссылка на проект")}<strong>{activeReview.project.url}</strong></span>
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
