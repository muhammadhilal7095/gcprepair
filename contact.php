<?php
// Receives the contact form and sends it through the SMTP account set in the admin panel.
declare(strict_types=1);

require __DIR__ . '/_private/lib.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    fail('Method not allowed', 405);
}

// Bots fill the hidden field: answer as if it worked and send nothing.
if (($_POST['website'] ?? '') !== '') {
    json_out(['ok' => true]);
}

$name = one_line((string) ($_POST['name'] ?? ''));
$email = one_line((string) ($_POST['email'] ?? ''));
$shop = one_line((string) ($_POST['shop'] ?? ''));
$subject = one_line((string) ($_POST['subject'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));

if ($name === '' || $subject === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail('invalid');
}
if (strlen($name) > 200 || strlen($subject) > 300 || strlen($shop) > 100 || strlen($message) > 10000) {
    fail('too_long');
}

$smtp = load_secrets()['smtp'] ?? [];
if (!smtp_configured($smtp)) {
    // The form falls back to the visitor's own mail app.
    fail('not_configured', 503);
}
if (!rate_limit('contact', 5, 600)) {
    fail('rate_limited', 429);
}

$body = "$message\n\nNavn: $name\nE-mail: $email\nButik: $shop\n";
try {
    smtp_send($smtp, "Kontaktformular: $subject", $body, $email);
} catch (Throwable $e) {
    error_log('Contact form: ' . $e->getMessage());
    fail('send_failed', 502);
}
json_out(['ok' => true]);
