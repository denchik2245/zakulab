<?php
declare(strict_types=1);

function content_source(): array {
    $value = store()->get('content');
    if ($value === null) $value = read_json_file(storage_path('initial-content.json'), generated('seed'));
    // Build exports already pass through the legacy migration and normalization code.
    unset($value['revision'], $value['reviewSnapshotIds']);
    $value['dismissedSubmissions'] ??= [];
    foreach ($value['site']['portfolioProjects'] as &$project) {
        if (!isset($project['caseStudy'])) continue;
        $case = &$project['caseStudy'];
        $case['whatDone'] = trim($case['whatDone'] ?? '') ?: $case['summary'];
        $case['blocks'] ??= legacy_case_blocks($case, $project['image']);
        unset($case);
    }
    unset($project);
    return $value;
}
function legacy_case_blocks(array $case, string $preview = ''): array {
    $slug = $case['slug']; $draft = $case['draft'];
    $blocks = $preview ? [['id' => $slug . '-cover', 'type' => 'image', 'image' => $preview, 'alt' => '', 'caption' => '', 'spacing' => 'large']] : [];
    foreach (['context' => ['Контекст задачи', $draft['challenge']], 'approach' => ['Подход', $draft['approach']], 'decisions' => ['Ключевые решения', ''], 'result' => ['Результат', $draft['result']]] as $key => [$title, $body]) {
        $items = [];
        if ($key === 'decisions') foreach ($draft['decisions'] as $index => $decision) $items[] = ['id' => $slug . '-decision-' . ($index + 1), 'label' => $decision['title'], 'text' => $decision['text']];
        $blocks[] = ['id' => $slug . '-' . $key, 'type' => 'text', 'title' => $title, 'body' => $body, 'listStyle' => $key === 'decisions' ? 'labeled' : 'none', 'items' => $items, 'spacing' => 'large'];
    }
    return $blocks;
}
function content_revision(array $value): string { return hash('sha256', json_encode_safe($value)); }
function normalize_order(array $items): array {
    usort($items, fn(array $a, array $b): int => $a['order'] <=> $b['order']);
    foreach ($items as $index => &$item) $item['order'] = $index + 1;
    return $items;
}
function review_queue(): array {
    return array_values(array_filter(store()->get('queue', []), fn(array $review): bool => strtotime($review['submittedAt']) > time() - 90 * 86400));
}
function read_content(bool $includeQueue = false): array {
    $content = content_source();
    $content['revision'] = content_revision($content);
    $content['reviews'] = array_values(array_filter($content['reviews'], fn(array $review): bool => $review['status'] !== 'pending' || strtotime($review['submittedAt']) > time() - 90 * 86400));
    $content['reviewSnapshotIds'] = [];
    if ($includeQueue) {
        $known = array_column($content['reviews'], null, 'id');
        foreach (review_queue() as $review) {
            if (in_array($review['id'], $content['dismissedSubmissions'], true)) continue;
            $content['reviewSnapshotIds'][] = $review['id'];
            if (!isset($known[$review['id']])) $content['reviews'][] = $review;
        }
    }
    $content['reviews'] = normalize_order($content['reviews']);
    $content['site']['portfolioProjects'] = normalize_order($content['site']['portfolioProjects']);
    $content['site']['styleChoice']['styles'] = normalize_order($content['site']['styleChoice']['styles']);
    return $content;
}
function cache_directory(): string { return web_root() . '/page-cache'; }
function clear_page_cache(): void {
    $directory = cache_directory();
    if (!is_dir($directory)) return;
    foreach (glob($directory . '/*.html') ?: [] as $file) if (!unlink($file)) throw new RuntimeException('Cannot invalidate page cache');
}
function save_content(array $incoming): array {
    validate_content($incoming);
    return store()->transaction(function(Store $store) use ($incoming): array {
        $current = content_source();
        if (!hash_equals(content_revision($current), $incoming['revision'])) fail(409, 'Документ уже изменён. Загрузите актуальную версию и повторите правки.');
        $known = array_column($incoming['reviews'], null, 'id');
        $queue = review_queue();
        $queueIds = array_column($queue, 'id');
        $dismissed = $current['dismissedSubmissions'] ?? [];
        foreach ($incoming['reviewSnapshotIds'] as $id) if (!isset($known[$id]) && in_array($id, $queueIds, true)) $dismissed[] = $id;
        $incoming['dismissedSubmissions'] = array_values(array_intersect(array_unique($dismissed), $queueIds));
        $incoming['updatedAt'] = now_iso();
        $incoming['reviews'] = normalize_order($incoming['reviews']);
        $incoming['site']['portfolioProjects'] = normalize_order($incoming['site']['portfolioProjects']);
        $incoming['site']['styleChoice']['styles'] = normalize_order($incoming['site']['styleChoice']['styles']);
        unset($incoming['revision'], $incoming['reviewSnapshotIds']);
        // Invalidate while holding the same lock used to publish rendered pages.
        clear_page_cache();
        $store->set('content', $incoming);
        return read_content(true);
    });
}
function published_cases(array $content): array {
    $cases = [];
    foreach ($content['site']['portfolioProjects'] as $project) {
        $case = $project['caseStudy'] ?? null;
        if ($project['published'] && $case && $case['status'] === 'published' && !case_has_placeholders($case)) $cases[$case['slug']] = array_replace($case, ['title' => $project['title']]);
    }
    uasort($cases, fn(array $a, array $b): int => strcmp($a['index'], $b['index']));
    return $cases;
}
function public_content(array $content, string $page): array {
    $site = $content['site'];
    $site['portfolioProjects'] = array_values(array_filter($site['portfolioProjects'], fn(array $project): bool => $project['published']));
    foreach ($site['portfolioProjects'] as &$project) {
        $case = $project['caseStudy'] ?? null;
        if ($case && $case['status'] === 'published' && !case_has_placeholders($case)) $project['url'] = '/cases/' . $case['slug'];
        elseif (str_starts_with($project['url'], '/cases/')) $project['url'] = $case['url'] ?? '';
        unset($project['caseStudy']);
    }
    unset($project);
    $site['styleChoice']['styles'] = array_values(array_filter($site['styleChoice']['styles'], fn(array $style): bool => $style['active']));
    $placement = $page === 'home' ? 'showOnHome' : 'showOnReviewsPage';
    $reviews = array_values(array_filter($content['reviews'], fn(array $review): bool => in_array($review['status'], ['demo', 'published'], true) && $review[$placement]));
    foreach ($reviews as &$review) unset($review['consent'], $review['submittedAt']);
    return ['page' => $page, 'site' => $site, 'reviews' => $reviews, 'updatedAt' => $content['updatedAt']];
}
function enqueue_review(array $review): bool {
    return store()->transaction(function(Store $store) use ($review): bool {
        $content = content_source();
        $known = array_column($content['reviews'], null, 'id');
        $queue = array_values(array_filter(review_queue(), fn(array $item): bool => !in_array($item['id'], $content['dismissedSubmissions'] ?? [], true) && (!isset($known[$item['id']]) || $known[$item['id']]['status'] === 'pending')));
        $pendingIds = array_column(array_filter($content['reviews'], fn(array $item): bool => $item['status'] === 'pending' && strtotime($item['submittedAt']) > time() - 90 * 86400), 'id');
        if (count($queue) >= 100 || count(array_unique(array_merge($pendingIds, array_column($queue, 'id')))) >= 100) return false;
        $queue[] = $review;
        $store->set('queue', $queue);
        return true;
    });
}
