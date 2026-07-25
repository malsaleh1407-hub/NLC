<?php
/**
 * Minimal dependency-free mailer for the NLC website.
 *
 * Two transports, one interface:
 *   - mail()  — PHP built-in, no configuration
 *   - SMTP    — authenticated, for Office 365 / any SMTP relay
 *
 * Both build the same MIME message, so attachments behave identically either
 * way. No Composer, no PHPMailer — this has to run on a stock cPanel PHP.
 */

/**
 * Build a complete RFC-5322 message (headers + body).
 *
 * @param array $m  to, subject, html, text, from_email, from_name,
 *                  reply_to, reply_to_name, bcc[], attachment[path,name,mime]
 * @return array{headers: string, body: string, to: string, subject: string}
 */
function nlc_build_message(array $m): array
{
    $boundary = '=_nlc_' . bin2hex(random_bytes(16));
    $eol      = "\r\n";

    // --- Headers -----------------------------------------------------------
    $headers = [];
    $headers[] = 'From: ' . nlc_encode_address($m['from_name'], $m['from_email']);

    if (!empty($m['reply_to'])) {
        $headers[] = 'Reply-To: ' . nlc_encode_address($m['reply_to_name'] ?? '', $m['reply_to']);
    }
    if (!empty($m['bcc'])) {
        $headers[] = 'Bcc: ' . implode(', ', $m['bcc']);
    }

    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-Type: multipart/mixed; boundary="' . $boundary . '"';
    $headers[] = 'X-Mailer: NLC-Website';
    $headers[] = 'Date: ' . date('r');
    $headers[] = 'Message-ID: <' . bin2hex(random_bytes(12)) . '@nlc.com.sa>';

    // --- Body --------------------------------------------------------------
    $alt  = '=_alt_' . bin2hex(random_bytes(12));
    $body = '';

    $body .= '--' . $boundary . $eol;
    $body .= 'Content-Type: multipart/alternative; boundary="' . $alt . '"' . $eol . $eol;

    // Plain-text part
    $body .= '--' . $alt . $eol;
    $body .= 'Content-Type: text/plain; charset=UTF-8' . $eol;
    $body .= 'Content-Transfer-Encoding: base64' . $eol . $eol;
    $body .= chunk_split(base64_encode($m['text'])) . $eol;

    // HTML part
    $body .= '--' . $alt . $eol;
    $body .= 'Content-Type: text/html; charset=UTF-8' . $eol;
    $body .= 'Content-Transfer-Encoding: base64' . $eol . $eol;
    $body .= chunk_split(base64_encode($m['html'])) . $eol;

    $body .= '--' . $alt . '--' . $eol . $eol;

    // Attachment
    if (!empty($m['attachment']) && is_readable($m['attachment']['path'])) {
        $data = file_get_contents($m['attachment']['path']);
        $name = nlc_encode_header(basename($m['attachment']['name']));

        $body .= '--' . $boundary . $eol;
        $body .= 'Content-Type: ' . $m['attachment']['mime'] . '; name="' . $name . '"' . $eol;
        $body .= 'Content-Transfer-Encoding: base64' . $eol;
        $body .= 'Content-Disposition: attachment; filename="' . $name . '"' . $eol . $eol;
        $body .= chunk_split(base64_encode($data)) . $eol;
    }

    $body .= '--' . $boundary . '--' . $eol;

    return [
        'headers' => implode($eol, $headers),
        'body'    => $body,
        'to'      => $m['to'],
        'subject' => nlc_encode_header($m['subject']),
    ];
}

/** RFC 2047 encode a header value if it contains non-ASCII. */
function nlc_encode_header(string $s): string
{
    return preg_match('/[^\x20-\x7E]/', $s)
        ? '=?UTF-8?B?' . base64_encode($s) . '?='
        : $s;
}

function nlc_encode_address(string $name, string $email): string
{
    $name = trim($name);
    return $name === '' ? $email : nlc_encode_header($name) . ' <' . $email . '>';
}

/**
 * Send using the configured transport.
 *
 * @throws RuntimeException on failure — the caller records this against the
 *         submission row so a lost email is always visible, never silent.
 */
function nlc_send(array $config, array $message): void
{
    $built = nlc_build_message($message);

    if (($config['transport'] ?? 'mail') === 'smtp') {
        nlc_send_smtp($config, $message, $built);
        return;
    }

    // The 5th argument sets the envelope sender so SPF aligns. It is only
    // permitted when the sender is a trusted mail user, which is the normal
    // case on cPanel; fall back without it if the host refuses.
    $ok = @mail(
        $built['to'],
        $built['subject'],
        $built['body'],
        $built['headers'],
        '-f' . $config['from_email']
    );

    if (!$ok) {
        $ok = @mail($built['to'], $built['subject'], $built['body'], $built['headers']);
    }

    if (!$ok) {
        throw new RuntimeException(
            'PHP mail() returned false. Check cPanel → Email Routing is set to '
            . '"Remote Mail Exchanger" for nlc.com.sa, and that the domain is '
            . 'not over its hourly send limit.'
        );
    }
}

/**
 * Speak SMTP directly. Supports STARTTLS (587) and implicit TLS (465).
 */
function nlc_send_smtp(array $config, array $message, array $built): void
{
    $s       = $config['smtp'];
    $timeout = $s['timeout'] ?? 20;
    $scheme  = ($s['encryption'] ?? 'tls') === 'ssl' ? 'ssl://' : '';

    $fp = @stream_socket_client(
        $scheme . $s['host'] . ':' . $s['port'],
        $errno, $errstr, $timeout,
        STREAM_CLIENT_CONNECT
    );

    if (!$fp) {
        throw new RuntimeException("SMTP connect failed: $errstr ($errno)");
    }
    stream_set_timeout($fp, $timeout);

    $read = function () use ($fp): string {
        $data = '';
        while (($line = fgets($fp, 515)) !== false) {
            $data .= $line;
            // Last line of a reply has a space in position 4: "250 OK"
            if (strlen($line) < 4 || $line[3] !== '-') {
                break;
            }
        }
        return $data;
    };

    $cmd = function (string $c, string $expect) use ($fp, $read): string {
        if ($c !== '') {
            fwrite($fp, $c . "\r\n");
        }
        $r = $read();
        if (strncmp($r, $expect, strlen($expect)) !== 0) {
            // Never echo the password back into a log.
            // A bare base64 token is a credential — never echo it into a log.
            $safe = (strncmp($c, 'AUTH', 4) === 0 || strpos($c, ' ') === false) ? '[credentials]' : $c;
            throw new RuntimeException("SMTP: expected $expect after $safe, got: " . trim($r));
        }
        return $r;
    };

    $host = $_SERVER['SERVER_NAME'] ?? 'nlc.com.sa';

    $cmd('', '220');
    $cmd('EHLO ' . $host, '250');

    if (($s['encryption'] ?? 'tls') === 'tls') {
        $cmd('STARTTLS', '220');
        if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            throw new RuntimeException('STARTTLS negotiation failed');
        }
        $cmd('EHLO ' . $host, '250');
    }

    if (!empty($s['username'])) {
        $cmd('AUTH LOGIN', '334');
        $cmd(base64_encode($s['username']), '334');
        $cmd(base64_encode($s['password']), '235');
    }

    $cmd('MAIL FROM:<' . $config['from_email'] . '>', '250');

    // Every envelope recipient, including Bcc (which is in headers for display
    // but must also be listed here or it will not be delivered).
    $rcpts = array_merge(
        array_map('trim', explode(',', $built['to'])),
        $message['bcc'] ?? []
    );
    foreach (array_unique(array_filter($rcpts)) as $rcpt) {
        $cmd('RCPT TO:<' . $rcpt . '>', '250');
    }

    $cmd('DATA', '354');

    // Headers, blank line, body. Dot-stuff any line starting with "." per RFC.
    $payload = 'To: ' . $built['to'] . "\r\n"
             . 'Subject: ' . $built['subject'] . "\r\n"
             . $built['headers'] . "\r\n\r\n"
             . $built['body'];

    $payload = preg_replace('/^\./m', '..', $payload);

    fwrite($fp, $payload . "\r\n.\r\n");
    $cmd('', '250');

    @fwrite($fp, "QUIT\r\n");
    @fclose($fp);
}
