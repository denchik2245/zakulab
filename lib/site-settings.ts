export type ServiceItem = {
  id: string;
  title: string;
  text: string;
  price: string;
  time: string;
};

export type SiteSettings = {
  heroTitle: string;
  heroAccent: string;
  heroLead: string;
  aboutLead: string;
  aboutText: string;
  contactTitle: string;
  contactAccent: string;
  contactText: string;
  contactPrice: string;
  services: ServiceItem[];
};

export const defaultSiteSettings: SiteSettings = {
  heroTitle: "Сайты, в которых",
  heroAccent: "бизнес понятен",
  heroLead: "Разбираюсь в задаче, проектирую ясную структуру и довожу сайт до запуска — сам или с проверенной командой.",
  aboutLead: "Я не начинаю с цвета кнопки. Сначала выясняю, что должен понять человек и какое действие важно бизнесу.",
  aboutText: "Проектирую структуру и дизайн сам. Сайты на Tilda собираю под ключ, а для кастомной разработки подключаю проверенных специалистов и контролирую результат.",
  contactTitle: "Давайте разберём",
  contactAccent: "вашу задачу",
  contactText: "Расскажите о проекте — я изучу вводные и свяжусь с вами выбранным способом в течение одного рабочего дня.",
  contactPrice: "от 40 000 ₽",
  services: [
    { id: "landing", title: "Лендинг", text: "Сфокусированная страница для запуска продукта, услуги или рекламной кампании.", price: "от 40 000 ₽", time: "от 7 рабочих дней" },
    { id: "corporate", title: "Многостраничный сайт", text: "Понятная система для компании со сложными услугами, направлениями и разными аудиториями.", price: "после оценки", time: "от 15 рабочих дней" },
    { id: "commerce", title: "Интернет-магазин", text: "Каталог и сценарии покупки, которые помогают выбирать, сравнивать и возвращаться.", price: "индивидуально", time: "от 25 рабочих дней" },
  ],
};
