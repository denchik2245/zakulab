"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { PortfolioFilter, SiteSettings } from "@/lib/site-settings";
import styles from "./portfolio-page.module.css";

const navigation = [["Портфолио", "/projects"], ["Этапы", "/#process"], ["Отзывы", "/reviews"], ["Услуги и стоимость", "/#price"]] as const;
const filters = [{ id: "all", label: "Все" }, { id: "tilda", label: "Tilda" }, { id: "landing", label: "Одностраничные" }, { id: "multipage", label: "Многостраничные" }, { id: "commerce", label: "Интернет-магазины" }, { id: "interface", label: "Интерфейсы" }] as const;
type Filter = (typeof filters)[number]["id"];

function Arrow({ light = false }: { light?: boolean }) {
  return <span className={styles.arrow}><Image src={light ? "/assets/figma/arrow.svg" : "/assets/figma/arrow1.svg"} alt="" fill sizes="20px" /></span>;
}
function Platform({ name }: { name: string }) {
  const platform = name.trim().toLowerCase();
  if (platform === "tilda") return <Image src="/assets/figma/property1-tilda.svg" width={36} height={36} alt="Tilda" />;
  if (platform === "wordpress") return <Image src="/assets/figma/property1-wordpress.svg" width={32} height={32} alt="WordPress" />;
  return <span className={styles.platformPlaceholder} aria-hidden="true" />;
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

export function PortfolioPage({ site }: { site: SiteSettings }) {
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const projects = useMemo(() => site.portfolioProjects.filter((project) => project.published).sort((a, b) => a.order - b.order), [site.portfolioProjects]);
  const featuredProjects = projects.filter((project) => project.portfolioPlacement === "featured").slice(0, 6);
  const archiveProjects = projects.filter((project) => project.portfolioPlacement === "archive");
  const visibleProjects = activeFilter === "all" ? archiveProjects : archiveProjects.filter((project) => activeFilter === "tilda" ? project.platform.toLowerCase() === "tilda" : project.filters.includes(activeFilter as PortfolioFilter));

  return <div className={`figma-portfolio-page ${styles.page}`} id="top">
    <section className={styles.intro}>
      <div className={styles.heading}><div className={styles.breadcrumbs}><Link href="/">Главная</Link><span aria-hidden="true">›</span><span>Портфолио</span></div><h1>Сайты и интерфейсы,<br />которые я спроектировал</h1></div>
      <div className={styles.updated}><span><small>Последнее обновление</small><strong>28 августа 2026</strong></span><Image src="/assets/figma/portfolio-update.svg" width={28} height={28} alt="" /></div>
    </section>

    <section className={styles.work} aria-labelledby="featured-title">
      <div className={styles.workTextureTop} aria-hidden="true" /><div className={styles.workTextureBottom} aria-hidden="true" />
      <div className={styles.workInner}>
        <div className={styles.sectionTitle}><span>{`{Лучшее}`}</span><h2 id="featured-title">Избранные проекты</h2></div>
        <div className={styles.featuredGrid}>{featuredProjects.map((project, index) => <a className={styles.featuredCard} href={project.url || "#"} target={project.url.startsWith("http") ? "_blank" : undefined} rel={project.url.startsWith("http") ? "noreferrer" : undefined} key={project.id}><Image src={project.image} alt={`Превью проекта ${project.title}`} fill sizes="(max-width: 700px) 100vw, 33vw" priority={index < 3} /><span className={styles.cardShade} aria-hidden="true" /><span className={styles.cardTitle}>{project.title}</span><div className={styles.cardTags}>{project.tags.filter(Boolean).map((tag) => <span key={tag}>{tag}</span>)}</div><span className={styles.cardArrow}><Arrow /></span></a>)}</div>

        <h2 className={styles.otherTitle} id="other">Другие проекты</h2>
        <div className={styles.filters} aria-label="Фильтр проектов">{filters.map((filter) => <button type="button" key={filter.id} className={activeFilter === filter.id ? styles.activeFilter : ""} aria-pressed={activeFilter === filter.id} onClick={() => setActiveFilter(filter.id)}>{filter.id === "tilda" && <Image src="/assets/figma/property1-tilda.svg" width={28} height={28} alt="" />}{filter.label}</button>)}</div>
        <div className={styles.projectList} aria-live="polite">{visibleProjects.map((project, index) => <a className={styles.projectRow} href={project.url || "#"} target={project.url.startsWith("http") ? "_blank" : undefined} rel={project.url.startsWith("http") ? "noreferrer" : undefined} key={`${project.id}-${index}`}><span className={styles.projectName}>{project.title}<Arrow light /></span><span className={styles.projectDescription}>{project.description}</span><span className={styles.projectPlatform}><Platform name={project.platform} /></span></a>)}</div>
      </div>
    </section>

    <section className={styles.price} id="price">
      <div className={styles.priceIntro}><div className={styles.sectionTitle}><span>{`{Стоимость}`}</span><h2>{site.servicesTitle}</h2></div><p>{site.servicesText}</p></div>
      <div className={styles.services}>{site.services.map((service) => <article key={service.id}><div className={styles.serviceCopy}><h3>{service.title}<Arrow /></h3><p>{service.text}</p></div><div className={styles.serviceTerms}><span>{service.time}</span><strong>{service.price}</strong><strong>{service.priceSecondary}</strong></div></article>)}</div>
      <div className={styles.smallTasks}><h2>{site.smallTasksTitle}</h2><div className={styles.taskGrid}>{site.smallTasks.map((task) => <article key={task.id}><div className={styles.taskHead}><h3>{task.title}<Arrow /></h3><p>{task.text}</p></div><div className={styles.deliverable}><h4>Что вы получите</h4><p>{task.deliverable}</p></div><div className={styles.taskTerms}><span>{task.time}</span><strong>{task.price}</strong></div></article>)}</div></div>
    </section>
    <Footer site={site} />
  </div>;
}
