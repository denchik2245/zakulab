<?php
declare(strict_types=1);

function auth_ready(): bool { return strlen(config()['session_secret']) >= 32 && config()['admin_password_hash'] !== ''; }
function auth_sign(string $value): string { return hash_hmac('sha256', $value . "\0" . config()['admin_password_hash'], config()['session_secret']); }
function session_token(): ?string {
    if (!auth_ready()) return null;
    $token = $_COOKIE['zakulab-admin-php'] ?? '';
    if (strlen($token) > 256 || !preg_match('/^(\d+)\.([a-f0-9]{32})\.([a-f0-9]{64})$/D', $token, $parts)) return null;
    if ((int)$parts[1] < time() || !hash_equals(auth_sign($parts[1] . '.' . $parts[2]), $parts[3])) return null;
    return $token;
}
function csrf_token(): string { return session_token() ? hash_hmac('sha256', 'csrf:' . session_token(), config()['session_secret']) : ''; }
function require_admin(bool $mutation = false): void {
    if (!session_token()) fail(401, 'Необходим вход в панель управления.');
    if ($mutation && !hash_equals(csrf_token(), $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')) fail(403, 'Сессия формы устарела. Обновите страницу.');
}
function set_auth_cookie(string $token, int $expires): void {
    setcookie('zakulab-admin-php', $token, ['expires' => $expires, 'path' => '/', 'secure' => str_starts_with(config()['site_url'], 'https://'), 'httponly' => true, 'samesite' => 'Strict']);
}
function login(string $password): ?array {
    if (!auth_ready() || !password_verify($password, config()['admin_password_hash'])) return null;
    $expires = time() + 604800;
    $payload = $expires . '.' . bin2hex(random_bytes(16));
    $token = $payload . '.' . auth_sign($payload);
    set_auth_cookie($token, $expires);
    $_COOKIE['zakulab-admin-php'] = $token;
    return ['ok' => true, 'csrfToken' => csrf_token()];
}
function allow_request(string $scope, int $limit, int $seconds): bool {
    // REMOTE_ADDR is authoritative on shared hosting. Forwarded headers from visitors are ignored.
    $identity = hash_hmac('sha256', $_SERVER['REMOTE_ADDR'] ?? 'local', config()['session_secret'] ?: 'public-rate-limits');
    $lane = hexdec(substr($identity, 0, 3));
    return store()->transaction(function(Store $store) use ($scope, $limit, $seconds, $lane): bool {
        $key = 'limit-' . $scope . '-' . $lane;
        $window = intdiv(time(), $seconds);
        $value = $store->get($key, []);
        $count = ($value['window'] ?? null) === $window ? ($value['count'] ?? 0) : 0;
        if ($count >= $limit) return false;
        $store->set($key, ['window' => $window, 'count' => $count + 1]);
        return true;
    });
}
