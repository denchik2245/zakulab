import { CmsImage as Image } from "@/components/cms-image";
import type { VerifiedReview } from "@/lib/reviews";
import { externalUrl } from "@/lib/external-url";
import { typographic } from "@/lib/typographic";
import { TgIcon, WebIcon, ArrowIcon } from "@/components/review-icons";
import styles from "./review-card.module.css";

type ReviewCardProps = {
  review: VerifiedReview;
  variant?: "catalog" | "slider";
  fallbackImage?: string;
  priority?: boolean;
  mobileCopy?: { role?: string; profileLabel?: string; projectLabel?: string };
};

function ResponsiveCopy({ desktop, mobile = desktop }: { desktop: string; mobile?: string }) {
  return <><span className={styles.desktopCopy}>{typographic(desktop)}</span><span className={styles.mobileCopy}>{typographic(mobile)}</span></>;
}

export function ReviewCard({ review, variant = "catalog", fallbackImage = "/assets/figma/rectangle25.png", priority = false, mobileCopy }: ReviewCardProps) {
  const isSlider = variant === "slider";
  const profileLabel = review.profile.label.replace(/^@/, "");
  const projectLabel = review.project.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const quote = `«${review.text.replace(/\.$/, "")}»${review.text.endsWith(".") ? "." : ""}`;

  return (
    <article className={`${styles.card} ${styles[variant]}`}>
      <div className={styles.photo}>
        <Image className={review.id === "figma-ivan" ? styles.trainImage : undefined} src={review.image || fallbackImage} alt="" fill sizes={isSlider ? "(max-width: 960px) calc(100vw - 40px), 960px" : "(max-width: 960px) calc(100vw - 40px), 50vw"} quality={90} priority={priority} />
      </div>
      {!isSlider && <span className={styles.category}>{review.project.name || review.author.company || "Совместный проект"}</span>}
      {review.status === "demo" && <small className={styles.demoBadge}>Демонстрационный отзыв</small>}
      <div className={styles.body}>
        <div className={styles.author}>
          <strong>{typographic(review.author.name)}</strong>
          <span><ResponsiveCopy desktop={review.author.role || review.author.company} mobile={mobileCopy?.role ?? (review.author.role || review.author.company)} /></span>
        </div>
        <blockquote>{typographic(quote)}</blockquote>
        {(review.profile.url.trim() || review.project.url.trim()) && <div className={styles.links}>
          {review.profile.url.trim() && <a href={review.profile.url} target="_blank" rel="noreferrer">
            <TgIcon className={styles.linkIcon} />
            <span><small>Профиль</small><strong><ResponsiveCopy desktop={isSlider ? review.profile.label : profileLabel} mobile={mobileCopy?.profileLabel ?? profileLabel} /></strong></span>
            <ArrowIcon className={styles.linkArrow} />
          </a>}
          {review.project.url.trim() && <a href={externalUrl(review.project.url)} target="_blank" rel="noreferrer">
            <WebIcon className={styles.linkIcon} />
            <span><small>{typographic("Ссылка на проект")}</small><strong><ResponsiveCopy desktop={isSlider ? review.project.url : projectLabel} mobile={mobileCopy?.projectLabel ?? projectLabel} /></strong></span>
            <ArrowIcon className={styles.linkArrow} />
          </a>}
        </div>}
      </div>
    </article>
  );
}
