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
  return { id: `portfolio-${Date.now()}`, title: "Новая работа", description: "Короткое описание проекта", image: "", url: "#", platform: "", tags: ["", ""], filters: [], homePlacement: "hidden", portfolioPlacement: "archive", published: true, order: (count + 1) * 10 };
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

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value)).replace(" г.", "");
}

export function AdminStudio({ authenticated, initialContent }: { authenticated: boolean; initialContent: AdminContent | null }) {
  const [isAuthenticated, setIsAuthenticated] = useState(authenticated);
  const [content, setContent] = useState(initialContent);
  const [tab, setTab] = useState<Tab>("site");
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [loginError, setLoginError] = useState("");

  const pendingReviews = content?.reviews.filter((item) => item.status === "pending").length ?? 0;
  const activeReview = content?.reviews.find((item) => item.id === selectedReview) ?? content?.reviews[1] ?? content?.reviews[0] ?? null;
  const activePortfolio = content?.site.portfolioProjects.find((item) => item.id === selectedPortfolio) ?? content?.site.portfolioProjects[0] ?? null;

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
    <section className={`admin-studio ${tab === "site" ? "is-site-tab" : tab === "reviews" ? "is-reviews-tab" : ""}`}>
      <aside className="admin-sidebar admin-unified-sidebar">
        <nav aria-label="Разделы админки">
          {([
            ["site", "Главная страница", "01"],
            ["portfolio", "Портфолио", String(content.site.portfolioProjects.length).padStart(2, "0")],
            ["reviews", "Отзывы", String(pendingReviews).padStart(2, "0")],
          ] as const).map(([id, label, count]) => (
            <button className={tab === id ? "is-active" : ""} onClick={() => setTab(id)} key={id}><span>{label}</span><i>{count}</i></button>
          ))}
        </nav>
        <div className="admin-sidebar-foot admin-site-actions">
          <Link href="/" target="_blank">Открыть сайт <Image src="/assets/figma/admin-asset-3.svg" width={14} height={14} alt="" /></Link>
          <button className="admin-sidebar-save" disabled={saving} onClick={() => persist(content, "Изменения сохранены")}>{saving ? "Сохраняю…" : "Сохранить изменения"}</button>
          {notice && <span role="status">{notice}</span>}
        </div>
      </aside>

      <main className="admin-main">
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
                  </div></details>}
                </div>
              ) : <div className="admin-empty-panel"><p>Добавьте первую работу.</p></div>}
            </div>
          </div>
        )}

        {tab === "reviews" && (
          <div className="admin-view admin-reviews-view">
            <h1>Отзывы</h1>
            <div className="admin-reviews-layout">
              <div className="admin-review-list">
                {[...content.reviews].sort((a, b) => a.order - b.order).map((item) => (
                  <button className={activeReview?.id === item.id ? "is-active" : ""} onClick={() => setSelectedReview(item.id)} key={item.id}>
                    <strong>{item.author.name}</strong>
                    <small><span>{item.author.company}</span><i />{formatReviewDate(item.submittedAt)}</small>
                  </button>
                ))}
              </div>
              {activeReview ? (
                <div className="admin-review-editor">
                  <div className="admin-review-editor-head"><h2>{activeReview.author.name}</h2><button type="button" aria-label="Удалить отзыв" onClick={() => deleteReview(activeReview.id)}><Image src="/assets/figma/reviews-admin-trash.svg" width={28} height={28} alt="" /></button></div>
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
                {content.site.heroGallery.map((image, index) => <GalleryMediaField key={index} label={`Фото ${index + 1}`} value={image} onChange={(value) => patchMediaArray("heroGallery", index, value)} />)}
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

function EditorSection({ title, code, children }: { title: string; code: string; children: React.ReactNode }) {
  return <section className="admin-editor-section"><div><span>{code}</span><h3>{title}</h3></div><div>{children}</div></section>;
}

function PortfolioRadioGroup({ name, value, options, onChange }: { name: string; value: string; options: [string, string][]; onChange: (value: string) => void }) {
  return <div className="admin-placement-options">{options.map(([id, label]) => <label key={id}><input type="radio" name={name} value={id} checked={value === id} onChange={(event) => onChange(event.target.value)} /><span>{label}</span></label>)}</div>;
}

function SiteCard({ title, className = "", children }: { title: string; className?: string; children: React.ReactNode }) {
  return <section className={`admin-site-card ${className}`}><h3>{title}</h3><div>{children}</div></section>;
}

function GalleryMediaField({ label, value, onChange, className = "", emptyLabel = "Добавить", iconSrc = "/assets/figma/admin-asset-2.svg" }: { label: string; value: string; onChange: (value: string) => void; className?: string; emptyLabel?: string; iconSrc?: string }) {
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

  return <div className={`admin-gallery-field ${value ? "has-image" : "is-empty"} ${className}`}>
    <label aria-label={`${value ? "Заменить" : "Добавить"}: ${label}`}>
      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={upload} disabled={uploading} />
      {value ? <img className="admin-gallery-image" src={value} alt="" /> : <span className="admin-gallery-empty">+</span>}
      <span className="admin-gallery-hover"><Image src={iconSrc} width={42} height={42} alt="" /><b>{uploading ? "Загружаю…" : value ? "Заменить" : emptyLabel}</b></span>
    </label>
    {error && <small>{error}</small>}
  </div>;
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
