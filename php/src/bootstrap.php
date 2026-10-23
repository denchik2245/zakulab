<?php
declare(strict_types=1);

const MAX_CONTENT_BYTES = 2097152;
const MAX_UPLOAD_BYTES = 8388608;
const MAX_IMAGE_PIXELS = 5000000;

function deployment_root(): string { return dirname(__DIR__, 2); }
function web_root(): string { return config()['web_root'] ?? deployment_root() . '/public_html'; }
function config(): array {
    static $config;
    if ($config !== null) return $config;
    $file = getenv('ZAKULAB_CONFIG') ?: deployment_root() . '/config.local.php';
    $local = is_file($file) ? require $file : [];
    if (!is_array($local)) throw new RuntimeException('Invalid configuration');
    $config = array_replace([
        'site_url' => getenv('SITE_URL') ?: 'https://zakulab.ru',
        'admin_password_hash' => getenv('ADMIN_PASSWORD_HASH') ?: '',
        'session_secret' => getenv('ADMIN_SESSION_SECRET') ?: '',
        'storage' => getenv('ZAKULAB_STORAGE') ?: deployment_root() . '/storage',
        'driver' => getenv('ZAKULAB_DRIVER') ?: 'file',
        'mysql_dsn' => getenv('MYSQL_DSN') ?: '',
        'mysql_user' => getenv('MYSQL_USER') ?: '',
        'mysql_password' => getenv('MYSQL_PASSWORD') ?: '',
    ], $local);
    // Explicit environment variables are useful for local preview and isolated checks.
    foreach (['SITE_URL' => 'site_url', 'ADMIN_PASSWORD_HASH' => 'admin_password_hash', 'ADMIN_SESSION_SECRET' => 'session_secret', 'ZAKULAB_STORAGE' => 'storage', 'ZAKULAB_DRIVER' => 'driver', 'MYSQL_DSN' => 'mysql_dsn', 'MYSQL_USER' => 'mysql_user', 'MYSQL_PASSWORD' => 'mysql_password'] as $environment => $key) {
        $value = getenv($environment);
        if ($value !== false) $config[$key] = $value;
    }
    $url = parse_url($config['site_url']);
    if (!$url || !in_array($url['scheme'] ?? '', ['https', 'http'], true) || empty($url['host']) || isset($url['user']) || isset($url['query']) || !empty($url['path'])) throw new RuntimeException('site_url must be an origin without a path or trailing slash');
    return $config;
}
function storage_path(string $suffix = ''): string {
    $directory = rtrim(config()['storage'], '/');
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) throw new RuntimeException('Storage directory is not writable');
    return $directory . ($suffix !== '' ? '/' . $suffix : '');
}
function json_encode_safe(mixed $value): string { return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR); }
function json_script(mixed $value): string { return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_THROW_ON_ERROR); }
function read_json_file(string $file, mixed $default = null): mixed {
    if (!is_file($file)) return $default;
    $raw = file_get_contents($file);
    if ($raw === false) throw new RuntimeException('Cannot read data');
    return json_decode($raw, true, 128, JSON_THROW_ON_ERROR);
}
function atomic_file(string $file, string $value, int $mode = 0600): void {
    $directory = dirname($file);
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) throw new RuntimeException('Cannot create storage directory');
    $temporary = tempnam($directory, '.write-');
    if ($temporary === false) throw new RuntimeException('Cannot create temporary file');
    try {
        if (file_put_contents($temporary, $value, LOCK_EX) !== strlen($value)) throw new RuntimeException('Cannot write data');
        chmod($temporary, $mode);
        if (!rename($temporary, $file)) throw new RuntimeException('Cannot replace data');
    } finally { if (is_file($temporary)) unlink($temporary); }
}
function now_iso(): string { return gmdate('Y-m-d\TH:i:s.000\Z'); }
function h(mixed $value): string { return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function typographic(string $value): string {
    return preg_replace('/(?<![\p{L}\p{N}])(а|без|бы|в|во|для|до|же|за|и|из|или|к|как|ко|ли|на|над|не|ни|но|о|об|от|по|под|при|про|с|со|у|через|что)\s+/iu', '$1' . "\u{00a0}", $value);
}
function t(string $value): string { return h(typographic($value)); }
function generated(string $name): array {
    static $values = [];
    return $values[$name] ??= read_json_file(dirname(__DIR__) . '/generated/' . $name . '.json', []);
}
function fail(int $status, string $message, array $extra = []): never { respond_json(['error' => $message] + $extra, $status); }
function respond_json(mixed $value, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode_safe($value);
    exit;
}
function request_body(int $maximum): string {
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > $maximum) fail(413, 'Слишком большой запрос.');
    $stream = fopen('php://input', 'rb');
    $body = stream_get_contents($stream, $maximum + 1);
    fclose($stream);
    if ($body === false || strlen($body) > $maximum) fail(413, 'Слишком большой запрос.');
    return $body;
}
function request_json(int $maximum = MAX_CONTENT_BYTES): array {
    if (!str_starts_with(strtolower($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) fail(415, 'Ожидается JSON.');
    try { $value = json_decode(request_body($maximum), true, 128, JSON_THROW_ON_ERROR); }
    catch (JsonException) { fail(400, 'Некорректный JSON.'); }
    if (!is_array($value) || array_is_list($value)) fail(400, 'Ожидается объект JSON.');
    return $value;
}
function check_origin(): void {
    if (($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') fail(403, 'Запрос с другого сайта запрещён.');
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '' && $origin !== config()['site_url']) fail(403, 'Запрос с другого сайта запрещён.');
}
function security_headers(): void {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
}

require_once __DIR__ . '/store.php';
require_once __DIR__ . '/validation.php';
require_once __DIR__ . '/content.php';
require_once __DIR__ . '/auth.php';
