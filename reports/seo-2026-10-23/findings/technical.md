# Technical SEO

## High: Static responses lack compression and explicit cache policy

CSS 246561 bytes and site entry JS 77026 bytes lack Content-Encoding despite Accept-Encoding gzip, br; checked static responses lack Cache-Control.

Enable compression on serving host and long-lived cache for hashed assets.

## Low: Sitemap lastmod uses global content save date

All 21 dates equal global updatedAt, not per-page significant update.

Use truthful per-page update times or omit lastmod.

