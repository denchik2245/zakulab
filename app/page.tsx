import Link from "next/link";
import { Arrow, LabMark } from "@/components/marks";
import { CaseVisual } from "@/components/case-visual";
import { ProjectForm } from "@/components/project-form";
import { readContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

const process = [
  ["01", "Разбираю задачу", "Знакомимся, обсуждаем бизнес, аудиторию, ограничения и критерии результата."],
  ["02", "Строю логику", "Исследую контекст, собираю структуру и прототип — до того, как появляется визуальный слой."],
  ["03", "Нахожу образ", "Создаю концепцию, которая помогает продукту быть понятным и отличимым."],
  ["04", "Собираю систему", "Проектирую страницы, адаптивы, состояния и правила для дальнейшего развития."],
  ["05", "Довожу до запуска", "Собираю на Tilda сам или подключаю партнёров и контролирую соответствие макетам."],
];

export default async function Home() {
  const content = await readContent();
  const cases = content.cases.filter((item) => item.status === "published" && item.featured);
  const { site } = content;
  return (
    <>
      <section className="hero shell">
        <div className="hero-grid hero-meta-row">
          <LabMark>WEB / DESIGN / LAUNCH</LabMark>
          <p className="hero-intro">Денис Закусилов<br />Веб-дизайнер и руководитель проектов</p>
        </div>
        <div className="hero-title-wrap">
          <span className="hero-coordinate">56.8389° N<br />60.6057° E</span>
          <h1>{site.heroTitle}<br /><em>{site.heroAccent}</em></h1>
          <div className="orbit-mark" aria-hidden="true"><span>ZK</span></div>
        </div>
        <div className="hero-grid hero-bottom">
          <p className="hero-lead">
            {site.heroLead}
          </p>
          <div className="hero-actions">
            <Link className="button" href="#contact">Обсудить проект <Arrow diagonal /></Link>
            <Link className="text-link" href="/projects">Посмотреть проекты <Arrow /></Link>
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
          <div className="all-projects-link">
            <Link className="button button-light" href="/projects">Открыть каталог проектов <Arrow diagonal /></Link>
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
          {site.services.map((service, index) => (
            <article key={service.id} className="service-row">
              <span className="service-number">{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{service.title}</h3><p>{service.text}</p></div>
              <div className="service-terms"><strong>{service.price}</strong><span>{service.time}</span></div>
            </article>
          ))}
        </div>
        <p className="service-footnote">Сроки указаны при готовых материалах и своевременном согласовании. Точная оценка — после короткого знакомства с задачей.</p>
      </section>

      <section className="style-test-teaser section shell">
        <div className="style-teaser-copy">
          <div className="section-kicker"><LabMark>VISUAL / TEST</LabMark><span>04 — Найти направление</span></div>
          <h2>Не знаете, какой стиль<br /><em>вам нравится?</em></h2>
          <p>Это нормально. Я собрал восемь контрастных направлений в короткий тест. Вы оцените примеры, а сайт соберёт понятный профиль — что использовать и чего избегать в будущей концепции.</p>
          <Link className="button" href="/style-check">Пройти визуальный тест <Arrow diagonal /></Link>
          <span className="style-teaser-time">3–4 минуты · без регистрации</span>
        </div>
        <div className="style-teaser-visual" aria-hidden="true">
          <div className="teaser-card teaser-card-a"><span>LIKE / 01</span><strong>Aa</strong><i /></div>
          <div className="teaser-card teaser-card-b"><span>AVOID / 02</span><strong>LOUD</strong><i /></div>
          <div className="teaser-profile"><span>YOUR / PROFILE</span><div><i style={{ left: "24%" }} /></div><div><i style={{ left: "72%" }} /></div><div><i style={{ left: "44%" }} /></div></div>
        </div>
      </section>

      <section className="process-section section" id="process">
        <div className="shell">
          <div className="section-heading process-heading">
            <div className="section-kicker"><LabMark>METHOD / 05</LabMark><span>05 — Как строится работа</span></div>
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
          <div className="section-kicker"><LabMark>DENIS / ZAKUSILOV</LabMark><span>06 — Личная практика</span></div>
          <h2>Погружаюсь лично.<br /><em>Отвечаю за целое.</em></h2>
          <p className="about-lead">{site.aboutLead}</p>
          <p>{site.aboutText}</p>
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
          <div className="section-kicker"><LabMark>CLIENT / NOTES</LabMark><span>07 — Отзывы</span></div>
          <blockquote>«Здесь появится проверенный отзыв клиента с конкретикой о процессе и результате работы».</blockquote>
          <p className="draft-note">[УТОЧНИТЬ] Отзыв проходит ручную проверку перед публикацией.</p>
          <Link className="text-link" href="/reviews">Все отзывы и форма <Arrow /></Link>
        </div>
      </section>

      <section className="faq-section section shell">
        <div className="section-heading split-heading">
          <div className="section-kicker"><LabMark>FAQ / TERMS</LabMark><span>08 — До старта</span></div>
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
            <h2>{site.contactTitle}<br /><em>{site.contactAccent}</em></h2>
            <p>{site.contactText}</p>
            <div className="contact-aside"><span>Старт проекта</span><strong>{site.contactPrice}</strong></div>
          </div>
          <ProjectForm />
        </div>
      </section>
    </>
  );
}
