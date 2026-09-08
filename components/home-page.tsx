import Image from "next/image";
import Link from "next/link";
import type { SiteSettings } from "@/lib/site-settings";
import type { VerifiedReview } from "@/lib/reviews";
import { typographic } from "@/lib/typographic";
import { navigation } from "@/lib/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ReviewsSlider } from "@/components/reviews-slider";
import { ServiceOrderButton } from "@/components/service-order-button";
import styles from "./home-page.module.css";

function ArrowIcon({ light = false }: { light?: boolean }) {
  return (
    <span className={styles.arrowIcon} aria-hidden="true">
      <Image src={light ? "/assets/figma/arrow1.svg" : "/assets/figma/arrow.svg"} alt="" fill sizes="20px" />
    </span>
  );
}

function ProjectPlatform({ platform }: { platform: string }) {
  const normalized = platform.trim().toLowerCase();
  if (!normalized) return <span className={styles.platformIcon} aria-hidden="true" />;

  const isWordPress = normalized === "wordpress" || normalized === "word press" || normalized === "wp";
  const isTilda = normalized === "tilda";
  if (!isWordPress && !isTilda) return <span className={styles.platformIcon} aria-hidden="true" />;

  return (
    <span className={styles.platformIcon}>
      <Image
        src={isWordPress ? "/assets/figma/property1-wordpress.svg" : "/assets/figma/property1-tilda.svg"}
        width={isWordPress ? 32 : 36}
        height={isWordPress ? 32 : 36}
        alt={`Логотип ${isWordPress ? "WordPress" : "Tilda"}`}
      />
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

export function HomePage({ site, reviews }: { site: SiteSettings; reviews: VerifiedReview[] }) {
  const portfolioProjects = site.portfolioProjects.filter((project) => project.published).sort((a, b) => a.order - b.order);
  const featuredProjects = portfolioProjects.filter((project) => project.homePlacement === "featured").slice(0, 4);
  const listedProjects = portfolioProjects.filter((project) => project.homePlacement === "list");

  return (
    <div className={styles.stage}>
      <div className={`figma-home-page ${styles.page}`} id="top">
      <Header />

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroTop}>
          <h1 id="hero-title">— {typographic(site.heroTitle)}</h1>
          <div className={styles.profileCard}>
            <div className={styles.portrait}><Image src={site.heroPortrait} alt={site.heroName} fill sizes="110px" priority /></div>
            <div><strong>{typographic(site.heroName)}</strong><span>{typographic(site.heroRole)}</span></div>
          </div>
        </div>
        <div className={styles.heroGalleryWrapper}>
          <div className={styles.heroGallery} style={{ "--speed": `${site.heroGallerySpeed || 30}s` } as React.CSSProperties}>
            {site.heroGallery.map((src, index) => (
              <div className={styles.heroImage} key={`orig-${src}-${index}`}>
                <Image src={src} alt="" fill sizes="420px" quality={90} priority={index < 2} />
              </div>
            ))}
            {site.heroGallery.map((src, index) => (
              <div className={styles.heroImage} key={`dup-${src}-${index}`}>
                <Image src={src} alt="" fill sizes="420px" quality={90} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.about} aria-labelledby="about-title">
        <span className={styles.eyebrow}>{`{Обо мне}`}</span>
        <h2 id="about-title">{typographic(site.aboutTitle)}</h2>
        <p>{typographic(site.aboutText)}</p>
        <div className={styles.stats}>
          {site.stats.map((item, statIndex) => (
            <article key={item.id}>
              <strong>{item.value}</strong>
              <span>{typographic(item.label)}</span>
              <i aria-hidden="true">
                {[0, 1, 2].map((starIndex) => (
                  <Image
                    key={starIndex}
                    src={starIndex <= statIndex ? "/assets/figma/logo2.svg" : "/assets/figma/logo3.svg"}
                    alt=""
                    width={20}
                    height={20}
                  />
                ))}
              </i>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.portfolio} id="portfolio" aria-labelledby="portfolio-title">
        <div className={styles.greenTexture} aria-hidden="true" />
        <div className={styles.portfolioInner}>
          <SectionTitle eyebrow="Лучшие проекты"><span id="portfolio-title">{typographic(site.portfolioTitle)}</span></SectionTitle>
          <div className={styles.portfolioGallery}>
            {featuredProjects.map((project) => {
              const label = project.title || "Проект";
              const tags = project.tags.filter(Boolean);

              return (
                <a href={project.url || "#"} key={project.id} target={project.url.startsWith("http") ? "_blank" : undefined} rel={project.url.startsWith("http") ? "noreferrer" : undefined}>
                  <Image src={project.image} alt={`Превью проекта ${project.title}`} fill sizes="(max-width: 900px) 50vw, 540px" quality={90} />
                  <span className={styles.featuredLabel}>{typographic(label)}</span>
                  <span className={styles.featuredTags}>{tags.map((tag, i) => <small key={`${tag}-${i}`}>{typographic(tag)}</small>)}</span>
                  <span className={styles.featuredArrow}><ArrowIcon /></span>
                </a>
              );
            })}
          </div>
          <div className={styles.projectRows}>
            {listedProjects.map((project) => (
              <a href={project.url} key={project.id} target={project.url.startsWith("http") ? "_blank" : undefined} rel={project.url.startsWith("http") ? "noreferrer" : undefined}>
                <strong>{typographic(project.title)}<ArrowIcon /></strong>
                <span className={styles.projectDescription}>{typographic(project.description)}</span>
                <ProjectPlatform platform={project.platform} />
              </a>
            ))}
          </div>
          <Link className={styles.allProjects} href="/projects"><span>Все проекты</span><small>{`{${portfolioProjects.length}}`}</small></Link>
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
                  {index === 4 ? (
                    <div className={styles.stepParagraphs}>
                      {step.text.split(/(?=Если сайт)/).map((paragraph) => <p key={paragraph}>{typographic(paragraph)}</p>)}
                    </div>
                  ) : <p>{typographic(step.text)}</p>}
                  {index === 3 && (
                    <div className={styles.processOptions}>
                      <div className={styles.processOption}>
                        <h4><Image src="/assets/figma/platform.svg" width={28} height={28} alt="" />{typographic("Разработка на Tilda")}</h4>
                        <p>{typographic("Собираю сайт по утверждённым макетам, настраиваю адаптивы, анимации, формы и базовые интеграции. Проверяю отображение на разных устройствах и подготавливаю сайт к публикации.")}</p>
                      </div>
                      {step.secondaryTitle && (
                        <div className={styles.processOption}>
                          <h4><Image src="/assets/figma/image36-vectorized.svg" width={28} height={28} alt="" />{typographic(step.secondaryTitle)}</h4>
                          <p>{typographic(step.secondaryText ?? "")}</p>
                        </div>
                      )}
                    </div>
                  )}
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

      <ReviewsSlider reviews={reviews} title={site.reviewsTitle} text={site.reviewsText} fallbackImage={site.reviewImage} />

      <section className={styles.price} id="price" aria-labelledby="price-title">
        <div className={styles.shell}>
          <div className={styles.priceHeading}><SectionTitle eyebrow="Стоимость"><span id="price-title">{typographic(site.servicesTitle)}</span></SectionTitle><p>{typographic(site.servicesText)}</p></div>
          <div className={styles.services}>
            {site.services.map((service) => <article key={service.id}><h3><ServiceOrderButton serviceTitle={service.title} telegramUrl={site.telegramUrl} maxUrl={site.maxUrl} vkUrl={site.vkUrl} popupTitlePrefix={site.popups.serviceTitlePrefix} popupTitle={site.popups.services[service.id]?.title} popupDescription={site.popups.services[service.id]?.description || site.popups.serviceDescription} /></h3><p>{typographic(service.text)}</p><div><span>{typographic(service.time)}</span><strong>{typographic(service.price)}</strong><strong>{typographic(service.priceSecondary)}</strong></div></article>)}
          </div>
          <h2 className={styles.smallTasksTitle}>{typographic(site.smallTasksTitle)}</h2>
          <div className={styles.smallTasks}>
            {site.smallTasks.map((task) => <article key={task.id}><h3><ServiceOrderButton serviceTitle={task.title} telegramUrl={site.telegramUrl} maxUrl={site.maxUrl} vkUrl={site.vkUrl} popupTitlePrefix={site.popups.serviceTitlePrefix} popupDescription={site.popups.serviceDescription} /></h3><p>{typographic(task.text)}</p><div><h4>{typographic("Что вы получите")}</h4><p>{typographic(task.deliverable)}</p></div><footer><span>{typographic(task.time)}</span><strong>{typographic(task.price)}</strong></footer></article>)}
          </div>
        </div>
      </section>

      <Footer site={site} />
      </div>
    </div>
  );
}
