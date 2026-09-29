import type { SiteSettings } from "@/lib/site-settings";
import { typographic } from "@/lib/typographic";
import { ServiceOrderButton } from "@/components/service-order-button";
import styles from "./services-section.module.css";

export function ServicesSection({ site }: { site: SiteSettings }) {
  return (
    <section className={styles.section} id="price" aria-labelledby="price-title">
      <div className={styles.shell}>
        <div className={styles.heading}>
          <div className={styles.title}>
            <span>{`{Стоимость}`}</span>
            <h2 id="price-title">{typographic(site.servicesTitle)}</h2>
          </div>
          <p>{typographic(site.servicesText)}</p>
        </div>

        <div className={styles.services}>
          {site.services.map((service) => (
            <article key={service.id}>
              <h3>
                <ServiceOrderButton
                  serviceTitle={service.title}
                  telegramUrl={site.telegramUrl}
                  maxUrl={site.maxUrl}
                  vkUrl={site.vkUrl}
                  popupTitlePrefix={site.popups.serviceTitlePrefix}
                  popupTitle={site.popups.services[service.id]?.title}
                  popupDescription={site.popups.services[service.id]?.description || site.popups.serviceDescription}
                />
              </h3>
              <p>{typographic(service.text)}</p>
              <div className={styles.terms}>
                <span>{typographic(service.time)}</span>
                <strong>{typographic(service.price)}</strong>
                <strong>{typographic(service.priceSecondary)}</strong>
              </div>
            </article>
          ))}
        </div>

        <h2 className={styles.smallTasksTitle}>{typographic(site.smallTasksTitle)}</h2>
        <div className={styles.smallTasks}>
          {site.smallTasks.map((task) => (
            <article key={task.id}>
              <h3>
                <ServiceOrderButton
                  serviceTitle={task.title}
                  telegramUrl={site.telegramUrl}
                  maxUrl={site.maxUrl}
                  vkUrl={site.vkUrl}
                  popupTitlePrefix={site.popups.serviceTitlePrefix}
                  popupTitle={site.popups.services[task.id]?.title}
                  popupDescription={site.popups.services[task.id]?.description || site.popups.serviceDescription}
                />
              </h3>
              <p>{typographic(task.text)}</p>
              <div className={styles.deliverable}>
                <h4>{typographic("Что вы получите")}</h4>
                <p>{typographic(task.deliverable)}</p>
              </div>
              <footer className={styles.taskTerms}>
                <span>{typographic(task.time)}</span>
                <strong>{typographic(task.price)}</strong>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
