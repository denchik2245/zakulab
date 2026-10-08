"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { AdminContent } from "@/lib/content-store";
import type { CaseBlock, CaseStudy } from "@/lib/cases";
import type { VerifiedReview } from "@/lib/reviews";
import type { PortfolioFilter, PortfolioProject, SiteSettings } from "@/lib/site-settings";
import type { StyleReference } from "@/lib/style-references";

type Tab = "site" | "portfolio" | "reviews" | "styles" | "popups";

const portfolioFilterOptions: { id: PortfolioFilter; label: string }[] = [
  { id: "landing", label: "Одностраничный" },
  { id: "multipage", label: "Многостраничный" },
  { id: "commerce", label: "Интернет-магазин" },
  { id: "interface", label: "Интерфейс" },
];

function blankPortfolioProject(count: number): PortfolioProject {
  return { id: `portfolio-${Date.now()}`, title: "Новая работа", description: "Короткое описание проекта", image: "", url: "", platform: "", tags: ["", ""], filters: [], homePlacement: "hidden", portfolioPlacement: "archive", published: false, order: (count + 1) * 10 };
}

function blankCaseBlock(type: CaseBlock["type"]): CaseBlock {
  const id = `case-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  if (type === "image") return { id, type, image: "", alt: "", caption: "", spacing: "large" };
  if (type === "gallery") return { id, type, images: [{ id: `${id}-1`, image: "", alt: "" }, { id: `${id}-2`, image: "", alt: "" }], spacing: "large" };
  if (type === "callout") return { id, type, text: "Ключевой результат проекта", spacing: "large" };
  return { id, type, title: "Название раздела", body: "Текст раздела", listStyle: "none", items: [], spacing: "large" };
}

function blankCase(count: number, title = "Новый проект"): CaseStudy {
  const now = new Date().toISOString();
  return {
    slug: `new-project-${count + 1}`,
    index: String(count + 1).padStart(2, "0"),
    title,
    eyebrow: "Сфера · формат сайта",
    summary: "Короткое описание проекта для каталога.",
    whatDone: "Коротко опишите, что было сделано и какой результат получил проект.",
    role: "Структура, UX/UI-дизайн",
    year: String(new Date().getFullYear()),
    url: "",
    accent: "green",
    category: "corporate",
    catalogTask: "Какую задачу бизнеса решал проект.",
    status: "draft",
    featured: false,
    createdAt: now,
    updatedAt: now,
    blocks: [blankCaseBlock("image"), blankCaseBlock("text")],
    verified: ["Что сделано в проекте", "Второй подтверждённый факт", "Третий подтверждённый факт"],
    draft: {
      challenge: "Опишите исходную задачу клиента.",
      approach: "Опишите логику и подход к решению.",
      decisions: [
        { title: "Решение 01", text: "Почему оно было принято." },
        { title: "Решение 02", text: "Почему оно было принято." },
        { title: "Решение 03", text: "Почему оно было принято." },
      ],
      result: "Опишите подтверждённый результат без неподтверждённых метрик.",
    },
  };
}

function blankReview(): VerifiedReview {
  const now = new Date().toISOString();
  return {
    id: `review-${Date.now()}`,
    status: "pending",
    submittedAt: now,
    publishedAt: "",
    showOnHome: false,
    showOnReviewsPage: false,
    order: Date.now(),
    text: "",
    image: "",
    author: { name: "Новый отзыв", initials: "", role: "", company: "" },
    project: { name: "", url: "", caseUrl: "" },
    profile: { network: "Telegram", label: "", url: "" },
  };
}

function blankStyle(count: number): StyleReference {
  return {
    id: `style-${Date.now()}`,
    number: String(count + 1).padStart(2, "0"),
    title: "Новый стиль",
    category: "",
    description: "Опишите настроение, композицию и характер этого направления.",
    traits: [],
    preview: "editorial",
    axes: { space: 0, energy: 0, expression: 0, emotion: 0 },
    images: [],
    active: true,
    order: (count + 1) * 10,
  };
}

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value)).replace(" г.", "");
}

export function AdminStudio({ authenticated, initialContent }: { authenticated: boolean; initialContent: AdminContent | null }) {
  const [isAuthenticated, setIsAuthenticated] = useState(authenticated);
  const [content, setContent] = useState(initialContent);
  const [tab, setTab] = useState<Tab>("site");
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedPopup, setSelectedPopup] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [loginError, setLoginError] = useState("");
  const [hasConflict, setHasConflict] = useState(false);

  const pendingReviews = content?.reviews.filter((item) => item.status === "pending").length ?? 0;
  const activeReview = content?.reviews.find((item) => item.id === selectedReview) ?? content?.reviews[1] ?? content?.reviews[0] ?? null;
  const activePortfolio = content?.site.portfolioProjects.find((item) => item.id === selectedPortfolio) ?? content?.site.portfolioProjects[0] ?? null;
  const activeStyle = content?.site.styleChoice.styles.find((item) => item.id === selectedStyle) ?? content?.site.styleChoice.styles[0] ?? null;
  const popupItems = content ? [
    ...content.site.services.map((service) => ({
      id: `service:${service.id}`,
      storageId: service.id,
      kind: "service" as const,
      fallbackTitle: `${content.site.popups.serviceTitlePrefix} ${service.title.toLocaleLowerCase("ru-RU")}`,
      title: content.site.popups.services[service.id]?.title || `${content.site.popups.serviceTitlePrefix} ${service.title.toLocaleLowerCase("ru-RU")}`,
      description: content.site.popups.services[service.id]?.description || content.site.popups.serviceDescription,
    })),
    ...content.site.smallTasks.map((task) => ({
      id: `task:${task.id}`,
      storageId: task.id,
      kind: "service" as const,
      fallbackTitle: `${content.site.popups.serviceTitlePrefix} ${task.title.toLocaleLowerCase("ru-RU")}`,
      title: content.site.popups.services[task.id]?.title || `${content.site.popups.serviceTitlePrefix} ${task.title.toLocaleLowerCase("ru-RU")}`,
      description: content.site.popups.services[task.id]?.description || content.site.popups.serviceDescription,
    })),
    {
      id: "review-form",
      storageId: "review-form",
      kind: "review-form" as const,
      fallbackTitle: content.site.popups.reviewFormTitle,
      title: content.site.popups.reviewFormTitle,
      description: content.site.popups.reviewFormDescription,
    },
    {
      id: "style-result",
      storageId: "style-result",
      kind: "style-result" as const,
      fallbackTitle: content.site.popups.styleResultTitle,
      title: content.site.popups.styleResultTitle,
      description: content.site.popups.styleResultDescription,
    },
  ] : [];
  const activePopup = popupItems.find((item) => item.id === selectedPopup) ?? popupItems[0] ?? null;

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (!response.ok) {
      const result = await response.json().catch(() => ({ error: "Не удалось войти" })) as { error?: string };
      setLoginError(result.error ?? "Не удалось войти");
      return;
    }
    const contentResponse = await fetch("/api/admin/content");
    setContent(await contentResponse.json());
    setIsAuthenticated(true);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAuthenticated(false);
    setContent(null);
  }

  async function persist(next: AdminContent, message: string) {
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const result = await response.json();
      if (response.status === 409) setHasConflict(true);
      if (!response.ok) throw new Error([result.error, ...(result.details ?? [])].filter(Boolean).join(". ") || "Не удалось сохранить");
      setContent(result);
      setHasConflict(false);
      setNotice(message);
      window.setTimeout(() => setNotice(""), 3200);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Не удалось сохранить. Проверьте соединение и настройки хранилища.");
    } finally {
      setSaving(false);
    }
  }

  function patchCaseStudy(projectId: string, patch: Partial<CaseStudy>) {
    const project = content?.site.portfolioProjects.find((item) => item.id === projectId);
    if (!project?.caseStudy) return;
    patchPortfolio(projectId, { caseStudy: { ...project.caseStudy, ...patch } });
  }

  function patchCaseBlocks(projectId: string, blocks: CaseBlock[]) {
    patchCaseStudy(projectId, { blocks });
  }

  function patchCaseBlock(projectId: string, blockId: string, patch: Partial<CaseBlock>) {
    const caseStudy = content?.site.portfolioProjects.find((item) => item.id === projectId)?.caseStudy;
    if (!caseStudy) return;
    patchCaseBlocks(projectId, (caseStudy.blocks ?? []).map((block) => block.id === blockId ? { ...block, ...patch } as CaseBlock : block));
  }

  function addCaseBlock(projectId: string, type: CaseBlock["type"]) {
    const caseStudy = content?.site.portfolioProjects.find((item) => item.id === projectId)?.caseStudy;
    if (!caseStudy) return;
    patchCaseBlocks(projectId, [...(caseStudy.blocks ?? []), blankCaseBlock(type)]);
  }

  function removeCaseBlock(projectId: string, blockId: string) {
    const caseStudy = content?.site.portfolioProjects.find((item) => item.id === projectId)?.caseStudy;
    if (!caseStudy) return;
    patchCaseBlocks(projectId, (caseStudy.blocks ?? []).filter((block) => block.id !== blockId));
  }

  function moveCaseBlock(projectId: string, blockId: string, direction: -1 | 1) {
    const caseStudy = content?.site.portfolioProjects.find((item) => item.id === projectId)?.caseStudy;
    if (!caseStudy) return;
    const blocks = [...(caseStudy.blocks ?? [])];
    const index = blocks.findIndex((block) => block.id === blockId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= blocks.length) return;
    [blocks[index], blocks[nextIndex]] = [blocks[nextIndex], blocks[index]];
    patchCaseBlocks(projectId, blocks);
  }

  function addCaseBlockItem(projectId: string, blockId: string) {
    const caseStudy = content?.site.portfolioProjects.find((item) => item.id === projectId)?.caseStudy;
    const block = caseStudy?.blocks?.find((item) => item.id === blockId);
    if (!block || block.type !== "text") return;
    patchCaseBlock(projectId, blockId, { items: [...block.items, { id: `${blockId}-item-${Date.now()}`, label: "", text: "Новый пункт" }] });
  }

  function patchCaseBlockItem(projectId: string, blockId: string, itemId: string, patch: { label?: string; text?: string }) {
    const caseStudy = content?.site.portfolioProjects.find((item) => item.id === projectId)?.caseStudy;
    const block = caseStudy?.blocks?.find((item) => item.id === blockId);
    if (!block || block.type !== "text") return;
    patchCaseBlock(projectId, blockId, { items: block.items.map((item) => item.id === itemId ? { ...item, ...patch } : item) });
  }

  function removeCaseBlockItem(projectId: string, blockId: string, itemId: string) {
    const caseStudy = content?.site.portfolioProjects.find((item) => item.id === projectId)?.caseStudy;
    const block = caseStudy?.blocks?.find((item) => item.id === blockId);
    if (!block || block.type !== "text") return;
    patchCaseBlock(projectId, blockId, { items: block.items.filter((item) => item.id !== itemId) });
  }

  function patchCaseGalleryImage(projectId: string, blockId: string, imageId: string, patch: { image?: string; alt?: string }) {
    const caseStudy = content?.site.portfolioProjects.find((item) => item.id === projectId)?.caseStudy;
    const block = caseStudy?.blocks?.find((item) => item.id === blockId);
    if (!block || block.type !== "gallery") return;
    patchCaseBlock(projectId, blockId, { images: block.images.map((image) => image.id === imageId ? { ...image, ...patch } : image) });
  }

  function addCaseGalleryImage(projectId: string, blockId: string) {
    const caseStudy = content?.site.portfolioProjects.find((item) => item.id === projectId)?.caseStudy;
    const block = caseStudy?.blocks?.find((item) => item.id === blockId);
    if (!block || block.type !== "gallery") return;
    patchCaseBlock(projectId, blockId, { images: [...block.images, { id: `${blockId}-image-${Date.now()}`, image: "", alt: "" }] });
  }

  function removeCaseGalleryImage(projectId: string, blockId: string, imageId: string) {
    const caseStudy = content?.site.portfolioProjects.find((item) => item.id === projectId)?.caseStudy;
    const block = caseStudy?.blocks?.find((item) => item.id === blockId);
    if (!block || block.type !== "gallery") return;
    patchCaseBlock(projectId, blockId, { images: block.images.filter((image) => image.id !== imageId) });
  }

  function toggleCaseStudy(projectId: string, enabled: boolean) {
    const project = content?.site.portfolioProjects.find((item) => item.id === projectId);
    if (!project) return;
    if (!enabled) {
      if (!window.confirm("Отключить и удалить содержимое внутренней страницы кейса?")) return;
      patchPortfolio(projectId, { caseStudy: undefined, url: project.url.startsWith("/cases/") ? project.caseStudy?.url || "" : project.url });
      return;
    }
    const caseStudy = blankCase(content?.site.portfolioProjects.filter((item) => item.caseStudy).length ?? 0, project.title);
    caseStudy.slug = project.id;
    patchPortfolio(projectId, { caseStudy });
  }

  async function setReviewStatus(id: string, status: VerifiedReview["status"]) {
    if (!content) return;
    const next = {
      ...content,
      reviews: content.reviews.map((item) => item.id === id ? { ...item, status, publishedAt: status === "published" ? new Date().toISOString().slice(0, 10) : item.publishedAt } : item),
    };
    await persist(next, status === "published" ? "Отзыв опубликован" : status === "rejected" ? "Отзыв отклонён" : "Статус отзыва обновлён");
  }

  function patchReview(id: string, patch: Partial<VerifiedReview>) {
    if (!content) return;
    setContent({ ...content, reviews: content.reviews.map((item) => item.id === id ? { ...item, ...patch } : item) });
  }

  function createReview() {
    if (!content) return;
    const item = blankReview();
    setContent({ ...content, reviews: [item, ...content.reviews] });
    setSelectedReview(item.id);
    setTab("reviews");
  }

  async function saveReview() {
    if (!content || !activeReview) return;
    await persist(content, "Изменения отзыва сохранены");
  }

  async function deleteReview(id: string) {
    if (!content || !window.confirm("Удалить отзыв без возможности восстановления?")) return;
    setSelectedReview(null);
    await persist({ ...content, reviews: content.reviews.filter((item) => item.id !== id) }, "Отзыв удалён");
  }

  function patchSite(patch: Partial<SiteSettings>) {
    if (!content) return;
    setContent({ ...content, site: { ...content.site, ...patch } });
  }

  function patchPortfolio(id: string, patch: Partial<PortfolioProject>) {
    if (!content) return;
    patchSite({ portfolioProjects: content.site.portfolioProjects.map((project) => project.id === id ? { ...project, ...patch } : project) });
  }

  function createPortfolioProject() {
    if (!content) return;
    const project = blankPortfolioProject(content.site.portfolioProjects.length);
    patchSite({ portfolioProjects: [...content.site.portfolioProjects, project] });
    setSelectedPortfolio(project.id);
    setTab("portfolio");
  }

  async function deletePortfolioProject(id: string) {
    if (!content || !window.confirm("Удалить работу из единой базы без возможности восстановления?")) return;
    setSelectedPortfolio(null);
    await persist({ ...content, site: { ...content.site, portfolioProjects: content.site.portfolioProjects.filter((project) => project.id !== id) } }, "Работа удалена");
  }

  function togglePortfolioFilter(id: string, filter: PortfolioFilter, checked: boolean) {
    const project = content?.site.portfolioProjects.find((item) => item.id === id);
    if (!project) return;
    patchPortfolio(id, { filters: checked ? [...new Set([...project.filters, filter])] : project.filters.filter((item) => item !== filter) });
  }

  function patchMediaArray(key: "heroGallery", index: number, value: string) {
    if (!content) return;
    const values = [...content.site[key]];
    values[index] = value;
    patchSite({ [key]: values });
  }

  function patchStyle(id: string, patch: Partial<StyleReference>) {
    if (!content) return;
    patchSite({ styleChoice: { ...content.site.styleChoice, styles: content.site.styleChoice.styles.map((item) => item.id === id ? { ...item, ...patch } : item) } });
  }

  function createStyle() {
    if (!content) return;
    const style = blankStyle(content.site.styleChoice.styles.length);
    patchSite({ styleChoice: { ...content.site.styleChoice, styles: [...content.site.styleChoice.styles, style] } });
    setSelectedStyle(style.id);
    setTab("styles");
  }

  function deleteStyle(id: string) {
    if (!content || !window.confirm("Удалить стиль и все загруженные для него примеры?")) return;
    setSelectedStyle(null);
    patchSite({ styleChoice: { ...content.site.styleChoice, styles: content.site.styleChoice.styles.filter((item) => item.id !== id) } });
  }

  function patchPopup(id: string, patch: { title?: string; description?: string }) {
    if (!content) return;
    const item = popupItems.find((popup) => popup.id === id);
    if (!item) return;
    if (item.kind === "review-form") {
      patchSite({
        popups: {
          ...content.site.popups,
          reviewFormTitle: patch.title ?? content.site.popups.reviewFormTitle,
          reviewFormDescription: patch.description ?? content.site.popups.reviewFormDescription,
        },
      });
      return;
    }
    if (item.kind === "style-result") {
      patchSite({
        popups: {
          ...content.site.popups,
          styleResultTitle: patch.title ?? content.site.popups.styleResultTitle,
          styleResultDescription: patch.description ?? content.site.popups.styleResultDescription,
        },
      });
      return;
    }
    const current = content.site.popups.services[item.storageId] ?? {
      title: item.fallbackTitle,
      description: content.site.popups.serviceDescription,
    };
    patchSite({
      popups: {
        ...content.site.popups,
        services: {
          ...content.site.popups.services,
          [item.storageId]: { ...current, ...patch },
        },
      },
    });
  }

  if (!isAuthenticated || !content) {
    return (
      <section className="admin-login shell">
        <div className="admin-login-code"><Image src="/assets/figma/logo.svg" width={48} height={48} alt="" /><span>ZAKULAB / ADMIN</span></div>
        <form onSubmit={login}>
          <span>PRIVATE / ACCESS</span>
          <h1>Вход<br /><em>в студию</em></h1>
          <p>Кейсы, отзывы и основные тексты сайта находятся в закрытой панели.</p>
          <label><span>Пароль администратора</span><input type="password" name="password" required autoFocus autoComplete="current-password" /></label>
          {loginError && <div className="admin-form-error">{loginError}</div>}
          <button className="button" type="submit">Войти <span>↗</span></button>
        </form>
      </section>
    );
  }

  return (
    <section className={`admin-studio ${tab === "site" ? "is-site-tab" : tab === "reviews" ? "is-reviews-tab" : ""}`}>
      <aside className="admin-sidebar admin-unified-sidebar">
        <nav aria-label="Разделы админки">
          {([
            ["site", "Главная страница", "01"],
            ["portfolio", "Портфолио", String(content.site.portfolioProjects.length).padStart(2, "0")],
            ["reviews", "Отзывы", String(pendingReviews).padStart(2, "0")],
            ["styles", "Выбор стиля", String(content.site.styleChoice.styles.length).padStart(2, "0")],
            ["popups", "Поп-ап окна", String(popupItems.length).padStart(2, "0")],
          ] as const).map(([id, label, count]) => (
            <button className={tab === id ? "is-active" : ""} onClick={() => setTab(id)} key={id}><span>{label}</span><i>{count}</i></button>
          ))}
        </nav>
        <div className="admin-sidebar-foot admin-site-actions">
          <button type="button" onClick={logout}>Выйти</button>
          {hasConflict && <button type="button" onClick={async () => {
            if (!window.confirm("Загрузить актуальную версию? Несохранённые правки будут сброшены.")) return;
            const response = await fetch("/api/admin/content", { cache: "no-store" });
            if (response.ok) { setContent(await response.json()); setHasConflict(false); setNotice("Загружена актуальная версия"); }
          }}>Загрузить актуальную версию</button>}
          <Link href="/" target="_blank">Открыть сайт <Image src="/assets/figma/admin-asset-3.svg" width={14} height={14} alt="" /></Link>
          <button className="admin-sidebar-save" disabled={saving} onClick={() => persist(content, "Изменения сохранены")}>{saving ? "Сохраняю…" : "Сохранить изменения"}</button>
          {notice && <span role="status">{notice}</span>}
        </div>
      </aside>

      <main className="admin-main">
        {tab === "styles" && (
          <div className="admin-view admin-style-view">
            <div className="admin-portfolio-heading"><h1>Выбор стиля</h1><button className="admin-add-button" type="button" onClick={createStyle}>Новый стиль</button></div>
            <div className="admin-style-layout">
              <div className="admin-style-list">
                {[...content.site.styleChoice.styles].sort((a, b) => a.order - b.order).map((item) => (
                  <button className={activeStyle?.id === item.id ? "is-active" : ""} type="button" onClick={() => setSelectedStyle(item.id)} key={item.id}>
                    <span><strong>{item.title}</strong><small>{item.images.length} {item.images.length === 1 ? "пример" : "примеров"}</small></span>
                  </button>
                ))}
              </div>
              {activeStyle ? (
                <div className="admin-style-editor">
                  <div className="admin-portfolio-editor-head"><h2>{activeStyle.title}</h2><button type="button" aria-label="Удалить стиль" onClick={() => deleteStyle(activeStyle.id)}><Image src="/assets/figma/portfolio-admin-7.svg" width={28} height={28} alt="" /></button></div>
                  <div className="admin-style-visible"><label><input type="checkbox" checked={activeStyle.active} onChange={(event) => patchStyle(activeStyle.id, { active: event.target.checked })} /><span>Показывать в тесте</span></label></div>
                  <div className="admin-style-order"><Field label="Порядок"><input type="number" value={activeStyle.order} onChange={(event) => patchStyle(activeStyle.id, { order: Number(event.target.value) })} /></Field></div>
                  <div className="admin-style-fields">
                    <Field label="Название стиля"><input value={activeStyle.title} onChange={(event) => patchStyle(activeStyle.id, { title: event.target.value })} /></Field>
                    <Field label="Описание стиля"><textarea rows={4} value={activeStyle.description} onChange={(event) => patchStyle(activeStyle.id, { description: event.target.value })} /></Field>
                  </div>
                  <section className="admin-style-gallery-section">
                    <h3>Примеры стиля</h3>
                    <div className="admin-style-gallery">
                      {activeStyle.images.map((image, imageIndex) => (
                        <GalleryMediaField key={imageIndex} className="is-style-image" isSlider label={`Пример ${imageIndex + 1}`} value={image} emptyLabel="Загрузить пример" onChange={(value) => patchStyle(activeStyle.id, { images: activeStyle.images.map((item, index) => index === imageIndex ? value : item) })} onDelete={() => patchStyle(activeStyle.id, { images: activeStyle.images.filter((_, index) => index !== imageIndex) })} />
                      ))}
                      <GalleryMediaField className="is-style-image is-style-add" label="Добавить изображение" value="" emptyLabel="" onChange={(value) => patchStyle(activeStyle.id, { images: [...activeStyle.images, value] })} />
                    </div>
                  </section>
                </div>
              ) : <div className="admin-empty-panel"><p>Добавьте первый стиль.</p></div>}
            </div>
          </div>
        )}

        {tab === "popups" && (
          <div className="admin-view admin-popup-view">
            <div className="admin-portfolio-heading"><h1>Поп-ап окна</h1></div>
            <div className="admin-popup-layout">
              <div className="admin-popup-list">
                {popupItems.map((item) => <button className={activePopup?.id === item.id ? "is-active" : ""} type="button" onClick={() => setSelectedPopup(item.id)} key={item.id}>{item.title}</button>)}
              </div>
              {activePopup ? (
                <div className="admin-popup-editor">
                  <div className="admin-popup-editor-head"><h2>{activePopup.title}</h2></div>
                  <div className="admin-popup-fields">
                    <Field label="Название"><input value={activePopup.title} onChange={(event) => patchPopup(activePopup.id, { title: event.target.value })} /></Field>
                    <Field label="Описание"><textarea rows={4} value={activePopup.description} onChange={(event) => patchPopup(activePopup.id, { description: event.target.value })} /></Field>
                  </div>
                </div>
              ) : <div className="admin-empty-panel"><p>На сайте пока нет поп-ап окон.</p></div>}
            </div>
          </div>
        )}

        {tab === "portfolio" && (
          <div className="admin-view admin-portfolio-view">
            <div className="admin-portfolio-heading"><h1>Портфолио</h1><button className="admin-add-button" onClick={createPortfolioProject}>Новая работа</button></div>
            <div className="admin-portfolio-layout">
              <div className="admin-portfolio-list">
                {[...content.site.portfolioProjects].sort((a, b) => a.order - b.order).map((item) => (
                  <button className={activePortfolio?.id === item.id ? "is-active" : ""} onClick={() => setSelectedPortfolio(item.id)} key={item.id}>
                    <span><strong>{item.title}</strong><small>{item.description}</small></span>
                    {item.portfolioPlacement === "featured" && <Image src="/assets/figma/portfolio-admin-3.svg" width={24} height={24} alt="Избранная работа" />}
                  </button>
                ))}
              </div>
              {activePortfolio ? (
                <div className="admin-portfolio-editor">
                  <div className="admin-portfolio-editor-head"><h2>{activePortfolio.title}</h2><button aria-label="Удалить работу" onClick={() => deletePortfolioProject(activePortfolio.id)}><Image src="/assets/figma/portfolio-admin-7.svg" width={28} height={28} alt="" /></button></div>
                  <div className="admin-case-toggle"><h3>Страница кейса</h3><label><input type="checkbox" checked={Boolean(activePortfolio.caseStudy)} onChange={(event) => toggleCaseStudy(activePortfolio.id, event.target.checked)} /><span>{activePortfolio.caseStudy ? "Подключена" : "Не подключена"}</span></label></div>
                  <section className="admin-placement-section">
                    <h3>Размещение на главной</h3>
                    <PortfolioRadioGroup name={`home-${activePortfolio.id}`} value={activePortfolio.homePlacement} onChange={(value) => patchPortfolio(activePortfolio.id, { homePlacement: value as PortfolioProject["homePlacement"] })} options={[["featured", "Избранное"], ["list", "Другие"], ["hidden", "Не показывать"]]} />
                    <Field label="Порядок"><input type="number" value={activePortfolio.order} onChange={(event) => patchPortfolio(activePortfolio.id, { order: Number(event.target.value) })} /></Field>
                  </section>
                  <section className="admin-placement-section">
                    <h3>Размещение в портфолио</h3>
                    <fieldset><legend>Фильтры проектов</legend>{portfolioFilterOptions.map((filter) => <label key={filter.id}><input type="checkbox" checked={activePortfolio.filters.includes(filter.id)} onChange={(event) => togglePortfolioFilter(activePortfolio.id, filter.id, event.target.checked)} />{filter.label}</label>)}</fieldset>
                    <PortfolioRadioGroup name={`portfolio-${activePortfolio.id}`} value={activePortfolio.portfolioPlacement} onChange={(value) => patchPortfolio(activePortfolio.id, { portfolioPlacement: value as PortfolioProject["portfolioPlacement"] })} options={[["featured", "Избранное"], ["archive", "Другие"], ["hidden", "Не показывать"]]} />
                    <Field label="Порядок"><input type="number" value={activePortfolio.order} onChange={(event) => patchPortfolio(activePortfolio.id, { order: Number(event.target.value) })} /></Field>
                  </section>
                  <div className="admin-portfolio-form">
                    <div className="admin-portfolio-main-fields"><Field label="Название"><input value={activePortfolio.title} onChange={(event) => patchPortfolio(activePortfolio.id, { title: event.target.value })} /></Field><Field label="Ссылка"><input value={activePortfolio.url} onChange={(event) => patchPortfolio(activePortfolio.id, { url: event.target.value })} /></Field></div>
                    <GalleryMediaField className="is-portfolio-preview" label="Превью проекта" value={activePortfolio.image} emptyLabel="Загрузить" iconSrc="/assets/figma/portfolio-admin-2.svg" onChange={(value) => patchPortfolio(activePortfolio.id, { image: value })} />
                    <Field label="Описание"><textarea rows={3} value={activePortfolio.description} onChange={(event) => patchPortfolio(activePortfolio.id, { description: event.target.value })} /></Field>
                    <Field label="Платформа"><select value={activePortfolio.platform} onChange={(event) => patchPortfolio(activePortfolio.id, { platform: event.target.value })}><option value="">Без логотипа</option><option value="Tilda">Tilda</option><option value="WordPress">WordPress</option></select></Field>
                    <div className="admin-two-columns"><Field label="Тег 1"><input value={activePortfolio.tags[0]} onChange={(event) => patchPortfolio(activePortfolio.id, { tags: [event.target.value, activePortfolio.tags[1]] })} /></Field><Field label="Тег 2"><input value={activePortfolio.tags[1]} onChange={(event) => patchPortfolio(activePortfolio.id, { tags: [activePortfolio.tags[0], event.target.value] })} /></Field></div>
                  </div>
                  {activePortfolio.caseStudy && <details className="admin-case-settings"><summary>Содержимое страницы кейса</summary><div>
                    <div className="admin-case-settings-head"><div><span>CASE / INNER PAGE</span><h3>Внутренняя страница кейса</h3><p>Контент кейса хранится внутри этой же работы — отдельной записи больше нет.</p></div><label><input type="checkbox" checked={Boolean(activePortfolio.caseStudy)} onChange={(event) => toggleCaseStudy(activePortfolio.id, event.target.checked)} /><span>{activePortfolio.caseStudy ? "Подключена" : "Не подключена"}</span></label></div>
                      <div className="admin-publish-row"><label><input type="checkbox" checked={activePortfolio.caseStudy.status === "published"} onChange={(event) => patchCaseStudy(activePortfolio.id, { status: event.target.checked ? "published" : "draft" })} /><span>Опубликовать внутреннюю страницу</span></label></div>
                      <div className="admin-fields">
                        <Field label="URL-адрес"><input value={activePortfolio.caseStudy.slug} onChange={(event) => { const slug = event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"); patchCaseStudy(activePortfolio.id, { slug }); }} /></Field>
                        <Field label="Номер"><input value={activePortfolio.caseStudy.index} onChange={(event) => patchCaseStudy(activePortfolio.id, { index: event.target.value })} /></Field>
                        <Field label="Год"><input value={activePortfolio.caseStudy.year} onChange={(event) => patchCaseStudy(activePortfolio.id, { year: event.target.value })} /></Field>
                        <Field label="Категория"><select value={activePortfolio.caseStudy.category} onChange={(event) => patchCaseStudy(activePortfolio.id, { category: event.target.value as CaseStudy["category"] })}><option value="corporate">Корпоративный</option><option value="commerce">E-commerce</option></select></Field>
                        <Field label="Цвет"><select value={activePortfolio.caseStudy.accent} onChange={(event) => patchCaseStudy(activePortfolio.id, { accent: event.target.value as CaseStudy["accent"] })}><option value="green">Зелёный</option><option value="orange">Оранжевый</option><option value="coral">Коралловый</option></select></Field>
                        <Field wide label="Подпись формата"><input value={activePortfolio.caseStudy.eyebrow} onChange={(event) => patchCaseStudy(activePortfolio.id, { eyebrow: event.target.value })} /></Field>
                        <Field wide label="Короткое описание кейса"><textarea rows={3} value={activePortfolio.caseStudy.summary} onChange={(event) => patchCaseStudy(activePortfolio.id, { summary: event.target.value })} /></Field>
                        <Field wide label="Что сделал — текст в закреплённой колонке"><textarea rows={4} value={activePortfolio.caseStudy.whatDone ?? activePortfolio.caseStudy.summary} onChange={(event) => patchCaseStudy(activePortfolio.id, { whatDone: event.target.value })} /></Field>
                        <Field wide label="Задача для каталога"><textarea rows={3} value={activePortfolio.caseStudy.catalogTask} onChange={(event) => patchCaseStudy(activePortfolio.id, { catalogTask: event.target.value })} /></Field>
                        <Field wide label="Моя роль"><input value={activePortfolio.caseStudy.role} onChange={(event) => patchCaseStudy(activePortfolio.id, { role: event.target.value })} /></Field>
                        <Field wide label="Ссылка на живой сайт"><input type="url" value={activePortfolio.caseStudy.url} onChange={(event) => patchCaseStudy(activePortfolio.id, { url: event.target.value })} /></Field>
                      </div>
                      <CaseBuilder
                        blocks={activePortfolio.caseStudy.blocks ?? []}
                        onAdd={(type) => addCaseBlock(activePortfolio.id, type)}
                        onPatch={(blockId, patch) => patchCaseBlock(activePortfolio.id, blockId, patch)}
                        onMove={(blockId, direction) => moveCaseBlock(activePortfolio.id, blockId, direction)}
                        onRemove={(blockId) => removeCaseBlock(activePortfolio.id, blockId)}
                        onAddItem={(blockId) => addCaseBlockItem(activePortfolio.id, blockId)}
                        onPatchItem={(blockId, itemId, patch) => patchCaseBlockItem(activePortfolio.id, blockId, itemId, patch)}
                        onRemoveItem={(blockId, itemId) => removeCaseBlockItem(activePortfolio.id, blockId, itemId)}
                        onPatchGalleryImage={(blockId, imageId, patch) => patchCaseGalleryImage(activePortfolio.id, blockId, imageId, patch)}
                        onAddGalleryImage={(blockId) => addCaseGalleryImage(activePortfolio.id, blockId)}
                        onRemoveGalleryImage={(blockId, imageId) => removeCaseGalleryImage(activePortfolio.id, blockId, imageId)}
                      />
                  </div></details>}
                </div>
              ) : <div className="admin-empty-panel"><p>Добавьте первую работу.</p></div>}
            </div>
          </div>
        )}

        {tab === "reviews" && (
          <div className="admin-view admin-reviews-view">
            <h1>Отзывы</h1><p>Новые отзывы поступают на проверку. Очередь ограничена 100 отзывами; необработанные отзывы хранятся 90 дней.</p><button type="button" className="admin-add-button" onClick={createReview}>Новый отзыв</button>
            <div className="admin-reviews-layout">
              <div className="admin-review-list">
                {[...content.reviews].sort((a, b) => a.order - b.order).map((item) => (
                  <button className={activeReview?.id === item.id ? "is-active" : ""} onClick={() => setSelectedReview(item.id)} key={item.id}>
                    <strong>{item.author.name}</strong>
                    <small><span>{item.author.company || item.author.role || "Без компании"}</span><i />{formatReviewDate(item.submittedAt)}</small>
                  </button>
                ))}
              </div>
              {activeReview ? (
                <div className="admin-review-editor">
                  <div className="admin-review-editor-head"><h2>{activeReview.author.name}</h2><button type="button" aria-label="Удалить отзыв" onClick={() => deleteReview(activeReview.id)}><Image src="/assets/figma/reviews-admin-trash.svg" width={28} height={28} alt="" /></button></div>
                  <div className="admin-review-moderation">
                    <button type="button" disabled={saving} onClick={saveReview}>Сохранить отзыв</button>
                    <Field label="Статус модерации"><select value={activeReview.status} disabled={saving} onChange={(event) => setReviewStatus(activeReview.id, event.target.value as VerifiedReview["status"])}><option value="pending">На проверке</option><option value="published">Опубликован</option><option value="rejected">Отклонён</option><option value="demo">Демонстрационный</option></select></Field>
                    <p>{activeReview.consent ? `Согласие получено ${formatReviewDate(activeReview.consent.acceptedAt)}` : "Перед публикацией получите согласие автора."}</p>
                  </div>
                  <div className="admin-publish-row"><label><input type="checkbox" checked={activeReview.showOnHome} onChange={(event) => patchReview(activeReview.id, { showOnHome: event.target.checked })} /><span>Показывать на главной</span></label><label><input type="checkbox" checked={activeReview.showOnReviewsPage} onChange={(event) => patchReview(activeReview.id, { showOnReviewsPage: event.target.checked })} /><span>Показывать на странице отзывов</span></label></div>
                  <section className="admin-review-order"><Field label="Порядок"><input type="number" value={activeReview.order} onChange={(event) => patchReview(activeReview.id, { order: Number(event.target.value) })} /></Field></section>
                  <div className="admin-review-form">
                    <Field label="Название проекта"><input value={activeReview.project.name} onChange={(e) => patchReview(activeReview.id, { project: { ...activeReview.project, name: e.target.value } })} /></Field>
                    <div className="admin-review-author-fields"><Field label="Имя"><input value={activeReview.author.name} onChange={(e) => patchReview(activeReview.id, { author: { ...activeReview.author, name: e.target.value } })} /></Field><Field label="Должность"><input value={activeReview.author.role} onChange={(e) => patchReview(activeReview.id, { author: { ...activeReview.author, role: e.target.value } })} /></Field></div>
                    <Field label="Текст отзыва"><textarea rows={6} value={activeReview.text} onChange={(e) => patchReview(activeReview.id, { text: e.target.value })} /></Field>
                    <div className="admin-review-profile-fields">
                    <Field label="Соц.сеть"><select value={activeReview.profile.network} onChange={(e) => patchReview(activeReview.id, { profile: { ...activeReview.profile, network: e.target.value as VerifiedReview["profile"]["network"] } })}><option>Telegram</option><option>MAX</option><option>VK</option><option>LinkedIn</option><option>Другая сеть</option></select></Field>
                    <Field label="Подпись профиля"><input value={activeReview.profile.label} onChange={(e) => patchReview(activeReview.id, { profile: { ...activeReview.profile, label: e.target.value } })} /></Field>
                    <Field label="Ссылка на профиль"><input type="url" value={activeReview.profile.url} onChange={(e) => patchReview(activeReview.id, { profile: { ...activeReview.profile, url: e.target.value } })} /></Field>
                    </div>
                    <Field label="Ссылка на проект"><input value={activeReview.project.url} onChange={(e) => patchReview(activeReview.id, { project: { ...activeReview.project, url: e.target.value } })} /></Field>
                    <GalleryMediaField className="is-review-image" label="Изображение отзыва" value={activeReview.image ?? ""} emptyLabel="Загрузить изображение" iconSrc="/assets/figma/reviews-admin-upload.svg" onChange={(value) => patchReview(activeReview.id, { image: value })} />
                  </div>
                </div>
              ) : <div className="admin-empty-panel"><span>←</span><p>Выберите отзыв.<br />Перед публикацией проверьте ссылки и согласие.</p></div>}
            </div>
          </div>
        )}

        {tab === "site" && (
          <div className="admin-view admin-site-editor">
            <h1>Главная страница</h1>

            <SiteCard title="Первый экран" className="admin-home-hero-card">
              <div className="admin-hero-fields">
                <div className="admin-hero-copy">
                  <Field label="Заголовок"><textarea rows={3} value={content.site.heroTitle} onChange={(e) => patchSite({ heroTitle: e.target.value })} /></Field>
                  <div className="admin-inline-fields"><Field label="Имя"><input value={content.site.heroName} onChange={(e) => patchSite({ heroName: e.target.value })} /></Field><Field label="Роль"><input value={content.site.heroRole} onChange={(e) => patchSite({ heroRole: e.target.value })} /></Field></div>
                </div>
                <GalleryMediaField className="is-portrait" label="Портрет" value={content.site.heroPortrait} onChange={(value) => patchSite({ heroPortrait: value })} />
              </div>
              <h4>Слайдер</h4>
              <div className="admin-gallery-grid">
                {content.site.heroGallery.map((image, index) => (
                  <GalleryMediaField
                    key={index}
                    className="is-slider"
                    isSlider={true}
                    label={`Фото ${index + 1}`}
                    value={image}
                    onChange={(value) => patchMediaArray("heroGallery", index, value)}
                    onDelete={() => patchSite({ heroGallery: content.site.heroGallery.filter((_, i) => i !== index) })}
                  />
                ))}
                <button className="admin-gallery-add" type="button" aria-label="Добавить фото в слайдер" onClick={() => patchSite({ heroGallery: [...content.site.heroGallery, ""] })}><Image src="/assets/figma/admin-asset-1.svg" width={36} height={36} alt="" /></button>
              </div>
              <Field label="Скорость галереи (сек.)"><input type="number" min={5} max={120} value={content.site.heroGallerySpeed || 30} onChange={(e) => patchSite({ heroGallerySpeed: Number(e.target.value) })} /></Field>
            </SiteCard>

            <SiteCard title="Обо мне" className="admin-about-card">
              <div className="admin-two-columns"><Field label="Заголовок"><textarea rows={3} value={content.site.aboutTitle} onChange={(e) => patchSite({ aboutTitle: e.target.value })} /></Field><Field label="Описание"><textarea rows={3} value={content.site.aboutText} onChange={(e) => patchSite({ aboutText: e.target.value })} /></Field></div>
              <h4>Преимущества</h4>
              <div className="admin-stats-fields">{content.site.stats.map((stat, index) => <div key={stat.id}><input aria-label={`Значение преимущества ${index + 1}`} value={stat.value} onChange={(e) => patchSite({ stats: content.site.stats.map((item, itemIndex) => itemIndex === index ? { ...item, value: e.target.value } : item) })} /><input aria-label={`Описание преимущества ${index + 1}`} value={stat.label} onChange={(e) => patchSite({ stats: content.site.stats.map((item, itemIndex) => itemIndex === index ? { ...item, label: e.target.value } : item) })} /></div>)}</div>
            </SiteCard>

            <SiteCard title="Портфолио" className="admin-site-portfolio-card">
              <Field label="Заголовок"><input value={content.site.portfolioTitle} onChange={(e) => patchSite({ portfolioTitle: e.target.value })} /></Field>
              <button className="admin-site-primary" type="button" onClick={() => setTab("portfolio")}>Открыть базу портфолио</button>
            </SiteCard>

            <SiteCard title="Процесс работы" className="admin-site-process-card">
              <Field label="Заголовок"><input value={content.site.processTitle} onChange={(e) => patchSite({ processTitle: e.target.value })} /></Field>
              <div className="admin-process-list">{content.site.process.map((step, index) => <div className="admin-process-row" key={step.id}><div className="admin-process-copy"><Field label={`Этап ${index + 1}`}><input value={step.title} onChange={(e) => patchSite({ process: content.site.process.map((item, itemIndex) => itemIndex === index ? { ...item, title: e.target.value } : item) })} /></Field><textarea aria-label={`Описание этапа ${index + 1}`} rows={3} value={step.text} onChange={(e) => patchSite({ process: content.site.process.map((item, itemIndex) => itemIndex === index ? { ...item, text: e.target.value } : item) })} />{step.secondaryTitle !== undefined && <><input aria-label="Название дополнительного этапа" value={step.secondaryTitle} onChange={(e) => patchSite({ process: content.site.process.map((item, itemIndex) => itemIndex === index ? { ...item, secondaryTitle: e.target.value } : item) })} /><textarea aria-label="Описание дополнительного этапа" rows={3} value={step.secondaryText} onChange={(e) => patchSite({ process: content.site.process.map((item, itemIndex) => itemIndex === index ? { ...item, secondaryText: e.target.value } : item) })} /></>}</div><GalleryMediaField className="is-process" label={`Изображение этапа ${index + 1}`} value={step.image} onChange={(value) => patchSite({ process: content.site.process.map((item, itemIndex) => itemIndex === index ? { ...item, image: value } : item) })} /></div>)}</div>
            </SiteCard>

            <SiteCard title="Отзывы">
              <div className="admin-two-columns"><Field label="Заголовок"><textarea rows={3} value={content.site.reviewsTitle} onChange={(e) => patchSite({ reviewsTitle: e.target.value })} /></Field><Field label="Описание"><textarea rows={3} value={content.site.reviewsText} onChange={(e) => patchSite({ reviewsText: e.target.value })} /></Field></div>
              <button className="admin-site-primary" type="button" onClick={() => setTab("reviews")}>Открыть базу отзывов</button>
            </SiteCard>

            <SiteCard title="Услуги и стоимость" className="admin-site-services-card">
              <div className="admin-two-columns"><Field label="Заголовок"><input value={content.site.servicesTitle} onChange={(e) => patchSite({ servicesTitle: e.target.value })} /></Field><Field label="Описание"><input value={content.site.servicesText} onChange={(e) => patchSite({ servicesText: e.target.value })} /></Field></div>
              <div className="admin-service-list">{content.site.services.map((service, index) => <div className="admin-site-service" key={service.id}><Field label={`Услуга ${index + 1}`}><input value={service.title} onChange={(e) => patchSite({ services: content.site.services.map((item, itemIndex) => itemIndex === index ? { ...item, title: e.target.value } : item) })} /></Field><div className="admin-service-text"><textarea aria-label={`Описание услуги ${index + 1}`} rows={3} value={service.text} onChange={(e) => patchSite({ services: content.site.services.map((item, itemIndex) => itemIndex === index ? { ...item, text: e.target.value } : item) })} /><input aria-label={`Срок услуги ${index + 1}`} value={service.time} onChange={(e) => patchSite({ services: content.site.services.map((item, itemIndex) => itemIndex === index ? { ...item, time: e.target.value } : item) })} /></div><div className="admin-two-columns"><input aria-label={`Стоимость услуги ${index + 1}`} value={service.price} onChange={(e) => patchSite({ services: content.site.services.map((item, itemIndex) => itemIndex === index ? { ...item, price: e.target.value } : item) })} /><input aria-label={`Стоимость с вёрсткой ${index + 1}`} value={service.priceSecondary} onChange={(e) => patchSite({ services: content.site.services.map((item, itemIndex) => itemIndex === index ? { ...item, priceSecondary: e.target.value } : item) })} /></div></div>)}</div>
              <h4>Небольшие задачи</h4>
              <Field label="Заголовок"><input value={content.site.smallTasksTitle} onChange={(e) => patchSite({ smallTasksTitle: e.target.value })} /></Field>
              <div className="admin-service-list">{content.site.smallTasks.map((task, index) => <div className="admin-site-service" key={task.id}><Field label={`Задача ${index + 1}`}><input value={task.title} onChange={(e) => patchSite({ smallTasks: content.site.smallTasks.map((item, itemIndex) => itemIndex === index ? { ...item, title: e.target.value } : item) })} /></Field><div className="admin-two-columns"><textarea aria-label={`Описание задачи ${index + 1}`} rows={3} value={task.text} onChange={(e) => patchSite({ smallTasks: content.site.smallTasks.map((item, itemIndex) => itemIndex === index ? { ...item, text: e.target.value } : item) })} /><textarea aria-label={`Результат задачи ${index + 1}`} rows={3} value={task.deliverable} onChange={(e) => patchSite({ smallTasks: content.site.smallTasks.map((item, itemIndex) => itemIndex === index ? { ...item, deliverable: e.target.value } : item) })} /></div><div className="admin-two-columns"><input aria-label={`Срок задачи ${index + 1}`} value={task.time} onChange={(e) => patchSite({ smallTasks: content.site.smallTasks.map((item, itemIndex) => itemIndex === index ? { ...item, time: e.target.value } : item) })} /><input aria-label={`Стоимость задачи ${index + 1}`} value={task.price} onChange={(e) => patchSite({ smallTasks: content.site.smallTasks.map((item, itemIndex) => itemIndex === index ? { ...item, price: e.target.value } : item) })} /></div></div>)}</div>
            </SiteCard>

            <SiteCard title="Контакты и подвал" className="admin-site-contact-card">
              <Field label="Призыв"><input value={content.site.contactTitle} onChange={(e) => patchSite({ contactTitle: e.target.value })} /></Field>
              <div className="admin-four-columns"><Field label="Email"><input type="email" value={content.site.email} onChange={(e) => patchSite({ email: e.target.value })} /></Field><Field label="Telegram"><input value={content.site.telegramUrl} onChange={(e) => patchSite({ telegramUrl: e.target.value })} /></Field><Field label="VK"><input value={content.site.vkUrl} onChange={(e) => patchSite({ vkUrl: e.target.value })} /></Field><Field label="MAX"><input value={content.site.maxUrl} onChange={(e) => patchSite({ maxUrl: e.target.value })} /></Field></div>
              <div className="admin-two-columns"><Field label="Kwork"><input value={content.site.kworkUrl} onChange={(e) => patchSite({ kworkUrl: e.target.value })} /></Field><Field label="FL"><input value={content.site.flUrl} onChange={(e) => patchSite({ flUrl: e.target.value })} /></Field></div>
            </SiteCard>
          </div>
        )}
      </main>
    </section>
  );
}

function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={wide ? "is-wide" : ""}><span>{label}</span>{children}</label>;
}

function CaseBuilder({
  blocks,
  onAdd,
  onPatch,
  onMove,
  onRemove,
  onAddItem,
  onPatchItem,
  onRemoveItem,
  onPatchGalleryImage,
  onAddGalleryImage,
  onRemoveGalleryImage,
}: {
  blocks: CaseBlock[];
  onAdd: (type: CaseBlock["type"]) => void;
  onPatch: (blockId: string, patch: Partial<CaseBlock>) => void;
  onMove: (blockId: string, direction: -1 | 1) => void;
  onRemove: (blockId: string) => void;
  onAddItem: (blockId: string) => void;
  onPatchItem: (blockId: string, itemId: string, patch: { label?: string; text?: string }) => void;
  onRemoveItem: (blockId: string, itemId: string) => void;
  onPatchGalleryImage: (blockId: string, imageId: string, patch: { image?: string; alt?: string }) => void;
  onAddGalleryImage: (blockId: string) => void;
  onRemoveGalleryImage: (blockId: string, imageId: string) => void;
}) {
  const typeLabels: Record<CaseBlock["type"], string> = { image: "Изображение", gallery: "Галерея", text: "Текстовая секция", callout: "Акцентная плашка" };

  return (
    <section className="admin-case-builder">
      <div className="admin-case-builder-head">
        <div><span>PAGE / BLOCKS</span><h3>Конструктор страницы</h3><p>Добавляйте блоки и меняйте их порядок. Компактный отступ связывает несколько блоков в одну смысловую секцию.</p></div>
        <div className="admin-case-add-buttons">
          <button type="button" onClick={() => onAdd("image")}>+ Изображение</button>
          <button type="button" onClick={() => onAdd("gallery")}>+ Галерея</button>
          <button type="button" onClick={() => onAdd("text")}>+ Текст</button>
          <button type="button" onClick={() => onAdd("callout")}>+ Плашка</button>
        </div>
      </div>

      {blocks.length === 0 && <p className="admin-case-builder-empty">Добавьте первый блок страницы.</p>}

      <div className="admin-case-blocks">
        {blocks.map((block, index) => (
          <article className="admin-case-block" key={block.id}>
            <header>
              <div><span>{String(index + 1).padStart(2, "0")}</span><strong>{typeLabels[block.type]}</strong></div>
              <div className="admin-case-block-actions">
                <button type="button" disabled={index === 0} onClick={() => onMove(block.id, -1)} aria-label="Переместить блок выше">↑</button>
                <button type="button" disabled={index === blocks.length - 1} onClick={() => onMove(block.id, 1)} aria-label="Переместить блок ниже">↓</button>
                <button type="button" className="is-danger" onClick={() => onRemove(block.id)}>Удалить</button>
              </div>
            </header>

            <label className="admin-case-spacing"><span>Отступ после блока</span><select value={block.spacing} onChange={(event) => onPatch(block.id, { spacing: event.target.value as CaseBlock["spacing"] })}><option value="large">Большой — 70 px</option><option value="compact">Компактный — 28 px</option></select></label>

            {block.type === "image" && <div className="admin-case-image-fields">
              <GalleryMediaField className="is-case-block-image" label="Изображение" value={block.image} emptyLabel="Загрузить изображение" onChange={(image) => onPatch(block.id, { image })} />
              <div><Field label="Подпись над изображением"><input value={block.caption} onChange={(event) => onPatch(block.id, { caption: event.target.value })} /></Field><Field label="Alt-текст"><input value={block.alt} onChange={(event) => onPatch(block.id, { alt: event.target.value })} /></Field></div>
            </div>}

            {block.type === "gallery" && <div className="admin-case-gallery-fields">
              <div className="admin-case-gallery-grid">{block.images.map((image, imageIndex) => <div key={image.id}>
                <GalleryMediaField className="is-case-gallery-image" isSlider label={`Изображение ${imageIndex + 1}`} value={image.image} emptyLabel="Загрузить" onChange={(value) => onPatchGalleryImage(block.id, image.id, { image: value })} onDelete={() => onRemoveGalleryImage(block.id, image.id)} />
                <input aria-label={`Alt-текст изображения ${imageIndex + 1}`} placeholder="Alt-текст" value={image.alt} onChange={(event) => onPatchGalleryImage(block.id, image.id, { alt: event.target.value })} />
              </div>)}</div>
              <button className="admin-case-inline-add" type="button" onClick={() => onAddGalleryImage(block.id)}>+ Добавить изображение</button>
            </div>}

            {block.type === "text" && <div className="admin-case-text-fields">
              <Field label="Заголовок"><input value={block.title} onChange={(event) => onPatch(block.id, { title: event.target.value })} /></Field>
              <Field label="Обычный текст"><textarea rows={5} value={block.body} onChange={(event) => onPatch(block.id, { body: event.target.value })} /></Field>
              <Field label="Формат списка"><select value={block.listStyle} onChange={(event) => onPatch(block.id, { listStyle: event.target.value as typeof block.listStyle })}><option value="none">Без списка</option><option value="bullet">Маркированный</option><option value="numbered">Нумерованный</option><option value="labeled">Пункты с подписями</option></select></Field>
              {block.listStyle !== "none" && <div className="admin-case-items">
                {block.items.map((item, itemIndex) => <div className="admin-case-item" key={item.id}>
                  <span>{String(itemIndex + 1).padStart(2, "0")}</span>
                  {block.listStyle === "labeled" && <input aria-label={`Подпись пункта ${itemIndex + 1}`} placeholder="Подпись" value={item.label} onChange={(event) => onPatchItem(block.id, item.id, { label: event.target.value })} />}
                  <textarea aria-label={`Текст пункта ${itemIndex + 1}`} rows={3} placeholder="Текст пункта" value={item.text} onChange={(event) => onPatchItem(block.id, item.id, { text: event.target.value })} />
                  <button type="button" onClick={() => onRemoveItem(block.id, item.id)} aria-label={`Удалить пункт ${itemIndex + 1}`}>×</button>
                </div>)}
                <button className="admin-case-inline-add" type="button" onClick={() => onAddItem(block.id)}>+ Добавить пункт</button>
              </div>}
            </div>}

            {block.type === "callout" && <Field label="Текст плашки"><textarea rows={3} value={block.text} onChange={(event) => onPatch(block.id, { text: event.target.value })} /></Field>}
          </article>
        ))}
      </div>
    </section>
  );
}

function PortfolioRadioGroup({ name, value, options, onChange }: { name: string; value: string; options: [string, string][]; onChange: (value: string) => void }) {
  return <div className="admin-placement-options">{options.map(([id, label]) => <label key={id}><input type="radio" name={name} value={id} checked={value === id} onChange={(event) => onChange(event.target.value)} /><span>{label}</span></label>)}</div>;
}

function SiteCard({ title, className = "", children }: { title: string; className?: string; children: React.ReactNode }) {
  return <section className={`admin-site-card ${className}`}><h3>{title}</h3><div>{children}</div></section>;
}

function GalleryMediaField({
  label,
  value,
  onChange,
  onDelete,
  className = "",
  emptyLabel = "Добавить",
  iconSrc = "/assets/figma/admin-asset-2.svg",
  isSlider = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onDelete?: () => void;
  className?: string;
  emptyLabel?: string;
  iconSrc?: string;
  isSlider?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/admin/media", { method: "POST", body });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Не удалось загрузить изображение");
      onChange(result.url);
    } catch (uploadError) {
      setError((uploadError as Error).message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className={`admin-gallery-field ${value ? "has-image" : "is-empty"} ${className}`}>
      <label aria-label={`${value ? "Заменить" : "Добавить"}: ${label}`}>
        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={upload} disabled={uploading} />
        {value ? <img className="admin-gallery-image" src={value} alt="" /> : <span className="admin-gallery-empty">+</span>}
        {isSlider && value ? (
          <div className="admin-slider-hover">
            {onDelete && (
              <button
                type="button"
                className="admin-slider-delete"
                aria-label="Удалить фото из слайдера"
                title="Удалить фото"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="3" x2="13" y2="13" />
                  <line x1="13" y1="3" x2="3" y2="13" />
                </svg>
              </button>
            )}
            <div className="admin-slider-btn">
              <span>{uploading ? "Загружаю…" : "Новое фото"}</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 10.5V12.5C2.5 13.0523 2.94772 13.5 3.5 13.5H12.5C13.0523 13.5 13.5 13.0523 13.5 12.5V10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 2.5V10.5M8 2.5L5 5.5M8 2.5L11 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        ) : (
          <>
            {isSlider && !value && onDelete && (
              <button
                type="button"
                className="admin-slider-delete is-empty-delete"
                aria-label="Удалить пустой слот"
                title="Удалить слот"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="3" x2="13" y2="13" />
                  <line x1="13" y1="3" x2="3" y2="13" />
                </svg>
              </button>
            )}
            <span className="admin-gallery-hover">
              <Image src={iconSrc} width={42} height={42} alt="" />
              <b>{uploading ? "Загружаю…" : value ? "Заменить" : emptyLabel}</b>
            </span>
          </>
        )}
      </label>
      {error && <small>{error}</small>}
    </div>
  );
}
