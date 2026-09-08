"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { navigation } from "@/lib/navigation";
import styles from "./site-header.module.css";
import { SocialLinks } from "./social-links";

export function Header() {
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      const direction = scrollY > lastScrollY ? "down" : "up";
      if (direction !== "down" && scrollY < 10) {
        setIsHidden(false);
      } else if (Math.abs(scrollY - lastScrollY) > 5) {
        setIsHidden(direction === "down" && scrollY > 100);
      }
      lastScrollY = scrollY > 0 ? scrollY : 0;
    };

    window.addEventListener("scroll", updateScrollDirection, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateScrollDirection);
    };
  }, []);

  return (
    <header className={`site-header ${styles.siteHeader} ${isHidden ? styles.hidden : ""}`}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.logo} aria-label="Zakulab">
          <Image src="/assets/figma/logo.svg" width={48} height={48} alt="" priority />
        </Link>

        <nav className={styles.primaryNav} aria-label="Основное меню">
          {navigation.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
        </nav>

        <nav className={styles.secondaryNav} aria-label="Дополнительное">
          <Link href="/#contact">Обсудить проект</Link>
          <Link href="/style-check">Выбор стиля</Link>
        </nav>

        <SocialLinks />

        <details className={styles.mobileMenu}>
          <summary>Меню</summary>
          <nav aria-label="Мобильное меню">
            {navigation.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
            <Link href="/style-check">Выбор стиля</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
