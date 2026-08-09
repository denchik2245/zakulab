import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseVisual } from "@/components/case-visual";
import { LabMark, Arrow } from "@/components/marks";
import { getPublishedCase, getPublishedCases } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublishedCase(slug);
  if (!item) return {};
  return {
    title: `Кейс ${item.title}`,
    description: item.summary,
    alternates: { canonical: `/cases/${item.slug}` },
  };
}

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getPublishedCase(slug);
  if (!item) notFound();
  const cases = await getPublishedCases();
  const next = cases[(cases.findIndex((entry) => entry.slug === slug) + 1) % cases.length];

  return (
    <article className="case-page">
      <section className="case-hero shell">
        <div className="case-breadcrumb"><Link href="/projects">Все проекты</Link><span>/</span><span>{item.index}</span></div>
        <div className="case-title-row">
          <div><LabMark>{item.eyebrow.toUpperCase()}</LabMark><h1>{item.title}</h1></div>
          <p>{item.summary}</p>
        </div>
        <CaseVisual item={item} />
        <div className="case-facts">
          <div><span>Роль</span><strong>{item.role}</strong></div>
          <div><span>Год</span><strong>{item.year}</strong></div>
          <a href={item.url} target="_blank" rel="noreferrer"><span>Сайт</span><strong>Открыть проект <Arrow diagonal /></strong></a>
        </div>
      </section>

      <section className="case-story section shell">
        <div className="case-story-label"><LabMark>01 / CONTEXT</LabMark><span>Исходная задача</span></div>
        <div className="case-story-copy"><h2>Сначала —<br /><em>понять проблему</em></h2><p>{item.draft.challenge}</p></div>
      </section>

      <section className="case-proof section">
        <div className="shell proof-grid">
          <div><LabMark>VERIFIED / FACTS</LabMark><h2>Что сделано</h2></div>
          <ol>{item.verified.map((fact) => <li key={fact}>{fact}</li>)}</ol>
        </div>
      </section>

      <section className="case-story section shell">
        <div className="case-story-label"><LabMark>02 / LOGIC</LabMark><span>Подход</span></div>
        <div className="case-story-copy"><h2>Структура до<br /><em>визуального слоя</em></h2><p>{item.draft.approach}</p></div>
      </section>

      <section className="decision-section section shell">
        <div className="section-kicker"><LabMark>03 / DECISIONS</LabMark><span>Ключевые решения</span></div>
        <div className="decision-grid">
          {item.draft.decisions.map((decision, index) => (
            <article key={decision.title}><span>0{index + 1}</span><h3>{decision.title}</h3><p>{decision.text}</p></article>
          ))}
        </div>
      </section>

      <section className={`case-spread case-${item.accent}`}>
        <div className="shell">
          <p>DESIGN SYSTEM / {item.title.toUpperCase()}</p>
          <strong>{item.slug === "alts" ? "Ясность для сложной отрасли" : item.slug === "ashanti" ? "Большой выбор без перегруза" : "Аргументы вместо обещаний"}</strong>
          <div className="spread-grid"><span /><span /><span /><span /></div>
        </div>
      </section>

      <section className="case-result section shell">
        <LabMark>04 / RESULT</LabMark>
        <h2>Результат</h2>
        <p>{item.draft.result}</p>
        <span className="draft-note">Перед публикацией заменить все фрагменты [УТОЧНИТЬ] на подтверждённые данные.</span>
      </section>

      <Link className="next-case" href={`/cases/${next.slug}`}>
        <span>Следующий кейс</span><strong>{next.title}</strong><Arrow diagonal />
      </Link>
    </article>
  );
}
