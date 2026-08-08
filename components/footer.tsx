import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <Link href="/" className="brand brand-light">
            <span className="brand-glyph">ZK</span>
            <span>zakulab</span>
          </Link>
          <p>Личная дизайн-практика Дениса Закусилова.</p>
        </div>
        <div className="footer-links">
          <Link href="/#work">Работы</Link>
          <Link href="/#services">Услуги</Link>
          <Link href="/reviews">Отзывы</Link>
          <Link href="/privacy">Политика</Link>
        </div>
        <div className="footer-meta">
          <p>Самозанятый · Работаю по договору</p>
          <p>Удалённо по всей России</p>
          <p>© {new Date().getFullYear()} Денис Закусилов</p>
        </div>
      </div>
    </footer>
  );
}
