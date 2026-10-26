
import Image from "@/components/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { navigation } from "@/lib/navigation";
import { SocialLinks } from "./social-links";
import styles from "./mobile-menu.module.css";

type MobileMenuProps = {
  className?: string;
  telegramUrl: string;
  maxUrl: string;
  vkUrl: string;
};

function MenuArrow() {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 15 15 5M5 5h10v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function MobileMenu({ className, telegramUrl, maxUrl, vkUrl }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isKeyboardNavigation, setIsKeyboardNavigation] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialogId = useId();
  const pathname = window.location.pathname;

  const finishClose = useCallback(() => {
    if (closingTimer.current) clearTimeout(closingTimer.current);
    closingTimer.current = null;
    setIsClosing(false);
    setIsOpen(false);
  }, []);

  const closeMenu = useCallback(() => {
    if (closingTimer.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finishClose();
      return;
    }
    setIsClosing(true);
    closingTimer.current = setTimeout(finishClose, 240);
  }, [finishClose]);

  useEffect(() => () => {
    if (closingTimer.current) clearTimeout(closingTimer.current);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const desktop = window.matchMedia("(width > 1024px)");
    const onDesktop = () => { if (desktop.matches) finishClose(); };

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    // Keep showModal() from scrolling to a link inside the sliding panel on iOS.
    // React does not set the autofocus attribute on client-mounted dialogs.
    dialog?.setAttribute("autofocus", "");
    dialog?.showModal();
    closeRef.current?.focus({ preventScroll: true });
    desktop.addEventListener("change", onDesktop);

    return () => {
      desktop.removeEventListener("change", onDesktop);
      dialog?.close();
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [isOpen, finishClose]);

  return <>
    <button
      type="button"
      className={className}
      aria-label="Открыть меню"
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-controls={isOpen ? dialogId : undefined}
      onClick={(event) => {
        setIsKeyboardNavigation(event.detail === 0);
        setIsOpen(true);
      }}
    ><span className={styles.burgerIcon} aria-hidden="true"><i /><i /><i /></span></button>

    {isOpen && createPortal(
      <dialog
        ref={dialogRef}
        id={dialogId}
        className={styles.drawer}
        aria-label="Меню сайта"
        aria-modal="true"
        data-closing={isClosing}
        data-keyboard-navigation={isKeyboardNavigation}
        onCancel={(event) => { event.preventDefault(); closeMenu(); }}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          setIsKeyboardNavigation(true);
          const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"));
          const first = focusable[0];
          const last = focusable.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onPointerDown={(event) => {
          setIsKeyboardNavigation(false);
          if (event.target === event.currentTarget) closeMenu();
        }}
      >
        <div className={styles.panel}>
          <div className={styles.top}>
            <a href="/" className={styles.homeLink} aria-label="На главную" onClick={finishClose}><Image src="/assets/figma/logo.svg" width={40} height={40} alt="" /></a>
            <button ref={closeRef} className={styles.closeButton} type="button" aria-label="Закрыть меню" onClick={closeMenu}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></button>
          </div>

          <nav className={styles.nav} aria-label="Мобильное меню">
            {[...navigation, ["Выбор стиля", "/style-check"], ["Калькулятор проекта", "/calculator"]].map(([label, href]) => (
              <a className={styles.menuLink} href={href} key={href} aria-current={pathname === href ? "page" : undefined} onClick={finishClose}><span>{label}</span><MenuArrow /></a>
            ))}
          </nav>

          <div className={styles.bottom}>
            <div className={styles.contacts}>
              <span>Обсудим ваш проект</span>
              <p>Выберите, где удобнее написать</p>
              <SocialLinks className={styles.contactLinks} telegramUrl={telegramUrl} maxUrl={maxUrl} vkUrl={vkUrl} />
            </div>
          </div>
        </div>
      </dialog>, document.body
    )}
  </>;
}
