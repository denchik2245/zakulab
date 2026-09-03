import Image from "next/image";
import Link from "next/link";
import styles from "./site-header.module.css";

const navigation = [
  ["Портфолио", "/#portfolio"],
  ["Этапы", "/#process"],
  ["Отзывы", "/reviews"],
  ["Услуги и стоимость", "/#price"],
] as const;

export function Header() {
  return (
    <header className={`site-header ${styles.siteHeader}`}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.logo} aria-label="Zakulab — на главную">
          <Image src="/assets/figma/logo.svg" width={48} height={48} alt="" priority />
        </Link>

        <nav className={styles.primaryNav} aria-label="Основная навигация">
          {navigation.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
        </nav>

        <nav className={styles.secondaryNav} aria-label="Инструменты">
          <Link href="/#contact">Бриф на разработку</Link>
          <Link href="/style-check">Выбор стиля</Link>
        </nav>

        <a className={styles.socials} href="https://t.me/deniszak" target="_blank" rel="noreferrer" aria-label="Социальные сети">
          <Image src="/assets/figma/btn.svg" width={169} height={48} alt="" />
        </a>

        <details className={styles.mobileMenu}>
          <summary>Меню</summary>
          <nav aria-label="Мобильная навигация">
            {navigation.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
            <Link href="/style-check">Выбор стиля</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
