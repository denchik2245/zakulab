export function ReviewForm() {
  return (
    <form
      className="review-form"
      name="client-review"
      method="POST"
      action="/success?form=review"
      data-netlify="true"
      data-netlify-honeypot="bot-field"
    >
      <input type="hidden" name="form-name" value="client-review" />
      <p className="hidden-field">
        <label>Не заполняйте: <input name="bot-field" /></label>
      </p>
      <label>
        <span>Имя и фамилия *</span>
        <input name="name" required autoComplete="name" />
      </label>
      <label>
        <span>Компания и должность *</span>
        <input name="company" required autoComplete="organization-title" />
      </label>
      <label>
        <span>Ссылка на сайт проекта *</span>
        <input name="project-url" required type="url" placeholder="https://" />
      </label>
      <label>
        <span>Приватный контакт для проверки *</span>
        <input name="contact" required placeholder="Телефон или ник в мессенджере" />
      </label>
      <label className="field-wide">
        <span>Ваш отзыв *</span>
        <textarea name="review" required rows={6} placeholder="Что было важно в работе и что получилось в результате?" />
      </label>
      <label className="consent field-wide">
        <input type="checkbox" name="publish-consent" required />
        <span>Разрешаю опубликовать имя, компанию, должность и текст отзыва после проверки</span>
      </label>
      <label className="consent field-wide">
        <input type="checkbox" name="privacy-consent" required />
        <span>Соглашаюсь с <a href="/privacy" target="_blank">обработкой персональных данных</a></span>
      </label>
      <button className="button field-wide" type="submit">Отправить на проверку <span aria-hidden="true">↗</span></button>
    </form>
  );
}
