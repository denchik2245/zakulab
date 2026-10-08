"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { SocialLinks } from "./social-links";
import styles from "./service-order-button.module.css";

type ContactPopupButtonProps = {
  children: ReactNode;
  title: ReactNode;
  description: string;
  telegramUrl: string;
  maxUrl: string;
  vkUrl: string;
  triggerClassName?: string;
  onOpen?: () => void;
  message?: string;
};

function getPopupScale() {
  return window.innerWidth >= 960 && window.innerWidth < 1920 ? window.innerWidth / 1920 : 1;
}

export function ContactPopupButton({ children, title, description, telegramUrl, maxUrl, vkUrl, triggerClassName, onOpen, message }: ContactPopupButtonProps) {
  const [copyStatus, setCopyStatus] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [popupScale, setPopupScale] = useState(1);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => setIsMounted(true), []);

  const closePopup = useCallback(() => {
    if (closingTimerRef.current) return;
    setIsClosing(true);
    closingTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      closingTimerRef.current = null;
    }, 400);
  }, []);

  useEffect(() => () => {
    if (closingTimerRef.current) clearTimeout(closingTimerRef.current);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const updateScale = () => setPopupScale(getPopupScale());
    window.addEventListener("resize", updateScale, { passive: true });
    return () => window.removeEventListener("resize", updateScale);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const bodyPaddingRight = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
    const page = document.querySelector<HTMLElement>(".figma-home-page, .figma-portfolio-page, .style-check-page");
    const pageWasInert = page?.inert ?? false;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${bodyPaddingRight + scrollbarWidth}px`;
    if (page) page.inert = true;
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePopup();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button, a[href], textarea"));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      if (page) page.inert = pageWasInert;
      document.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus();
    };
  }, [closePopup, isOpen]);

  const popup = isOpen ? (
    <div className={`${styles.overlay} ${isClosing ? styles.isClosing : ""}`} data-smooth-scroll-prevent onMouseDown={(event) => { if (event.target === event.currentTarget) closePopup(); }}>
      <div ref={dialogRef} className={styles.dialog} style={{ "--popup-scale": popupScale } as CSSProperties} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
        <button ref={closeButtonRef} className={styles.closeButton} type="button" onClick={closePopup} aria-label="Закрыть окно">
          <Image src="/assets/figma/cross-popup.svg" width={20} height={20} alt="" />
        </button>
        <div className={styles.copy}>
          <h2 id={titleId}>{title}</h2>
          <p id={descriptionId}>{description}</p>
        </div>
        {message && <div className={styles.resultTransfer}>
          <textarea aria-label="Результат выбора стиля" readOnly value={message} />
          <button type="button" onClick={async () => {
            try { await navigator.clipboard.writeText(message); setCopyStatus("Результат скопирован. Вставьте его в сообщение."); }
            catch { setCopyStatus("Выделите текст и скопируйте вручную или скачайте файл."); }
          }}>Скопировать результат</button>
          <button type="button" onClick={() => {
            const url = URL.createObjectURL(new Blob([message], { type: "text/plain;charset=utf-8" }));
            const anchor = document.createElement("a"); anchor.href = url; anchor.download = "zakulab-style-result.txt";
            anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}>Скачать .txt</button>
          <p role="status">{copyStatus}</p>
        </div>}
        <SocialLinks className={styles.socials} telegramUrl={telegramUrl} maxUrl={maxUrl} vkUrl={vkUrl} />
      </div>
    </div>
  ) : null;

  return (
    <>
      <button ref={triggerRef} className={triggerClassName ?? styles.trigger} type="button" onClick={() => { onOpen?.(); setPopupScale(getPopupScale()); setIsClosing(false); setIsOpen(true); }} aria-haspopup="dialog">
        {children}
      </button>
      {isMounted && popup ? createPortal(popup, document.body) : null}
    </>
  );
}
