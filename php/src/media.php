<?php
declare(strict_types=1);

function upload_media(): array {
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > MAX_UPLOAD_BYTES + 65536) fail(413, 'Максимальный размер изображения — 8 МБ.');
    $file = $_FILES['file'] ?? null;
    if (!$file || $file['error'] !== UPLOAD_ERR_OK) fail(400, 'Файл не получен. Проверьте ограничения загрузок PHP.');
    if ($file['size'] < 1 || $file['size'] > MAX_UPLOAD_BYTES || !is_uploaded_file($file['tmp_name'])) fail(413, 'Максимальный размер изображения — 8 МБ.');
    $info = @getimagesize($file['tmp_name']);
    $types = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_GIF => 'gif', IMAGETYPE_WEBP => 'webp'];
    if (!$info || !isset($types[$info[2]])) fail(415, 'Допустимы PNG, JPEG, WebP и GIF.');
    if ($info[0] < 1 || $info[1] < 1 || $info[0] > 16000 || $info[1] > 16000 || $info[0] * $info[1] > MAX_IMAGE_PIXELS) fail(413, 'Уменьшите изображение до 5 мегапикселей перед загрузкой.');
    if (!function_exists('imagecreatefromstring')) throw new RuntimeException('The GD PHP extension is required');
    $raw = file_get_contents($file['tmp_name']);
    // APNG animation is carried by an acTL chunk. GD only decodes its first
    // frame, so keep animated uploads on their original URL without previews.
    $animatedPng = false;
    if ($info[2] === IMAGETYPE_PNG) {
        for ($offset = 8, $length = strlen($raw); $offset + 12 <= $length;) {
            $chunkLength = unpack('N', substr($raw, $offset, 4))[1];
            if (substr($raw, $offset + 4, 4) === 'acTL') { $animatedPng = true; break; }
            $offset += 12 + $chunkLength;
        }
    }
    $decoded = @imagecreatefromstring($raw);
    unset($raw);
    if (!$decoded) fail(415, 'Изображение повреждено.');
    $canPreviewJpeg = $info[2] !== IMAGETYPE_JPEG || function_exists('exif_read_data');
    if ($info[2] === IMAGETYPE_JPEG && $canPreviewJpeg) {
        $exif = @exif_read_data($file['tmp_name']);
        $orientation = (int)($exif['Orientation'] ?? 1);
        if (in_array($orientation, [2, 5, 7], true)) imageflip($decoded, IMG_FLIP_HORIZONTAL);
        elseif ($orientation === 4) imageflip($decoded, IMG_FLIP_VERTICAL);
        $angle = match($orientation) { 3 => 180, 5, 8 => 90, 6, 7 => 270, default => 0 };
        if ($angle) {
            $rotated = imagerotate($decoded, $angle, 0);
            if (!$rotated) throw new RuntimeException('Cannot orient uploaded image');
            unset($decoded); $decoded = $rotated; unset($rotated);
        }
        $info[0] = imagesx($decoded); $info[1] = imagesy($decoded);
    }
    $key = bin2hex(random_bytes(16)) . '.' . $types[$info[2]];
    $directory = storage_path('media');
    if (!is_dir($directory)) mkdir($directory, 0700, true);
    $target = $directory . '/' . $key;
    try {
        // GIFs keep their animation. All files stay outside the document root and are served as images only.
        if (!move_uploaded_file($file['tmp_name'], $target)) throw new RuntimeException('Cannot save uploaded image');
        chmod($target, 0600);
        atomic_file($target . '.json', json_encode_safe(['contentType' => $info['mime'], 'width' => $info[0], 'height' => $info[1]]));
        if (!$animatedPng && $canPreviewJpeg && in_array($info[2], [IMAGETYPE_PNG, IMAGETYPE_JPEG], true) && function_exists('imagewebp')) {
            // Reuse the decoded source: no second full-size GD buffer is needed
            // on the hosting account's 96 MB PHP memory limit.
            if (!imageistruecolor($decoded) && !imagepalettetotruecolor($decoded)) throw new RuntimeException('Cannot prepare image colors');
            imagealphablending($decoded, false); imagesavealpha($decoded, true);
            if (!imagewebp($decoded, $target . '.full.webp', 88)) throw new RuntimeException('Cannot create full image preview');
            chmod($target . '.full.webp', 0600);
        }
        if (!$animatedPng && $canPreviewJpeg && $info[2] !== IMAGETYPE_GIF && function_exists('imagewebp')) foreach ([320, 640, 1280, 1920] as $width) {
            if ($width >= $info[0]) continue;
            $height = max(1, (int)round($info[1] * $width / $info[0]));
            $resized = imagecreatetruecolor($width, $height);
            imagealphablending($resized, false); imagesavealpha($resized, true);
            imagecopyresampled($resized, $decoded, 0, 0, 0, 0, $width, $height, $info[0], $info[1]);
            if (!imagewebp($resized, $target . '.' . $width . '.webp', 88)) throw new RuntimeException('Cannot create image preview');
            chmod($target . '.' . $width . '.webp', 0600);
            unset($resized);
        }
    } catch (Throwable $error) {
        foreach (glob($target . '*') ?: [] as $partial) unlink($partial);
        throw $error;
    } finally { unset($decoded); }
    return ['key' => $key, 'url' => '/api/media/' . $key];
}
function serve_media(string $key): never {
    if (!preg_match('/^[a-f0-9-]{16,64}\.(png|jpg|webp|gif)$/D', $key)) fail(404, 'Изображение не найдено.');
    $file = storage_path('media/' . $key);
    if (!is_file($file)) fail(404, 'Изображение не найдено.');
    $metadata = read_json_file($file . '.json', []);
    $mime = $metadata['contentType'] ?? match(pathinfo($key, PATHINFO_EXTENSION)) { 'png' => 'image/png', 'jpg' => 'image/jpeg', 'gif' => 'image/gif', default => 'image/webp' };
    $width = is_string($_GET['w'] ?? null) ? $_GET['w'] : '';
    if (in_array($width, ['320', '640', '1280', '1920'], true) && is_file($file . '.' . $width . '.webp')) { $file .= '.' . $width . '.webp'; $mime = 'image/webp'; }
    elseif ($width === 'full' && in_array(pathinfo($key, PATHINFO_EXTENSION), ['png', 'jpg'], true) && is_file($file . '.full.webp')) { $file .= '.full.webp'; $mime = 'image/webp'; }
    $etag = '"' . hash('sha256', $key . ':' . $width . ':' . filesize($file) . ':' . filemtime($file)) . '"';
    header('Content-Type: ' . $mime);
    header('Cache-Control: public, max-age=31536000, immutable');
    header('ETag: ' . $etag);
    if (($_SERVER['HTTP_IF_NONE_MATCH'] ?? '') === $etag) { http_response_code(304); exit; }
    header('Content-Length: ' . filesize($file));
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'HEAD') readfile($file);
    exit;
}
