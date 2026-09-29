import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CaseBlock } from "@/lib/cases";
import { createLegacyCaseBlocks } from "@/lib/cases";
import { getPublishedCase } from "@/lib/content-store";
import styles from "./case-page.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublishedCase(slug);
  if (!item) return {};
  return {
    title: `Кейс ${item.title}`,
    description: item.summary,
    alternates: { canonical: `/cases/${item.slug}` },
  };
}

function CaseContentBlock({ block }: { block: CaseBlock }) {
  if (block.type === "image") {
    if (!block.image) return null;
    return (
      <figure className={styles.block} data-spacing={block.spacing}>
        {block.caption && <figcaption>{block.caption}</figcaption>}
        <img className={styles.image} src={block.image} alt={block.alt} />
      </figure>
    );
  }

  if (block.type === "gallery") {
    const images = block.images.filter((item) => item.image);
    if (images.length === 0) return null;
    return (
      <div className={`${styles.block} ${styles.gallery}`} data-spacing={block.spacing}>
        {images.map((item) => <img key={item.id} src={item.image} alt={item.alt} />)}
      </div>
    );
  }

  if (block.type === "callout") {
    if (!block.text) return null;
    return (
      <aside className={`${styles.block} ${styles.callout}`} data-spacing={block.spacing}>
        <Image src="/assets/figma/case-callout-icon.svg" width={24} height={24} alt="" />
        <p>{block.text}</p>
      </aside>
    );
  }

  return (
    <section className={`${styles.block} ${styles.textBlock}`} data-spacing={block.spacing}>
      {block.title && <header><h2>{block.title}</h2><span /></header>}
      {block.body && <p className={styles.body}>{block.body}</p>}
      {block.listStyle !== "none" && block.items.length > 0 && (
        <ol className={styles.list} data-style={block.listStyle}>
          {block.items.map((item, index) => (
            <li key={item.id}>
              {block.listStyle === "bullet" && <Image src="/assets/figma/case-list-marker.svg" width={8} height={18} alt="" />}
              {block.listStyle === "numbered" && <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>}
              <div>{item.label && <span className={styles.itemLabel}>{item.label}</span>}<p>{item.text}</p></div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getPublishedCase(slug);
  if (!item) notFound();
  const blocks = item.blocks?.length ? item.blocks : createLegacyCaseBlocks(item);

  return (
    <article className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.heading}>
            <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
              <Link href="/">Главная</Link><span aria-hidden="true">›</span>
              <Link href="/projects">Портфолио</Link><span aria-hidden="true">›</span>
              <span aria-current="page">{item.title}</span>
            </nav>
            <h1>{item.title}</h1>
          </div>
          <p className={styles.whatDone}>{item.whatDone || item.summary}</p>
        </aside>

        <div className={styles.content}>
          {blocks.map((block) => <CaseContentBlock key={block.id} block={block} />)}
        </div>
      </div>
    </article>
  );
}
