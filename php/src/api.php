<?php
declare(strict_types=1);
require_once __DIR__ . '/media.php';

function form_field(string $name): string { return is_string($_POST[$name] ?? null) ? trim($_POST[$name]) : ''; }
function form_result(string $type): never {
    if (form_field('response') === 'json') respond_json(['ok' => true], 201);
    header('Location: /success?form=' . $type, true, 303); exit;
}
function handle_api(string $path, string $method): never {
    if (str_starts_with($path, '/api/media/')) {
        if (!in_array($method, ['GET', 'HEAD'], true)) fail(405, 'Метод не поддерживается.');
        serve_media(substr($path, strlen('/api/media/')));
    }
    header('Cache-Control: no-store');
    if (!in_array($method, ['GET', 'HEAD'], true)) check_origin();
    if ($path === '/api/admin/session' && $method === 'GET') respond_json(['authenticated' => session_token() !== null, 'csrfToken' => csrf_token()]);
    if ($path === '/api/admin/login' && $method === 'POST') {
        if (!auth_ready()) fail(503, 'Панель ещё не настроена. Укажите хеш пароля и секрет сессии в config.local.php.');
        if (!allow_request('login', 10, 900)) { header('Retry-After: 900'); fail(429, 'Слишком много попыток. Попробуйте через 15 минут.'); }
        $body = request_json(4096);
        $password = $body['password'] ?? '';
        if (!is_string($password) || !($result = login($password))) fail(401, 'Неверный пароль.');
        respond_json($result);
    }
    if (str_starts_with($path, '/api/admin/')) {
        require_admin(!in_array($method, ['GET', 'HEAD'], true));
        if ($path === '/api/admin/content' && $method === 'GET') respond_json(read_content(true));
        if ($path === '/api/admin/content' && $method === 'PUT') {
            try { $result = save_content(request_json()); }
            catch (ValidationError $error) { fail(400, 'Проверьте поля формы.', ['details' => [$error->getMessage()]]); }
            respond_json($result);
        }
        if ($path === '/api/admin/media' && $method === 'POST') respond_json(upload_media(), 201);
        if ($path === '/api/admin/logout' && $method === 'POST') { set_auth_cookie('', time() - 3600); respond_json(['ok' => true]); }
        if ($path === '/api/admin/requests' && $method === 'GET') respond_json(['requests' => store()->get('requests', [])]);
        if (preg_match('~^/api/admin/requests/([a-f0-9]{32})$~D', $path, $match) && $method === 'DELETE') {
            store()->transaction(function(Store $store) use ($match): void { $store->set('requests', array_values(array_filter($store->get('requests', []), fn(array $item): bool => $item['id'] !== $match[1]))); });
            respond_json(['ok' => true]);
        }
        if ($path === '/api/admin/backup' && $method === 'GET') {
            $backup = store()->transaction(fn(Store $store): array => ['format' => 'zakulab-php-v1', 'createdAt' => now_iso(), 'content' => read_content(true), 'queue' => review_queue(), 'requests' => $store->get('requests', [])]);
            header('Content-Disposition: attachment; filename="zakulab-backup-' . gmdate('Y-m-d') . '.json"');
            respond_json($backup);
        }
        fail(404, 'Метод API не найден.');
    }
    if ($path === '/api/reviews' && $method === 'POST') {
        if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 32768) fail(413, 'Слишком большая форма.');
        if (form_field('bot-field') !== '') { http_response_code(204); exit; }
        if (!allow_request('review', 3, 3600)) { header('Retry-After: 3600'); fail(429, 'Слишком много отправок. Попробуйте через час.'); }
        $name = form_field('name'); $role = form_field('role'); $profile = normalize_url(form_field('public-profile')); $text = form_field('review');
        if ($name === '' || mb_strlen($name) > 120 || $role === '' || mb_strlen($role) > 120 || mb_strlen($text) < 20 || mb_strlen($text) > 4000 || $profile === '' || !safe_url($profile) || !preg_match('~^https?://~i', $profile) || strlen($profile) > 500 || form_field('consent') !== 'yes') fail(400, 'Заполните поля и подтвердите согласие. Текст отзыва: от 20 до 4000 символов.');
        $words = preg_split('/\s+/u', $name); $initials = '';
        foreach (array_slice($words, 0, 2) as $word) $initials .= mb_strtoupper(mb_substr($word, 0, 1));
        $review = ['id' => 'review-' . bin2hex(random_bytes(16)), 'status' => 'pending', 'submittedAt' => now_iso(), 'publishedAt' => gmdate('Y-m-d'), 'showOnHome' => false, 'showOnReviewsPage' => false, 'order' => (int)(microtime(true) * 1000), 'text' => $text, 'author' => ['name' => $name, 'initials' => $initials, 'role' => $role, 'company' => ''], 'project' => ['name' => '', 'url' => ''], 'profile' => ['network' => 'Другая сеть', 'label' => '', 'url' => $profile], 'consent' => ['acceptedAt' => now_iso(), 'version' => '2026-10-08']];
        if (!enqueue_review($review)) fail(503, 'Очередь отзывов заполнена. Попробуйте позже.');
        form_result('review');
    }
    if ($path === '/api/requests' && $method === 'POST') {
        if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 32768) fail(413, 'Слишком большая форма.');
        if (form_field('bot-field') !== '') { http_response_code(204); exit; }
        if (!allow_request('request', 5, 3600)) { header('Retry-After: 3600'); fail(429, 'Слишком много отправок. Попробуйте через час.'); }
        $item = ['id' => bin2hex(random_bytes(16)), 'createdAt' => now_iso()];
        foreach (['name' => 120, 'company' => 200, 'task' => 10000, 'budget' => 120, 'messenger' => 120, 'contact' => 500, 'visual-profile' => 12000] as $field => $max) {
            $value = form_field($field);
            if (mb_strlen($value) > $max) fail(400, 'Слишком длинное поле: ' . $field);
            $item[$field === 'visual-profile' ? 'visualProfile' : $field] = $value;
        }
        if ($item['name'] === '' || $item['task'] === '' || $item['contact'] === '' || $item['budget'] === '' || !in_array(form_field('consent'), ['on', 'yes'], true)) fail(400, 'Заполните обязательные поля и подтвердите согласие.');
        $item['consentAt'] = now_iso();
        store()->transaction(function(Store $store) use ($item): void {
            $items = $store->get('requests', []);
            if (count($items) >= 100) fail(503, 'Приём заявок временно приостановлен. Свяжитесь со мной через контакты сайта.');
            array_unshift($items, $item); $store->set('requests', $items);
        });
        form_result('project');
    }
    fail(404, 'Метод API не найден.');
}
