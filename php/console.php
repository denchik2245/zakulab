<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require __DIR__ . '/app/src/bootstrap.php';
require __DIR__ . '/app/src/render.php';
$command = $argv[1] ?? 'help';
try {
    switch ($command) {
        case 'password-hash':
            fwrite(STDERR, "Введите новый пароль (минимум 12 символов): ");
            $password = trim(fgets(STDIN));
            if (strlen($password) < 12) throw new RuntimeException('Пароль должен быть не короче 12 символов');
            echo password_hash($password, PASSWORD_DEFAULT) . "\n"; break;
        case 'secret': echo bin2hex(random_bytes(32)) . "\n"; break;
        case 'warm-cache':
            $content = read_content();
            $revision = $content['revision'];
            foreach (['home', 'projects', 'reviews', 'style-check', 'privacy', 'consent'] as $page) publish_cache($page, render_page($page, $content), $revision);
            foreach (published_cases($content) as $case) publish_cache('case-' . $case['slug'], render_page('case', $content, $case), $revision);
            echo "Public HTML cache generated.\n"; break;
        case 'export':
            $file = $argv[2] ?? null;
            if (!$file) throw new RuntimeException('Укажите файл вне public_html');
            $data = store()->transaction(fn(Store $store): array => ['format' => 'zakulab-php-v1', 'createdAt' => now_iso(), 'content' => read_content(true), 'queue' => review_queue(), 'requests' => $store->get('requests', [])]);
            atomic_file($file, json_encode_safe($data)); echo "Backup saved. Images must be backed up separately from storage/media.\n"; break;
        case 'import':
            $file = $argv[2] ?? null;
            if (!$file || !is_file($file)) throw new RuntimeException('Укажите JSON-экспорт контента');
            $backup = read_json_file($file);
            $content = $backup['content'] ?? $backup;
            $content['revision'] ??= 'initial'; $content['reviewSnapshotIds'] ??= []; $content['dismissedSubmissions'] ??= [];
            validate_content($content);
            store()->transaction(function(Store $store) use ($content, $backup): void {
                // Explicit CLI import is a restore operation, never an automatic deployment overwrite.
                $existing = ['format' => 'zakulab-php-v1', 'createdAt' => now_iso(), 'content' => read_content(true), 'queue' => review_queue(), 'requests' => $store->get('requests', [])];
                atomic_file(storage_path('before-import-' . gmdate('Ymd-His') . '.json'), json_encode_safe($existing));
                unset($content['revision'], $content['reviewSnapshotIds']);
                clear_page_cache(); $store->set('content', $content);
                if (isset($backup['queue'])) $store->set('queue', $backup['queue']);
                if (isset($backup['requests'])) $store->set('requests', $backup['requests']);
            });
            echo "Content imported. Run warm-cache; copy all exported images to storage/media.\n"; break;
        default: echo "Commands: secret, password-hash, warm-cache, export FILE, import FILE\n";
    }
} catch (Throwable $error) { fwrite(STDERR, $error->getMessage() . "\n"); exit(1); }
