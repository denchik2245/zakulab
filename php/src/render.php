<?php
declare(strict_types=1);

function c(string $module, string $class): string { return generated('styles')[$module][$class] ?? $class; }
function attrs(array $attributes): string {
    $html = '';
    foreach ($attributes as $key => $value) if ($value !== null && $value !== false) $html .= ' ' . $key . ($value === true ? '' : '="' . h($value) . '"');
    return $html;
}
function media_image_variants(string $src): ?array {
    static $cache = [];
    if (array_key_exists($src, $cache)) return $cache[$src];
    if (!preg_match('~^/api/media/([a-f0-9-]{16,64}\.(?:png|jpg|webp|gif))$~D', $src, $match)) return null;
    $file = storage_path('media/' . $match[1]);
    $metadata = read_json_file($file . '.json', []);
    $originalWidth = (int)($metadata['width'] ?? 0);
    $originalHeight = (int)($metadata['height'] ?? 0);
    if ($originalWidth <= 0 || $originalHeight <= 0) return $cache[$src] = null;
    $full = preg_match('/\.(?:png|jpg)$/D', $match[1]) && is_file($file . '.full.webp') ? $src . '?w=full' : $src;
    $variants = []; $fallback = $full;
    foreach ([320, 640, 1280, 1920] as $width) {
        if ($width >= $originalWidth || !is_file($file . '.' . $width . '.webp')) continue;
        $variant = $src . '?w=' . $width;
        if ($width <= 960) $fallback = $variant;
        $variants[] = $variant . ' ' . $width . 'w';
    }
    $dimensions = ['width' => $originalWidth, 'height' => $originalHeight];
    if (!$variants) return $cache[$src] = ['src' => $full] + $dimensions;
    $variants[] = $full . ' ' . $originalWidth . 'w';
    return $cache[$src] = ['src' => $fallback, 'srcset' => implode(', ', $variants)] + $dimensions;
}
function collect_public_images(array $value, array &$images): void {
    foreach ($value as $item) {
        if (is_array($item)) collect_public_images($item, $images);
        elseif (is_string($item) && ($variants = media_image_variants($item))) $images[$item] = $variants;
    }
}
function image(string $src, string $alt = '', array $attributes = [], bool $fill = false, bool $priority = false): void {
    $attributes += ['src' => $src, 'alt' => $alt, 'loading' => $priority ? 'eager' : 'lazy', 'decoding' => 'async'];
    if ($priority) $attributes['fetchpriority'] = 'high';
    if ($fill) $attributes['style'] = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;' . ($attributes['style'] ?? '');
    $optimized = generated('images')[$src] ?? media_image_variants($src);
    if ($optimized) {
        $attributes['src'] = $optimized['src'] ?? $src;
        if (!empty($optimized['srcset'])) {
            $attributes['srcset'] = $optimized['srcset'];
            $attributes['sizes'] ??= '(max-width: 767px) 100vw, 50vw';
        }
        if (!empty($optimized['width']) && !empty($optimized['height'])) {
            if (!isset($attributes['width']) && !isset($attributes['height'])) {
                $attributes['width'] = $optimized['width'];
                $attributes['height'] = $optimized['height'];
            } elseif (isset($attributes['width']) && !isset($attributes['height'])) {
                $attributes['height'] = max(1, (int)round((int)$attributes['width'] * $optimized['height'] / $optimized['width']));
            } elseif (isset($attributes['height']) && !isset($attributes['width'])) {
                $attributes['width'] = max(1, (int)round((int)$attributes['height'] * $optimized['width'] / $optimized['height']));
            }
        }
    }
    echo '<img' . attrs($attributes) . '>';
}
function navigation(): array { return [['Портфолио', '/projects'], ['Отзывы', '/reviews'], ['Этапы', '/#process'], ['Услуги и стоимость', '/#price']]; }
function social(array $site, string $class = ''): void {
    $markup = generated('marks')['social'];
    if ($class !== '') $markup = preg_replace('/class="/', 'class="' . h($class) . ' ', $markup, 1);
    echo str_replace(['__TG__', '__MAX__', '__VK__'], [h($site['telegramUrl']), h($site['maxUrl']), h($site['vkUrl'])], $markup);
}
function breadcrumbs(string $current): void { ?>
    <nav class="<?= c('breadcrumbs', 'breadcrumbs') ?>" aria-label="Хлебные крошки"><a href="/">Главная</a><span class="<?= c('breadcrumbs', 'separator') ?>" aria-hidden="true">›</span><span class="<?= c('breadcrumbs', 'current') ?>" aria-current="page"><?= h($current) ?></span></nav>
<?php }
function section_title(string $eyebrow, string $title, string $id = ''): void { ?><div class="<?= c('home', 'sectionTitle') ?>"><span>{<?= h($eyebrow) ?>}</span><h2<?= attrs(['id' => $id ?: null]) ?>><?= t($title) ?></h2></div><?php }
function project_arrow(): void { ?><span class="<?= c('project', 'arrow') ?>" aria-hidden="true"><?php image('/assets/figma/arrow.svg', '', ['width' => 20, 'height' => 20]); ?></span><?php }
function project_card(array $project, string $class = '', bool $priority = false, string $sizes = '(max-width: 767px) 100vw, 50vw'): void {
    $url = $project['url']; $tag = $url && $url !== '#' ? 'a' : 'div';
    echo '<' . $tag . attrs(['class' => c('project', 'card') . ' ' . $class, 'href' => $tag === 'a' ? $url : null, 'target' => str_starts_with($url, 'http') ? '_blank' : null, 'rel' => str_starts_with($url, 'http') ? 'noreferrer' : null]) . '>';
    image($project['image'], 'Превью проекта ' . $project['title'], ['sizes' => $sizes], true, $priority); ?>
    <span class="<?= c('project', 'shade') ?>" aria-hidden="true"></span><span class="<?= c('project', 'label') ?>"><span class="<?= c('project', 'desktopCopy') ?>"><?= t($project['title']) ?></span><span class="<?= c('project', 'mobileCopy') ?>"><?= t($project['title']) ?></span></span>
    <span class="<?= c('project', 'tags') ?>"><?php foreach (['desktopCopy', 'mobileCopy'] as $copy) foreach (array_filter($project['tags']) as $tagText): ?><small class="<?= c('project', $copy) ?>"><?= t($tagText) ?></small><?php endforeach; ?></span><span class="<?= c('project', 'cardArrow') ?>"><?php project_arrow(); ?></span>
    <?php echo '</' . $tag . '>';
}
function project_row(array $project, string $class = ''): void {
    $url = $project['url']; $tag = $url && $url !== '#' ? 'a' : 'div';
    echo '<' . $tag . attrs(['class' => c('project', 'row') . ' ' . $class, 'data-project-id' => $project['id'], 'href' => $tag === 'a' ? $url : null, 'target' => str_starts_with($url, 'http') ? '_blank' : null, 'rel' => str_starts_with($url, 'http') ? 'noreferrer' : null]) . '>'; ?>
    <strong class="<?= c('project', 'name') ?>"><?= t($project['title']) ?><?php project_arrow(); ?></strong><span class="<?= c('project', 'description') ?>"><span class="<?= c('project', 'desktopCopy') ?>"><?= t($project['description']) ?></span><span class="<?= c('project', 'mobileCopy') ?>"><?= t($project['description']) ?></span></span>
    <span class="<?= c('project', 'platform') ?>"><?php $platform = strtolower(trim($project['platform'])); if (in_array($platform, ['tilda', 'wp', 'wordpress', 'word press'], true)) image('/assets/figma/property1-' . ($platform === 'tilda' ? 'tilda' : 'wordpress') . '.svg', $project['platform'], ['width' => 36, 'height' => 36]); ?></span>
    <?php echo '</' . $tag . '>';
}
function all_projects(int $count, string $class = '', string $href = '/projects'): void { ?><a class="<?= c('project', 'allProjects') ?> <?= h($class) ?>" href="<?= h($href) ?>"><span>Все проекты</span><small>{<?= $count ?>}</small></a><?php }
function review_card(array $review, string $variant = 'catalog', string $fallback = '/assets/figma/rectangle25.png', bool $priority = false): void {
    $slider = $variant === 'slider';
    $profileLabel = ltrim($review['profile']['label'], '@');
    $projectLabel = rtrim(preg_replace('~^https?://~', '', $review['project']['url']), '/');
    $quote = '«' . preg_replace('/\.$/', '', $review['text']) . '»' . (str_ends_with($review['text'], '.') ? '.' : ''); ?>
    <article class="<?= c('review', 'card') ?> <?= c('review', $variant) ?>"><div class="<?= c('review', 'photo') ?>"><?php image($review['image'] ?? $fallback, '', ['class' => $review['id'] === 'figma-ivan' ? c('review', 'trainImage') : null], true, $priority); ?></div>
    <?php if (!$slider): ?><span class="<?= c('review', 'category') ?>"><?= h($review['project']['name'] ?: ($review['author']['company'] ?: 'Совместный проект')) ?></span><?php endif; ?>
    <?php if ($review['status'] === 'demo'): ?><small class="<?= c('review', 'demoBadge') ?>">Демонстрационный отзыв</small><?php endif; ?>
    <div class="<?= c('review', 'body') ?>"><div class="<?= c('review', 'author') ?>"><strong><?= t($review['author']['name']) ?></strong><span><?php responsive_copy($review['author']['role'] ?: $review['author']['company']); ?></span></div><blockquote><?= t($quote) ?></blockquote>
    <?php if ($review['profile']['url'] || $review['project']['url']): ?><div class="<?= c('review', 'links') ?>">
    <?php foreach ([['profile', 'tg', 'Профиль', $slider ? $review['profile']['label'] : $profileLabel], ['project', 'web', 'Ссылка на проект', $slider ? $review['project']['url'] : $projectLabel]] as [$field, $icon, $label, $text]): if (!$review[$field]['url']) continue; ?>
    <a href="<?= h(normalize_url($review[$field]['url'])) ?>" target="_blank" rel="noreferrer"><?= str_replace('<svg ', '<svg class="' . c('review', 'linkIcon') . '" ', generated('marks')['icons'][$icon]) ?><span><small><?= t($label) ?></small><strong><?php responsive_copy($text); ?></strong></span><?= str_replace('<svg ', '<svg class="' . c('review', 'linkArrow') . '" ', generated('marks')['icons']['arrow']) ?></a>
    <?php endforeach; ?></div><?php endif; ?></div></article>
<?php }
function responsive_copy(string $text): void { ?><span class="<?= c('review', 'desktopCopy') ?>"><?= t($text) ?></span><span class="<?= c('review', 'mobileCopy') ?>"><?= t($text) ?></span><?php }
function service_button(array $service, array $site): void { ?><span data-service-id="<?= h($service['id']) ?>"><a class="<?= c('popup', 'trigger') ?>" href="<?= h($site['telegramUrl']) ?>" target="_blank" rel="noreferrer"><span><?= t($service['title']) ?></span><?= str_replace('<svg ', '<svg class="' . c('popup', 'triggerArrow') . '" ', generated('marks')['icons']['arrow']) ?></a></span><?php }
function render_page(string $page, array $content, ?array $case = null, array $query = []): string {
    $public = public_content($content, $page);
    $images = [];
    collect_public_images($public, $images);
    // Only public DTO images and the rendered blocks enter browser data, never unused editor copy.
    if ($case) collect_public_images($case['blocks'] ?? [], $images);
    $public['images'] = $images;
    $site = $public['site']; $reviews = $public['reviews'];
    $meta = page_meta($page, $case);
    $assets = generated('assets');
    ob_start();
    require dirname(__DIR__) . '/templates/layout.php';
    return ob_get_clean();
}
function page_meta(string $page, ?array $case = null): array {
    $title = match($page) { 'home' => 'Денис Закусилов — сайты для бизнеса под ключ', 'projects' => 'Портфолио — zakulab', 'reviews' => 'Отзывы клиентов — zakulab', 'style-check' => 'Выбор стиля — zakulab', 'case' => 'Кейс ' . ($case['title'] ?? '') . ' — zakulab', 'admin' => 'Панель управления — zakulab', 'privacy' => 'Политика обработки персональных данных — zakulab', 'consent' => 'Согласие на обработку персональных данных — zakulab', 'success' => 'Спасибо — zakulab', 'request' => 'Обсудить проект — zakulab', default => 'Страница не найдена — zakulab' };
    $description = match($page) { 'projects' => 'Сайты и интерфейсы, спроектированные Денисом Закусиловым.', 'reviews' => 'Отзывы клиентов о совместной работе с Денисом Закусиловым.', 'style-check' => 'Выберите визуальные направления, которые подходят для будущего сайта.', 'case' => $case['summary'] ?? '', default => 'Проектирую и запускаю понятные сайты для бизнеса: лендинги, многостраничные сайты и интернет-магазины.' };
    $path = match($page) { 'home' => '/', 'case' => '/cases/' . ($case['slug'] ?? ''), '404' => '/404', default => '/' . $page };
    return ['title' => $title, 'description' => $description, 'canonical' => config()['site_url'] . $path, 'robots' => in_array($page, ['admin', 'privacy', 'consent', 'success', 'request', '404'], true) ? 'noindex, follow' : 'index, follow'];
}
function page_structured_data(string $page, array $site, array $meta, ?array $case = null): array {
    $origin = config()['site_url'];
    $personId = $origin . '/#person';
    $person = ['@type' => 'Person', '@id' => $personId, 'name' => 'Денис Закусилов', 'url' => $origin . '/', 'jobTitle' => 'Веб-дизайнер и руководитель проектов', 'knowsAbout' => ['Веб-дизайн', 'UX/UI', 'Tilda', 'Интернет-магазины']];
    $profiles = [];
    foreach (['telegramUrl', 'maxUrl', 'vkUrl', 'kworkUrl', 'flUrl'] as $key) {
        $url = $site[$key] ?? '';
        $parts = parse_url($url);
        // Generic network home pages do not identify this person.
        if ($parts && in_array($parts['scheme'] ?? '', ['http', 'https'], true) && trim($parts['path'] ?? '', '/') !== '') $profiles[] = $url;
    }
    if ($profiles) $person['sameAs'] = array_values(array_unique($profiles));
    $graph = [$person];
    $label = match ($page) { 'projects' => 'Портфолио', 'reviews' => 'Отзывы', 'style-check' => 'Выбрать стиль', 'case' => $case['title'] ?? '', default => '' };
    if ($label !== '') {
        $items = [['@type' => 'ListItem', 'position' => 1, 'name' => 'Главная', 'item' => $origin . '/']];
        if ($page === 'case') $items[] = ['@type' => 'ListItem', 'position' => 2, 'name' => 'Портфолио', 'item' => $origin . '/projects'];
        $items[] = ['@type' => 'ListItem', 'position' => count($items) + 1, 'name' => $label, 'item' => $meta['canonical']];
        $graph[] = ['@type' => 'BreadcrumbList', '@id' => $meta['canonical'] . '#breadcrumbs', 'itemListElement' => $items];
    }
    if ($page === 'case' && $case) {
        $work = ['@type' => 'CreativeWork', '@id' => $meta['canonical'] . '#work', 'url' => $meta['canonical'], 'name' => $case['title'], 'description' => $case['summary'], 'author' => ['@id' => $personId], 'inLanguage' => 'ru'];
        foreach ($case['blocks'] ?? [] as $block) {
            $image = $block['type'] === 'image' ? ($block['image'] ?? '') : ($block['type'] === 'gallery' ? ($block['images'][0]['image'] ?? '') : '');
            if ($image === '') continue;
            $work['image'] = str_starts_with($image, '/') ? $origin . $image : $image;
            break;
        }
        $graph[] = $work;
    }
    return ['@context' => 'https://schema.org', '@graph' => $graph];
}
function page_route(string $path, array $content): array {
    $known = ['/' => 'home', '/projects' => 'projects', '/reviews' => 'reviews', '/style-check' => 'style-check', '/privacy' => 'privacy', '/consent' => 'consent', '/success' => 'success', '/request' => 'request', '/admin' => 'admin'];
    if (isset($known[$path])) return [$known[$path], null];
    if (preg_match('~^/cases/([a-z0-9]+(?:-[a-z0-9]+)*)$~D', $path, $match)) {
        $case = published_cases($content)[$match[1]] ?? null;
        if ($case) return ['case', $case];
    }
    return ['404', null];
}
function cache_key(string $page, ?array $case = null): ?string {
    return in_array($page, ['home', 'projects', 'reviews', 'style-check', 'privacy', 'consent'], true) ? $page : ($page === 'case' ? 'case-' . $case['slug'] : null);
}
function publish_cache(string $key, string $html, string $revision): void {
    store()->transaction(function() use ($key, $html, $revision): void {
        if (!hash_equals($revision, content_revision(content_source()))) return;
        if (!is_dir(cache_directory())) mkdir(cache_directory(), 0755, true);
        atomic_file(cache_directory() . '/' . $key . '.html', $html, 0644);
    });
}
