import Image from "next/image";
import Link from "next/link";
import { defaultSiteSettings as site } from "@/lib/site-settings";
import styles from "./footer.module.css";

const navigation = [
  ["Портфолио", "/#portfolio"],
  ["Этапы", "/#process"],
  ["Отзывы", "/reviews"],
  ["Услуги и стоимость", "/#price"],
] as const;

export function Footer() {
  return (
    <footer className={styles.footer} id="contact">
      <div className={styles.texture} aria-hidden="true" />
      <div className={styles.top}>
        <h2>{site.contactTitle}</h2>
        <a className={styles.discuss} href={site.telegramUrl} target="_blank" rel="noreferrer"><span>{site.contactButton}</span><small>{`{TG}`}</small></a>
        <a className={styles.toTop} href="#top" aria-label="Наверх"><Image src="/assets/figma/group.svg" width={20} height={10} alt="" /></a>
      </div>
      <div className={styles.columns}>
        <div><span>Навигация</span>{navigation.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}</div>
        <div><span>Связаться</span><a href={site.telegramUrl}>Telegram</a><a href={site.vkUrl}>VK</a><a href={site.maxUrl}>MAX</a><a href={`mailto:${site.email}`}>{site.email}</a></div>
        <div><span>Мои фриланс биржи</span><a href={site.kworkUrl}>Kwork</a><a href={site.flUrl}>FL</a></div>
      </div>
      <div className={styles.legal}>
        <Link href="/privacy">Политика обработки ПД</Link>
        <Link href="/privacy">Согласие на обработку ПД</Link>
      </div>
      <Image className={styles.mark} src="/assets/figma/logo1.svg" width={500} height={500} alt="" />
    </footer>
  );
}
