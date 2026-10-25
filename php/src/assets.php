<?php
declare(strict_types=1);

// Serve build assets through PHP when a hosting proxy strips static cache headers.
// This path never reads content, opens a session, or initializes storage.
function serve_asset(string $path, string $method): never {
    if (!in_array($method, ['GET', 'HEAD'], true)) {
        header('Allow: GET, HEAD');
        fail(405, 'Метод не поддерживается.');
    }
    if (!preg_match('~^/api/assets/(bundles|optimized|fonts)/([A-Za-z0-9][A-Za-z0-9._-]{0,199})$~D', $path, $match)) fail(404, 'Ресурс не найден.');
    [, $group, $name] = $match;
    $valid = match ($group) {
        'bundles' => preg_match('~^(?:site|admin|images|chunk)-[A-Za-z0-9_-]{6,64}\.(?:css|js)$~D', $name),
        'optimized' => preg_match('~^[a-f0-9]{8,64}-(?:texture-)?[1-9][0-9]{0,5}\.webp$~D', $name),
        'fonts' => preg_match('~^[A-Za-z0-9][A-Za-z0-9._-]{0,190}\.woff2$~D', $name),
    };
    if (!$valid) fail(404, 'Ресурс не найден.');
    $root = realpath(web_root());
    $directory = $root === false ? false : realpath($root . '/' . $group);
    // Require the actual directory/file to match the public path, excluding symlink escapes.
    if ($root === false || $directory !== $root . '/' . $group) fail(404, 'Ресурс не найден.');
    $file = realpath($directory . '/' . $name);
    if ($file !== $directory . '/' . $name || !is_file($file) || !is_readable($file)) fail(404, 'Ресурс не найден.');

    $qualities = [];
    $accept = $_SERVER['HTTP_ACCEPT_ENCODING'] ?? '';
    foreach (explode(',', strtolower($accept)) as $entry) {
        $parts = explode(';', trim($entry));
        $token = trim(array_shift($parts));
        if ($token === '') continue;
        $quality = 1.0;
        foreach ($parts as $parameter) {
            if (preg_match('/^\s*q\s*=\s*(.*)\s*$/D', $parameter, $q)) {
                $quality = preg_match('/^(?:0(?:\.[0-9]{0,3})?|1(?:\.0{0,3})?)$/D', trim($q[1])) ? (float)$q[1] : 0.0;
            }
        }
        $qualities[$token] = $quality;
    }
    $identity = $qualities['identity'] ?? (($qualities['*'] ?? null) === 0.0 ? 0.0 : 1.0);
    $encoding = ''; $selected = $file; $best = -1.0;
    foreach (['br' => '.br', 'gzip' => '.gz', 'identity' => ''] as $candidate => $suffix) {
        $quality = $candidate === 'identity' ? $identity : ($qualities[$candidate] ?? $qualities['*'] ?? 0.0);
        $prepared = $suffix === '' ? $file : realpath($file . $suffix);
        if ($quality <= 0 || $quality <= $best || $prepared !== $file . $suffix || !is_file($prepared) || !is_readable($prepared)) continue;
        $selected = $prepared; $best = $quality;
        $encoding = $candidate === 'identity' ? '' : $candidate;
    }
    header('Vary: Accept-Encoding');
    if ($best < 0) fail(406, 'Подходящее представление ресурса недоступно.');
    // Avoid applying PHP compression to an already compressed representation.
    ini_set('zlib.output_compression', '0');
    $type = match (pathinfo($name, PATHINFO_EXTENSION)) {
        'css' => 'text/css; charset=utf-8', 'js' => 'application/javascript; charset=utf-8',
        'webp' => 'image/webp', 'woff2' => 'font/woff2',
    };
    $etag = '"' . hash('sha256', $encoding . ':' . hash_file('sha256', $selected)) . '"';
    header('Content-Type: ' . $type);
    header('Cache-Control: public, max-age=' . ($group === 'fonts' ? '604800, must-revalidate' : '31536000, immutable'));
    header('ETag: ' . $etag);
    if ($encoding !== '') header('Content-Encoding: ' . $encoding);
    foreach (explode(',', $_SERVER['HTTP_IF_NONE_MATCH'] ?? '') as $tag) {
        $tag = trim($tag);
        if ($tag === '*' || preg_replace('~^W/~', '', $tag) === $etag) { http_response_code(304); exit; }
    }
    header('Content-Length: ' . filesize($selected));
    if ($method !== 'HEAD') readfile($selected);
    exit;
}
