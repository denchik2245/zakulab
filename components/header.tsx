"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { navigation } from "@/lib/navigation";
import styles from "./site-header.module.css";
import { SocialLinks } from "./social-links";
import { MobileMenu } from "./mobile-menu";

export function Header(links: { telegramUrl: string; maxUrl: string; vkUrl: string }) {
  const [isHidden, setIsHidden] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const getScrollY = () => Math.max(0, Math.min(window.scrollY, document.documentElement.scrollHeight - window.innerHeight));
    let lastScrollY = getScrollY();
    let lastDirection = 0;
    let directionDistance = 0;

    const updateScrollDirection = () => {
      // Clamp elastic overscroll so bouncing at either edge cannot reverse the header.
      const scrollY = getScrollY();
      const delta = scrollY - lastScrollY;
      if (delta === 0) return;

      const direction = Math.sign(delta);
      directionDistance = direction === lastDirection ? directionDistance + Math.abs(delta) : Math.abs(delta);

      if (scrollY <= (headerRef.current?.offsetHeight ?? 88)) {
        setIsHidden(false);
      } else if (directionDistance >= 6) {
        setIsHidden(direction > 0);
      }
      lastScrollY = scrollY;
      lastDirection = direction;
    };

    window.addEventListener("scroll", updateScrollDirection, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateScrollDirection);
    };
  }, []);

  return (
    <header ref={headerRef} className={`site-header ${styles.siteHeader} ${isHidden ? styles.hidden : ""}`}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.logo} aria-label="Zakulab">
          <Image src="/assets/figma/logo.svg" width={48} height={48} alt="" priority />
        </Link>

        <nav className={styles.primaryNav} aria-label="Основное меню">
          {navigation.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
        </nav>

        <nav className={styles.secondaryNav} aria-label="Дополнительное">
          <Link href="/style-check">Выбор стиля</Link>
        </nav>

        <SocialLinks className={styles.socials} {...links} />

        <MobileMenu className={styles.mobileMenu} {...links} />
      </div>
    </header>
  );
}
