"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { styleAxes, styleReasons, styleReferences, type StyleAxis } from "@/lib/style-references";
import { StylePreview } from "@/components/style-preview";
import styles from "@/components/style-check.module.css";

type Vote = "like" | "dislike" | "skip";
type Response = { vote: Vote; reasons: string[] };

export function StyleQuiz() {
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [completed, setCompleted] = useState(false);
  const [note, setNote] = useState("");
  const [copyState, setCopyState] = useState("Скопировать итог");
  const [validationMessage, setValidationMessage] = useState("");

  const current = styleReferences[index];
  const currentResponse = responses[current.id];
  const result = useMemo(() => {
    const totals: Record<StyleAxis, number> = { space: 0, energy: 0, expression: 0, emotion: 0 };
    const evaluated = styleReferences.filter((item) => {
      const vote = responses[item.id]?.vote;
      return vote === "like" || vote === "dislike";
    });

    evaluated.forEach((item) => {
      const weight = responses[item.id].vote === "like" ? 1 : -1;
      styleAxes.forEach(({ key }) => { totals[key] += item.axes[key] * weight; });
    });

    const scores = styleAxes.reduce<Record<StyleAxis, number>>((acc, { key }) => {
      acc[key] = evaluated.length ? Math.max(-1, Math.min(1, totals[key] / evaluated.length)) : 0;
      return acc;
    }, { space: 0, energy: 0, expression: 0, emotion: 0 });

    const liked = styleReferences.filter((item) => responses[item.id]?.vote === "like");
    const disliked = styleReferences.filter((item) => responses[item.id]?.vote === "dislike");
    const reasonCounts = (vote: "like" | "dislike") => {
      const counts = new Map<string, number>();
      Object.values(responses).filter((item) => item.vote === vote).forEach((item) => {
        item.reasons.forEach((reason) => counts.set(reason, (counts.get(reason) ?? 0) + 1));
      });
      return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([reason]) => reason);
    };

    return { scores, liked, disliked, positiveReasons: reasonCounts("like"), negativeReasons: reasonCounts("dislike") };
  }, [responses]);

  const summary = useMemo(() => {
    const axisLines = styleAxes.map((axis) => {
      const score = result.scores[axis.key];
      const direction = score < -0.12 ? axis.left : score > 0.12 ? axis.right : "баланс";
      return `${axis.label}: ${direction}`;
    });
    return [
      "Визуальный профиль zakulab",
      `Нравится: ${result.liked.map((item) => item.title).join(", ") || "не отмечено"}`,
      `Не нравится: ${result.disliked.map((item) => item.title).join(", ") || "не отмечено"}`,
      `Понравилось в деталях: ${result.positiveReasons.join(", ") || "не отмечено"}`,
      `Не подошло в деталях: ${result.negativeReasons.join(", ") || "не отмечено"}`,
      ...axisLines,
      note.trim() ? `Свои ссылки / комментарий: ${note.trim()}` : "",
    ].filter(Boolean).join("\n");
  }, [note, result]);

  function chooseVote(vote: Vote) {
    setValidationMessage("");
    if (vote === "skip") {
      setResponses((prev) => ({ ...prev, [current.id]: { vote, reasons: [] } }));
      moveForward({ ...responses, [current.id]: { vote, reasons: [] } });
      return;
    }
    setResponses((prev) => ({ ...prev, [current.id]: { vote, reasons: prev[current.id]?.vote === vote ? prev[current.id].reasons : [] } }));
  }

  function toggleReason(reason: string) {
    const response = responses[current.id];
    if (!response || response.vote === "skip") return;
    const exists = response.reasons.includes(reason);
    setResponses((prev) => ({
      ...prev,
      [current.id]: { ...response, reasons: exists ? response.reasons.filter((item) => item !== reason) : [...response.reasons, reason] },
    }));
  }

  function moveForward(nextResponses = responses) {
    if (index < styleReferences.length - 1) {
      setIndex((value) => value + 1);
      return;
    }
    const nextRated = Object.values(nextResponses).filter((item) => item.vote !== "skip").length;
    if (nextRated < 4) {
      const firstSkipped = styleReferences.findIndex((item) => !nextResponses[item.id] || nextResponses[item.id].vote === "skip");
      setValidationMessage("Для полезного результата оцените минимум четыре направления.");
      setIndex(firstSkipped >= 0 ? firstSkipped : 0);
      return;
    }
    setCompleted(true);
    requestAnimationFrame(() => {
      document.getElementById("visual-style-test")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function goBack() {
    if (index > 0) setIndex((value) => value - 1);
  }

  function goNext() {
    if (!currentResponse) {
      const nextResponses = { ...responses, [current.id]: { vote: "skip" as const, reasons: [] } };
      setResponses(nextResponses);
      moveForward(nextResponses);
      return;
    }
    moveForward();
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopyState("Итог скопирован ✓");
    } catch {
      setCopyState("Не удалось скопировать");
    }
  }

  function attachToRequest() {
    localStorage.setItem("zakulab-style-brief", summary);
    window.location.href = "/#contact";
  }

  function resetQuiz() {
    setResponses({});
    setIndex(0);
    setCompleted(false);
    setNote("");
    setValidationMessage("");
    setCopyState("Скопировать итог");
    requestAnimationFrame(() => {
      document.getElementById("visual-style-test")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  if (completed) {
    return (
      <section className={`${styles.resultShell} style-result`} id="visual-style-test" aria-live="polite">
        <div className="style-result-head">
          <span className="style-result-code">PROFILE / COMPLETE</span>
          <h2>Ваш визуальный<br /><em>профиль готов</em></h2>
          <p>Это не готовый дизайн и не жёсткое техническое задание. Профиль показывает направление, с которого стоит начать обсуждение концепции.</p>
        </div>

        <div className="style-result-body">
          <div className="style-axis-list">
            {styleAxes.map((axis) => {
              const score = result.scores[axis.key];
              return (
                <div className="style-axis" key={axis.key}>
                  <div><span>{axis.left}</span><b>{axis.label}</b><span>{axis.right}</span></div>
                  <div className="axis-track"><i style={{ left: `${50 + score * 42}%` }} /></div>
                </div>
              );
            })}
          </div>

          <div className="style-summary-columns">
            <article className="summary-like">
              <span>LIKE / {result.liked.length.toString().padStart(2, "0")}</span>
              <h3>Точно в сторону</h3>
              <ul>{result.liked.map((item) => <li key={item.id}>{item.title}</li>)}</ul>
              {result.positiveReasons.length > 0 && <p>Особенно: {result.positiveReasons.join(", ").toLowerCase()}</p>}
            </article>
            <article className="summary-dislike">
              <span>AVOID / {result.disliked.length.toString().padStart(2, "0")}</span>
              <h3>Лучше избегать</h3>
              <ul>{result.disliked.map((item) => <li key={item.id}>{item.title}</li>)}</ul>
              {result.negativeReasons.length > 0 && <p>Не подошли: {result.negativeReasons.join(", ").toLowerCase()}</p>}
            </article>
          </div>

          <label className="style-own-reference">
            <span>Свои ссылки или комментарий — необязательно</span>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder="Вставьте ссылки на сайты или напишите, что ещё важно учесть" />
          </label>

          <div className="style-result-actions">
            <button type="button" className="button" onClick={attachToRequest}>Прикрепить к заявке <span aria-hidden="true">↗</span></button>
            <button type="button" className="style-copy-button" onClick={copySummary}>{copyState}</button>
            <button type="button" className="style-reset-button" onClick={resetQuiz}>Пройти заново</button>
          </div>
        </div>
      </section>
    );
  }

  const requiresReason = Boolean(currentResponse && currentResponse.vote !== "skip");

  return (
    <section className={styles.quiz} id="visual-style-test" aria-live="polite">
      {validationMessage && <p className={styles.validation}>{validationMessage}</p>}

      <div className={styles.quizGrid}>
        <div className={styles.previewFrame}>
          {current.id === "editorial" ? (
            <Image className={styles.referenceImage} src="/assets/figma/style-reference-catering.png" alt="Пример сайта в стиле редакционного минимализма" fill sizes="(max-width: 959px) 100vw, 760px" quality={92} priority />
          ) : (
            <div className={styles.syntheticPreview}><StylePreview reference={current} /></div>
          )}
        </div>

        <div className={styles.question}>
          <span className={styles.category}>{`{${current.traits.slice(0, 2).map((trait) => trait[0].toUpperCase() + trait.slice(1)).join(", ")}}`}</span>
          <h2>{current.title}</h2>
          <p className={styles.description}>{current.description}</p>

          <fieldset className={styles.voteFieldset}>
            <legend>Как вам это направление?</legend>
            <div className={styles.voteButtons}>
              <button type="button" data-active={currentResponse?.vote === "dislike"} onClick={() => chooseVote("dislike")} aria-pressed={currentResponse?.vote === "dislike"}>Не нравится <span className={styles.voteIcon}><Image src="/assets/figma/minus.svg" alt="" fill sizes="20px" /></span></button>
              <button type="button" className="skip" onClick={() => chooseVote("skip")}>Пропустить</button>
              <button type="button" data-active={currentResponse?.vote === "like"} onClick={() => chooseVote("like")} aria-pressed={currentResponse?.vote === "like"}>Нравится <span className={styles.voteIcon}><Image src="/assets/figma/plus.svg" alt="" fill sizes="20px" /></span></button>
            </div>
          </fieldset>

          <fieldset className={styles.reasonFieldset} data-disabled={!requiresReason} disabled={!requiresReason}>
            <legend>{currentResponse?.vote === "dislike" ? "Что именно не подошло?" : "Что именно понравилось?"}</legend>
            <div className={styles.reasonOptions}>
              {styleReasons.slice(0, 5).map((reason) => (
                <label key={reason}>
                  <input type="checkbox" checked={currentResponse?.reasons.includes(reason) ?? false} onChange={() => toggleReason(reason)} />
                  <span className={styles.checkbox} aria-hidden="true" />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className={styles.navButtons}>
            <button type="button" onClick={goBack} disabled={index === 0}>Назад</button>
            <button type="button" className={styles.next} onClick={goNext}>{index === styleReferences.length - 1 ? "Показать результат" : "Далее"}</button>
          </div>
        </div>
      </div>
    </section>
  );
}
