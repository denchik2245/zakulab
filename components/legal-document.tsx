import { Breadcrumbs } from "@/components/breadcrumbs";
import styles from "./legal-document.module.css";

export type LegalSection = {
  title: string;
  paragraphs: string[];
  items?: string[];
};

type LegalDocumentProps = {
  title: string;
  lead: string;
  notice?: string;
  sections: LegalSection[];
};

export function LegalDocument({ title, lead, notice, sections }: LegalDocumentProps) {
  return (
    <section className={styles.page}>
      <div className={styles.layout}>
        <header className={styles.intro}>
          <Breadcrumbs current={title} />
          <h1>{title}</h1>
          <p>{lead}</p>
        </header>

        <article className={styles.document}>
          {notice && <aside className={styles.notice}>{notice}</aside>}

          {sections.map((section, index) => (
            <section className={styles.section} key={section.title} aria-labelledby={`legal-section-${index + 1}`}>
              <h2 id={`legal-section-${index + 1}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {section.title}
              </h2>
              <div className={styles.copy}>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.items && (
                  <ul>
                    {section.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </article>
      </div>
    </section>
  );
}
