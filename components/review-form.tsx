export function ReviewForm() {
  return (
    <form
      className="review-form"
      method="POST"
      action="/api/reviews"
    >
      <p className="hidden-field">
        <label>Не заполняйте: <input name="bot-field" /></label>
      </p>
      <label>
        <span>Имя и фамилия *</span>
        <input name="name" required autoComplete="name" />
      </label>
      <label>
        <span>Компания *</span>
        <input name="company" required autoComplete="organization" />
      </label>
      <label>
        <span>Ваша должность или роль *</span>
        <input name="role" required autoComplete="organization-title" />
      </label>
      <label>
        <span>Название проекта *</span>
        <input name="project-name" required placeholder="Например, сайт компании" />
      </label>
      <label>
        <span>Ссылка на сайт проекта *</span>
        <input name="project-url" required type="url" placeholder="https://" />
      </label>
      <label>
        <span>Соцсеть или мессенджер *</span>
        <select name="profile-network" required defaultValue="">
          <option value="" disabled>Выберите площадку</option>
          <option>Telegram</option>
          <option>MAX</option>
          <option>VK</option>
          <option>LinkedIn</option>
          <option>Другая сеть</option>
        </select>
      </label>
      <label>
        <span>Ссылка на ваш публичный профиль *</span>
        <input name="public-profile" required placeholder="https:// или @username" />
      </label>
      <label className="field-wide">
        <span>Ваш отзыв *</span>
        <textarea name="review" required rows={6} placeholder="Что было важно в работе и что получилось в результате?" />
      </label>
      <label className="consent field-wide">
        <input type="checkbox" name="publication-consent" required />
        <span>Разрешаю опубликовать имя, компанию, роль, текст отзыва, ссылку на проект и указанный публичный профиль</span>
      </label>
      <label className="consent field-wide">
        <input type="checkbox" name="public-contact-awareness" required />
        <span>Понимаю, что ссылка на профиль будет видна посетителям сайта и они смогут перейти в него или написать мне</span>
      </label>
      <label className="consent field-wide">
        <input type="checkbox" name="privacy-consent" required />
        <span>Соглашаюсь с <a href="/privacy" target="_blank">обработкой персональных данных</a></span>
      </label>
      <button className="button field-wide" type="submit">Отправить на проверку <span aria-hidden="true">↗</span></button>
    </form>
  );
}
