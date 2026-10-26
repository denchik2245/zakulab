/** Pricing for the public project calculator. Base prices follow the "Услуги и стоимость" section. */
export type SiteType = "landing" | "corporate" | "commerce";
export type Scope = "design" | "tilda";
export type Pace = "standard" | "urgent";

type Context = { type: SiteType; scope: Scope; units: number };

export const siteTypes: Record<SiteType, { title: string; text: string; unitLabel: string; unitHint: string; included: number; min: number; max: number; price: Record<Scope, number>; extraUnit: Record<Scope, number>; days: [number, number]; unitsPerDay: number }> = {
  landing: { title: "Одностраничный сайт", text: "Лендинг или промо-сайт для одного продукта, услуги или предложения.", unitLabel: "Количество блоков", unitHint: "Первый экран, преимущества, услуги, отзывы, форма и другие секции.", included: 8, min: 4, max: 20, price: { design: 15000, tilda: 25000 }, extraUnit: { design: 1500, tilda: 2500 }, days: [7, 10], unitsPerDay: 3 },
  corporate: { title: "Многостраничный сайт", text: "Сайт компании, сервиса или личного бренда с несколькими разделами.", unitLabel: "Количество страниц", unitHint: "Уникальные страницы: главная, о компании, услуги, кейсы, контакты.", included: 5, min: 2, max: 30, price: { design: 25000, tilda: 40000 }, extraUnit: { design: 3500, tilda: 5500 }, days: [10, 14], unitsPerDay: 2 },
  commerce: { title: "Интернет-магазин", text: "Каталог, карточки товаров, корзина и оформление заказа.", unitLabel: "Количество шаблонов страниц", unitHint: "Главная, каталог, карточка товара, корзина, оформление заказа и другие.", included: 5, min: 5, max: 30, price: { design: 25000, tilda: 40000 }, extraUnit: { design: 3500, tilda: 5500 }, days: [10, 14], unitsPerDay: 2 },
};

export const scopes: Record<Scope, { title: string; text: string }> = {
  design: { title: "Только дизайн", text: "Макет в Figma с адаптивом для телефона и планшета." },
  tilda: { title: "Дизайн и вёрстка на Tilda", text: "Готовый сайт, который можно сразу запускать." },
};

export const paces: Record<Pace, { title: string; text: string }> = {
  standard: { title: "Обычный срок", text: "Спокойная работа по этапам." },
  urgent: { title: "Срочно", text: "Быстрее примерно на треть, +30% к стоимости." },
};

export type Extra = { id: string; title: string; text: string; tildaOnly?: boolean; price: (context: Context) => number; days: number };

export const extras: Extra[] = [
  { id: "prototype", title: "Структура и прототип", text: "Продумаю логику страниц и порядок блоков до начала дизайна.", price: ({ type }) => type === "landing" ? 3000 : 6000, days: 2 },
  { id: "copywriting", title: "Тексты для сайта", text: "Напишу понятные продающие тексты под каждый блок.", price: ({ type, units }) => type === "landing" ? 6000 : Math.max(6000, units * 1500), days: 3 },
  { id: "illustrations", title: "Иконки и иллюстрации", text: "Отрисую набор иконок и графику в стиле сайта.", price: ({ type }) => type === "landing" ? 4000 : 7000, days: 2 },
  { id: "animation", title: "Анимации и эффекты", text: "Появление блоков, ховеры и живые акценты интерфейса.", price: ({ type }) => type === "landing" ? 4000 : 7000, days: 2 },
  { id: "quiz", title: "Квиз или калькулятор", text: "Интерактивный блок, который помогает собирать заявки.", price: () => 6000, days: 2 },
  { id: "language", title: "Вторая языковая версия", text: "Адаптирую страницы под второй язык.", price: ({ type, scope, units }) => Math.round(0.3 * (siteTypes[type].price[scope] + Math.max(0, units - siteTypes[type].included) * siteTypes[type].extraUnit[scope])), days: 3 },
  { id: "integrations", title: "Формы, CRM и аналитика", text: "Заявки в Telegram, почту или CRM, Яндекс Метрика и цели.", tildaOnly: true, price: () => 3000, days: 1 },
  { id: "seo", title: "Базовая SEO-настройка", text: "Заголовки, описания, адреса страниц и карта сайта.", tildaOnly: true, price: ({ type }) => type === "landing" ? 2000 : 4000, days: 1 },
];

export type Selection = Context & { extras: string[]; pace: Pace };
export type Estimate = { lines: { title: string; price: number }[]; total: number; days: [number, number] };

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);
const roundPrice = (value: number) => Math.round(value / 500) * 500;

export function availableExtras(scope: Scope) {
  return extras.filter((extra) => scope === "tilda" || !extra.tildaOnly);
}

export function estimateProject(selection: Selection): Estimate {
  const type = siteTypes[selection.type];
  const extraUnits = Math.max(0, selection.units - type.included);
  const lines = [{ title: `${type.title}: ${lowerFirst(scopes[selection.scope].title)}`, price: type.price[selection.scope] }];
  if (extraUnits > 0) lines.push({ title: `${type.unitLabel}: ещё ${extraUnits}`, price: extraUnits * type.extraUnit[selection.scope] });
  let days = Math.ceil(extraUnits / type.unitsPerDay);
  for (const extra of availableExtras(selection.scope)) {
    if (!selection.extras.includes(extra.id)) continue;
    lines.push({ title: extra.title, price: extra.price(selection) });
    days += extra.days;
  }
  const subtotal = lines.reduce((sum, line) => sum + line.price, 0);
  if (selection.pace === "urgent") lines.push({ title: "Срочность, +30%", price: subtotal * 0.3 });
  const factor = selection.pace === "urgent" ? 0.7 : 1;
  const rounded = lines.map((line) => ({ ...line, price: roundPrice(line.price) }));
  return {
    lines: rounded,
    total: rounded.reduce((sum, line) => sum + line.price, 0),
    days: [Math.max(3, Math.round((type.days[0] + days) * factor)), Math.max(4, Math.round((type.days[1] + days) * factor))],
  };
}

/** Matches the "15.000 ₽" price format used in the services section. */
export function formatPrice(value: number) {
  return `${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} ₽`;
}

export function formatDays([from, to]: [number, number]) {
  const last = to % 10 === 1 && to % 100 !== 11 ? "день" : [2, 3, 4].includes(to % 10) && ![12, 13, 14].includes(to % 100) ? "дня" : "дней";
  return `${from}–${to} ${last}`;
}
