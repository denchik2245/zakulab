"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ServicesSection } from "@/components/services-section";
import { AllProjectsButton, ProjectCard, ProjectRow } from "@/components/portfolio-project";
import type { PortfolioFilter } from "@/lib/site-settings";
import type { PortfolioContent } from "@/lib/public-content";
import styles from "./portfolio-page.module.css";

const filters = [{ id: "all", label: "Все" }, { id: "tilda", label: "Tilda" }, { id: "landing", label: "Одностраничные" }, { id: "multipage", label: "Многостраничные" }, { id: "commerce", label: "Интернет-магазины" }, { id: "interface", label: "Интерфейсы" }] as const;
type Filter = (typeof filters)[number]["id"];

export function PortfolioPage({ site }: { site: PortfolioContent }) {
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [showAll, setShowAll] = useState(false);
  const projects = useMemo(() => site.portfolioProjects.filter((project) => project.published).sort((a, b) => a.order - b.order), [site.portfolioProjects]);
  const featuredProjects = projects.filter((project) => project.portfolioPlacement === "featured").slice(0, 6);
  const homeFeaturedProjects = featuredProjects.filter((project) => project.homePlacement === "featured");
  const mobileFeaturedIds = new Set((homeFeaturedProjects.length ? homeFeaturedProjects : featuredProjects).slice(0, 4).map((project) => project.id));
  const archiveProjects = projects.filter((project) => project.portfolioPlacement === "archive");
  const visibleProjects = activeFilter === "all" ? archiveProjects : archiveProjects.filter((project) => activeFilter === "tilda" ? project.platform.toLowerCase() === "tilda" : project.filters.includes(activeFilter as PortfolioFilter));

  return <div className={`figma-portfolio-page site-mobile-layout ${styles.page} ${showAll ? styles.expanded : ""}`} id="top">
    <section className={styles.intro}>
      <div className={styles.heading}><Breadcrumbs current="Портфолио" /><h1>Сайты и интерфейсы,<br className={styles.desktopBreak} /> которые я спроектировал</h1></div>
      <div className={styles.updated}><span><small>Последнее обновление</small><strong>28 августа 2026</strong></span><Image className={styles.desktopUpdateIcon} src="/assets/figma/portfolio-update.svg" width={28} height={28} alt="" /><Image className={styles.mobileUpdateIcon} src="/assets/figma/portfolio-update-mobile.svg" width={24} height={24} alt="" /></div>
    </section>

    <section className={styles.work} aria-labelledby="featured-title">
      <div className={styles.workTextureTop} aria-hidden="true" /><div className={styles.workTextureBottom} aria-hidden="true" />
      <div className={styles.workInner}>
        <div className={styles.sectionTitle}><span>{`{Лучшее}`}</span><h2 id="featured-title">Избранные проекты</h2></div>
        <div className={styles.featuredGrid} id="featured-projects">{featuredProjects.map((project, index) => <ProjectCard className={`${styles.featuredCard} ${mobileFeaturedIds.has(project.id) ? "" : styles.extraCard}`} project={project} priority={index < 3} key={project.id} />)}</div>

        <h2 className={styles.otherTitle} id="other">Другие проекты</h2>
        <div className={styles.filters} role="group" aria-label="Фильтр проектов">{filters.map((filter) => <button type="button" key={filter.id} className={activeFilter === filter.id ? styles.activeFilter : ""} aria-pressed={activeFilter === filter.id} onClick={() => { setActiveFilter(filter.id); setShowAll(false); }}>{filter.id === "tilda" && <Image src="/assets/figma/property1-tilda.svg" width={28} height={28} alt="" />}{filter.label}</button>)}</div>
        <div className={styles.projectList} id="archive-projects" aria-live="polite">{visibleProjects.map((project) => <ProjectRow className={styles.projectRow} project={project} key={project.id} />)}</div>
        {!showAll && (featuredProjects.length > 4 || visibleProjects.length > 5) && <AllProjectsButton className={styles.allProjects} count={projects.length} onClick={() => setShowAll(true)} expanded={showAll} controls="featured-projects archive-projects" />}
      </div>
    </section>

    <ServicesSection site={site} />
  </div>;
}
