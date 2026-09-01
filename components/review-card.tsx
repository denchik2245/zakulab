import type { VerifiedReview } from "@/lib/reviews";
import { externalUrl } from "@/lib/external-url";

export function ReviewCard({ review, index }: { review: VerifiedReview; index: number }) {
  const isDemo = review.status === "demo";
  const formattedDate = new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  }).format(new Date(review.publishedAt));

  return (
    <article className="verified-review-card">
      <div className="review-card-index">
        <span>{String(index + 1).padStart(2, "0")} / {isDemo ? "DEMO" : "VERIFIED"}</span>
        <span>{formattedDate}</span>
      </div>
      <blockquote>«{review.text}»</blockquote>
      <div className="review-author-row">
        <div className="review-avatar" aria-hidden="true">{review.author.initials}</div>
        <div className="review-author-copy">
          <strong>{review.author.name}</strong>
          <span>{review.author.role} · {review.author.company}</span>
        </div>
        <span className={`review-verified-mark${isDemo ? " is-demo" : ""}`}><i>{isDemo ? "D" : "✓"}</i> {isDemo ? "Демонстрационный отзыв" : "Проект и профиль проверены"}</span>
      </div>
      <div className="review-proof-links">
        <a href={externalUrl(review.project.url)} target="_blank" rel="noreferrer">
          <span>{isDemo ? "Пример ссылки на проект" : "Реализованный проект"}</span>
          <strong>{review.project.url} ↗</strong>
        </a>
        <a href={review.profile.url} target="_blank" rel="noreferrer">
          <span>{isDemo ? "Пример профиля" : "Публичный профиль"} · {review.profile.network}</span>
          <strong>{review.profile.label} ↗</strong>
        </a>
        {review.project.caseUrl && (
          <a href={review.project.caseUrl}>
            <span>Разбор работы</span>
            <strong>Открыть кейс →</strong>
          </a>
        )}
      </div>
    </article>
  );
}
