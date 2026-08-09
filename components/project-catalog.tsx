"use client";

import { useState } from "react";
import Link from "next/link";
import { Arrow } from "@/components/marks";
import { CaseVisual } from "@/components/case-visual";
import type { CaseStudy } from "@/lib/cases";

const filters = [
  { id: "all", label: "Все проекты" },
  { id: "corporate", label: "Корпоративные" },
  { id: "commerce", label: "E-commerce" },
] as const;

type FilterId = (typeof filters)[number]["id"];

export function ProjectCatalog({ cases }: { cases: CaseStudy[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const visibleCases = activeFilter === "all"
    ? cases
    : cases.filter((item) => item.category === activeFilter);

  return (
    <section className="projects-catalog shell" id="catalog" aria-label="Каталог проектов">
      <div className="catalog-toolbar">
        <div>
          <span className="catalog-toolbar-label">Фильтр по формату</span>
          <div className="catalog-filters" aria-label="Фильтр проектов">
            {filters.map((filter) => {
              const count = filter.id === "all"
                ? cases.length
                : cases.filter((item) => item.category === filter.id).length;

              return (
                <button
                  className={activeFilter === filter.id ? "is-active" : ""}
                  type="button"
                  aria-pressed={activeFilter === filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  key={filter.id}
                >
                  {filter.label}<sup>{String(count).padStart(2, "0")}</sup>
                </button>
              );
            })}
          </div>
        </div>
        <p className="catalog-count" aria-live="polite">
          Показано <strong>{String(visibleCases.length).padStart(2, "0")}</strong>
        </p>
      </div>

      <div className="catalog-project-list">
        {visibleCases.map((item) => (
          <article className="catalog-project" key={item.slug}>
            <div className="catalog-project-rail">
              <span>{item.index} / {String(cases.length).padStart(2, "0")}</span>
              <span>{item.year}</span>
            </div>

            <Link className="catalog-project-visual" href={`/cases/${item.slug}`} aria-label={`Открыть кейс ${item.title}`}>
              <CaseVisual item={item} compact />
              <span className="catalog-open-mark" aria-hidden="true">↗</span>
            </Link>

            <div className="catalog-project-body">
              <div className="catalog-project-title">
                <span>{item.eyebrow}</span>
                <h2>{item.title}</h2>
                <p>{item.summary}</p>
              </div>

              <div className="catalog-project-evidence">
                <div className="catalog-task">
                  <span>Задача проекта</span>
                  <strong>{item.catalogTask}</strong>
                </div>
                <div className="catalog-role">
                  <span>Моя зона ответственности</span>
                  <p>{item.role}</p>
                </div>
                <ul aria-label="Что сделано в проекте">
                  {item.verified.map((fact) => <li key={fact}>{fact}</li>)}
                </ul>
              </div>

              <div className="catalog-project-actions">
                <Link className="button" href={`/cases/${item.slug}`}>
                  Разобрать кейс <Arrow diagonal />
                </Link>
                <a className="catalog-live-link" href={item.url} target="_blank" rel="noreferrer">
                  Открыть живой сайт <Arrow diagonal />
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
