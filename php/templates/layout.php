<!DOCTYPE html>
<html lang="ru" data-scroll-behavior="smooth"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title><?= h($meta['title']) ?></title><meta name="description" content="<?= h($meta['description']) ?>"><meta name="robots" content="<?= h($meta['robots']) ?>"><link rel="canonical" href="<?= h($meta['canonical']) ?>"><meta property="og:title" content="<?= h($meta['title']) ?>"><meta property="og:description" content="<?= h($meta['description']) ?>"><meta property="og:url" content="<?= h($meta['canonical']) ?>"><meta property="og:type" content="website"><meta property="og:locale" content="ru_RU"><meta property="og:site_name" content="zakulab"><meta property="og:image" content="<?= h(config()['site_url']) ?>/opengraph-image.png"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/assets/figma/logo.svg" type="image/svg+xml"><link rel="manifest" href="/manifest.webmanifest"><link rel="stylesheet" href="<?= h($page === 'admin' ? ($assets['adminCss'] ?? $assets['css']) : $assets['css']) ?>">
<?php if ($page === 'projects' && !empty($assets['texture'])): ?><link rel="preload" as="image" href="<?= h($assets['texture']) ?>" fetchpriority="high"><?php endif; ?>
<script type="application/ld+json"><?= json_script(page_structured_data($page, $site, $meta, $case)) ?></script>
</head><body><script src="<?= h($assets['images']) ?>"></script>
<?php if ($page === 'admin'): ?>
<div id="admin-app"><p class="php-loading">Загружаю панель управления…</p></div><noscript><p class="php-nojs">Для работы админки включите JavaScript.</p></noscript><script type="module" src="<?= h($assets['admin']) ?>"></script>
<?php else: ?>
<div id="site-header"><?php require __DIR__ . '/header.php'; ?></div>
<main><?php $template = in_array($page, ['home', 'projects', 'reviews', 'style-check', 'case', 'request'], true) ? $page : 'document'; require __DIR__ . '/' . $template . '.php'; ?></main>
<?php require __DIR__ . '/footer.php'; ?>
<script id="site-data" type="application/json"><?= json_script($public) ?></script><script type="module" src="<?= h($assets['site']) ?>"></script>
<?php endif; ?>
</body></html>
