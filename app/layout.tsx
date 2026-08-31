import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/ibm-plex-mono/400.css";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SmoothScroll } from "@/components/smooth-scroll";

export const metadata: Metadata = {
  metadataBase: new URL("https://zakulab.ru"),
  title: {
    default: "Денис Закусилов — сайты для бизнеса под ключ",
    template: "%s — zakulab",
  },
  description:
    "Проектирую и запускаю понятные сайты для бизнеса: лендинги, многостраничные сайты и интернет-магазины.",
  openGraph: {
    title: "Денис Закусилов — сайты для бизнеса под ключ",
    description: "От бизнес-задачи и структуры до дизайна и запуска.",
    url: "https://zakulab.ru",
    siteName: "zakulab",
    locale: "ru_RU",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Денис Закусилов",
    url: "https://zakulab.ru",
    jobTitle: "Веб-дизайнер и руководитель проектов",
    knowsAbout: ["Веб-дизайн", "UX/UI", "Tilda", "Интернет-магазины"],
  };

  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <body>
        <SmoothScroll />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
