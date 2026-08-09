import type { Metadata } from "next";
import { LabMark } from "@/components/marks";
import { StyleQuiz } from "@/components/style-quiz";

export const metadata: Metadata = {
  title: "Визуальный тест",
  description: "Короткий тест, который помогает определить подходящий визуальный стиль будущего сайта.",
  alternates: { canonical: "/style-check" },
};

export default function StyleCheckPage() {
  return (
    <>
      <section className="style-page-hero shell">
        <div className="style-hero-meta">
          <LabMark>VISUAL / DIRECTION</LabMark>
          <span>8 направлений · 3–4 минуты</span>
        </div>
        <h1>Покажите,<br />что вам <em>близко</em></h1>
        <div className="style-hero-bottom">
          <p>Если у вас нет готовых примеров — это нормально. Оцените несколько контрастных направлений, а я переведу ваши реакции в полезные ориентиры для дизайна.</p>
          <div className="style-hero-scale" aria-hidden="true"><span>LIKE</span><i /><span>AVOID</span></div>
        </div>
      </section>
      <div className="style-lab-section">
        <div className="shell"><StyleQuiz /></div>
      </div>
      <section className="style-explainer shell">
        <div><LabMark>HOW / I USE IT</LabMark><h2>Что я получу<br /><em>из ответов</em></h2></div>
        <div className="style-explainer-list">
          <article><span>01</span><h3>Направление</h3><p>Пойму, насколько спокойным, выразительным, плотным и эмоциональным должен быть будущий сайт.</p></article>
          <article><span>02</span><h3>Конкретные детали</h3><p>Увижу, на что вы реагируете: цвет, типографику, композицию, графику, плотность или эффекты.</p></article>
          <article><span>03</span><h3>Антипримеры</h3><p>Зафиксирую не только предпочтения, но и решения, которых точно стоит избегать в первой концепции.</p></article>
        </div>
      </section>
    </>
  );
}
