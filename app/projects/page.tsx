import type { Metadata } from "next";
import Link from "next/link";
import { Arrow, LabMark } from "@/components/marks";
import { ProjectCatalog } from "@/components/project-catalog";
import { getPublishedCases } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Проекты и кейсы",
  description: "Каталог сайтов Дениса Закусилова: корпоративные проекты, B2B-сервисы и интернет-магазины с разбором задач и решений.",
  alternates: { canonical: "/projects" },
};

const principles = [
  {
    number: "01",
    title: "Смотрим на задачу",
    text: "В каждом проекте сначала показан контекст бизнеса, а не набор красивых экранов.",
  },
  {
    number: "02",
    title: "Объясняем решения",
    text: "Внутри кейса можно проследить логику структуры, интерфейса и визуальной системы.",
  },
  {
    number: "03",
    title: "Фиксируем роль",
    text: "Отдельно обозначено, за какие части проекта я отвечал лично и что было сделано.",
  },
];

export default async function ProjectsPage() {
  const cases = await getPublishedCases();
  return (
    <>
      <section className="projects-hero shell">
        <div className="projects-hero-meta">
          <LabMark>PROJECT / INDEX</LabMark>
          <span>{String(cases.length).padStart(2, "0")} опубликованных кейса · 2025</span>
        </div>

        <div className="projects-hero-title">
          <span className="projects-hero-code" aria-hidden="true">ZK—{String(cases.length).padStart(2, "0")}</span>
          <h1>Каталог<br /><em>проектов</em></h1>
        </div>

        <div className="projects-hero-bottom">
          <p>Здесь не галерея экранов, а разбор реальных задач: что требовалось бизнесу, какую логику я предложил и за что отвечал в проекте.</p>
          <Link className="text-link" href="#catalog">Перейти к проектам <Arrow /></Link>
        </div>
      </section>

      <ProjectCatalog cases={cases} />

      <section className="catalog-method section">
        <div className="shell">
          <div className="section-kicker">
            <LabMark>READ / THE / WORK</LabMark>
            <span>Как устроены кейсы</span>
          </div>
          <div className="catalog-method-grid">
            <h2>Профессионализм —<br /><em>в ходе мысли</em></h2>
            <div className="catalog-principles">
              {principles.map((principle) => (
                <article key={principle.number}>
                  <span>{principle.number}</span>
                  <h3>{principle.title}</h3>
                  <p>{principle.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="catalog-cta">
        <div className="shell catalog-cta-grid">
          <LabMark>NEW / PROJECT</LabMark>
          <div>
            <h2>Не нашли проект<br /><em>точно как ваш?</em></h2>
            <p>Это нормально: решение начинается не с шаблона, а с вашей задачи. На первой встрече разберём контекст и поймём, какой формат сайта сработает лучше.</p>
            <Link className="button button-light" href="/#contact">Обсудить задачу <Arrow diagonal /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
