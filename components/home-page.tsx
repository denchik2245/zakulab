import { CmsImage as Image } from "@/components/cms-image";
import type { SiteSettings } from "@/lib/site-settings";
import type { VerifiedReview } from "@/lib/reviews";
import { typographic } from "@/lib/typographic";
import { ReviewsSlider } from "@/components/reviews-slider";
import { ServicesSection } from "@/components/services-section";
import { AllProjectsButton, ProjectCard, ProjectRow } from "@/components/portfolio-project";
import styles from "./home-page.module.css";
import { publicProject } from "@/lib/public-content";

function SectionTitle({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div className={styles.sectionTitle}>
      <span>{`{${eyebrow}}`}</span>
      <h2>{children}</h2>
    </div>
  );
}

export function HomePage({ site, reviews }: { site: SiteSettings; reviews: VerifiedReview[] }) {
  const portfolioProjects = site.portfolioProjects.filter((project) => project.published && project.homePlacement !== "hidden").map(publicProject).sort((a, b) => a.order - b.order);
  const featuredProjects = portfolioProjects.filter((project) => project.homePlacement === "featured").slice(0, 4);
  const listedProjects = portfolioProjects.filter((project) => project.homePlacement === "list");

  return (
    <div className={styles.stage}>
      <div className={`figma-home-page site-mobile-layout ${styles.page}`} id="top">
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
              <strong>
                {item.value}
              </strong>
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
            {featuredProjects.map((project) => <ProjectCard key={project.id} project={project} sizes="(max-width: 960px) calc(100vw - 40px), 540px" />)}
          </div>
          <div className={styles.projectRows}>
            {listedProjects.map((project) => <ProjectRow key={project.id} project={project} />)}
          </div>
          <AllProjectsButton className={styles.allProjects} href="/projects" count={site.portfolioProjects.filter((project) => project.published && project.portfolioPlacement !== "hidden").length} />
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

      <ServicesSection site={site} />
      </div>
    </div>
  );
}
