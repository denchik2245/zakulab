import type { Metadata } from "next";
import { LabMark } from "@/components/marks";
import { ReviewForm } from "@/components/review-form";

export const metadata: Metadata = {
  title: "Отзывы клиентов",
  description: "Проверенные отзывы клиентов о работе с Денисом Закусиловым.",
};

export default function ReviewsPage() {
  return (
    <>
      <section className="subpage-hero shell">
        <LabMark>CLIENT / NOTES</LabMark>
        <h1>Отзывы без<br /><em>анонимности</em></h1>
        <p>Публикую только отзывы реальных клиентов после ручной проверки имени, компании и проекта.</p>
      </section>
      <section className="reviews-grid section shell">
        {[1, 2, 3].map((number) => (
          <article className="review-placeholder" key={number}>
            <span>0{number} / VERIFIED SOON</span>
            <blockquote>«[УТОЧНИТЬ] Здесь будет опубликован отзыв клиента с конкретикой о совместной работе и результате проекта».</blockquote>
            <div><strong>Имя клиента</strong><span>Компания · должность</span></div>
          </article>
        ))}
      </section>
      <section className="review-submit-section">
        <div className="shell review-submit-grid">
          <div>
            <LabMark>LEAVE / REVIEW</LabMark>
            <h2>Работали<br /><em>вместе?</em></h2>
            <p>Расскажите, что было важно в процессе и что получилось. Контакт нужен только для проверки и не публикуется.</p>
            <p className="review-policy">Отзыв появится на сайте только после ручной модерации. Анонимные отзывы не публикуются.</p>
          </div>
          <ReviewForm />
        </div>
      </section>
    </>
  );
}
