"use client";

import { useEffect, useState } from "react";

export function ProjectForm() {
  const [styleBrief, setStyleBrief] = useState("");

  useEffect(() => {
    setStyleBrief(localStorage.getItem("zakulab-style-brief") ?? "");
  }, []);

  function clearStyleBrief() {
    localStorage.removeItem("zakulab-style-brief");
    setStyleBrief("");
  }

  return (
    <form
      className="project-form"
      name="project-request"
      method="POST"
      action="/success?form=project"
      data-netlify="true"
      data-netlify-honeypot="bot-field"
    >
      <input type="hidden" name="form-name" value="project-request" />
      <input type="hidden" name="visual-profile" value={styleBrief} />
      <p className="hidden-field">
        <label>
          Не заполняйте это поле: <input name="bot-field" />
        </label>
      </p>
      {styleBrief && (
        <div className="attached-style-brief field-wide" aria-live="polite">
          <div><span>VISUAL / PROFILE</span><strong>Визуальный тест прикреплён к заявке</strong></div>
          <button type="button" onClick={clearStyleBrief}>Удалить</button>
        </div>
      )}
      <label>
        <span>Как вас зовут *</span>
        <input name="name" autoComplete="name" required placeholder="Александр" />
      </label>
      <label>
        <span>Компания</span>
        <input name="company" autoComplete="organization" placeholder="Название или сфера" />
      </label>
      <label className="field-wide">
        <span>Что нужно сделать? *</span>
        <textarea
          name="task"
          required
          rows={4}
          placeholder="Коротко опишите бизнес, задачу и желаемый результат"
        />
      </label>
      <label>
        <span>Бюджет *</span>
        <select name="budget" required defaultValue="">
          <option value="" disabled>Выберите диапазон</option>
          <option>40–70 тыс. ₽</option>
          <option>70–150 тыс. ₽</option>
          <option>150–300 тыс. ₽</option>
          <option>Более 300 тыс. ₽</option>
          <option>Пока не определён</option>
        </select>
      </label>
      <label>
        <span>Где ответить? *</span>
        <select name="messenger" required defaultValue="Telegram">
          <option>Telegram</option>
          <option>MAX</option>
          <option>Другой способ</option>
        </select>
      </label>
      <label className="field-wide">
        <span>Контакт для связи *</span>
        <input name="contact" required placeholder="@username, номер телефона или ссылка" />
      </label>
      <label className="consent field-wide">
        <input type="checkbox" name="consent" required />
        <span>
          Я соглашаюсь с <a href="/consent" target="_blank">обработкой персональных данных</a>
        </span>
      </label>
      <button type="submit" className="button button-light field-wide">
        Отправить заявку <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}
