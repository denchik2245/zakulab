"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./review-form.module.css";

export function ReviewForm({ title, description }: { title: string; description: string }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => setIsMounted(true), []);

  const close = useCallback(() => {
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
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const bodyPaddingRight = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
    const page = document.querySelector<HTMLElement>(".figma-reviews-page");
    const pageWasInert = page?.inert ?? false;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${bodyPaddingRight + scrollbarWidth}px`;
    if (page) page.inert = true;
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button, input, textarea, a[href]"));
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
  }, [close, isOpen]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      formData.set("response", "json");
      const response = await fetch("/api/reviews", { method: "POST", body: formData });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Не удалось отправить отзыв.");
      form.reset();
      setIsSent(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось отправить отзыв.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const popup = isOpen ? (
    <div className={`${styles.overlay} ${isClosing ? styles.isClosing : ""}`} data-smooth-scroll-prevent onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
        <button ref={closeRef} className={styles.close} type="button" onClick={close} aria-label="Закрыть окно">
          <Image src="/assets/figma/cross-popup.svg" width={20} height={20} alt="" />
        </button>
        {isSent ? (
          <div className={styles.success}>
            <span aria-hidden="true">✓</span>
            <h2 id={titleId}>Спасибо за отзыв</h2>
            <p id={descriptionId}>Отзыв отправлен и уже появился в админ-панели. Перед публикацией он будет проверен.</p>
            <button type="button" onClick={close}>Закрыть</button>
          </div>
        ) : (
          <>
            <header>
              <h2 id={titleId}>{title}</h2>
              <p id={descriptionId}>{description}</p>
            </header>
            <form className={styles.form} onSubmit={submit}>
              <input className={styles.honeypot} name="bot-field" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              <div className={styles.row}>
                <label><span>Имя и Фамилия</span><input name="name" required maxLength={120} autoComplete="name" placeholder="Закусилов Денис" /></label>
                <label><span>Должность</span><input name="role" required maxLength={120} autoComplete="organization-title" placeholder="Руководитель маркетинга" /></label>
              </div>
              <label><span>Ссылка на ваш профиль в соц.сетях (Telegram, VK, MAX, ...)</span><input name="public-profile" required maxLength={500} inputMode="url" placeholder="t.me/deniszak123" /></label>
              <label><span>Текст отзыва</span><textarea name="review" required minLength={20} maxLength={4000} rows={7} placeholder="Отзыв" /></label>
              <label className={styles.consent}><input type="checkbox" name="consent" value="yes" required /><span>Согласен с <a href="/privacy" target="_blank" rel="noreferrer">политикой обработки данных</a> и <a href="/consent" target="_blank" rel="noreferrer">условиями согласия</a>, разрешаю публикацию имени, должности, ссылки на профиль и текста отзыва на сайте.</span></label>
              {error && <p className={styles.error} role="alert">{error}</p>}
              <button className={styles.submit} type="submit" disabled={isSubmitting}>{isSubmitting ? "Отправляю…" : "Отправить"}</button>
            </form>
          </>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => { setError(""); setIsSent(false); setIsClosing(false); setIsOpen(true); }} aria-haspopup="dialog">Оставить отзыв</button>
      {isMounted && popup ? createPortal(popup, document.body) : null}
    </>
  );
}
