import type { Metadata } from "next";
import Image from "next/image";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { StyleQuiz } from "@/components/style-quiz";
import styles from "@/components/style-check.module.css";

export const metadata: Metadata = {
  title: "Выбрать стиль",
  description: "Выберите визуальные направления, которые подходят для будущего сайта.",
  alternates: { canonical: "/style-check" },
};

const hints = [
  {
    title: "Оцените направление целиком",
    text: "Сначала выберите общее впечатление: нравится, не нравится или пока сложно определиться.",
    activeMarks: 1,
  },
  {
    title: "Отметьте, что именно понравилось",
    text: "Выберите детали, которые вам близки: цвет, шрифты, композицию или графику.",
    activeMarks: 2,
  },
  {
    title: <>Не ищите<br />готовый дизайн</>,
    text: "Примеры нужны как ориентиры, чтобы точнее понять ваши визуальные предпочтения.",
    activeMarks: 3,
  },
] as const;

export default function StyleCheckPage() {
  return (
    <div className={`style-check-page ${styles.page}`} id="top">
      <section className={styles.intro} aria-labelledby="style-page-title">
        <div className={styles.introTop}>
          <div>
            <Breadcrumbs current="Выбрать стиль" />
            <h1 id="style-page-title">Найдём стиль,<br />который вам подходит</h1>
          </div>
          <p>Выберите примеры, которые вам ближе по настроению и визуалу. По ответам я пойму, какие цвета, типографика, композиция и характер интерфейса лучше подойдут для будущего сайта.</p>
        </div>

        <div className={styles.hints}>
          {hints.map((hint) => (
            <article key={typeof hint.title === "string" ? hint.title : hint.text}>
              <div>
                <h2>{hint.title}</h2>
                <span className={styles.marks} aria-hidden="true">
                  {[0, 1, 2].map((mark) => (
                    <Image key={mark} src={mark < hint.activeMarks ? "/assets/figma/logo2.svg" : "/assets/figma/logo3.svg"} width={20} height={20} alt="" />
                  ))}
                </span>
              </div>
              <p>{hint.text}</p>
            </article>
          ))}
        </div>
      </section>

      <StyleQuiz />
    </div>
  );
}
