"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { AdminContent } from "@/lib/content-store";
import type { CaseStudy } from "@/lib/cases";
import { externalUrl } from "@/lib/external-url";
import type { VerifiedReview } from "@/lib/reviews";
import type { PortfolioFilter, PortfolioProject, SiteSettings } from "@/lib/site-settings";

type Tab = "site" | "portfolio" | "reviews";

const portfolioFilterOptions: { id: PortfolioFilter; label: string }[] = [
  { id: "landing", label: "Одностраничный" },
  { id: "multipage", label: "Многостраничный" },
  { id: "commerce", label: "Интернет-магазин" },
  { id: "interface", label: "Интерфейс" },
];

function blankPortfolioProject(count: number): PortfolioProject {
  return { id: `portfolio-${Date.now()}`, title: "Новая работа", description: "Короткое описание проекта", image: "", url: "#", platform: "", tags: ["", ""], filters: [], homePlacement: "hidden", portfolioPlacement: "archive", published: false, order: (count + 1) * 10 };
}

function blankCase(count: number, title = "Новый проект"): CaseStudy {
  const now = new Date().toISOString();
  return {
    slug: `new-project-${count + 1}`,
    index: String(count + 1).padStart(2, "0"),
    title,
    eyebrow: "Сфера · формат сайта",
    summary: "Короткое описание проекта для каталога.",
    role: "Структура, UX/UI-дизайн",
    year: String(new Date().getFullYear()),
    url: "https://",
    accent: "green",
    category: "corporate",
    catalogTask: "Какую задачу бизнеса решал проект.",
    status: "draft",
    featured: false,
    createdAt: now,
    updatedAt: now,
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function AdminStudio({ authenticated, initialContent }: { authenticated: boolean; initialContent: AdminContent | null }) {
  const [isAuthenticated, setIsAuthenticated] = useState(authenticated);
  const [content, setContent] = useState(initialContent);
  const [tab, setTab] = useState<Tab>("portfolio");
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [loginError, setLoginError] = useState("");

  const pendingReviews = content?.reviews.filter((item) => item.status === "pending").length ?? 0;
  const activeReview = content?.reviews.find((item) => item.id === selectedReview) ?? null;
  const activePortfolio = content?.site.portfolioProjects.find((item) => item.id === selectedPortfolio) ?? null;

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
      if (!response.ok) throw new Error("save failed");
      setContent(await response.json());
      setNotice(message);
      window.setTimeout(() => setNotice(""), 3200);
    } catch {
      setNotice("Не удалось сохранить. Проверьте соединение и настройки хранилища.");
    } finally {
      setSaving(false);
    }
  }

  function patchCaseStudy(projectId: string, patch: Partial<CaseStudy>) {
    const project = content?.site.portfolioProjects.find((item) => item.id === projectId);
    if (!project?.caseStudy) return;
    patchPortfolio(projectId, { caseStudy: { ...project.caseStudy, ...patch } });
  }

  function updateCaseArray(projectId: string, key: "verified" | "decisions", index: number, value: string, subKey?: "title" | "text") {
    const caseStudy = content?.site.portfolioProjects.find((item) => item.id === projectId)?.caseStudy;
    if (!caseStudy) return;
    if (key === "verified") {
      const verified = [...caseStudy.verified];
      verified[index] = value;
      patchCaseStudy(projectId, { verified });
      return;
    }
    const decisions = caseStudy.draft.decisions.map((item, itemIndex) => itemIndex === index ? { ...item, [subKey ?? "text"]: value } : item);
    patchCaseStudy(projectId, { draft: { ...caseStudy.draft, decisions } });
  }

  function toggleCaseStudy(projectId: string, enabled: boolean) {
    const project = content?.site.portfolioProjects.find((item) => item.id === projectId);
    if (!project) return;
    if (!enabled) {
      if (!window.confirm("Отключить и удалить содержимое внутренней страницы кейса?")) return;
      patchPortfolio(projectId, { caseStudy: undefined });
      return;
    }
    const caseStudy = blankCase(content?.site.portfolioProjects.filter((item) => item.caseStudy).length ?? 0, project.title);
    caseStudy.slug = project.id;
    patchPortfolio(projectId, { caseStudy, url: `/cases/${caseStudy.slug}` });
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
    <section className="admin-studio">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-head"><span><Image src="/assets/figma/logo.svg" width={42} height={42} alt="" /></span><div><strong>Панель управления</strong><small>ZAKULAB / CONTENT</small></div></div>
        <nav aria-label="Разделы админки">
          {([
            ["site", "Сайт", "01"],
            ["portfolio", "Портфолио", String(content.site.portfolioProjects.length).padStart(2, "0")],
            ["reviews", "Отзывы", String(pendingReviews).padStart(2, "0")],
          ] as const).map(([id, label, count]) => (
            <button className={tab === id ? "is-active" : ""} onClick={() => setTab(id)} key={id}><span>{label}</span><i>{count}</i></button>
          ))}
        </nav>
        <div className="admin-sidebar-foot"><Link href="/" target="_blank">Открыть сайт ↗</Link><button onClick={logout}>Выйти</button></div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div><span>ADMIN / {tab.toUpperCase()}</span><strong>{tab === "site" ? "Редактор сайта" : tab === "portfolio" ? "Единая база работ и кейсов" : "Единая база отзывов"}</strong></div>
          <div className="admin-save-state"><i className={saving ? "is-saving" : ""} />{saving ? "Сохраняю…" : notice || `Обновлено ${formatDate(content.updatedAt)}`}</div>
        </header>

        {tab === "portfolio" && (
          <div className="admin-view">
            <div className="admin-list-head"><div><span>PORTFOLIO / SINGLE SOURCE</span><h1>Работы</h1><p>Одна запись управляет показом на главной, внутренней странице и в фильтрах.</p></div><button className="admin-add-button" onClick={createPortfolioProject}>+ Новая работа</button></div>
            <div className="admin-portfolio-summary"><span>На главной: <strong>{content.site.portfolioProjects.filter((item) => item.published && item.homePlacement !== "hidden").length}</strong></span><span>Избранные: <strong>{content.site.portfolioProjects.filter((item) => item.published && item.portfolioPlacement === "featured").length}/6</strong></span><span>Другие / архив: <strong>{content.site.portfolioProjects.filter((item) => item.published && item.portfolioPlacement === "archive").length}</strong></span><span>Внутренние кейсы: <strong>{content.site.portfolioProjects.filter((item) => item.caseStudy).length}</strong></span></div>
            <div className="admin-split-view">
              <div className="admin-entity-list">
                {[...content.site.portfolioProjects].sort((a, b) => a.order - b.order).map((item) => (
                  <button className={selectedPortfolio === item.id ? "is-active" : ""} onClick={() => setSelectedPortfolio(item.id)} key={item.id}>
                    <span className={`admin-status-dot is-${item.published ? "published" : "draft"}`} />
                    <div><strong>{item.title}</strong><small>{item.description}{item.caseStudy ? " · есть кейс" : ""}</small></div>
                    <span>{item.portfolioPlacement === "featured" ? "Избранное" : item.portfolioPlacement === "archive" ? "Архив" : "Скрыто"}</span>
                  </button>
                ))}
              </div>
              {activePortfolio ? (
                <div className="admin-editor">
                  <div className="admin-editor-head"><div><span>WORK / {activePortfolio.id}</span><h2>{activePortfolio.title}</h2></div><button className="admin-danger" onClick={() => deletePortfolioProject(activePortfolio.id)}>Удалить</button></div>
                  <div className="admin-publish-row"><label><input type="checkbox" checked={activePortfolio.published} onChange={(event) => patchPortfolio(activePortfolio.id, { published: event.target.checked })} /><span>Опубликована</span></label></div>
                  <div className="admin-fields">
                    <Field label="Название"><input value={activePortfolio.title} onChange={(event) => patchPortfolio(activePortfolio.id, { title: event.target.value })} /></Field>
                    <Field label="Порядок"><input type="number" value={activePortfolio.order} onChange={(event) => patchPortfolio(activePortfolio.id, { order: Number(event.target.value) })} /></Field>
                    <Field wide label="Описание"><textarea rows={3} value={activePortfolio.description} onChange={(event) => patchPortfolio(activePortfolio.id, { description: event.target.value })} /></Field>
                    <Field wide label="Ссылка"><input value={activePortfolio.url} onChange={(event) => patchPortfolio(activePortfolio.id, { url: event.target.value })} /></Field>
                    <Field label="Размещение на главной"><select value={activePortfolio.homePlacement} onChange={(event) => patchPortfolio(activePortfolio.id, { homePlacement: event.target.value as PortfolioProject["homePlacement"] })}><option value="featured">Избранное — карточка (макс. 4)</option><option value="list">Список проектов</option><option value="hidden">Не показывать</option></select></Field>
                    <Field label="Размещение в портфолио"><select value={activePortfolio.portfolioPlacement} onChange={(event) => patchPortfolio(activePortfolio.id, { portfolioPlacement: event.target.value as PortfolioProject["portfolioPlacement"] })}><option value="featured">Избранные проекты (макс. 6)</option><option value="archive">Другие / архивные</option><option value="hidden">Не показывать</option></select></Field>
                    <Field label="Платформа"><select value={activePortfolio.platform} onChange={(event) => patchPortfolio(activePortfolio.id, { platform: event.target.value })}><option value="">Без логотипа</option><option value="Tilda">Tilda</option><option value="WordPress">WordPress</option></select></Field>
                    <Field label="Тег 1"><input value={activePortfolio.tags[0]} onChange={(event) => patchPortfolio(activePortfolio.id, { tags: [event.target.value, activePortfolio.tags[1]] })} /></Field>
                    <Field label="Тег 2"><input value={activePortfolio.tags[1]} onChange={(event) => patchPortfolio(activePortfolio.id, { tags: [activePortfolio.tags[0], event.target.value] })} /></Field>
                    <div className="admin-portfolio-filters"><span>Фильтры внутренней страницы</span>{portfolioFilterOptions.map((filter) => <label key={filter.id}><input type="checkbox" checked={activePortfolio.filters.includes(filter.id)} onChange={(event) => togglePortfolioFilter(activePortfolio.id, filter.id, event.target.checked)} />{filter.label}</label>)}</div>
                  </div>
                  <div className="admin-portfolio-media"><MediaField label="Превью проекта" value={activePortfolio.image} onChange={(value) => patchPortfolio(activePortfolio.id, { image: value })} /></div>
                  <section className="admin-case-settings">
                    <div className="admin-case-settings-head"><div><span>CASE / INNER PAGE</span><h3>Внутренняя страница кейса</h3><p>Контент кейса хранится внутри этой же работы — отдельной записи больше нет.</p></div><label><input type="checkbox" checked={Boolean(activePortfolio.caseStudy)} onChange={(event) => toggleCaseStudy(activePortfolio.id, event.target.checked)} /><span>{activePortfolio.caseStudy ? "Подключена" : "Не подключена"}</span></label></div>
                    {activePortfolio.caseStudy && <>
                      <div className="admin-publish-row"><label><input type="checkbox" checked={activePortfolio.caseStudy.status === "published"} onChange={(event) => patchCaseStudy(activePortfolio.id, { status: event.target.checked ? "published" : "draft" })} /><span>Опубликовать внутреннюю страницу</span></label></div>
                      <div className="admin-fields">
                        <Field label="URL-адрес"><input value={activePortfolio.caseStudy.slug} onChange={(event) => { const slug = event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"); patchPortfolio(activePortfolio.id, { url: `/cases/${slug}`, caseStudy: { ...activePortfolio.caseStudy!, slug } }); }} /></Field>
                        <Field label="Номер"><input value={activePortfolio.caseStudy.index} onChange={(event) => patchCaseStudy(activePortfolio.id, { index: event.target.value })} /></Field>
                        <Field label="Год"><input value={activePortfolio.caseStudy.year} onChange={(event) => patchCaseStudy(activePortfolio.id, { year: event.target.value })} /></Field>
                        <Field label="Категория"><select value={activePortfolio.caseStudy.category} onChange={(event) => patchCaseStudy(activePortfolio.id, { category: event.target.value as CaseStudy["category"] })}><option value="corporate">Корпоративный</option><option value="commerce">E-commerce</option></select></Field>
                        <Field label="Цвет"><select value={activePortfolio.caseStudy.accent} onChange={(event) => patchCaseStudy(activePortfolio.id, { accent: event.target.value as CaseStudy["accent"] })}><option value="green">Зелёный</option><option value="orange">Оранжевый</option><option value="coral">Коралловый</option></select></Field>
                        <Field wide label="Подпись формата"><input value={activePortfolio.caseStudy.eyebrow} onChange={(event) => patchCaseStudy(activePortfolio.id, { eyebrow: event.target.value })} /></Field>
                        <Field wide label="Короткое описание кейса"><textarea rows={3} value={activePortfolio.caseStudy.summary} onChange={(event) => patchCaseStudy(activePortfolio.id, { summary: event.target.value })} /></Field>
                        <Field wide label="Задача для каталога"><textarea rows={3} value={activePortfolio.caseStudy.catalogTask} onChange={(event) => patchCaseStudy(activePortfolio.id, { catalogTask: event.target.value })} /></Field>
                        <Field wide label="Моя роль"><input value={activePortfolio.caseStudy.role} onChange={(event) => patchCaseStudy(activePortfolio.id, { role: event.target.value })} /></Field>
                        <Field wide label="Ссылка на живой сайт"><input type="url" value={activePortfolio.caseStudy.url} onChange={(event) => patchCaseStudy(activePortfolio.id, { url: event.target.value })} /></Field>
                      </div>
                      <EditorSection title="Что сделано" code="FACTS / 03">{activePortfolio.caseStudy.verified.map((fact, index) => <input key={index} value={fact} onChange={(event) => updateCaseArray(activePortfolio.id, "verified", index, event.target.value)} />)}</EditorSection>
                      <EditorSection title="Разбор проекта" code="STORY / LONG">
                        <Field label="Исходная задача"><textarea rows={5} value={activePortfolio.caseStudy.draft.challenge} onChange={(event) => patchCaseStudy(activePortfolio.id, { draft: { ...activePortfolio.caseStudy!.draft, challenge: event.target.value } })} /></Field>
                        <Field label="Подход"><textarea rows={5} value={activePortfolio.caseStudy.draft.approach} onChange={(event) => patchCaseStudy(activePortfolio.id, { draft: { ...activePortfolio.caseStudy!.draft, approach: event.target.value } })} /></Field>
                        {activePortfolio.caseStudy.draft.decisions.map((decision, index) => <div className="admin-decision-fields" key={index}><input value={decision.title} onChange={(event) => updateCaseArray(activePortfolio.id, "decisions", index, event.target.value, "title")} /><textarea rows={3} value={decision.text} onChange={(event) => updateCaseArray(activePortfolio.id, "decisions", index, event.target.value, "text")} /></div>)}
                        <Field label="Результат"><textarea rows={5} value={activePortfolio.caseStudy.draft.result} onChange={(event) => patchCaseStudy(activePortfolio.id, { draft: { ...activePortfolio.caseStudy!.draft, result: event.target.value } })} /></Field>
                      </EditorSection>
                    </>}
                  </section>
                  <div className="admin-editor-actions"><button className="button" disabled={saving} onClick={() => persist(content, "Работа и кейс обновлены")}>Сохранить работу <span>↗</span></button>{activePortfolio.caseStudy?.status === "published" && <Link href={`/cases/${activePortfolio.caseStudy.slug}`} target="_blank">Предпросмотр кейса ↗</Link>}</div>
                </div>
              ) : <div className="admin-empty-panel"><span>←</span><p>Выберите работу или добавьте новую.<br />Все размещения и фильтры настраиваются в одной записи.</p></div>}
            </div>
          </div>
        )}

        {tab === "reviews" && (
          <div className="admin-view">
            <div className="admin-list-head"><div><span>REVIEWS / SINGLE SOURCE</span><h1>Отзывы</h1><p>Одна запись управляет модерацией и показом отзыва на главной и внутренней странице.</p></div><div className="admin-list-actions"><p>{pendingReviews} требуют решения</p><button className="admin-add-button" onClick={createReview}>+ Добавить отзыв</button></div></div>
            <div className="admin-portfolio-summary"><span>На главной: <strong>{content.reviews.filter((item) => (item.status === "published" || item.status === "demo") && item.showOnHome).length}</strong></span><span>На странице отзывов: <strong>{content.reviews.filter((item) => (item.status === "published" || item.status === "demo") && item.showOnReviewsPage).length}</strong></span><span>На модерации: <strong>{pendingReviews}</strong></span></div>
            <div className="admin-split-view">
              <div className="admin-entity-list admin-review-list">
                {[...content.reviews].sort((a, b) => a.order - b.order).map((item) => (
                  <button className={selectedReview === item.id ? "is-active" : ""} onClick={() => setSelectedReview(item.id)} key={item.id}>
                    <span className={`admin-status-dot is-${item.status}`} />
                    <div><strong>{item.author.name}</strong><small>{item.author.company} · {formatDate(item.submittedAt)}</small></div>
                    <span>{item.status === "pending" ? "На проверке" : item.status === "published" ? "Опубликован" : item.status === "rejected" ? "Отклонён" : "Демо"}</span>
                  </button>
                ))}
              </div>
              {activeReview ? (
                <div className="admin-editor admin-review-editor">
                  <div className="admin-editor-head"><div><span>REVIEW / {activeReview.status.toUpperCase()}</span><h2>{activeReview.author.name}</h2></div><small>{formatDate(activeReview.submittedAt)}</small></div>
                  <blockquote>«{activeReview.text}»</blockquote>
                  <div className="admin-review-proof"><a href={externalUrl(activeReview.project.url)} target="_blank" rel="noreferrer">Проект: {activeReview.project.url} ↗</a><a href={activeReview.profile.url} target="_blank" rel="noreferrer">Профиль: {activeReview.profile.label} ↗</a></div>
                  <div className="admin-publish-row"><label><input type="checkbox" checked={activeReview.showOnHome} onChange={(event) => patchReview(activeReview.id, { showOnHome: event.target.checked })} /><span>Показывать на главной</span></label><label><input type="checkbox" checked={activeReview.showOnReviewsPage} onChange={(event) => patchReview(activeReview.id, { showOnReviewsPage: event.target.checked })} /><span>Показывать на странице отзывов</span></label></div>
                  <div className="admin-fields">
                    <Field label="Имя"><input value={activeReview.author.name} onChange={(e) => patchReview(activeReview.id, { author: { ...activeReview.author, name: e.target.value } })} /></Field>
                    <Field label="Порядок показа"><input type="number" value={activeReview.order} onChange={(event) => patchReview(activeReview.id, { order: Number(event.target.value) })} /></Field>
                    <Field label="Должность"><input value={activeReview.author.role} onChange={(e) => patchReview(activeReview.id, { author: { ...activeReview.author, role: e.target.value } })} /></Field>
                    <Field label="Компания"><input value={activeReview.author.company} onChange={(e) => patchReview(activeReview.id, { author: { ...activeReview.author, company: e.target.value } })} /></Field>
                    <Field label="Инициалы"><input value={activeReview.author.initials} onChange={(e) => patchReview(activeReview.id, { author: { ...activeReview.author, initials: e.target.value } })} /></Field>
                    <Field wide label="Текст отзыва"><textarea rows={7} value={activeReview.text} onChange={(e) => patchReview(activeReview.id, { text: e.target.value })} /></Field>
                    <Field label="Социальная сеть"><select value={activeReview.profile.network} onChange={(e) => patchReview(activeReview.id, { profile: { ...activeReview.profile, network: e.target.value as VerifiedReview["profile"]["network"] } })}><option>Telegram</option><option>MAX</option><option>VK</option><option>LinkedIn</option><option>Другая сеть</option></select></Field>
                    <Field label="Подпись профиля"><input value={activeReview.profile.label} onChange={(e) => patchReview(activeReview.id, { profile: { ...activeReview.profile, label: e.target.value } })} /></Field>
                    <Field wide label="Ссылка на профиль"><input type="url" value={activeReview.profile.url} onChange={(e) => patchReview(activeReview.id, { profile: { ...activeReview.profile, url: e.target.value } })} /></Field>
                    <Field wide label="Ссылка на проект"><input value={activeReview.project.url} placeholder="normdev.ru" onChange={(e) => patchReview(activeReview.id, { project: { ...activeReview.project, url: e.target.value } })} /></Field>
                    <Field wide label="Ссылка на кейс"><input type="url" value={activeReview.project.caseUrl ?? ""} onChange={(e) => patchReview(activeReview.id, { project: { ...activeReview.project, caseUrl: e.target.value } })} /></Field>
                  </div>
                  <MediaField label="Фоновое изображение" value={activeReview.image ?? ""} onChange={(value) => patchReview(activeReview.id, { image: value })} />
                  <div className="admin-review-actions"><button disabled={saving} onClick={() => setReviewStatus(activeReview.id, "published")}>✓ Одобрить и опубликовать</button><button disabled={saving} onClick={() => setReviewStatus(activeReview.id, "rejected")}>× Отклонить</button><button disabled={saving} onClick={saveReview}>Сохранить правки</button><button className="admin-review-delete" disabled={saving} onClick={() => deleteReview(activeReview.id)}>Удалить отзыв</button></div>
                </div>
              ) : <div className="admin-empty-panel"><span>←</span><p>Выберите отзыв.<br />Перед публикацией проверьте ссылки и согласие.</p></div>}
            </div>
          </div>
        )}

        {tab === "site" && (
          <div className="admin-view admin-site-editor">
            <div className="admin-list-head"><div><span>PUBLIC / COPY</span><h1>Сайт</h1></div><Link href="/" target="_blank">Открыть сайт ↗</Link></div>
            <EditorSection title="Первый экран" code="HOME / HERO">
              <Field label="Главный заголовок"><textarea rows={4} value={content.site.heroTitle} onChange={(e) => patchSite({ heroTitle: e.target.value })} /></Field>
              <div className="admin-inline-fields"><Field label="Имя"><input value={content.site.heroName} onChange={(e) => patchSite({ heroName: e.target.value })} /></Field><Field label="Роль"><input value={content.site.heroRole} onChange={(e) => patchSite({ heroRole: e.target.value })} /></Field></div>
              <div style={{ maxWidth: 300 }}>
                <MediaField label="Портрет" value={content.site.heroPortrait} onChange={(value) => patchSite({ heroPortrait: value })} />
              </div>
              <div className="admin-media-grid">
                {content.site.heroGallery.map((image, index) => (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <MediaField label={`Фото ${index + 1}`} value={image} onChange={(value) => patchMediaArray("heroGallery", index, value)} />
                    <button className="admin-danger" style={{ alignSelf: 'flex-start', padding: '4px 0' }} onClick={() => patchSite({ heroGallery: content.site.heroGallery.filter((_, i) => i !== index) })}>Удалить фото</button>
                  </div>
                ))}
              </div>
              <button className="button" style={{ marginTop: 12, padding: '4px 12px', fontSize: 13, background: 'transparent', color: 'var(--ink)', border: '1px solid #c4c6bf' }} onClick={() => patchSite({ heroGallery: [...content.site.heroGallery, ""] })}>+ Добавить фото в галерею</button>
              <Field label="Скорость галереи (сек)"><input type="number" min={5} max={120} value={content.site.heroGallerySpeed || 30} onChange={(e) => patchSite({ heroGallerySpeed: Number(e.target.value) })} /></Field>
            </EditorSection>
            <EditorSection title="Обо мне" code="HOME / ABOUT">
              <Field label="Заголовок"><textarea rows={3} value={content.site.aboutTitle} onChange={(e) => patchSite({ aboutTitle: e.target.value })} /></Field>
              <Field label="Описание"><textarea rows={5} value={content.site.aboutText} onChange={(e) => patchSite({ aboutText: e.target.value })} /></Field>
              <div className="admin-media-grid">{content.site.stats.map((stat, index) => <div className="admin-array-card" key={stat.id}><input value={stat.value} onChange={(e) => patchSite({ stats: content.site.stats.map((item, itemIndex) => itemIndex === index ? { ...item, value: e.target.value } : item) })} /><input value={stat.label} onChange={(e) => patchSite({ stats: content.site.stats.map((item, itemIndex) => itemIndex === index ? { ...item, label: e.target.value } : item) })} /></div>)}</div>
            </EditorSection>
            <EditorSection title="Портфолио" code="HOME / PORTFOLIO">
              <Field label="Заголовок"><input value={content.site.portfolioTitle} onChange={(e) => patchSite({ portfolioTitle: e.target.value })} /></Field>
              <p className="admin-portfolio-note">Карточки, списки, изображения и фильтры теперь управляются в единой базе. Изменения названия этого блока сохраняются вместе с остальными настройками главной.</p>
              <button className="admin-add-button" type="button" onClick={() => setTab("portfolio")}>Открыть базу портфолио →</button>
            </EditorSection>
            <EditorSection title="Процесс" code="HOME / PROCESS">
              <Field label="Заголовок"><input value={content.site.processTitle} onChange={(e) => patchSite({ processTitle: e.target.value })} /></Field>
              {content.site.process.map((step, index) => <div className="admin-array-card admin-process-fields" key={step.id}><input value={step.title} onChange={(e) => patchSite({ process: content.site.process.map((item, itemIndex) => itemIndex === index ? { ...item, title: e.target.value } : item) })} /><textarea rows={4} value={step.text} onChange={(e) => patchSite({ process: content.site.process.map((item, itemIndex) => itemIndex === index ? { ...item, text: e.target.value } : item) })} /><MediaField label={`Изображение этапа ${index + 1}`} value={step.image} onChange={(value) => patchSite({ process: content.site.process.map((item, itemIndex) => itemIndex === index ? { ...item, image: value } : item) })} />{step.secondaryTitle !== undefined && <><input value={step.secondaryTitle} onChange={(e) => patchSite({ process: content.site.process.map((item, itemIndex) => itemIndex === index ? { ...item, secondaryTitle: e.target.value } : item) })} /><textarea rows={3} value={step.secondaryText} onChange={(e) => patchSite({ process: content.site.process.map((item, itemIndex) => itemIndex === index ? { ...item, secondaryText: e.target.value } : item) })} />{step.secondaryImage && <MediaField label="Второе изображение" value={step.secondaryImage} onChange={(value) => patchSite({ process: content.site.process.map((item, itemIndex) => itemIndex === index ? { ...item, secondaryImage: value } : item) })} />}</>}</div>)}
            </EditorSection>
            <EditorSection title="Отзывы" code="HOME / REVIEWS">
              <Field label="Заголовок"><textarea rows={3} value={content.site.reviewsTitle} onChange={(e) => patchSite({ reviewsTitle: e.target.value })} /></Field>
              <Field label="Пояснение"><textarea rows={4} value={content.site.reviewsText} onChange={(e) => patchSite({ reviewsText: e.target.value })} /></Field>
              <MediaField label="Фоновое изображение отзыва" value={content.site.reviewImage} onChange={(value) => patchSite({ reviewImage: value })} />
            </EditorSection>
            <EditorSection title="Услуги и стоимость" code="HOME / SERVICES">
              <Field label="Заголовок"><input value={content.site.servicesTitle} onChange={(e) => patchSite({ servicesTitle: e.target.value })} /></Field>
              <Field label="Пояснение"><textarea rows={4} value={content.site.servicesText} onChange={(e) => patchSite({ servicesText: e.target.value })} /></Field>
              {content.site.services.map((service, index) => <div className="admin-array-card admin-service-fields" key={service.id}><input value={service.title} onChange={(e) => patchSite({ services: content.site.services.map((item, itemIndex) => itemIndex === index ? { ...item, title: e.target.value } : item) })} /><textarea rows={3} value={service.text} onChange={(e) => patchSite({ services: content.site.services.map((item, itemIndex) => itemIndex === index ? { ...item, text: e.target.value } : item) })} /><input value={service.time} onChange={(e) => patchSite({ services: content.site.services.map((item, itemIndex) => itemIndex === index ? { ...item, time: e.target.value } : item) })} /><input value={service.price} onChange={(e) => patchSite({ services: content.site.services.map((item, itemIndex) => itemIndex === index ? { ...item, price: e.target.value } : item) })} /><input value={service.priceSecondary} onChange={(e) => patchSite({ services: content.site.services.map((item, itemIndex) => itemIndex === index ? { ...item, priceSecondary: e.target.value } : item) })} /></div>)}
            </EditorSection>
            <EditorSection title="Небольшие задачи" code="HOME / QUICK START">
              <Field label="Заголовок"><input value={content.site.smallTasksTitle} onChange={(e) => patchSite({ smallTasksTitle: e.target.value })} /></Field>
              {content.site.smallTasks.map((task, index) => <div className="admin-array-card admin-task-fields" key={task.id}><input value={task.title} onChange={(e) => patchSite({ smallTasks: content.site.smallTasks.map((item, itemIndex) => itemIndex === index ? { ...item, title: e.target.value } : item) })} /><textarea rows={3} value={task.text} onChange={(e) => patchSite({ smallTasks: content.site.smallTasks.map((item, itemIndex) => itemIndex === index ? { ...item, text: e.target.value } : item) })} /><textarea rows={4} value={task.deliverable} onChange={(e) => patchSite({ smallTasks: content.site.smallTasks.map((item, itemIndex) => itemIndex === index ? { ...item, deliverable: e.target.value } : item) })} /><input value={task.time} onChange={(e) => patchSite({ smallTasks: content.site.smallTasks.map((item, itemIndex) => itemIndex === index ? { ...item, time: e.target.value } : item) })} /><input value={task.price} onChange={(e) => patchSite({ smallTasks: content.site.smallTasks.map((item, itemIndex) => itemIndex === index ? { ...item, price: e.target.value } : item) })} /></div>)}
            </EditorSection>
            <EditorSection title="Контакты и подвал" code="HOME / CONTACT">
              <div className="admin-inline-fields"><Field label="Призыв"><input value={content.site.contactTitle} onChange={(e) => patchSite({ contactTitle: e.target.value })} /></Field><Field label="Кнопка"><input value={content.site.contactButton} onChange={(e) => patchSite({ contactButton: e.target.value })} /></Field></div>
              <Field label="Email"><input type="email" value={content.site.email} onChange={(e) => patchSite({ email: e.target.value })} /></Field>
              <div className="admin-inline-fields"><Field label="Telegram"><input value={content.site.telegramUrl} onChange={(e) => patchSite({ telegramUrl: e.target.value })} /></Field><Field label="VK"><input value={content.site.vkUrl} onChange={(e) => patchSite({ vkUrl: e.target.value })} /></Field><Field label="MAX"><input value={content.site.maxUrl} onChange={(e) => patchSite({ maxUrl: e.target.value })} /></Field></div>
              <div className="admin-inline-fields"><Field label="Kwork"><input value={content.site.kworkUrl} onChange={(e) => patchSite({ kworkUrl: e.target.value })} /></Field><Field label="FL"><input value={content.site.flUrl} onChange={(e) => patchSite({ flUrl: e.target.value })} /></Field></div>
            </EditorSection>
            <div className="admin-editor-actions"><button className="button" disabled={saving} onClick={() => persist(content, "Тексты сайта обновлены")}>Сохранить изменения <span>↗</span></button></div>
          </div>
        )}
      </main>
    </section>
  );
}

function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={wide ? "is-wide" : ""}><span>{label}</span>{children}</label>;
}

function EditorSection({ title, code, children }: { title: string; code: string; children: React.ReactNode }) {
  return <section className="admin-editor-section"><div><span>{code}</span><h3>{title}</h3></div><div>{children}</div></section>;
}

function MediaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
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
    <div className="admin-media-field">
      <span>{label}</span>
      <div className="admin-media-preview">{value ? <img src={value} alt="" /> : <i>Нет изображения</i>}</div>
      <label className="admin-media-upload"><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={upload} disabled={uploading} /><span>{uploading ? "Загружаю…" : "Загрузить файл"}</span></label>
      {error && <small>{error}</small>}
    </div>
  );
}
