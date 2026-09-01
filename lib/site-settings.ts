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

export type HomeProject = {
  id: string;
  title: string;
  description: string;
  url: string;
  platform: string;
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
  portfolioCount: string;
  portfolioImages: string[];
  projects: HomeProject[];
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
  portfolioCount: "26",
  portfolioImages: [
    "/assets/figma/rectangle8.png",
    "/assets/figma/rectangle11.png",
    "/assets/figma/rectangle10.png",
    "/assets/figma/rectangle9.png",
  ],
  projects: [
    { id: "siding-moldova", title: "Siding-Moldova", description: "Виниловый сайдинг для дома под ключ", url: "#", platform: "Tilda" },
    { id: "tck-levit", title: "TCK Levit", description: "Закупка строительных материалов", url: "#", platform: "" },
    { id: "estet-apart", title: "Estet-Apart", description: "Управление посуточной и долгосрочной арендой", url: "#", platform: "WordPress" },
    { id: "smol-aqua-pro", title: "SmolAquaPro", description: "Системы водоочистки", url: "#", platform: "Tilda" },
    { id: "flat-design", title: "Flat Design", description: "Студия дизайна интерьеров", url: "#", platform: "" },
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
};
