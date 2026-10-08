import { CmsImage as Image } from "@/components/cms-image";
import Link from "next/link";
import type { PublicProject as PortfolioProject } from "@/lib/public-content";
import { typographic } from "@/lib/typographic";
import styles from "./portfolio-project.module.css";

function ProjectArrow() {
  return <span className={styles.arrow} aria-hidden="true"><Image src="/assets/figma/arrow.svg" width={20} height={20} alt="" /></span>;
}

export function ProjectCard({ project, className = "", mobileCopy, priority = false, sizes = "(max-width: 960px) calc(100vw - 40px), 33vw" }: {
  project: PortfolioProject;
  className?: string;
  mobileCopy?: { label: string; tags: string[] };
  priority?: boolean;
  sizes?: string;
}) {
  const tags = project.tags.filter(Boolean);
  const Tag = project.url && project.url !== "#" ? "a" : "div";
  return (
    <Tag className={`${styles.card} ${className}`} href={Tag === "a" ? project.url : undefined} target={project.url.startsWith("http") ? "_blank" : undefined} rel={project.url.startsWith("http") ? "noreferrer" : undefined}>
      <Image src={project.image} alt={`Превью проекта ${project.title}`} fill sizes={sizes} quality={90} priority={priority} />
      <span className={styles.shade} aria-hidden="true" />
      <span className={styles.label}>
        <span className={styles.desktopCopy}>{typographic(project.title || "Проект")}</span>
        <span className={styles.mobileCopy}>{typographic(mobileCopy?.label ?? project.title)}</span>
      </span>
      <span className={styles.tags}>
        {tags.map((tag, index) => <small className={styles.desktopCopy} key={`${tag}-${index}`}>{typographic(tag)}</small>)}
        {(mobileCopy?.tags ?? tags).map((tag, index) => <small className={styles.mobileCopy} key={`mobile-${tag}-${index}`}>{typographic(tag)}</small>)}
      </span>
      <span className={styles.cardArrow}><ProjectArrow /></span>
    </Tag>
  );
}

export function ProjectRow({ project, className = "", mobileDescription }: { project: PortfolioProject; className?: string; mobileDescription?: string }) {
  const platform = project.platform.trim().toLowerCase();
  const isWordPress = ["wordpress", "word press", "wp"].includes(platform);
  const Tag = project.url && project.url !== "#" ? "a" : "div";
  return (
    <Tag className={`${styles.row} ${className}`} href={Tag === "a" ? project.url : undefined} target={project.url.startsWith("http") ? "_blank" : undefined} rel={project.url.startsWith("http") ? "noreferrer" : undefined}>
      <strong className={styles.name}>{typographic(project.title)}<ProjectArrow /></strong>
      <span className={styles.description}>
        <span className={styles.desktopCopy}>{typographic(project.description)}</span>
        <span className={styles.mobileCopy}>{typographic(mobileDescription ?? project.description)}</span>
      </span>
      <span className={styles.platform}>
        {(isWordPress || platform === "tilda") && <Image src={isWordPress ? "/assets/figma/property1-wordpress.svg" : "/assets/figma/property1-tilda.svg"} width={isWordPress ? 32 : 36} height={isWordPress ? 32 : 36} alt={`Логотип ${isWordPress ? "WordPress" : "Tilda"}`} />}
      </span>
    </Tag>
  );
}

export function AllProjectsButton({ count, className = "", href, onClick, expanded, controls }: { count: number; className?: string; href?: string; onClick?: () => void; expanded?: boolean; controls?: string }) {
  const content = <><span>Все проекты</span><small>{`{${count}}`}</small></>;
  const classes = `${styles.allProjects} ${className}`;
  return href ? <Link className={classes} href={href}>{content}</Link> : <button type="button" className={classes} onClick={onClick} aria-expanded={expanded} aria-controls={controls}>{content}</button>;
}
