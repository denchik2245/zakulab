import Image from "next/image";
import Link from "next/link";
import { defaultSiteSettings, type SiteSettings } from "@/lib/site-settings";
import { navigation } from "@/lib/navigation";
import styles from "./footer.module.css";

type FooterProps = {
  site?: SiteSettings;
};

export function Footer({ site }: FooterProps = {}) {
  const s = site ?? defaultSiteSettings;

  return (
    <footer className={styles.footer} id="contact">
      <div className={styles.texture} aria-hidden="true" />
      <div className={styles.top}>
        <h2>{s.contactTitle}</h2>
        <a className={styles.discuss} href={s.telegramUrl} target="_blank" rel="noreferrer"><span>{s.contactButton}</span><small>{`{TG}`}</small></a>
        <a className={styles.toTop} href="#top" aria-label="Наверх"><Image src="/assets/figma/group.svg" width={20} height={10} alt="" /></a>
      </div>
      <div className={styles.columns}>
        <div><span>Навигация</span>{navigation.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}</div>
        <div><span>Связаться</span><a href={s.telegramUrl}>Telegram</a><a href={s.vkUrl}>VK</a><a href={s.maxUrl}>MAX</a><a href={`mailto:${s.email}`}>{s.email}</a></div>
        <div><span>Мои фриланс биржи</span><a href={s.kworkUrl}>Kwork</a><a href={s.flUrl}>FL</a></div>
      </div>
      <div className={styles.legal}>
        <Link href="/privacy">Политика обработки ПД</Link>
        <Link href="/privacy">Согласие на обработку ПД</Link>
      </div>
      <Image className={styles.mark} src="/assets/figma/logo1.svg" width={500} height={500} alt="" />
    </footer>
  );
}
