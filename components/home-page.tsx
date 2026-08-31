import Image from "next/image";
import Link from "next/link";
import type { SiteSettings } from "@/lib/site-settings";
import type { VerifiedReview } from "@/lib/reviews";
import styles from "./home-page.module.css";

const nav = [
  ["Портфолио", "#portfolio"],
  ["Этапы", "#process"],
  ["Отзывы", "#reviews"],
  ["Услуги и стоимость", "#price"],
] as const;

const shortWordsPattern = /(?<![\p{L}\p{N}])(а|без|бы|в|во|для|до|же|за|и|из|или|к|как|ко|ли|на|над|не|ни|но|о|об|от|по|под|при|про|с|со|у|через|что)\s+/giu;

function typographic(text: string) {
  return text.replace(shortWordsPattern, (word) => `${word.trim()}\u00a0`);
}

function ArrowIcon({ light = false }: { light?: boolean }) {
  return (
    <span className={styles.arrowIcon} aria-hidden="true">
      <Image src={light ? "/assets/figma/arrow1.svg" : "/assets/figma/arrow.svg"} alt="" fill sizes="20px" />
    </span>
  );
}

function SectionTitle({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div className={styles.sectionTitle}>
      <span>{`{${eyebrow}}`}</span>
      <h2>{children}</h2>
    </div>
  );
}

function HomeHeader() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.homeLogo} aria-label="Zakulab — на главную">
        <Image src="/assets/figma/logo.svg" width={48} height={48} alt="" />
      </Link>
      <nav className={styles.primaryNav} aria-label="Навигация по главной странице">
        {nav.map(([label, href]) => <a href={href} key={href}>{typographic(label)}</a>)}
      </nav>
      <nav className={styles.secondaryNav} aria-label="Инструменты">
        <Link href="/#contact">{typographic("Бриф на разработку")}</Link>
        <Link href="/style-check">Выбор стиля</Link>
      </nav>
      <a className={styles.socialStrip} href="https://t.me/deniszak" target="_blank" rel="noreferrer" aria-label="Социальные сети">
        <Image src="/assets/figma/btn.svg" width={169} height={48} alt="" />
      </a>
      <details className={styles.mobileMenu}>
        <summary>Меню</summary>
        <nav>
          {nav.map(([label, href]) => <a href={href} key={href}>{typographic(label)}</a>)}
          <Link href="/style-check">Выбор стиля</Link>
        </nav>
      </details>
    </header>
  );
}

function HomeFooter({ site }: { site: SiteSettings }) {
  return (
    <footer className={styles.footer} id="contact">
      <div className={styles.footerTexture} aria-hidden="true" />
      <div className={styles.footerTop}>
        <h2>{typographic(site.contactTitle)}</h2>
        <a className={styles.discussButton} href={site.telegramUrl} target="_blank" rel="noreferrer">
          <span>{typographic(site.contactButton)}</span><small>{`{TG}`}</small>
        </a>
        <a className={styles.toTop} href="#top" aria-label="Наверх">↑</a>
      </div>
      <div className={styles.footerColumns}>
        <div><span>Навигация</span>{nav.map(([label, href]) => <a href={href} key={href}>{typographic(label)}</a>)}</div>
        <div><span>Связаться</span><a href={site.telegramUrl}>Telegram</a><a href={site.vkUrl}>VK</a><a href={site.maxUrl}>MAX</a><a href={`mailto:${site.email}`}>{site.email}</a></div>
        <div><span>Мои фриланс биржи</span><a href={site.kworkUrl}>Kwork</a><a href={site.flUrl}>FL</a></div>
      </div>
      <div className={styles.footerLegal}>
        <Link href="/privacy">Политика обработки ПД</Link>
        <Link href="/privacy">{typographic("Согласие на обработку ПД")}</Link>
      </div>
      <Image className={styles.footerMark} src="/assets/figma/logo1.svg" width={500} height={500} alt="" />
    </footer>
  );
}

export function HomePage({ site, reviews }: { site: SiteSettings; reviews: VerifiedReview[] }) {
  const review = reviews[0];

  return (
    <div className={styles.stage}>
      <div className={`figma-home-page ${styles.page}`} id="top">
      <HomeHeader />

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroTop}>
          <h1 id="hero-title">— {typographic(site.heroTitle)}</h1>
          <div className={styles.profileCard}>
            <div className={styles.portrait}><Image src={site.heroPortrait} alt={site.heroName} fill sizes="110px" /></div>
            <div><strong>{typographic(site.heroName)}</strong><span>{typographic(site.heroRole)}</span></div>
          </div>
        </div>
        <div className={styles.heroGallery}>
          {site.heroGallery.map((src, index) => (
            <div className={styles.heroImage} key={`${src}-${index}`}>
              <Image src={src} alt="" fill sizes="420px" quality={90} />
            </div>
          ))}
        </div>
      </section>

      <section className={styles.about} aria-labelledby="about-title">
        <span className={styles.eyebrow}>{`{Обо мне}`}</span>
        <h2 id="about-title">{typographic(site.aboutTitle)}</h2>
        <p>{typographic(site.aboutText)}</p>
        <div className={styles.stats}>
          {site.stats.map((item) => <article key={item.id}><strong>{item.value}</strong><span>{typographic(item.label)}</span><i aria-hidden="true"><span>✱</span><span>✱</span><span>✱</span></i></article>)}
        </div>
      </section>

      <section className={styles.portfolio} id="portfolio" aria-labelledby="portfolio-title">
        <div className={styles.greenTexture} aria-hidden="true" />
        <div className={styles.portfolioInner}>
          <SectionTitle eyebrow="Портфолио"><span id="portfolio-title">{typographic(site.portfolioTitle)}</span></SectionTitle>
          <div className={styles.portfolioGallery}>
            {site.portfolioImages.slice(0, 4).map((src, index) => (
              <div key={`${src}-${index}`}><Image src={src} alt="Превью проекта" fill sizes="(max-width: 900px) 50vw, 540px" quality={90} /></div>
            ))}
          </div>
          <div className={styles.projectRows}>
            {site.projects.map((project) => (
              <a href={project.url} key={project.id} target={project.url.startsWith("http") ? "_blank" : undefined} rel={project.url.startsWith("http") ? "noreferrer" : undefined}>
                <strong>{typographic(project.title)}<ArrowIcon light /></strong>
                <span>{typographic(project.description)}</span>
                <Image src="/assets/figma/property1-tilda.svg" width={36} height={36} alt={project.platform} title={project.platform} />
              </a>
            ))}
          </div>
          <Link className={styles.allProjects} href="/projects"><span>Все проекты</span><small>{`{${site.portfolioCount}}`}</small></Link>
        </div>
      </section>

      <section className={styles.processSection} id="process" aria-labelledby="process-title">
        <div className={styles.shell}>
          <SectionTitle eyebrow="Процесс работы"><span id="process-title">{typographic(site.processTitle)}</span></SectionTitle>
          <div className={styles.processBoard}>
            {site.process.map((step, index) => (
              <article className={styles.processStep} key={step.id}>
                <span className={styles.stepNumber}>{`{${String(index + 1).padStart(2, "0")}}`}</span>
                <div className={styles.stepCopy}>
                  <h3>{typographic(step.title)}</h3>
                  <p>{typographic(step.text)}</p>
                  {step.secondaryTitle && <div className={styles.secondaryStep}><h4>{typographic(step.secondaryTitle)}</h4><p>{typographic(step.secondaryText ?? "")}</p></div>}
                </div>
                <div className={styles.stepMedia}>
                  <div><Image src={step.image} alt="" fill sizes="(max-width: 900px) 100vw, 770px" quality={90} /></div>
                  {step.secondaryImage && <div><Image src={step.secondaryImage} alt="" fill sizes="380px" quality={90} /></div>}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.reviews} id="reviews" aria-labelledby="reviews-title">
        <div className={styles.greenTexture} aria-hidden="true" />
        <div className={styles.reviewsCopy}>
          <SectionTitle eyebrow="Отзывы"><span id="reviews-title">{typographic(site.reviewsTitle)}</span></SectionTitle>
          <p>{typographic(site.reviewsText)}</p>
          <div className={styles.reviewControls}><strong>1/{Math.max(8, reviews.length)}</strong><span><Image src="/assets/figma/group34.svg" width={48} height={48} alt="" /><Image src="/assets/figma/group33.svg" width={48} height={48} alt="" /></span></div>
          <Link className={styles.reviewButton} href="/reviews"><span>Все отзывы</span><small>{`{${reviews.length}}`}</small></Link>
        </div>
        <div className={styles.reviewCard}>
          <div className={styles.reviewPhoto}><Image src={site.reviewImage} alt="" fill sizes="960px" quality={90} /></div>
          {review ? <div className={styles.reviewBody}>
            <div className={styles.reviewAuthor}><strong>{typographic(review.author.name)}</strong><span>{typographic(review.author.role || review.author.company)}</span></div>
            <blockquote>«{typographic(review.text)}»</blockquote>
            <div className={styles.reviewLinks}>
              <a href={review.profile.url}><Image src="/assets/figma/tg.svg" width={36} height={36} alt="" /><span>Профиль<strong>{review.profile.label}</strong></span><ArrowIcon /></a>
              <a href={review.project.url}><Image src="/assets/figma/image34-vectorized.svg" width={36} height={36} alt="" /><span>{typographic("Ссылка на проект")}<strong>{typographic(review.project.name)}</strong></span><ArrowIcon /></a>
            </div>
          </div> : <div className={styles.reviewBody}><blockquote>{typographic("Отзыв появится после публикации в админке.")}</blockquote></div>}
        </div>
      </section>

      <section className={styles.price} id="price" aria-labelledby="price-title">
        <div className={styles.shell}>
          <div className={styles.priceHeading}><SectionTitle eyebrow="Стоимость"><span id="price-title">{typographic(site.servicesTitle)}</span></SectionTitle><p>{typographic(site.servicesText)}</p></div>
          <div className={styles.services}>
            {site.services.map((service) => <article key={service.id}><h3>{typographic(service.title)}<ArrowIcon /></h3><p>{typographic(service.text)}</p><div><span>{typographic(service.time)}</span><strong>{typographic(service.price)}</strong><strong>{typographic(service.priceSecondary)}</strong></div></article>)}
          </div>
          <h2 className={styles.smallTasksTitle}>{typographic(site.smallTasksTitle)}</h2>
          <div className={styles.smallTasks}>
            {site.smallTasks.map((task) => <article key={task.id}><h3>{typographic(task.title)}<ArrowIcon /></h3><p>{typographic(task.text)}</p><div><h4>{typographic("Что вы получите")}</h4><p>{typographic(task.deliverable)}</p></div><footer><span>{typographic(task.time)}</span><strong>{typographic(task.price)}</strong></footer></article>)}
          </div>
        </div>
      </section>

      <HomeFooter site={site} />
      </div>
    </div>
  );
}
