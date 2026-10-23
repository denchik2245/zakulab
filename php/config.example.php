<?php
declare(strict_types=1);

// Copy to config.local.php OUTSIDE public_html. No default production password exists.
return [
    'site_url' => 'https://zakulab.ru',
    'admin_password_hash' => '', // Generate with: php console.php password-hash
    'session_secret' => '',     // At least 32 random characters; php console.php secret
    'storage' => __DIR__ . '/storage',
    // If the provider fixes the public directory name, set its absolute path here.
    // 'web_root' => __DIR__ . '/zakulab.ru',
    // file works without a database. For Beget MySQL, change driver to mysql and fill these values.
    'driver' => 'file',
    'mysql_dsn' => 'mysql:host=localhost;dbname=ACCOUNT_DATABASE;charset=utf8mb4',
    'mysql_user' => '',
    'mysql_password' => '',
];
