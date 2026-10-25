<?php
declare(strict_types=1);

try {
    require dirname(__DIR__) . '/app/src/bootstrap.php';
    security_headers();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $rawPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    if (!is_string($rawPath) || preg_match('/%2f|%5c|%00/i', $rawPath)) fail(400, 'Некорректный адрес.');
    $path = rawurldecode($rawPath);
    if (str_contains($path, '\\') || preg_match('/[\x00-\x1f\x7f]/', $path) || preg_match('~(?:^|/)\.[^/]*(?:/|$)~', $path)) fail(404, 'Страница не найдена.');
    // Technical preview hosts must not collect administrator passwords over HTTP.
    $canonicalHost = parse_url(config()['site_url'], PHP_URL_HOST);
    $canonicalPort = parse_url(config()['site_url'], PHP_URL_PORT);
    if ($canonicalPort) $canonicalHost .= ':' . $canonicalPort;
    if ($path === '/admin' && strtolower($_SERVER['HTTP_HOST'] ?? '') !== strtolower($canonicalHost)) {
        header('Cache-Control: no-store');
        header('Location: ' . config()['site_url'] . '/admin', true, 302); exit;
    }
    if ($path !== '/' && str_ends_with($path, '/')) {
        if (!in_array($method, ['GET', 'HEAD'], true)) fail(404, 'Страница не найдена.');
        header('Location: ' . rtrim($path, '/') . (isset($_SERVER['QUERY_STRING']) && $_SERVER['QUERY_STRING'] !== '' ? '?' . $_SERVER['QUERY_STRING'] : ''), true, 308); exit;
    }
    if (str_starts_with($path, '/api/assets/')) { require __DIR__ . '/../app/src/assets.php'; serve_asset($path, $method); }
    if (str_starts_with($path, '/api/')) { require __DIR__ . '/../app/src/api.php'; handle_api($path, $method); }
    if (!in_array($method, ['GET', 'HEAD'], true)) { header('Allow: GET, HEAD'); fail(405, 'Метод не поддерживается.'); }
    require __DIR__ . '/../app/src/render.php';
    if ($path === '/robots.txt') {
        header('Content-Type: text/plain; charset=utf-8');
        echo "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/admin/\nDisallow: /page-cache/\nSitemap: " . config()['site_url'] . "/sitemap.xml\n"; exit;
    }
    $content = read_content();
    if ($path === '/sitemap.xml') {
        header('Content-Type: application/xml; charset=utf-8');
        echo '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        $paths = ['/', '/projects', '/reviews', '/style-check'];
        foreach (published_cases($content) as $case) $paths[] = '/cases/' . $case['slug'];
        // CMS saves affect the whole document; they are not a reliable modification date for each URL.
        foreach ($paths as $url) echo '<url><loc>' . h(config()['site_url'] . $url) . '</loc></url>';
        echo '</urlset>'; exit;
    }
    if ($path === '/manifest.webmanifest') { header('Content-Type: application/manifest+json'); echo json_encode_safe(['name' => 'zakulab', 'short_name' => 'zakulab', 'start_url' => '/', 'display' => 'browser', 'background_color' => '#fefefe', 'theme_color' => '#304e41']); exit; }
    [$page, $case] = page_route($path, $content);
    if ($page === '404') http_response_code(404);
    if (in_array($page, ['admin', 'success', '404', 'request'], true)) header('Cache-Control: no-store');
    else header('Cache-Control: public, max-age=0, must-revalidate');
    header('Content-Type: text/html; charset=utf-8');
    if (in_array($page, ['admin', 'success', '404', 'privacy', 'consent', 'request'], true)) header('X-Robots-Tag: noindex');
    $key = cache_key($page, $case);
    $cached = $key ? cache_directory() . '/' . $key . '.html' : null;
    if ($cached && is_file($cached)) { if ($method !== 'HEAD') readfile($cached); exit; }
    $html = render_page($page, $content, $case, $_GET);
    if ($key) publish_cache($key, $html, $content['revision']);
    if ($method !== 'HEAD') echo $html;
} catch (Throwable $error) {
    error_log('Zakulab PHP: ' . $error->getMessage());
    http_response_code(500);
    header('Content-Type: text/html; charset=utf-8'); header('Cache-Control: no-store');
    echo '<!doctype html><html lang="ru"><meta charset="utf-8"><title>Временная ошибка</title><h1>Не удалось загрузить страницу</h1><p>Попробуйте обновить её через минуту.</p></html>';
}
