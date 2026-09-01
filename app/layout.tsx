import type { Metadata } from "next";
import { Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/smooth-scroll";

const manrope = Manrope({
  subsets: ["cyrillic", "latin"],
  display: "swap",
  variable: "--font-manrope",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: "400",
  subsets: ["cyrillic", "latin"],
  display: "swap",
  variable: "--font-ibm-plex-mono",
});

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
    <html lang="ru" data-scroll-behavior="smooth" className={`${manrope.variable} ${ibmPlexMono.variable}`}>
      <body>
        <SmoothScroll />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
      </body>
    </html>
  );
}
