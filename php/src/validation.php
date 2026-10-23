<?php
declare(strict_types=1);

final class ValidationError extends RuntimeException {}
function validate_schema(mixed $value, array $schema, string $path = 'content'): void {
    if (isset($schema['$ref'])) {
        $ref = generated('schema');
        foreach (explode('/', substr($schema['$ref'], 2)) as $part) $ref = $ref[str_replace(['~1', '~0'], ['/', '~'], $part)];
        validate_schema($value, $ref, $path); return;
    }
    foreach (['anyOf', 'oneOf'] as $union) if (isset($schema[$union])) {
        foreach ($schema[$union] as $option) { try { validate_schema($value, $option, $path); return; } catch (ValidationError) {} }
        throw new ValidationError($path . ': неверный вариант значения');
    }
    $type = $schema['type'] ?? null;
    $valid = match($type) {
        'object' => is_array($value) && ($value === [] || !array_is_list($value)),
        'array' => is_array($value) && array_is_list($value),
        'string' => is_string($value),
        'number' => is_int($value) || is_float($value) && is_finite($value),
        'integer' => is_int($value),
        'boolean' => is_bool($value),
        'null' => $value === null,
        default => true,
    };
    if (!$valid) throw new ValidationError($path . ': неверный тип');
    if (array_key_exists('const', $schema) && $value !== $schema['const']) throw new ValidationError($path . ': неверное значение');
    if (isset($schema['enum']) && !in_array($value, $schema['enum'], true)) throw new ValidationError($path . ': неизвестное значение');
    if ($type === 'object') {
        foreach ($schema['required'] ?? [] as $key) if (!array_key_exists($key, $value)) throw new ValidationError($path . '.' . $key . ': обязательное поле');
        foreach ($value as $key => $item) {
            $child = $schema['properties'][$key] ?? null;
            if ($child === null && ($schema['additionalProperties'] ?? true) === false) throw new ValidationError($path . '.' . $key . ': неизвестное поле');
            if ($child !== null) validate_schema($item, $child, $path . '.' . $key);
            elseif (is_array($schema['additionalProperties'] ?? null)) validate_schema($item, $schema['additionalProperties'], $path . '.' . $key);
        }
    }
    if ($type === 'array') {
        if (count($value) > ($schema['maxItems'] ?? PHP_INT_MAX) || count($value) < ($schema['minItems'] ?? 0)) throw new ValidationError($path . ': неверное число элементов');
        $ids = [];
        foreach ($value as $index => $item) {
            $child = $schema['prefixItems'][$index] ?? $schema['items'] ?? [];
            if ($child === false) throw new ValidationError($path . ': лишние элементы');
            if (is_array($child)) validate_schema($item, $child, $path . '[' . $index . ']');
            if (is_array($item) && isset($item['id'])) { if (isset($ids[$item['id']])) throw new ValidationError($path . ': повторяющиеся id'); $ids[$item['id']] = true; }
        }
    }
    if ($type === 'string') {
        $length = mb_strlen($value, 'UTF-8');
        if ($length > ($schema['maxLength'] ?? PHP_INT_MAX) || $length < ($schema['minLength'] ?? 0)) throw new ValidationError($path . ': неверная длина текста');
        if (isset($schema['pattern']) && !preg_match('~' . str_replace('~', '\\~', $schema['pattern']) . '~uD', $value)) throw new ValidationError($path . ': неверный формат');
        if (($schema['format'] ?? '') === 'date-time' && (!preg_match('/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/D', $value) || strtotime($value) === false)) throw new ValidationError($path . ': неверная дата');
    }
    if (($type === 'number' || $type === 'integer') && ($value < ($schema['minimum'] ?? -INF) || $value > ($schema['maximum'] ?? INF))) throw new ValidationError($path . ': число вне диапазона');
}
function safe_url(string $value): bool {
    if ($value === '' || $value === '#') return true;
    if (strlen($value) > 1000 || preg_match('/[\x00-\x20\\\\]/', $value)) return false;
    if (str_starts_with($value, '/') && !str_starts_with($value, '//')) return true;
    $parts = parse_url($value);
    return $parts !== false && in_array(strtolower($parts['scheme'] ?? ''), ['https', 'http'], true) && !empty($parts['host']) && !isset($parts['user']);
}
function normalize_url(string $value): string {
    $value = trim($value);
    if ($value === '' || $value === '#' || preg_match('~^https?://$~iD', $value)) return '';
    return str_starts_with($value, '/') || preg_match('/^[a-z][a-z\d+.-]*:/i', $value) ? $value : 'https://' . $value;
}
function normalize_links(array &$value, string $parent = ''): void {
    foreach ($value as $key => &$item) {
        if (is_array($item)) normalize_links($item, (string)$key);
        elseif (is_string($item) && (in_array((string)$key, ['url', 'caseUrl', 'image', 'heroPortrait', 'reviewImage', 'secondaryImage'], true) || str_ends_with((string)$key, 'Url') || in_array($parent, ['images', 'heroGallery'], true))) {
            $item = normalize_url($item);
            if (!safe_url($item)) throw new ValidationError('Нужна ссылка http(s) или путь сайта');
        }
    }
}
function case_has_placeholders(array $case): bool {
    // Old draft copy stops being public once an editor has created blocks, including an empty list.
    $copy = [$case['title'], $case['eyebrow'], $case['summary'], $case['whatDone'] ?? '', $case['role'], $case['catalogTask'], $case['verified'], $case['blocks'] ?? $case['draft']];
    return str_contains(json_encode_safe($copy), '[УТОЧНИТЬ]');
}
function validate_content(array &$value): void {
    normalize_links($value);
    validate_schema($value, generated('schema'));
    $slugs = [];
    $additional = 0;
    foreach ($value['site']['portfolioProjects'] as $project) {
        if ($project['homePlacement'] === 'list') $additional++;
        if (isset($project['caseStudy'])) {
            $case = $project['caseStudy'];
            if (isset($slugs[$case['slug']])) throw new ValidationError('Повторяющиеся адреса кейсов');
            $slugs[$case['slug']] = true;
            if ($case['status'] === 'published' && case_has_placeholders($case)) throw new ValidationError('Перед публикацией замените все [УТОЧНИТЬ]');
        }
    }
    if ($additional > 5) throw new ValidationError('На главной можно разместить не более 5 дополнительных работ');
}
