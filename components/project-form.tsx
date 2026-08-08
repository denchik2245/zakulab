export function ProjectForm() {
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
      <p className="hidden-field">
        <label>
          Не заполняйте это поле: <input name="bot-field" />
        </label>
      </p>
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
          Я соглашаюсь с <a href="/privacy" target="_blank">обработкой персональных данных</a>
        </span>
      </label>
      <button type="submit" className="button button-light field-wide">
        Отправить заявку <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}
