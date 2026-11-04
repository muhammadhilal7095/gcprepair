<?php
// JSON API behind the admin panel. Every action except state, setup and login needs a logged-in session.
declare(strict_types=1);

require dirname(__DIR__) . '/_private/lib.php';

const DATA_DIR = PRIVATE_DIR . '/data';
const BACKUP_DIR = PRIVATE_DIR . '/backups';
const MAX_BACKUPS = 15;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
// Only generated site files may be written, never admin, PHP or private files.
const PUBLISH_ALLOWED = '#^(index\.html|404\.html|sitemap\.xml|robots\.txt|js/devices\.js|(?!admin/|_private/)[a-z0-9-]+/index\.html|kategori/[a-z0-9-]+/index\.html)$#';

session_name('gcpadmin');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();
if (empty($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
}

$action = (string) ($_GET['action'] ?? '');
$secrets = load_secrets();
$setupNeeded = empty($secrets['password_hash']);

if ($action === 'state') {
    json_out(['ok' => true, 'setupNeeded' => $setupNeeded, 'loggedIn' => !empty($_SESSION['admin']), 'csrf' => $_SESSION['csrf']]);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    fail('Method not allowed', 405);
}
if (!hash_equals($_SESSION['csrf'], (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''))) {
    fail('Your session expired. Reload the page.', 403);
}

$input = [];
if (str_starts_with((string) ($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) {
    $input = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($input)) {
        fail('Invalid request');
    }
}

function require_password_rules(string $password): void
{
    if (strlen($password) < 10) {
        fail('The password must be at least 10 characters.');
    }
}

function log_in(): void
{
    session_regenerate_id(true);
    $_SESSION['admin'] = true;
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
}

if ($action === 'setup') {
    if (!$setupNeeded) {
        fail('Setup is already done.', 403);
    }
    if (!rate_limit('login', 5, 900)) {
        fail('Too many attempts. Try again in 15 minutes.', 429);
    }
    $expected = is_file(PRIVATE_DIR . '/setup-hash.php') ? require PRIVATE_DIR . '/setup-hash.php' : '';
    if (!is_string($expected) || $expected === '' || !hash_equals($expected, hash('sha256', trim((string) ($input['code'] ?? ''))))) {
        fail('That setup code is not correct.', 403);
    }
    require_password_rules((string) ($input['password'] ?? ''));
    $secrets['password_hash'] = password_hash((string) $input['password'], PASSWORD_DEFAULT);
    save_secrets($secrets);
    clear_rate_limit('login');
    log_in();
    json_out(['ok' => true, 'csrf' => $_SESSION['csrf']]);
}

if ($action === 'login') {
    if ($setupNeeded) {
        fail('Setup is needed first.', 403);
    }
    if (!rate_limit('login', 5, 900)) {
        fail('Too many attempts. Try again in 15 minutes.', 429);
    }
    if (!password_verify((string) ($input['password'] ?? ''), (string) $secrets['password_hash'])) {
        fail('Wrong password.', 403);
    }
    clear_rate_limit('login');
    log_in();
    json_out(['ok' => true, 'csrf' => $_SESSION['csrf']]);
}

if (empty($_SESSION['admin'])) {
    fail('Please log in.', 401);
}

function public_smtp(array $secrets): array
{
    $smtp = $secrets['smtp'] ?? [];
    return [
        'host' => $smtp['host'] ?? 'smtp.hostinger.com',
        'port' => (int) ($smtp['port'] ?? 465),
        'encryption' => $smtp['encryption'] ?? 'ssl',
        'username' => $smtp['username'] ?? '',
        'from' => $smtp['from'] ?? '',
        'to' => $smtp['to'] ?? '',
        'hasPassword' => !empty($smtp['password']),
    ];
}

function backup_data(): void
{
    $name = date('Y-m-d_His');
    foreach (['business.json', 'repairs.json', 'shop.json'] as $file) {
        if (is_file(DATA_DIR . "/$file")) {
            write_atomic(BACKUP_DIR . "/$name/$file", (string) file_get_contents(DATA_DIR . "/$file"));
        }
    }
    $all = array_reverse(list_backups());
    foreach (array_slice($all, 0, max(0, count($all) - MAX_BACKUPS)) as $old) {
        array_map('unlink', (array) glob(BACKUP_DIR . "/$old/*"));
        @rmdir(BACKUP_DIR . "/$old");
    }
}

function list_backups(): array
{
    if (!is_dir(BACKUP_DIR)) {
        return [];
    }
    $all = array_values(array_filter((array) scandir(BACKUP_DIR), static fn ($d) => $d[0] !== '.'));
    rsort($all);
    return $all;
}

try {
    switch ($action) {
        case 'logout':
            $_SESSION = [];
            session_destroy();
            json_out(['ok' => true]);

        case 'load':
            json_out([
                'ok' => true,
                'business' => read_json(DATA_DIR . '/business.json'),
                'repairs' => read_json(DATA_DIR . '/repairs.json'),
                'shop' => read_json(DATA_DIR . '/shop.json'),
                'smtp' => public_smtp($secrets),
                'backups' => list_backups(),
            ]);

        case 'publish':
            $business = $input['business'] ?? null;
            $repairs = $input['repairs'] ?? null;
            $shop = $input['shop'] ?? null;
            $files = $input['files'] ?? null;
            if (!is_array($business) || !is_array($repairs) || !is_array($shop) || !is_array($files) || empty($business['shops']) || !isset($files['index.html'])) {
                fail('The data looks incomplete, nothing was changed.');
            }
            foreach ($files as $path => $content) {
                if (!is_string($content) || !preg_match(PUBLISH_ALLOWED, (string) $path)) {
                    fail('Refused to write ' . $path);
                }
            }
            backup_data();
            write_json(DATA_DIR . '/business.json', $business);
            write_json(DATA_DIR . '/repairs.json', $repairs);
            write_json(DATA_DIR . '/shop.json', $shop);
            foreach ($files as $path => $content) {
                write_atomic(SITE_ROOT . '/' . $path, $content);
            }
            // Pages of deleted shop categories must not stay online
            foreach ((array) glob(SITE_ROOT . '/kategori/*/index.html') as $page) {
                if (!isset($files['kategori/' . basename(dirname($page)) . '/index.html'])) {
                    @unlink($page);
                    @rmdir(dirname($page));
                }
            }
            json_out(['ok' => true, 'backups' => list_backups()]);

        case 'restore':
            $name = (string) ($input['name'] ?? '');
            if (!preg_match('/^\d{4}-\d{2}-\d{2}_\d{6}$/', $name) || !is_dir(BACKUP_DIR . "/$name")) {
                fail('That backup does not exist.');
            }
            json_out([
                'ok' => true,
                'business' => read_json(BACKUP_DIR . "/$name/business.json"),
                'repairs' => read_json(BACKUP_DIR . "/$name/repairs.json"),
                'shop' => read_json(BACKUP_DIR . "/$name/shop.json"),
            ]);

        case 'upload':
            $file = $_FILES['image'] ?? null;
            if (!$file || ($file['error'] ?? 1) !== UPLOAD_ERR_OK) {
                fail('The upload failed. Images can be at most 5 MB.');
            }
            if ($file['size'] > MAX_IMAGE_BYTES) {
                fail('Images can be at most 5 MB.');
            }
            $types = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
            $info = @getimagesize($file['tmp_name']);
            $extension = $types[$info['mime'] ?? ''] ?? null;
            if (!$extension) {
                fail('Please use a JPG, PNG or WebP image.');
            }
            $kind = in_array($_POST['kind'] ?? '', ['site', 'shop'], true) ? $_POST['kind'] : 'devices';
            $slug = trim((string) preg_replace('/[^a-z0-9]+/', '-', strtolower((string) ($_POST['name'] ?? 'image'))), '-') ?: 'image';
            $name = $slug . '-' . bin2hex(random_bytes(3)) . '.' . $extension;
            $dir = SITE_ROOT . "/images/$kind";
            if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
                fail('Cannot save images on the server.', 500);
            }
            if (!move_uploaded_file($file['tmp_name'], "$dir/$name")) {
                fail('Cannot save the image on the server.', 500);
            }
            json_out(['ok' => true, 'file' => $name]);

        case 'smtp-save':
            $smtp = $secrets['smtp'] ?? [];
            foreach (['host', 'username', 'from', 'to'] as $field) {
                $smtp[$field] = one_line((string) ($input[$field] ?? ''));
            }
            $smtp['port'] = (int) ($input['port'] ?? 465);
            $smtp['encryption'] = in_array($input['encryption'] ?? '', ['ssl', 'tls', 'none'], true) ? $input['encryption'] : 'ssl';
            if (($input['password'] ?? '') !== '') {
                $smtp['password'] = (string) $input['password'];
            }
            if ($smtp['from'] !== '' && !filter_var($smtp['from'], FILTER_VALIDATE_EMAIL)) {
                fail('"Send from" is not a valid email address.');
            }
            if ($smtp['to'] !== '' && !filter_var($smtp['to'], FILTER_VALIDATE_EMAIL)) {
                fail('"Send to" is not a valid email address.');
            }
            $secrets['smtp'] = $smtp;
            save_secrets($secrets);
            json_out(['ok' => true, 'smtp' => public_smtp($secrets)]);

        case 'smtp-test':
            $smtp = $secrets['smtp'] ?? [];
            if (!smtp_configured($smtp)) {
                fail('Save the server, "send from" and "send to" first.');
            }
            smtp_send($smtp, 'Test from gcprepair.dk', "This is a test email from your website's admin panel.\n\nIf you can read this, the contact form can send email.\n");
            json_out(['ok' => true]);

        case 'password':
            if (!password_verify((string) ($input['current'] ?? ''), (string) $secrets['password_hash'])) {
                fail('The current password is wrong.', 403);
            }
            require_password_rules((string) ($input['new'] ?? ''));
            $secrets['password_hash'] = password_hash((string) $input['new'], PASSWORD_DEFAULT);
            save_secrets($secrets);
            json_out(['ok' => true]);

        default:
            fail('Unknown action', 404);
    }
} catch (Throwable $e) {
    error_log('Admin: ' . $e->getMessage());
    fail($e->getMessage(), 500);
}
