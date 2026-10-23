<?php
declare(strict_types=1);
// PHP's local development server does not read .htaccess; match the same private-path rules here.
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');
if (preg_match('~(?:^|/)(?:\.|page-cache|app|storage|config|console\.php|router\.php)~', $path) || str_contains($path, '\\') || str_contains($path, "\0")) { http_response_code(404); exit; }
$file = realpath(__DIR__ . $path);
if ($file && str_starts_with($file, __DIR__ . '/') && is_file($file) && !str_ends_with($file, '.php')) return false;
require __DIR__ . '/index.php';
