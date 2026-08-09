import Link from "next/link";

const links = [
  ["Проекты", "/projects"],
  ["Тест стиля", "/style-check"],
  ["Услуги", "/#services"],
  ["Процесс", "/#process"],
  ["Отзывы", "/reviews"],
];

export function Header() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="brand" aria-label="Zakulab — на главную">
          <span className="brand-glyph">ZK</span>
          <span>zakulab</span>
        </Link>
        <nav className="desktop-nav" aria-label="Основная навигация">
          {links.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <Link className="header-cta" href="/#contact">
          Обсудить проект <span aria-hidden="true">↗</span>
        </Link>
        <details className="mobile-menu">
          <summary aria-label="Открыть меню">Меню</summary>
          <nav aria-label="Мобильная навигация">
            {links.map(([label, href]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
            <Link href="/#contact">Обсудить проект</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
