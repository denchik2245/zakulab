import type { Metadata } from "next";
import { LabMark } from "@/components/marks";
import { ReviewForm } from "@/components/review-form";
import { ReviewCard } from "@/components/review-card";
import { getPublishedReviews } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Отзывы клиентов",
  description: "Проверенные отзывы клиентов о работе с Денисом Закусиловым.",
};

export default async function ReviewsPage() {
  const verifiedReviews = await getPublishedReviews();
  const hasDemoReviews = verifiedReviews.some((review) => review.status === "demo");

  return (
    <>
      <section className="subpage-hero shell">
        <div className="reviews-hero-meta"><LabMark>CLIENT / PROOF</LabMark><span>{verifiedReviews.length.toString().padStart(2, "0")} {hasDemoReviews ? "демо-карточки" : "опубликовано"}</span></div>
        <h1>Отзывы, за которыми<br /><em>стоят люди</em></h1>
        <p>Каждый отзыв связан с реальным проектом и публичным профилем автора. Никаких анонимных цитат и неподтверждённых имён.</p>
      </section>

      <section className="review-trust-protocol">
        <div className="shell review-trust-grid">
          <div><LabMark>TRUST / PROTOCOL</LabMark><h2>Что можно<br /><em>проверить</em></h2></div>
          <ol>
            <li><span>01</span><div><strong>Личность автора</strong><p>Имя связано с публичным профилем в соцсети или мессенджере.</p></div></li>
            <li><span>02</span><div><strong>Реальный проект</strong><p>У отзыва есть ссылка на запущенный сайт и, когда доступно, подробный кейс.</p></div></li>
            <li><span>03</span><div><strong>Согласие на публикацию</strong><p>Автор заранее разрешает показать текст, имя, компанию и свой профиль.</p></div></li>
            <li><span>04</span><div><strong>Смысл без редакции</strong><p>Я не превращаю отзыв в рекламный текст. Содержательные изменения согласуются с автором.</p></div></li>
          </ol>
        </div>
      </section>

      <section className="verified-reviews-section section shell">
        <div className="section-kicker"><LabMark>PUBLIC / REVIEWS</LabMark><span>Проверенные отзывы</span></div>
        {hasDemoReviews && (
          <div className="reviews-demo-notice">
            <span>DEMO / 03</span>
            <p><strong>Это временные примеры.</strong> Имена, компании, тексты и ссылки вымышлены и добавлены только для просмотра дизайна карточек. Перед публикацией сайта их нужно заменить реальными проверенными отзывами.</p>
          </div>
        )}
        {verifiedReviews.length > 0 ? (
          <div className="verified-reviews-list">
            {verifiedReviews.map((review, index) => <ReviewCard review={review} index={index} key={review.id} />)}
          </div>
        ) : (
          <div className="reviews-empty-state">
            <span className="empty-review-count">00</span>
            <div>
              <h2>Здесь пока нет<br />опубликованных отзывов</h2>
              <p>Я не заполняю страницу выдуманными цитатами ради красивой сетки. Первый отзыв появится здесь только после проверки автора, проекта и согласия на публикацию профиля.</p>
              <a href="#leave-review">Оставить первый проверенный отзыв ↓</a>
            </div>
          </div>
        )}
      </section>

      <section className="review-submit-section">
        <div className="shell review-submit-grid" id="leave-review">
          <div>
            <LabMark>LEAVE / REVIEW</LabMark>
            <h2>Работали<br /><em>вместе?</em></h2>
            <p>Расскажите, что было важно в процессе и что получилось. Для подтверждения понадобится ссылка на проект и публичный профиль.</p>
            <div className="review-public-note"><span>Важно</span><p>Телефон и email не публикуются. Посетители увидят только ту публичную страницу, которую вы сами укажете и разрешите показать.</p></div>
            <p className="review-policy">Отзыв появится на сайте только после ручной проверки. Анонимные отзывы не публикуются.</p>
          </div>
          <ReviewForm />
        </div>
      </section>
    </>
  );
}
