import Link from "next/link";
import styles from "./breadcrumbs.module.css";

type BreadcrumbsProps = {
  current: string;
  homeHref?: string;
  homeLabel?: string;
};

export function Breadcrumbs({ current, homeHref = "/", homeLabel = "Главная" }: BreadcrumbsProps) {
  return (
    <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
      <Link href={homeHref}>{homeLabel}</Link>
      <span className={styles.separator} aria-hidden="true">›</span>
      <span className={styles.current} aria-current="page">{current}</span>
    </nav>
  );
}
