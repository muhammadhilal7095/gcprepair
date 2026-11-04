<?php
// Shared helpers for the admin API and the contact form.
declare(strict_types=1);

define('SITE_ROOT', dirname(__DIR__));
define('PRIVATE_DIR', __DIR__);

function json_out(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $message, int $status = 400): void
{
    json_out(['ok' => false, 'error' => $message], $status);
}

function write_atomic(string $path, string $content): void
{
    $dir = dirname($path);
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        throw new RuntimeException('Cannot create folder ' . basename($dir));
    }
    $tmp = $path . '.tmp' . bin2hex(random_bytes(4));
    if (file_put_contents($tmp, $content, LOCK_EX) === false || !rename($tmp, $path)) {
        @unlink($tmp);
        throw new RuntimeException('Cannot write ' . basename($path));
    }
}

function read_json(string $path): array
{
    $data = json_decode((string) @file_get_contents($path), true);
    return is_array($data) ? $data : [];
}

function write_json(string $path, array $data): void
{
    write_atomic($path, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . "\n");
}

// Secrets live in a PHP file so they stay unreadable even if .htaccess is ignored.
function load_secrets(): array
{
    $file = PRIVATE_DIR . '/secrets.php';
    $data = is_file($file) ? require $file : [];
    return is_array($data) ? $data : [];
}

function save_secrets(array $secrets): void
{
    write_atomic(PRIVATE_DIR . '/secrets.php', "<?php\nreturn " . var_export($secrets, true) . ";\n");
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate(PRIVATE_DIR . '/secrets.php', true);
    }
}

// True while the caller is under the limit of $max hits per $window seconds.
function rate_limit(string $bucket, int $max, int $window, bool $record = true): bool
{
    $file = PRIVATE_DIR . '/rate/' . sha1($bucket . '|' . ($_SERVER['REMOTE_ADDR'] ?? '')) . '.json';
    $now = time();
    $hits = array_filter(read_json($file), static fn ($t) => is_int($t) && $t > $now - $window);
    if (count($hits) >= $max) {
        return false;
    }
    if ($record) {
        $hits[] = $now;
        write_json($file, array_values($hits));
    }
    return true;
}

function clear_rate_limit(string $bucket): void
{
    @unlink(PRIVATE_DIR . '/rate/' . sha1($bucket . '|' . ($_SERVER['REMOTE_ADDR'] ?? '')) . '.json');
}

function one_line(string $value): string
{
    return trim((string) preg_replace('/[\r\n\t]+/', ' ', $value));
}

function smtp_configured(array $smtp): bool
{
    return ($smtp['host'] ?? '') !== '' && ($smtp['from'] ?? '') !== '' && ($smtp['to'] ?? '') !== '';
}

// Minimal SMTP client: implicit TLS (ssl), STARTTLS (tls) or plain (none), with AUTH LOGIN.
function smtp_send(array $smtp, string $subject, string $body, string $replyTo = ''): void
{
    $encryption = $smtp['encryption'] ?? 'ssl';
    $host = (string) $smtp['host'];
    $port = (int) ($smtp['port'] ?? 465);
    $target = ($encryption === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port;

    $errno = 0;
    $errstr = '';
    $socket = @stream_socket_client($target, $errno, $errstr, 15);
    if (!$socket) {
        throw new RuntimeException("Could not connect to $host:$port ($errstr)");
    }
    stream_set_timeout($socket, 15);

    $read = static function (array $expected) use ($socket): string {
        $reply = '';
        while (($line = fgets($socket, 1024)) !== false) {
            $reply .= $line;
            if (strlen($line) < 4 || $line[3] !== '-') {
                break;
            }
        }
        $code = (int) substr($reply, 0, 3);
        if (!in_array($code, $expected, true)) {
            throw new RuntimeException('Mail server said: ' . one_line($reply !== '' ? $reply : 'no reply'));
        }
        return $reply;
    };
    $send = static function (string $command, array $expected) use ($socket, $read): string {
        fwrite($socket, $command . "\r\n");
        return $read($expected);
    };

    try {
        $read([220]);
        $hostname = one_line((string) ($_SERVER['SERVER_NAME'] ?? 'localhost'));
        $send("EHLO $hostname", [250]);
        if ($encryption === 'tls') {
            $send('STARTTLS', [220]);
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('Could not start encryption (STARTTLS)');
            }
            $send("EHLO $hostname", [250]);
        }
        if (($smtp['username'] ?? '') !== '') {
            $send('AUTH LOGIN', [334]);
            $send(base64_encode((string) $smtp['username']), [334]);
            $send(base64_encode((string) ($smtp['password'] ?? '')), [235]);
        }
        $from = one_line((string) $smtp['from']);
        $to = one_line((string) $smtp['to']);
        $send("MAIL FROM:<$from>", [250]);
        $send("RCPT TO:<$to>", [250, 251]);
        $send('DATA', [354]);

        $headers = [
            'Date: ' . date(DATE_RFC2822),
            "From: <$from>",
            "To: <$to>",
            'Subject: =?UTF-8?B?' . base64_encode(one_line($subject)) . '?=',
            'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . (substr((string) strrchr($from, '@'), 1) ?: 'localhost') . '>',
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
        ];
        $reply = one_line($replyTo);
        if ($reply !== '' && filter_var($reply, FILTER_VALIDATE_EMAIL)) {
            $headers[] = "Reply-To: <$reply>";
        }
        // Base64 lines never start with a dot, so no dot-stuffing is needed.
        fwrite($socket, implode("\r\n", $headers) . "\r\n\r\n" . chunk_split(base64_encode($body), 76, "\r\n") . ".\r\n");
        $read([250]);
        fwrite($socket, "QUIT\r\n");
    } finally {
        fclose($socket);
    }
}
