export type ServiceItem = {
  id: string;
  title: string;
  text: string;
  price: string;
  priceSecondary: string;
  time: string;
};

export type HomeStat = {
  id: string;
  value: string;
  label: string;
};

export type PortfolioFilter = "landing" | "multipage" | "commerce" | "interface";
export type PortfolioPlacement = "featured" | "list" | "hidden";
export type PortfolioProject = {
  id: string;
  title: string;
  description: string;
  image: string;
  url: string;
  platform: string;
  tags: [string, string];
  filters: PortfolioFilter[];
  homePlacement: PortfolioPlacement;
  portfolioPlacement: "featured" | "archive" | "hidden";
  published: boolean;
  order: number;
  caseStudy?: CaseStudy;
};

export type ProcessStep = {
  id: string;
  title: string;
  text: string;
  image: string;
  secondaryTitle?: string;
  secondaryText?: string;
  secondaryImage?: string;
};

export type SmallTask = {
  id: string;
  title: string;
  text: string;
  deliverable: string;
  time: string;
  price: string;
};

export type SiteSettings = {
  heroTitle: string;
  heroName: string;
  heroRole: string;
  heroPortrait: string;
  heroGallery: string[];
  heroGallerySpeed: number;
  aboutTitle: string;
  aboutText: string;
  stats: HomeStat[];
  portfolioTitle: string;
  portfolioProjects: PortfolioProject[];
  processTitle: string;
  process: ProcessStep[];
  reviewsTitle: string;
  reviewsText: string;
  reviewImage: string;
  servicesTitle: string;
  servicesText: string;
  services: ServiceItem[];
  smallTasksTitle: string;
  smallTasks: SmallTask[];
  contactTitle: string;
  contactButton: string;
  email: string;
  telegramUrl: string;
  vkUrl: string;
  maxUrl: string;
  kworkUrl: string;
  flUrl: string;
  styleChoice: StyleChoiceSettings;
  popups: PopupSettings;
};

export const defaultSiteSettings: SiteSettings = {
  heroTitle: "Проектирую сайты и цифровые продукты, в которых легко понять главное и сделать следующий шаг",
  heroName: "Денис Закусилов",
  heroRole: "UI & UX Дизайнер",
  heroPortrait: "/assets/figma/portrait.png",
  heroGallery: [
    "/assets/figma/rectangle12.png",
    "/assets/figma/rectangle13.png",
    "/assets/figma/rectangle14.png",
    "/assets/figma/rectangle15.png",
    "/assets/figma/rectangle16.png",
  ],
  heroGallerySpeed: 30,
  aboutTitle: "Превращаю продукты и услуги в понятные цифровые решения",
  aboutText: "Сначала определяю, что важно бизнесу и пользователю, затем выстраиваю структуру, сценарии и визуальную коммуникацию. В результате дизайн помогает быстрее понять предложение и перейти к нужному действию.",
  stats: [
    { id: "experience", value: "5 лет", label: "Опыта в дизайне" },
    { id: "projects", value: "30+", label: "Проектов запущено" },
    { id: "reviews", value: "85", label: "Положительных отзывов" },
  ],
  portfolioTitle: "Портфолио",
  portfolioProjects: [
    { id: "vladkovsky", title: "На Владковском", description: "Центр дополнительного образования", image: "/assets/figma/rectangle8.png", url: "#", platform: "", tags: ["Интерфейс", "Мобильная версия"], filters: ["interface"], homePlacement: "featured", portfolioPlacement: "featured", published: true, order: 10 },
    { id: "talantum", title: "Центр творчества", description: "Онлайн-курсы подготовки к экзаменам", image: "/assets/figma/rectangle11.png", url: "#", platform: "", tags: ["Анализ конкурентов", "15 страниц"], filters: ["multipage"], homePlacement: "featured", portfolioPlacement: "featured", published: true, order: 20 },
    { id: "nextdev", title: "NextDev", description: "Digital-решения для бизнеса", image: "/assets/figma/rectangle10.png", url: "#", platform: "", tags: ["Многостраничный", "Корпоративный"], filters: ["multipage"], homePlacement: "featured", portfolioPlacement: "featured", published: true, order: 30 },
    { id: "nextdev-interface", title: "NextDev — интерфейсы", description: "Интерфейсы цифровых продуктов", image: "/assets/figma/rectangle10.png", url: "#", platform: "", tags: ["UX/UI", "Интерфейсы"], filters: ["interface"], homePlacement: "hidden", portfolioPlacement: "featured", published: true, order: 40 },
    { id: "kuzin-partners", title: "Кузин и партнёры", description: "Юридическая помощь физическим лицам", image: "/assets/figma/rectangle9.png", url: "#", platform: "", tags: ["Одностраничный", "Юридические услуги"], filters: ["landing"], homePlacement: "featured", portfolioPlacement: "featured", published: true, order: 50 },
    { id: "vladkovsky-mobile", title: "На Владковском — mobile", description: "Мобильная версия образовательного центра", image: "/assets/figma/rectangle8.png", url: "#", platform: "", tags: ["Mobile", "Интерфейс"], filters: ["interface"], homePlacement: "hidden", portfolioPlacement: "featured", published: true, order: 60 },
    { id: "siding-moldova", title: "Siding-Moldova", description: "Виниловый сайдинг для дома под ключ", image: "/assets/figma/rectangle11.png", url: "#", platform: "Tilda", tags: ["Одностраничный", "Tilda"], filters: ["landing"], homePlacement: "list", portfolioPlacement: "archive", published: true, order: 70 },
    { id: "tck-levit", title: "TCK Levit", description: "Закупка строительных материалов", image: "/assets/figma/rectangle9.png", url: "#", platform: "", tags: ["Многостраничный", "Корпоративный"], filters: ["multipage"], homePlacement: "list", portfolioPlacement: "archive", published: true, order: 80 },
    { id: "estet-apart", title: "Estet-Apart", description: "Управление посуточной и долгосрочной арендой", image: "/assets/figma/rectangle10.png", url: "#", platform: "WordPress", tags: ["Интерфейсы", "WordPress"], filters: ["multipage", "interface"], homePlacement: "list", portfolioPlacement: "archive", published: true, order: 90 },
    { id: "smol-aqua-pro", title: "SmolAquaPro", description: "Системы водоочистки", image: "/assets/figma/rectangle8.png", url: "#", platform: "Tilda", tags: ["Одностраничный", "Tilda"], filters: ["landing"], homePlacement: "list", portfolioPlacement: "archive", published: true, order: 100 },
    { id: "flat-design", title: "Flat Design", description: "Студия дизайна интерьеров", image: "/assets/figma/rectangle11.png", url: "#", platform: "", tags: ["Интерфейсы", "Дизайн интерьеров"], filters: ["interface"], homePlacement: "list", portfolioPlacement: "archive", published: true, order: 110 },
    { id: "alts", title: "АЛТС", description: "Обслуживание железнодорожной инфраструктуры", image: "/assets/figma/rectangle8.png", url: "/cases/alts", platform: "", tags: ["Многостраничный", "Корпоративный"], filters: ["multipage"], homePlacement: "hidden", portfolioPlacement: "archive", published: true, order: 120 },
    { id: "ashanti", title: "Ashanti", description: "Интернет-магазин индийских товаров", image: "/assets/figma/rectangle9.png", url: "/cases/ashanti", platform: "", tags: ["Интернет-магазин", "E-commerce"], filters: ["commerce"], homePlacement: "hidden", portfolioPlacement: "archive", published: true, order: 130 },
    { id: "seo-roi", title: "SEO & ROI", description: "Коммерческий сайт SEO-команды", image: "/assets/figma/rectangle10.png", url: "/cases/seo-roi", platform: "", tags: ["Одностраничный", "B2B"], filters: ["landing"], homePlacement: "hidden", portfolioPlacement: "archive", published: true, order: 140 },
    { id: "normdev", title: "NormDev", description: "Сайт digital-команды", image: "/assets/figma/rectangle10.png", url: "#", platform: "Tilda", tags: ["Многостраничный", "Tilda"], filters: ["multipage"], homePlacement: "hidden", portfolioPlacement: "archive", published: true, order: 150 },
    { id: "zakulab", title: "Zakulab", description: "Портфолио UI/UX-дизайнера", image: "/assets/figma/rectangle11.png", url: "#", platform: "", tags: ["Интерфейсы", "Портфолио"], filters: ["interface"], homePlacement: "hidden", portfolioPlacement: "archive", published: true, order: 160 },
  ],
  processTitle: "Как проходит работа над проектом",
  process: [
    {
      id: "discovery",
      title: "Погружение в задачу",
      text: "На старте обсуждаем проект, его цели, аудиторию и задачи бизнеса. Я изучаю продукт, текущие материалы и контекст, задаю вопросы и фиксирую основные требования. В результате у нас появляется общее понимание того, что и для кого мы проектируем.",
      image: "/assets/figma/rectangle19.png",
    },
    {
      id: "analytics",
      title: "Аналитика и прототипирование",
      text: "Изучаю конкурентов, пользовательские сценарии и логику продукта. На основе этого формирую структуру, расставляю смысловые акценты и собираю прототип. На этом этапе определяем, как пользователь будет двигаться по интерфейсу и где принимать ключевые решения.",
      image: "/assets/figma/rectangle20.png",
    },
    {
      id: "design",
      title: "Визуальная концепция и дизайн",
      text: "На основе утверждённой структуры разрабатываю визуальное направление проекта: типографику, цвета, графику и UI-элементы. После согласования концепции переношу её на остальные страницы и экраны, сохраняя единую логику и визуальную систему.",
      image: "/assets/figma/rectangle21.png",
    },
    {
      id: "implementation",
      title: "Дальнейшая реализация",
      text: "После утверждения дизайна выбираем подходящий сценарий: я либо собираю сайт под ключ на Tilda, либо подготавливаю макеты для передачи вашей команде или отдельному разработчику.",
      image: "/assets/figma/rectangle22.png",
      secondaryTitle: "Передача в разработку",
      secondaryText: "Подготавливаю макеты, компоненты, адаптивные версии и состояния элементов. Привожу файл в порядок и добавляю необходимые пояснения, чтобы разработчик мог реализовать интерфейс без лишних вопросов.",
      secondaryImage: "/assets/figma/rectangle23.png",
    },
    {
      id: "launch",
      title: "Проверка и запуск",
      text: "Перед запуском проверяю итоговый результат: адаптивность, типографику, отступы, состояния элементов и работу основных сценариев. Если сайт разрабатываю я — публикую его на домене. Если проект передан разработчикам — проверяю реализацию и фиксирую расхождения с макетами.",
      image: "/assets/figma/rectangle24.png",
    },
  ],
  reviewsTitle: "Что говорят клиенты после совместной работы",
  reviewsText: "Здесь — отзывы о процессе, коммуникации и результате. Без обезличенных цитат: у каждого отзыва есть автор и проект, над которым мы работали.",
  reviewImage: "/assets/figma/rectangle25.png",
  servicesTitle: "Услуги и стоимость",
  servicesText: "Разбиваю проект на понятные этапы и заранее фиксирую, что входит в работу. Итоговая стоимость зависит от объёма, количества экранов и формата реализации.",
  services: [
    { id: "landing", title: "Одностраничный сайт", text: "Лендинг или промо-сайт для продукта, услуги или отдельного предложения. Продумываю структуру и дизайн.", price: "от 15.000 ₽, только макет", priceSecondary: "от 25.000 ₽, верстка на Tilda", time: "7–10 дней" },
    { id: "corporate", title: "Многостраничный сайт", text: "Сайт со сложной структурой и несколькими разделами: для компании, сервиса, продукта или личного бренда.", price: "от 25.000 ₽, только макет", priceSecondary: "от 40.000 ₽, верстка на Tilda", time: "10–14 дней" },
    { id: "commerce", title: "Интернет-магазин", text: "Дизайн магазина с каталогом, карточками товаров, корзиной и основными пользовательскими сценариями.", price: "от 25.000 ₽, только макет", priceSecondary: "от 40.000 ₽, верстка на Tilda", time: "10–14 дней" },
  ],
  smallTasksTitle: "Начните с небольшой задачи",
  smallTasks: [
    { id: "audit", title: "Аудит сайта", text: "Разберу текущий сайт и покажу, где теряется понятность, логика и внимание пользователя.", deliverable: "Видео-разбор с комментариями и списком приоритетных правок, которые можно внедрить самостоятельно или передать в работу дизайнеру.", time: "1–2 дня", price: "от 3000 ₽" },
    { id: "structure", title: "Структура главной страницы", text: "Продумываю логику страницы: что и в какой последовательности должен увидеть пользователь.", deliverable: "Готовую структуру главной страницы с описанием каждого блока и логикой перехода между ними. Её можно использовать как основу для дизайна, текста и дальнейшей разработки.", time: "1–2 дня", price: "от 3000 ₽" },
  ],
  contactTitle: "Есть задача? Давайте обсудим",
  contactButton: "Обсудить",
  email: "deniszak54321@gmail.com",
  telegramUrl: "https://t.me/deniszak",
  vkUrl: "https://vk.com/",
  maxUrl: "https://max.ru/",
  kworkUrl: "https://kwork.ru/",
  flUrl: "https://fl.ru/",
  styleChoice: structuredClone(defaultStyleChoiceSettings),
  popups: {
    serviceTitlePrefix: "Заказать",
    serviceDescription: "Выберите удобный способ — отвечу, обсудим задачу и подскажу, с чего начать.",
    services: {
      landing: {
        title: "Заказать одностраничный сайт",
        description: "Выберите удобный способ — отвечу, обсудим задачу и подскажу, с чего начать.",
      },
      corporate: {
        title: "Заказать многостраничный сайт",
        description: "Выберите удобный способ — отвечу, обсудим задачу и подскажу, с чего начать.",
      },
      commerce: {
        title: "Заказать интернет-магазин",
        description: "Выберите удобный способ — отвечу, обсудим задачу и подскажу, с чего начать.",
      },
      audit: {
        title: "Заказать аудит сайта",
        description: "Выберите удобный способ — отвечу, обсудим задачу и подскажу, с чего начать.",
      },
      structure: {
        title: "Заказать структуру главной страницы",
        description: "Выберите удобный способ — отвечу, обсудим задачу и подскажу, с чего начать.",
      },
    },
    reviewFormTitle: "Оставить отзыв",
    reviewFormDescription: "Выберите удобный способ — отвечу, обсудим задачу и подскажу, с чего начать.",
    styleResultTitle: "Отправить результаты выбора стиля",
    styleResultDescription: "Выберите удобный способ — результат теста уже сохранён, останется только отправить его мне.",
  },
};
import type { CaseStudy } from "@/lib/cases";
import { defaultStyleChoiceSettings, type StyleChoiceSettings } from "@/lib/style-references";

export type PopupSettings = {
  serviceTitlePrefix: string;
  serviceDescription: string;
  services: Record<string, PopupCopy>;
  reviewFormTitle: string;
  reviewFormDescription: string;
  styleResultTitle: string;
  styleResultDescription: string;
};

export type PopupCopy = {
  title: string;
  description: string;
};
