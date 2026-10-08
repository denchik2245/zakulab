export type VerifiedReview = {
  id: string;
  status: "published" | "pending" | "rejected" | "demo";
  submittedAt: string;
  publishedAt: string;
  showOnHome: boolean;
  showOnReviewsPage: boolean;
  order: number;
  text: string;
  image?: string;
  consent?: { acceptedAt: string; version: "2026-10-08" };
  author: {
    name: string;
    initials: string;
    role: string;
    company: string;
  };
  project: {
    name: string;
    url: string;
    caseUrl?: string;
  };
  profile: {
    network: "Telegram" | "MAX" | "VK" | "LinkedIn" | "Другая сеть";
    label: string;
    url: string;
  };
};

/**
 * В этот массив добавляются только отзывы, для которых:
 * 1. подтверждён реальный совместный проект;
 * 2. ссылка ведёт на публичный профиль автора;
 * 3. получено явное согласие на публикацию всех указанных данных.
 *
 * Пример структуры:
 * {
 *   id: "client-project",
 *   status: "published",
 *   submittedAt: "2026-08-08T00:00:00.000Z",
 *   publishedAt: "2026-08-08",
 *   text: "Текст, согласованный с автором.",
 *   author: { name: "Имя Фамилия", initials: "ИФ", role: "Должность", company: "Компания" },
 *   project: { name: "Название проекта", url: "https://example.com", caseUrl: "/cases/example" },
 *   profile: { network: "Telegram", label: "@username", url: "https://t.me/username" },
 * }
 */
export const verifiedReviews: VerifiedReview[] = [
  {
    id: "demo-development-company",
    status: "demo",
    submittedAt: "2026-07-18T00:00:00.000Z",
    publishedAt: "2026-07-18",
    showOnHome: true,
    showOnReviewsPage: true,
    order: 10,
    text: "Денис быстро разобрался в сложном продукте и предложил структуру, которую мы сами долго не могли сформулировать. Макеты получились ясными, современными и без лишних декоративных решений. Особенно понравилось, что каждое решение он мог объяснить с точки зрения бизнеса.",
    image: "/assets/figma/rectangle25.png",
    author: {
      name: "Алексей Воронцов",
      initials: "АВ",
      role: "Основатель",
      company: "Norma Development",
    },
    project: {
      name: "Корпоративный сайт застройщика",
      url: "https://example.com/demo-project-1",
    },
    profile: {
      network: "Telegram",
      label: "@alexey_demo",
      url: "https://example.com/demo-profile-1",
    },
  },
  {
    id: "demo-ecommerce-brand",
    status: "demo",
    submittedAt: "2026-06-04T00:00:00.000Z",
    publishedAt: "2026-06-04",
    showOnHome: true,
    showOnReviewsPage: true,
    order: 20,
    text: "Пришли с задачей обновить интернет-магазин, но в процессе получили намного больше: понятную логику каталога, сильную подачу продукта и цельную визуальную систему. Работа шла спокойно, сроки соблюдались, а комментарии не терялись.",
    image: "/assets/figma/rectangle12.png",
    author: {
      name: "Марина Крылова",
      initials: "МК",
      role: "Руководитель маркетинга",
      company: "Forma Home",
    },
    project: {
      name: "Интернет-магазин интерьерного бренда",
      url: "https://example.com/demo-project-2",
      caseUrl: "/cases/ashanti",
    },
    profile: {
      network: "VK",
      label: "vk.com/marina_demo",
      url: "https://example.com/demo-profile-2",
    },
  },
  {
    id: "demo-b2b-service",
    status: "demo",
    submittedAt: "2026-04-22T00:00:00.000Z",
    publishedAt: "2026-04-22",
    showOnHome: true,
    showOnReviewsPage: true,
    order: 30,
    text: "Нам нужен был не просто красивый лендинг, а страница, которая понятно объясняет сложную услугу и ведёт к заявке. Денис выстроил аргументацию, помог сократить лишний текст и собрал дизайн, который выглядит убедительно для нашей аудитории.",
    image: "/assets/figma/rectangle13.png",
    author: {
      name: "Илья Сафонов",
      initials: "ИС",
      role: "Коммерческий директор",
      company: "Vector B2B",
    },
    project: {
      name: "Лендинг B2B-сервиса",
      url: "https://example.com/demo-project-3",
    },
    profile: {
      network: "MAX",
      label: "Илья Сафонов · демо",
      url: "https://example.com/demo-profile-3",
    },
  },
  {
    id: "demo-legal-company",
    status: "demo",
    submittedAt: "2026-03-10T00:00:00.000Z",
    publishedAt: "2026-03-10",
    showOnHome: false,
    showOnReviewsPage: true,
    order: 40,
    text: "Денис помог превратить сложное описание юридических услуг в понятную структуру и аккуратный интерфейс. Работа была организована последовательно, а решения всегда опирались на задачи будущих клиентов.",
    image: "/assets/figma/rectangle29.png",
    author: { name: "Дмитрий Кузнецов", initials: "ДК", role: "Руководитель маркетинга", company: "Юридическая компания" },
    project: { name: "Юридическая компания", url: "https://example.com/demo-project-4" },
    profile: { network: "Telegram", label: "@dmitry_demo", url: "https://example.com/demo-profile-4" },
  },
  {
    id: "demo-service-company",
    status: "demo",
    submittedAt: "2026-02-12T00:00:00.000Z",
    publishedAt: "2026-02-12",
    showOnHome: false,
    showOnReviewsPage: true,
    order: 50,
    text: "Сотрудничество получилось спокойным и продуктивным. Денис быстро разобрался в продукте, предложил ясную логику страницы и собрал современный дизайн без лишних декоративных элементов.",
    image: "/assets/figma/rectangle27.png",
    author: { name: "Андрей Васильев", initials: "АВ", role: "Руководитель маркетинга", company: "Сервисная компания" },
    project: { name: "Сфера услуг", url: "https://example.com/demo-project-5" },
    profile: { network: "VK", label: "vk.com/andrey_demo", url: "https://example.com/demo-profile-5" },
  },
];
