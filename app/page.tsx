import Link from "next/link";
import { Arrow, LabMark } from "@/components/marks";
import { CaseVisual } from "@/components/case-visual";
import { ProjectForm } from "@/components/project-form";
import { cases } from "@/lib/cases";

const process = [
  ["01", "Разбираю задачу", "Знакомимся, обсуждаем бизнес, аудиторию, ограничения и критерии результата."],
  ["02", "Строю логику", "Исследую контекст, собираю структуру и прототип — до того, как появляется визуальный слой."],
  ["03", "Нахожу образ", "Создаю концепцию, которая помогает продукту быть понятным и отличимым."],
  ["04", "Собираю систему", "Проектирую страницы, адаптивы, состояния и правила для дальнейшего развития."],
  ["05", "Довожу до запуска", "Собираю на Tilda сам или подключаю партнёров и контролирую соответствие макетам."],
];

const services = [
  {
    number: "01",
    title: "Лендинг",
    text: "Сфокусированная страница для запуска продукта, услуги или рекламной кампании.",
    price: "от 40 000 ₽",
    time: "от 7 рабочих дней",
  },
  {
    number: "02",
    title: "Многостраничный сайт",
    text: "Понятная система для компании со сложными услугами, направлениями и разными аудиториями.",
    price: "после оценки",
    time: "от 15 рабочих дней",
  },
  {
    number: "03",
    title: "Интернет-магазин",
    text: "Каталог и сценарии покупки, которые помогают выбирать, сравнивать и возвращаться.",
    price: "индивидуально",
    time: "от 25 рабочих дней",
  },
];

export default function Home() {
  return (
    <>
      <section className="hero shell">
        <div className="hero-grid hero-meta-row">
          <LabMark>WEB / DESIGN / LAUNCH</LabMark>
          <p className="hero-intro">Денис Закусилов<br />Веб-дизайнер и руководитель проектов</p>
        </div>
        <div className="hero-title-wrap">
          <span className="hero-coordinate">56.8389° N<br />60.6057° E</span>
          <h1>Сайты, в которых<br /><em>бизнес понятен</em></h1>
          <div className="orbit-mark" aria-hidden="true"><span>ZK</span></div>
        </div>
        <div className="hero-grid hero-bottom">
          <p className="hero-lead">
            Разбираюсь в задаче, проектирую ясную структуру и довожу сайт до запуска — сам или с проверенной командой.
          </p>
          <div className="hero-actions">
            <Link className="button" href="#contact">Обсудить проект <Arrow diagonal /></Link>
            <Link className="text-link" href="#work">Посмотреть работы <Arrow /></Link>
          </div>
        </div>
        <div className="hero-ticker" aria-hidden="true">
          <span>ПОНЯТНО · СИСТЕМНО · ПО ДЕЛУ</span>
          <span>ПОНЯТНО · СИСТЕМНО · ПО ДЕЛУ</span>
        </div>
      </section>

      <section className="scenario-section section shell">
        <div className="section-kicker"><LabMark>START / GROW</LabMark><span>01 — С чего начинаем</span></div>
        <div className="scenario-grid">
          <article>
            <span className="scenario-number">A</span>
            <h2>Запускаю<br />новый проект</h2>
            <p>Помогу превратить идею в понятную структуру, выбрать подходящий формат и подготовить уверенный первый запуск.</p>
          </article>
          <article>
            <span className="scenario-number">B</span>
            <h2>Улучшаю<br />существующий</h2>
            <p>Разберусь, где сайт теряет ясность и доверие, пересоберу логику и дам продукту более сильную форму.</p>
          </article>
        </div>
        <p className="scenario-note"><span>Принцип 01</span> Не навязываю формат. Сначала разбираюсь в задаче, затем предлагаю оптимальное решение.</p>
      </section>

      <section className="work-section section" id="work">
        <div className="shell">
          <div className="section-heading">
            <div className="section-kicker"><LabMark>SELECTED / WORK</LabMark><span>02 — Избранные проекты</span></div>
            <h2>Не просто экраны.<br /><em>Решения с логикой.</em></h2>
          </div>
          <div className="case-list">
            {cases.map((item) => (
              <Link className="case-card" href={`/cases/${item.slug}`} key={item.slug}>
                <div className="case-card-head">
                  <span>{item.index}</span>
                  <span>{item.eyebrow}</span>
                  <span>Открыть кейс <Arrow diagonal /></span>
                </div>
                <CaseVisual item={item} compact />
                <div className="case-card-copy">
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="services-section section shell" id="services">
        <div className="section-heading split-heading">
          <div className="section-kicker"><LabMark>SCOPE / FORMAT</LabMark><span>03 — Форматы работы</span></div>
          <h2>Формат следует<br /><em>за задачей</em></h2>
          <p>Технология — не отправная точка. Я подбираю решение по содержанию, срокам и реальной пользе для бизнеса.</p>
        </div>
        <div className="service-list">
          {services.map((service) => (
            <article key={service.number} className="service-row">
              <span className="service-number">{service.number}</span>
              <div><h3>{service.title}</h3><p>{service.text}</p></div>
              <div className="service-terms"><strong>{service.price}</strong><span>{service.time}</span></div>
            </article>
          ))}
        </div>
        <p className="service-footnote">Сроки указаны при готовых материалах и своевременном согласовании. Точная оценка — после короткого знакомства с задачей.</p>
      </section>

      <section className="process-section section" id="process">
        <div className="shell">
          <div className="section-heading process-heading">
            <div className="section-kicker"><LabMark>METHOD / 05</LabMark><span>04 — Как строится работа</span></div>
            <h2>От вопроса<br /><em>до работающего сайта</em></h2>
          </div>
          <div className="process-list">
            {process.map(([number, title, text]) => (
              <article key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section section shell">
        <div className="about-portrait" aria-label="Место для фотографии Дениса Закусилова">
          <span className="portrait-code">PORTRAIT / DZ</span>
          <strong>D<span>Z</span></strong>
          <p>Фотография<br />будет добавлена</p>
        </div>
        <div className="about-copy">
          <div className="section-kicker"><LabMark>DENIS / ZAKUSILOV</LabMark><span>05 — Личная практика</span></div>
          <h2>Погружаюсь лично.<br /><em>Отвечаю за целое.</em></h2>
          <p className="about-lead">Я не начинаю с цвета кнопки. Сначала выясняю, что должен понять человек и какое действие важно бизнесу.</p>
          <p>Проектирую структуру и дизайн сам. Сайты на Tilda собираю под ключ, а для кастомной разработки подключаю проверенных специалистов и контролирую результат.</p>
          <div className="stats-grid">
            <div><strong>4</strong><span>года коммерческого опыта</span></div>
            <div><strong>120+</strong><span>выполненных клиентских задач</span></div>
            <div><strong>≈30</strong><span>сайтов спроектировано с нуля</span></div>
          </div>
          <div className="about-flags"><span>По договору</span><span>Самозанятый</span><span>По всей России</span></div>
        </div>
      </section>

      <section className="reviews-teaser section shell">
        <div className="review-quote-mark">“</div>
        <div>
          <div className="section-kicker"><LabMark>CLIENT / NOTES</LabMark><span>06 — Отзывы</span></div>
          <blockquote>«Здесь появится проверенный отзыв клиента с конкретикой о процессе и результате работы».</blockquote>
          <p className="draft-note">[УТОЧНИТЬ] Отзыв проходит ручную проверку перед публикацией.</p>
          <Link className="text-link" href="/reviews">Все отзывы и форма <Arrow /></Link>
        </div>
      </section>

      <section className="faq-section section shell">
        <div className="section-heading split-heading">
          <div className="section-kicker"><LabMark>FAQ / TERMS</LabMark><span>07 — До старта</span></div>
          <h2>Коротко<br /><em>о важном</em></h2>
        </div>
        <div className="faq-list">
          <details open><summary>Как проходит оплата?</summary><p>Для лендинга — 50% перед стартом и 50% перед передачей или публикацией. Крупные проекты делятся на этапы.</p></details>
          <details><summary>Сколько правок входит?</summary><p>Два раунда правок на каждом этапе. Новые страницы, функции и изменение утверждённой структуры оцениваются отдельно.</p></details>
          <details><summary>Кто занимается разработкой?</summary><p>Сайт на Tilda я собираю сам. Для кастомной разработки подключаю партнёров и остаюсь единой точкой ответственности.</p></details>
          <details><summary>Можно начать без готового ТЗ?</summary><p>Да. На первой встрече я помогу определить задачу, формат и объём. Большой формальный документ до знакомства не нужен.</p></details>
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="shell contact-grid">
          <div className="contact-copy">
            <LabMark>NEW / PROJECT</LabMark>
            <h2>Давайте разберём<br /><em>вашу задачу</em></h2>
            <p>Расскажите о проекте — я изучу вводные и свяжусь с вами выбранным способом в течение одного рабочего дня.</p>
            <div className="contact-aside"><span>Старт проекта</span><strong>от 40 000 ₽</strong></div>
          </div>
          <ProjectForm />
        </div>
      </section>
    </>
  );
}
