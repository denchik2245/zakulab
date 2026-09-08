"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ContactPopupButton } from "@/components/contact-popup-button";
import { StylePreview } from "@/components/style-preview";
import { styleReasons, type StyleChoiceSettings, type StyleReference } from "@/lib/style-references";
import type { PopupSettings } from "@/lib/site-settings";
import styles from "@/components/style-check.module.css";

type Vote = "like" | "dislike" | "skip";
type Response = { vote: Vote; reasons: string[] };
type SocialLinks = { telegramUrl: string; maxUrl: string; vkUrl: string };

function StyleGallery({ reference }: { reference: StyleReference }) {
  const [imageIndex, setImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [thumb, setThumb] = useState({ top: 0, height: 160 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const images = reference.images.filter(Boolean);

  function updateThumb() {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
    const height = maxScroll > 0 ? Math.max(72, viewport.clientHeight * (viewport.clientHeight / viewport.scrollHeight)) : 160;
    const top = maxScroll > 0 ? (viewport.scrollTop / maxScroll) * (viewport.clientHeight - height) : 0;
    setThumb({ top, height });
  }

  useEffect(() => {
    setImageIndex(0);
    const viewport = viewportRef.current;
    if (viewport) viewport.scrollTop = 0;
    requestAnimationFrame(updateThumb);
  }, [reference.id]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const keepWheelInsidePreview = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const distance = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      viewport.scrollTop += distance;
    };
    viewport.addEventListener("wheel", keepWheelInsidePreview, { passive: false });
    return () => viewport.removeEventListener("wheel", keepWheelInsidePreview);
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setIsFullscreen(false); };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isFullscreen]);

  function changeImage(nextIndex: number) {
    const normalized = (nextIndex + images.length) % images.length;
    setImageIndex(normalized);
    if (viewportRef.current) viewportRef.current.scrollTop = 0;
    requestAnimationFrame(updateThumb);
  }

  const activeImage = images[imageIndex];

  return (
    <div className={styles.galleryShell}>
      <div ref={viewportRef} className={styles.previewFrame} onScroll={updateThumb}>
        {activeImage ? (
          <img className={styles.referenceImage} src={activeImage} alt={`Пример стиля «${reference.title}», ${imageIndex + 1} из ${images.length}`} onLoad={updateThumb} />
        ) : (
          <div className={styles.syntheticPreview}><StylePreview reference={reference} /></div>
        )}
      </div>

      <span className={styles.scrollRail} aria-hidden="true"><i style={{ height: thumb.height, transform: `translateY(${thumb.top}px)` }} /></span>

      <button className={styles.fullscreenButton} type="button" onClick={() => setIsFullscreen(true)} aria-label="Открыть пример на весь экран">
        <Image src="/assets/figma/expand-style.svg" width={24} height={24} alt="" />
      </button>

      {images.length > 0 && (
        <div className={styles.pagination}>
          <button type="button" onClick={() => changeImage(imageIndex - 1)} disabled={images.length < 2} aria-label="Предыдущий пример"><Image src="/assets/figma/arrow.svg" width={20} height={20} alt="" /></button>
          <b>{imageIndex + 1} / {images.length}</b>
          <button type="button" onClick={() => changeImage(imageIndex + 1)} disabled={images.length < 2} aria-label="Следующий пример"><Image src="/assets/figma/arrow.svg" width={20} height={20} alt="" /></button>
        </div>
      )}

      {isFullscreen && (
        <div
          className={styles.fullscreenOverlay}
          role="dialog"
          aria-modal="true"
          aria-label={`Полноэкранный просмотр: ${reference.title}`}
          data-smooth-scroll-prevent
          onWheel={(event) => {
            const scrollable = (event.target as HTMLElement)?.closest?.(`.${styles.fullscreenImage}`);
            if (!scrollable) {
              event.preventDefault();
            }
          }}
          onMouseDown={(event) => { if (event.target === event.currentTarget) setIsFullscreen(false); }}
        >
          <button type="button" className={styles.fullscreenClose} onClick={() => setIsFullscreen(false)} aria-label="Закрыть полноэкранный просмотр"><Image src="/assets/figma/cross-popup.svg" width={20} height={20} alt="" /></button>
          <div className={styles.fullscreenImage} data-smooth-scroll-prevent tabIndex={0}>{activeImage ? <img src={activeImage} alt={`Пример стиля «${reference.title}»`} /> : <StylePreview reference={reference} />}</div>
        </div>
      )}
    </div>
  );
}

export function StyleQuiz({ settings, popups, socialLinks }: { settings: StyleChoiceSettings; popups: PopupSettings; socialLinks: SocialLinks }) {
  const references = useMemo(() => settings.styles.filter((item) => item.active).sort((a, b) => a.order - b.order), [settings.styles]);
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [completed, setCompleted] = useState(false);

  const current = references[index];
  const currentResponse = current ? responses[current.id] : undefined;
  const liked = references.filter((item) => responses[item.id]?.vote === "like");
  const disliked = references.filter((item) => responses[item.id]?.vote === "dislike");
  const summary = [
    "Результаты выбора стиля",
    `Понравилось: ${liked.map((item) => item.title).join(", ") || "не отмечено"}`,
    `Не понравилось: ${disliked.map((item) => item.title).join(", ") || "не отмечено"}`,
    ...[...liked, ...disliked].map((item) => `${item.title}: ${responses[item.id]?.reasons.join(", ") || "общее впечатление"}`),
  ].join("\n");

  function chooseVote(vote: Vote) {
    if (!current) return;
    if (vote === "skip") {
      const nextResponses = { ...responses, [current.id]: { vote, reasons: [] } };
      setResponses(nextResponses);
      moveForward(nextResponses);
      return;
    }
    setResponses((previous) => ({
      ...previous,
      [current.id]: { vote, reasons: previous[current.id]?.vote === vote ? previous[current.id].reasons : [] },
    }));
  }

  function toggleReason(reason: string) {
    if (!current) return;
    const response = responses[current.id];
    if (!response || response.vote === "skip") return;
    const reasons = response.reasons.includes(reason) ? response.reasons.filter((item) => item !== reason) : [...response.reasons, reason];
    setResponses((previous) => ({ ...previous, [current.id]: { ...response, reasons } }));
  }

  function moveForward(nextResponses = responses) {
    if (index < references.length - 1) {
      setIndex((value) => value + 1);
      return;
    }
    setResponses(nextResponses);
    setCompleted(true);
    requestAnimationFrame(() => document.getElementById("visual-style-test")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function goNext() {
    if (!current || !hasVoted) return;
    moveForward();
  }

  function resetQuiz() {
    setResponses({});
    setIndex(0);
    setCompleted(false);
    requestAnimationFrame(() => document.getElementById("visual-style-test")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  if (references.length === 0) {
    return <section className={styles.quiz} id="visual-style-test"><p className={styles.emptyState}>Стили скоро появятся.</p></section>;
  }

  if (completed) {
    const renderList = (items: StyleReference[]) => items.length ? items.map((item) => (
      <li key={item.id}><strong>{item.title}</strong><span>{responses[item.id]?.reasons.join(", ") || "Общее впечатление"}</span></li>
    )) : <li className={styles.emptyResult}>Нет отмеченных стилей</li>;

    return (
      <section className={styles.resultShell} id="visual-style-test" aria-live="polite">
        <div className={styles.resultHeading}>
          <h2>Результаты</h2>
          <div className={styles.resultActions}>
            <button type="button" onClick={resetQuiz}>Пройти тест еще раз</button>
            <ContactPopupButton triggerClassName={styles.sendResult} title={popups.styleResultTitle} description={popups.styleResultDescription} {...socialLinks} onOpen={() => localStorage.setItem("zakulab-style-brief", summary)}>Отправить результат</ContactPopupButton>
          </div>
        </div>
        <div className={styles.resultColumns}>
          <article><h3><Image src="/assets/figma/plus.svg" width={28} height={28} alt="" />Понравилось</h3><ul>{renderList(liked)}</ul></article>
          <article><h3><Image src="/assets/figma/minus.svg" width={28} height={28} alt="" />Не понравилось</h3><ul>{renderList(disliked)}</ul></article>
        </div>
      </section>
    );
  }

  const requiresReason = Boolean(currentResponse && currentResponse.vote !== "skip");
  const hasVoted = Boolean(currentResponse && (currentResponse.vote === "like" || currentResponse.vote === "dislike"));
  const canGoBack = index > 0;

  return (
    <section className={styles.quiz} id="visual-style-test" aria-live="polite">
      <div className={styles.quizGrid}>
        <StyleGallery reference={current} />
        <div className={styles.question}>
          <span className={styles.category}>{`{Шаг ${index + 1} из ${references.length}}`}</span>
          <h2>{current.title}</h2>
          <p className={styles.description}>{current.description}</p>

          <fieldset className={styles.voteFieldset}>
            <legend>Как вам этот стиль?</legend>
            <div className={styles.voteButtons}>
              <button type="button" data-active={currentResponse?.vote === "dislike"} onClick={() => chooseVote("dislike")} aria-pressed={currentResponse?.vote === "dislike"}>Не нравится <span className={styles.voteIcon}><Image src="/assets/figma/minus.svg" alt="" fill sizes="20px" /></span></button>
              <button type="button" onClick={() => chooseVote("skip")}>Пропустить</button>
              <button type="button" data-active={currentResponse?.vote === "like"} onClick={() => chooseVote("like")} aria-pressed={currentResponse?.vote === "like"}>Нравится <span className={styles.voteIcon}><Image src="/assets/figma/plus.svg" alt="" fill sizes="20px" /></span></button>
            </div>
          </fieldset>

          <fieldset className={styles.reasonFieldset} data-disabled={!requiresReason} disabled={!requiresReason}>
            <legend>{currentResponse?.vote === "dislike" ? "Что именно не подошло?" : "Что именно понравилось?"}</legend>
            <div className={styles.reasonOptions}>
              {styleReasons.slice(0, 5).map((reason) => (
                <label key={reason}><input type="checkbox" checked={currentResponse?.reasons.includes(reason) ?? false} onChange={() => toggleReason(reason)} /><span className={styles.checkbox} aria-hidden="true" /><span>{reason}</span></label>
              ))}
            </div>
          </fieldset>

          <div className={styles.navButtons}>
            <button
              type="button"
              className={styles.prevButton}
              data-active={canGoBack}
              onClick={() => setIndex((value) => Math.max(0, value - 1))}
              disabled={!canGoBack}
            >
              Назад
            </button>
            <button
              type="button"
              className={`${styles.nextButton} ${styles.next}`}
              data-active={hasVoted}
              onClick={goNext}
              disabled={!hasVoted}
            >
              {index === references.length - 1 ? "Показать результат" : "Далее"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
