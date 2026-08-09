export type StyleAxis = "space" | "energy" | "expression" | "emotion";

export type StyleReference = {
  id: string;
  number: string;
  title: string;
  category: string;
  description: string;
  traits: string[];
  preview: "editorial" | "brutal" | "premium" | "organic" | "technical" | "product" | "vivid" | "catalog";
  axes: Record<StyleAxis, number>;
};

export const styleReasons = [
  "Цвет",
  "Шрифты",
  "Композиция",
  "Фото / графика",
  "Плотность",
  "Эффекты / анимация",
] as const;

export const styleAxes: Array<{
  key: StyleAxis;
  left: string;
  right: string;
  label: string;
}> = [
  { key: "space", left: "Воздушно", right: "Плотно", label: "Количество воздуха" },
  { key: "energy", left: "Спокойно", right: "Энергично", label: "Визуальный темп" },
  { key: "expression", left: "Сдержанно", right: "Выразительно", label: "Степень выразительности" },
  { key: "emotion", left: "Рационально", right: "Эмоционально", label: "Характер подачи" },
];

export const styleReferences: StyleReference[] = [
  {
    id: "editorial",
    number: "01",
    title: "Редакционный минимализм",
    category: "Воздух · типографика · ритм",
    description: "Много свободного пространства, крупные заголовки и спокойная композиция. Контент ощущается как хорошо сверстанный журнал.",
    traits: ["светлый", "воздушный", "типографичный"],
    preview: "editorial",
    axes: { space: -1, energy: -0.65, expression: 0.05, emotion: -0.15 },
  },
  {
    id: "brutal",
    number: "02",
    title: "Смелая типографика",
    category: "Контраст · масштаб · заявление",
    description: "Очень крупный текст, резкие контрасты и намеренно прямолинейная сетка. Сайт говорит громко и сразу задаёт характер.",
    traits: ["контрастный", "дерзкий", "прямой"],
    preview: "brutal",
    axes: { space: 0.2, energy: 1, expression: 1, emotion: 0.35 },
  },
  {
    id: "premium",
    number: "03",
    title: "Тёмный премиальный",
    category: "Статус · атмосфера · детали",
    description: "Тёмная палитра, деликатные акценты и крупная предметная фотография. Темп медленный, впечатление — дорогое и собранное.",
    traits: ["тёмный", "статусный", "атмосферный"],
    preview: "premium",
    axes: { space: -0.35, energy: -0.45, expression: 0.45, emotion: 0.7 },
  },
  {
    id: "organic",
    number: "04",
    title: "Мягкий и естественный",
    category: "Тепло · формы · забота",
    description: "Природные цвета, округлая геометрия и дружелюбная подача. Подходит брендам, которым важны близость и человеческий тон.",
    traits: ["тёплый", "мягкий", "дружелюбный"],
    preview: "organic",
    axes: { space: -0.25, energy: -0.4, expression: 0.2, emotion: 1 },
  },
  {
    id: "technical",
    number: "05",
    title: "Техническая система",
    category: "Сетка · данные · точность",
    description: "Модульная сетка, моноширинные подписи и визуальный язык интерфейсов. Создаёт ощущение компетентности и контроля.",
    traits: ["системный", "технологичный", "точный"],
    preview: "technical",
    axes: { space: 0.15, energy: 0.25, expression: 0.35, emotion: -1 },
  },
  {
    id: "product",
    number: "06",
    title: "Продуктовый и функциональный",
    category: "Интерфейс · сценарии · польза",
    description: "Спокойная оболочка, карточки и понятные действия. Внешний вид подчинён удобству и объяснению продукта.",
    traits: ["понятный", "практичный", "интерфейсный"],
    preview: "product",
    axes: { space: 0.15, energy: -0.2, expression: -0.65, emotion: -0.85 },
  },
  {
    id: "vivid",
    number: "07",
    title: "Яркий визуальный",
    category: "Цвет · образ · движение",
    description: "Насыщенная палитра, большие изображения и активная композиция. Эмоция возникает раньше, чем человек начинает читать детали.",
    traits: ["яркий", "динамичный", "эмоциональный"],
    preview: "vivid",
    axes: { space: -0.1, energy: 0.85, expression: 0.9, emotion: 0.85 },
  },
  {
    id: "catalog",
    number: "08",
    title: "Плотный каталог",
    category: "Ассортимент · сравнение · выбор",
    description: "Много товаров и полезной информации на экране. Акцент не на атмосфере, а на скорости поиска и принятия решения.",
    traits: ["информативный", "плотный", "коммерческий"],
    preview: "catalog",
    axes: { space: 1, energy: 0.35, expression: -0.25, emotion: -0.7 },
  },
];
