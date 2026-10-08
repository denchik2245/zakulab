import type { Metadata } from "next";
import Image from "next/image";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { StyleQuiz } from "@/components/style-quiz";
import styles from "@/components/style-check.module.css";
import { readContent } from "@/lib/content-store";
import { typographic } from "@/lib/typographic";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Выбор стиля",
  description: "Выберите визуальные направления, которые подходят для будущего сайта.",
  alternates: { canonical: "/style-check" },
};

const hints = [
  {
    title: "Оцените направление целиком",
    text: "Сначала выберите общее впечатление: нравится, не нравится или пока сложно определиться.",
    activeMarks: 1,
  },
  {
    title: "Отметьте, что именно понравилось",
    text: "Выберите детали, которые вам близки: цвет, шрифты, композицию или графику.",
    activeMarks: 2,
  },
  {
    title: <>Не ищите<br />готовый дизайн</>,
    text: "Примеры нужны как ориентиры, чтобы точнее понять ваши визуальные предпочтения.",
    activeMarks: 3,
  },
] as const;

export default async function StyleCheckPage() {
  const { site } = await readContent();

  return (
    <div className={`style-check-page site-mobile-layout ${styles.page}`} id="top">
      <section className={styles.intro} aria-labelledby="style-page-title">
        <div className={styles.introTop}>
          <div>
            <Breadcrumbs current="Выбрать стиль" />
            <h1 id="style-page-title">Найдём стиль,<br className={styles.desktopBreak} /> который вам подходит</h1>
          </div>
          <p>{typographic("Выберите примеры, которые вам ближе по настроению и визуалу. По ответам я пойму, какие цвета, типографика, композиция и характер интерфейса лучше подойдут для будущего сайта.")}</p>
        </div>

        <div className={styles.hints}>
          {hints.map((hint) => (
            <article key={typeof hint.title === "string" ? hint.title : hint.text}>
              <div>
                <h2>{hint.title}</h2>
                <span className={styles.marks} aria-hidden="true">
                  {[0, 1, 2].map((mark) => (
                    <picture key={mark}>
                      <source media="(max-width: 960px)" srcSet={mark < hint.activeMarks ? "/assets/figma/style-mark-active-mobile.svg" : "/assets/figma/style-mark-muted-mobile.svg"} />
                      <Image src={mark < hint.activeMarks ? "/assets/figma/logo2.svg" : "/assets/figma/logo3.svg"} width={20} height={20} alt="" />
                    </picture>
                  ))}
                </span>
              </div>
              <p>{typographic(hint.text)}</p>
            </article>
          ))}
        </div>
      </section>

      <StyleQuiz settings={site.styleChoice} popups={site.popups} socialLinks={{ telegramUrl: site.telegramUrl, maxUrl: site.maxUrl, vkUrl: site.vkUrl }} />
    </div>
  );
}
