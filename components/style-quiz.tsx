"use client";

import { useMemo, useState } from "react";
import { styleAxes, styleReasons, styleReferences, type StyleAxis } from "@/lib/style-references";
import { StylePreview } from "@/components/style-preview";

type Vote = "like" | "dislike" | "skip";
type Response = { vote: Vote; reasons: string[] };

export function StyleQuiz() {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [completed, setCompleted] = useState(false);
  const [note, setNote] = useState("");
  const [copyState, setCopyState] = useState("Скопировать итог");
  const [validationMessage, setValidationMessage] = useState("");

  const current = styleReferences[index];
  const currentResponse = responses[current.id];
  const ratedCount = Object.values(responses).filter((item) => item.vote !== "skip").length;

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
    setStarted(false);
    setNote("");
    setValidationMessage("");
    setCopyState("Скопировать итог");
    requestAnimationFrame(() => {
      document.getElementById("visual-style-test")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function startQuiz() {
    setStarted(true);
    requestAnimationFrame(() => {
      document.getElementById("visual-style-test")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  if (!started) {
    return (
      <section className="style-intro-panel" id="visual-style-test">
        <div className="style-intro-index">01—08</div>
        <div>
          <h2>Вам не нужно знать<br />названия стилей</h2>
          <p>Просто реагируйте на примеры. Здесь нет правильных ответов: важна первая честная реакция, а не попытка выбрать «самый профессиональный» вариант.</p>
          <ul>
            <li><span>01</span> Оцените минимум 4 из 8 направлений</li>
            <li><span>02</span> Отметьте, что именно повлияло на выбор</li>
            <li><span>03</span> Получите профиль, который можно приложить к заявке</li>
          </ul>
          <button type="button" className="button" onClick={startQuiz}>Начать тест <span aria-hidden="true">→</span></button>
          <small>Обычно занимает 3–4 минуты</small>
        </div>
      </section>
    );
  }

  if (completed) {
    return (
      <section className="style-result" id="visual-style-test" aria-live="polite">
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

  const requiresReason = currentResponse && currentResponse.vote !== "skip";
  const canContinue = Boolean(requiresReason && currentResponse.reasons.length > 0);

  return (
    <section className="style-quiz" id="visual-style-test" aria-live="polite">
      <div className="style-progress">
        <div><span>VISUAL / TEST</span><b>{current.number} / {styleReferences.length.toString().padStart(2, "0")}</b></div>
        <div className="progress-track"><i style={{ width: `${((index + 1) / styleReferences.length) * 100}%` }} /></div>
        <p>{ratedCount} направлений оценено</p>
      </div>

      {validationMessage && <p className="style-validation">{validationMessage}</p>}

      <div className="style-question-grid">
        <StylePreview reference={current} />
        <div className="style-question-copy">
          <span className="style-category">{current.category}</span>
          <h2>{current.title}</h2>
          <p>{current.description}</p>
          <div className="style-traits">{current.traits.map((trait) => <span key={trait}>{trait}</span>)}</div>

          <fieldset className="vote-fieldset">
            <legend>Как вам это направление?</legend>
            <div className="vote-buttons">
              <button type="button" className={currentResponse?.vote === "dislike" ? "is-active dislike" : ""} onClick={() => chooseVote("dislike")} aria-pressed={currentResponse?.vote === "dislike"}><span>−</span> Не нравится</button>
              <button type="button" className="skip" onClick={() => chooseVote("skip")}>Пропустить</button>
              <button type="button" className={currentResponse?.vote === "like" ? "is-active like" : ""} onClick={() => chooseVote("like")} aria-pressed={currentResponse?.vote === "like"}><span>+</span> Нравится</button>
            </div>
          </fieldset>

          {requiresReason && (
            <fieldset className="reason-fieldset">
              <legend>{currentResponse.vote === "like" ? "Что именно понравилось?" : "Что именно не подошло?"} <small>Можно выбрать несколько</small></legend>
              <div className="reason-buttons">
                {styleReasons.map((reason) => (
                  <button type="button" key={reason} className={currentResponse.reasons.includes(reason) ? "is-active" : ""} onClick={() => toggleReason(reason)} aria-pressed={currentResponse.reasons.includes(reason)}>{reason}</button>
                ))}
              </div>
            </fieldset>
          )}

          <div className="style-nav-actions">
            <button type="button" onClick={goBack} disabled={index === 0}>← Назад</button>
            {requiresReason && <button type="button" className="style-next" disabled={!canContinue} onClick={() => moveForward()}>{index === styleReferences.length - 1 ? "Показать результат" : "Следующий пример"} →</button>}
          </div>
        </div>
      </div>
    </section>
  );
}
