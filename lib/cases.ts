export type CaseBlockSpacing = "compact" | "large";

export type CaseBlockItem = {
  id: string;
  label: string;
  text: string;
};

export type CaseBlock =
  | {
      id: string;
      type: "image";
      image: string;
      alt: string;
      caption: string;
      spacing: CaseBlockSpacing;
    }
  | {
      id: string;
      type: "gallery";
      images: { id: string; image: string; alt: string }[];
      spacing: CaseBlockSpacing;
    }
  | {
      id: string;
      type: "text";
      title: string;
      body: string;
      listStyle: "none" | "bullet" | "numbered" | "labeled";
      items: CaseBlockItem[];
      spacing: CaseBlockSpacing;
    }
  | {
      id: string;
      type: "callout";
      text: string;
      spacing: CaseBlockSpacing;
    };

export type CaseStudy = {
  slug: string;
  index: string;
  title: string;
  eyebrow: string;
  summary: string;
  role: string;
  year: string;
  url: string;
  accent: "green" | "orange" | "coral";
  category: "corporate" | "commerce";
  catalogTask: string;
  status: "published" | "draft";
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  whatDone?: string;
  blocks?: CaseBlock[];
  verified: string[];
  draft: {
    challenge: string;
    approach: string;
    decisions: { title: string; text: string }[];
    result: string;
  };
};

export function createLegacyCaseBlocks(caseStudy: Pick<CaseStudy, "slug" | "draft">, previewImage = ""): CaseBlock[] {
  const decisions = caseStudy.draft.decisions.map((decision, index) => ({
    id: `${caseStudy.slug}-decision-${index + 1}`,
    label: decision.title,
    text: decision.text,
  }));

  return [
    ...(previewImage ? [{ id: `${caseStudy.slug}-cover`, type: "image" as const, image: previewImage, alt: "", caption: "", spacing: "large" as const }] : []),
    { id: `${caseStudy.slug}-context`, type: "text", title: "Контекст задачи", body: caseStudy.draft.challenge, listStyle: "none", items: [], spacing: "large" },
    { id: `${caseStudy.slug}-approach`, type: "text", title: "Подход", body: caseStudy.draft.approach, listStyle: "none", items: [], spacing: "large" },
    { id: `${caseStudy.slug}-decisions`, type: "text", title: "Ключевые решения", body: "", listStyle: "labeled", items: decisions, spacing: "large" },
    { id: `${caseStudy.slug}-result`, type: "text", title: "Результат", body: caseStudy.draft.result, listStyle: "none", items: [], spacing: "large" },
  ];
}

export const cases: CaseStudy[] = [
  {
    slug: "alts",
    index: "01",
    title: "АЛТС",
    eyebrow: "Промышленность · корпоративный сайт",
    summary:
      "Сайт для компании в сфере алюминотермитной сварки и обслуживания железнодорожных путей.",
    role: "Структура, UX/UI-дизайн с нуля, авторский надзор",
    year: "2025",
    url: "https://alts-ural.ru/",
    accent: "green",
    category: "corporate",
    catalogTask: "Объяснить сложную промышленную услугу и собрать убедительную презентацию компании.",
    status: "published",
    featured: true,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    verified: [
      "Полный дизайн сайта разработан с нуля",
      "Спроектирована подача сложной промышленной услуги",
      "Проведён авторский надзор за вёрсткой",
    ],
    draft: {
      challenge:
        "[УТОЧНИТЬ] Заказчику требовалось сделать сложную узкопрофильную услугу понятной для закупщиков и технических специалистов, одновременно показав масштаб работ и опыт компании.",
      approach:
        "[УТОЧНИТЬ] В основу структуры легли реальные сценарии выбора подрядчика: компетенции, география, технологии, подтверждённый опыт и быстрый переход к обсуждению задачи.",
      decisions: [
        {
          title: "Сложное — по уровням",
          text: "[УТОЧНИТЬ] Информация разделена на короткие смысловые уровни, чтобы посетитель мог быстро оценить компанию, а затем углубиться в технические детали.",
        },
        {
          title: "Цифры как доказательство",
          text: "Факты об опыте, географии и выполненных работах вынесены в самостоятельные визуальные блоки вместо общих рекламных обещаний.",
        },
        {
          title: "Индустриальный ритм",
          text: "Сдержанная палитра, крупная типографика и модульная сетка поддерживают инженерный характер бизнеса.",
        },
      ],
      result:
        "[УТОЧНИТЬ] Новый сайт стал единой презентационной площадкой компании и упростил знакомство потенциальных заказчиков с направлениями работ.",
    },
  },
  {
    slug: "ashanti",
    index: "02",
    title: "Ashanti",
    eyebrow: "E-commerce · интернет-магазин",
    summary:
      "Интерфейс интернет-магазина индийских товаров с большим каталогом и несколькими сценариями покупки.",
    role: "Структура, UX/UI-дизайн с нуля, авторский надзор",
    year: "2025",
    url: "https://ashaindia.ru/",
    accent: "orange",
    category: "commerce",
    catalogTask: "Организовать каталог из тысяч товаров и сделать путь к покупке понятным.",
    status: "published",
    featured: true,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    verified: [
      "Полный дизайн интернет-магазина разработан с нуля",
      "Спроектирована работа с каталогом из тысяч товаров",
      "Проведён авторский надзор за реализацией",
    ],
    draft: {
      challenge:
        "[УТОЧНИТЬ] Требовалось собрать большой и разнородный каталог в понятную систему, сохранив характер бренда и быстрый путь к покупке.",
      approach:
        "[УТОЧНИТЬ] Проект строился вокруг частых пользовательских задач: найти категорию или бренд, сравнить товары, понять условия доставки и вернуться к избранному.",
      decisions: [
        {
          title: "Каталог без перегруза",
          text: "Категории, поиск и сервисные действия собраны в ясную двухуровневую навигацию, рассчитанную на большой ассортимент.",
        },
        {
          title: "Бренд через детали",
          text: "Тёплая природная палитра и мягкая геометрия создают узнаваемый характер, не мешая товарам оставаться главным содержанием.",
        },
        {
          title: "Покупка без вопросов",
          text: "Доставка, лояльность, наличие магазинов и возврат показаны рядом с основным предложением, а не спрятаны в подвале.",
        },
      ],
      result:
        "[УТОЧНИТЬ] Магазин получил цельную масштабируемую систему интерфейсов для каталога, промо и сервисных сценариев.",
    },
  },
  {
    slug: "seo-roi",
    index: "03",
    title: "SEO & ROI",
    eyebrow: "B2B-услуги · корпоративный сайт",
    summary:
      "Коммерческий сайт SEO-команды с фокусом на измеримый результат и понятную подачу методологии.",
    role: "Структура, UX/UI-дизайн с нуля, авторский надзор",
    year: "2025",
    url: "https://urkov-seo.ru/",
    accent: "coral",
    category: "corporate",
    catalogTask: "Перевести сложную B2B-услугу в последовательный коммерческий сценарий.",
    status: "published",
    featured: true,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    verified: [
      "Полный дизайн сайта разработан с нуля",
      "Сложная услуга переведена в последовательный коммерческий сценарий",
      "Проведён авторский надзор за вёрсткой",
    ],
    draft: {
      challenge:
        "[УТОЧНИТЬ] Нужно было отстроить команду от SEO-подрядчиков, продающих позиции и трафик, и связать предложение с бизнес-результатом клиента.",
      approach:
        "[УТОЧНИТЬ] Структура последовательно отвечает на вопросы владельца бизнеса: что изменится, почему подход работает, как прогнозируется результат и что произойдёт после заявки.",
      decisions: [
        {
          title: "Один сильный тезис",
          text: "Первый экран сразу связывает SEO с ростом бизнеса и ROI, не заставляя посетителя расшифровывать профессиональный жаргон.",
        },
        {
          title: "Методология на виду",
          text: "Расчёты, графики и логика работы становятся частью аргументации, а не приложением к коммерческому предложению.",
        },
        {
          title: "Контрастная система",
          text: "Тёмная основа и коралловый акцент создают энергичный характер и направляют внимание к ключевым действиям.",
        },
      ],
      result:
        "[УТОЧНИТЬ] Сайт сформировал цельную презентацию подхода команды и стал основной точкой входа для новых обращений.",
    },
  },
];

export function getCase(slug: string) {
  return cases.find((item) => item.slug === slug);
}

export function hasCasePlaceholders(item: CaseStudy) {
  return JSON.stringify([item.title, item.eyebrow, item.summary, item.whatDone, item.role, item.catalogTask,
    item.verified, item.blocks ?? item.draft]).includes("[УТОЧНИТЬ]");
}
