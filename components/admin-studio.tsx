"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import type { AdminContent } from "@/lib/content-store";
import type { CaseStudy } from "@/lib/cases";
import type { VerifiedReview } from "@/lib/reviews";

type Tab = "overview" | "cases" | "reviews" | "site";

function blankCase(count: number): CaseStudy {
  const now = new Date().toISOString();
  return {
    slug: `new-project-${count + 1}`,
    index: String(count + 1).padStart(2, "0"),
    title: "Новый проект",
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function AdminStudio({ authenticated, initialContent }: { authenticated: boolean; initialContent: AdminContent | null }) {
  const [isAuthenticated, setIsAuthenticated] = useState(authenticated);
  const [content, setContent] = useState(initialContent);
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [loginError, setLoginError] = useState("");

  const pendingReviews = content?.reviews.filter((item) => item.status === "pending").length ?? 0;
  const activeCase = content?.cases.find((item) => item.slug === selectedCase) ?? null;
  const activeReview = content?.reviews.find((item) => item.id === selectedReview) ?? null;

  const stats = useMemo(() => content ? [
    [String(content.cases.filter((item) => item.status === "published").length).padStart(2, "0"), "кейсов опубликовано"],
    [String(content.cases.filter((item) => item.status === "draft").length).padStart(2, "0"), "черновиков"],
    [String(pendingReviews).padStart(2, "0"), "отзывов ждут решения"],
  ] : [], [content, pendingReviews]);

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

  function patchCase(slug: string, patch: Partial<CaseStudy>) {
    if (!content) return;
    setContent({ ...content, cases: content.cases.map((item) => item.slug === slug ? { ...item, ...patch } : item) });
  }

  function updateCaseArray(slug: string, key: "verified" | "decisions", index: number, value: string, subKey?: "title" | "text") {
    if (!activeCase) return;
    if (key === "verified") {
      const verified = [...activeCase.verified];
      verified[index] = value;
      patchCase(slug, { verified });
      return;
    }
    const decisions = activeCase.draft.decisions.map((item, itemIndex) => itemIndex === index ? { ...item, [subKey ?? "text"]: value } : item);
    patchCase(slug, { draft: { ...activeCase.draft, decisions } });
  }

  function createCase() {
    if (!content) return;
    const item = blankCase(content.cases.length);
    setContent({ ...content, cases: [...content.cases, item] });
    setSelectedCase(item.slug);
    setTab("cases");
  }

  async function saveCase() {
    if (!content || !activeCase) return;
    const now = new Date().toISOString();
    const next = { ...content, cases: content.cases.map((item) => item.slug === activeCase.slug ? { ...item, updatedAt: now } : item) };
    await persist(next, activeCase.status === "published" ? "Кейс обновлён на сайте" : "Черновик сохранён");
  }

  async function deleteCase(slug: string) {
    if (!content || !window.confirm("Удалить кейс без возможности восстановления?")) return;
    setSelectedCase(null);
    await persist({ ...content, cases: content.cases.filter((item) => item.slug !== slug) }, "Кейс удалён");
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

  if (!isAuthenticated || !content) {
    return (
      <section className="admin-login shell">
        <div className="admin-login-code">ZK / CONTROL</div>
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
        <div className="admin-sidebar-head"><span>ZK</span><div><strong>Control room</strong><small>CONTENT / SYSTEM</small></div></div>
        <nav aria-label="Разделы админки">
          {([
            ["overview", "Обзор", "01"],
            ["cases", "Кейсы", String(content.cases.length).padStart(2, "0")],
            ["reviews", "Отзывы", String(pendingReviews).padStart(2, "0")],
            ["site", "Сайт", "04"],
          ] as const).map(([id, label, count]) => (
            <button className={tab === id ? "is-active" : ""} onClick={() => setTab(id)} key={id}><span>{label}</span><i>{count}</i></button>
          ))}
        </nav>
        <div className="admin-sidebar-foot"><Link href="/" target="_blank">Открыть сайт ↗</Link><button onClick={logout}>Выйти</button></div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div><span>ADMIN / {tab.toUpperCase()}</span><strong>{tab === "overview" ? "Центр управления" : tab === "cases" ? "Каталог кейсов" : tab === "reviews" ? "Модерация отзывов" : "Редактор сайта"}</strong></div>
          <div className="admin-save-state"><i className={saving ? "is-saving" : ""} />{saving ? "Сохраняю…" : notice || `Обновлено ${formatDate(content.updatedAt)}`}</div>
        </header>

        {tab === "overview" && (
          <div className="admin-view admin-overview">
            <div className="admin-view-intro"><span>STATUS / LIVE</span><h1>Сайт под<br /><em>контролем</em></h1><p>Контент хранится отдельно от кода. Изменения опубликованных материалов появляются на сайте сразу после сохранения.</p></div>
            <div className="admin-stats">{stats.map(([value, label]) => <article key={label}><strong>{value}</strong><span>{label}</span></article>)}</div>
            <div className="admin-quick-grid">
              <button onClick={createCase}><span>NEW / CASE</span><strong>Добавить новый кейс</strong><i>↗</i></button>
              <button onClick={() => setTab("reviews")}><span>REVIEW / QUEUE</span><strong>{pendingReviews ? `${pendingReviews} ждут модерации` : "Очередь пуста"}</strong><i>→</i></button>
              <button onClick={() => setTab("site")}><span>LIVE / COPY</span><strong>Изменить тексты сайта</strong><i>→</i></button>
            </div>
          </div>
        )}

        {tab === "cases" && (
          <div className="admin-view">
            <div className="admin-list-head"><div><span>PROJECT / LIBRARY</span><h1>Кейсы</h1></div><button className="admin-add-button" onClick={createCase}>+ Новый кейс</button></div>
            <div className="admin-split-view">
              <div className="admin-entity-list">
                {content.cases.map((item) => (
                  <button className={selectedCase === item.slug ? "is-active" : ""} onClick={() => setSelectedCase(item.slug)} key={item.slug}>
                    <span className={`admin-status-dot is-${item.status}`} />
                    <div><strong>{item.title}</strong><small>{item.eyebrow}</small></div>
                    <span>{item.status === "published" ? "На сайте" : "Черновик"}</span>
                  </button>
                ))}
              </div>
              {activeCase ? (
                <div className="admin-editor">
                  <div className="admin-editor-head"><div><span>CASE / {activeCase.index}</span><h2>{activeCase.title}</h2></div><button className="admin-danger" onClick={() => deleteCase(activeCase.slug)}>Удалить</button></div>
                  <div className="admin-publish-row">
                    <label><input type="checkbox" checked={activeCase.status === "published"} onChange={(event) => patchCase(activeCase.slug, { status: event.target.checked ? "published" : "draft" })} /><span>Опубликован на сайте</span></label>
                    <label><input type="checkbox" checked={activeCase.featured} onChange={(event) => patchCase(activeCase.slug, { featured: event.target.checked })} /><span>Показывать на главной</span></label>
                  </div>
                  <div className="admin-fields">
                    <Field label="Название"><input value={activeCase.title} onChange={(e) => patchCase(activeCase.slug, { title: e.target.value })} /></Field>
                    <Field label="URL-адрес"><input value={activeCase.slug} onChange={(e) => { const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"); patchCase(activeCase.slug, { slug }); setSelectedCase(slug); }} /></Field>
                    <Field label="Номер"><input value={activeCase.index} onChange={(e) => patchCase(activeCase.slug, { index: e.target.value })} /></Field>
                    <Field label="Год"><input value={activeCase.year} onChange={(e) => patchCase(activeCase.slug, { year: e.target.value })} /></Field>
                    <Field label="Категория"><select value={activeCase.category} onChange={(e) => patchCase(activeCase.slug, { category: e.target.value as CaseStudy["category"] })}><option value="corporate">Корпоративный</option><option value="commerce">E-commerce</option></select></Field>
                    <Field label="Цвет"><select value={activeCase.accent} onChange={(e) => patchCase(activeCase.slug, { accent: e.target.value as CaseStudy["accent"] })}><option value="green">Зелёный</option><option value="orange">Оранжевый</option><option value="coral">Коралловый</option></select></Field>
                    <Field wide label="Подпись формата"><input value={activeCase.eyebrow} onChange={(e) => patchCase(activeCase.slug, { eyebrow: e.target.value })} /></Field>
                    <Field wide label="Короткое описание"><textarea rows={3} value={activeCase.summary} onChange={(e) => patchCase(activeCase.slug, { summary: e.target.value })} /></Field>
                    <Field wide label="Задача для каталога"><textarea rows={3} value={activeCase.catalogTask} onChange={(e) => patchCase(activeCase.slug, { catalogTask: e.target.value })} /></Field>
                    <Field wide label="Моя роль"><input value={activeCase.role} onChange={(e) => patchCase(activeCase.slug, { role: e.target.value })} /></Field>
                    <Field wide label="Ссылка на живой сайт"><input type="url" value={activeCase.url} onChange={(e) => patchCase(activeCase.slug, { url: e.target.value })} /></Field>
                  </div>
                  <EditorSection title="Что сделано" code="FACTS / 03">{activeCase.verified.map((fact, index) => <input key={index} value={fact} onChange={(e) => updateCaseArray(activeCase.slug, "verified", index, e.target.value)} />)}</EditorSection>
                  <EditorSection title="Разбор проекта" code="STORY / LONG">
                    <Field label="Исходная задача"><textarea rows={5} value={activeCase.draft.challenge} onChange={(e) => patchCase(activeCase.slug, { draft: { ...activeCase.draft, challenge: e.target.value } })} /></Field>
                    <Field label="Подход"><textarea rows={5} value={activeCase.draft.approach} onChange={(e) => patchCase(activeCase.slug, { draft: { ...activeCase.draft, approach: e.target.value } })} /></Field>
                    {activeCase.draft.decisions.map((decision, index) => <div className="admin-decision-fields" key={index}><input value={decision.title} onChange={(e) => updateCaseArray(activeCase.slug, "decisions", index, e.target.value, "title")} /><textarea rows={3} value={decision.text} onChange={(e) => updateCaseArray(activeCase.slug, "decisions", index, e.target.value, "text")} /></div>)}
                    <Field label="Результат"><textarea rows={5} value={activeCase.draft.result} onChange={(e) => patchCase(activeCase.slug, { draft: { ...activeCase.draft, result: e.target.value } })} /></Field>
                  </EditorSection>
                  <div className="admin-editor-actions"><button className="button" disabled={saving} onClick={saveCase}>Сохранить кейс <span>↗</span></button><Link href={`/cases/${activeCase.slug}`} target="_blank">Предпросмотр ↗</Link></div>
                </div>
              ) : <div className="admin-empty-panel"><span>←</span><p>Выберите кейс для редактирования<br />или создайте новый.</p></div>}
            </div>
          </div>
        )}

        {tab === "reviews" && (
          <div className="admin-view">
            <div className="admin-list-head"><div><span>TRUST / MODERATION</span><h1>Отзывы</h1></div><p>{pendingReviews} требуют решения</p></div>
            <div className="admin-split-view">
              <div className="admin-entity-list admin-review-list">
                {content.reviews.map((item) => (
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
                  <div className="admin-review-proof"><a href={activeReview.project.url} target="_blank" rel="noreferrer">Проект: {activeReview.project.name} ↗</a><a href={activeReview.profile.url} target="_blank" rel="noreferrer">Профиль: {activeReview.profile.label} ↗</a></div>
                  <div className="admin-fields">
                    <Field label="Имя"><input value={activeReview.author.name} onChange={(e) => patchReview(activeReview.id, { author: { ...activeReview.author, name: e.target.value } })} /></Field>
                    <Field label="Компания"><input value={activeReview.author.company} onChange={(e) => patchReview(activeReview.id, { author: { ...activeReview.author, company: e.target.value } })} /></Field>
                    <Field wide label="Текст отзыва"><textarea rows={7} value={activeReview.text} onChange={(e) => patchReview(activeReview.id, { text: e.target.value })} /></Field>
                  </div>
                  <div className="admin-review-actions"><button onClick={() => setReviewStatus(activeReview.id, "published")}>✓ Одобрить и опубликовать</button><button onClick={() => setReviewStatus(activeReview.id, "rejected")}>× Отклонить</button><button onClick={() => content && persist(content, "Изменения отзыва сохранены")}>Сохранить правки</button></div>
                </div>
              ) : <div className="admin-empty-panel"><span>←</span><p>Выберите отзыв.<br />Перед публикацией проверьте ссылки и согласие.</p></div>}
            </div>
          </div>
        )}

        {tab === "site" && (
          <div className="admin-view admin-site-editor">
            <div className="admin-list-head"><div><span>PUBLIC / COPY</span><h1>Сайт</h1></div><Link href="/" target="_blank">Открыть сайт ↗</Link></div>
            <EditorSection title="Первый экран" code="HOME / HERO">
              <Field label="Первая строка"><input value={content.site.heroTitle} onChange={(e) => setContent({ ...content, site: { ...content.site, heroTitle: e.target.value } })} /></Field>
              <Field label="Акцентная строка"><input value={content.site.heroAccent} onChange={(e) => setContent({ ...content, site: { ...content.site, heroAccent: e.target.value } })} /></Field>
              <Field label="Вводный текст"><textarea rows={4} value={content.site.heroLead} onChange={(e) => setContent({ ...content, site: { ...content.site, heroLead: e.target.value } })} /></Field>
            </EditorSection>
            <EditorSection title="Обо мне" code="HOME / ABOUT">
              <Field label="Главная мысль"><textarea rows={4} value={content.site.aboutLead} onChange={(e) => setContent({ ...content, site: { ...content.site, aboutLead: e.target.value } })} /></Field>
              <Field label="Описание"><textarea rows={5} value={content.site.aboutText} onChange={(e) => setContent({ ...content, site: { ...content.site, aboutText: e.target.value } })} /></Field>
            </EditorSection>
            <EditorSection title="Форматы работы" code="HOME / SERVICES">
              {content.site.services.map((service, index) => <div className="admin-service-fields" key={service.id}><input value={service.title} onChange={(e) => setContent({ ...content, site: { ...content.site, services: content.site.services.map((item, itemIndex) => itemIndex === index ? { ...item, title: e.target.value } : item) } })} /><textarea rows={3} value={service.text} onChange={(e) => setContent({ ...content, site: { ...content.site, services: content.site.services.map((item, itemIndex) => itemIndex === index ? { ...item, text: e.target.value } : item) } })} /><input value={service.price} onChange={(e) => setContent({ ...content, site: { ...content.site, services: content.site.services.map((item, itemIndex) => itemIndex === index ? { ...item, price: e.target.value } : item) } })} /><input value={service.time} onChange={(e) => setContent({ ...content, site: { ...content.site, services: content.site.services.map((item, itemIndex) => itemIndex === index ? { ...item, time: e.target.value } : item) } })} /></div>)}
            </EditorSection>
            <EditorSection title="Форма заявки" code="HOME / CONTACT">
              <Field label="Первая строка"><input value={content.site.contactTitle} onChange={(e) => setContent({ ...content, site: { ...content.site, contactTitle: e.target.value } })} /></Field>
              <Field label="Акцентная строка"><input value={content.site.contactAccent} onChange={(e) => setContent({ ...content, site: { ...content.site, contactAccent: e.target.value } })} /></Field>
              <Field label="Описание"><textarea rows={4} value={content.site.contactText} onChange={(e) => setContent({ ...content, site: { ...content.site, contactText: e.target.value } })} /></Field>
              <Field label="Стоимость от"><input value={content.site.contactPrice} onChange={(e) => setContent({ ...content, site: { ...content.site, contactPrice: e.target.value } })} /></Field>
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
