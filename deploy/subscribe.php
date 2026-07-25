<?php
/**
 * NLC Website — newsletter subscription handler
 *
 * Replaces the formsubmit.co call in nlSubscribe(). Stores the address locally
 * so the list is yours, then sends a notification.
 *
 * Returns the {"success":"true"} shape the existing frontend expects.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$configPath = dirname(__DIR__) . '/nlc-config/config.php';
if (!is_readable($configPath)) {
    http_response_code(500);
    echo json_encode(['success' => 'false', 'message' => 'Server is not configured.']);
    exit;
}

$config = require $configPath;
require __DIR__ . '/lib/mailer.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => 'false', 'message' => 'Method not allowed.']);
    exit;
}

if (!empty($_POST['_honey'])) {
    echo json_encode(['success' => 'true']);
    exit;
}

$email = mb_strtolower(trim((string) ($_POST['email'] ?? '')));
$email = preg_replace('/[\x00-\x1F\x7F]/u', '', $email);

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 190) {
    http_response_code(422);
    echo json_encode(['success' => 'false', 'message' => 'Please enter a valid email address.']);
    exit;
}

$language = in_array(($_POST['language'] ?? 'en'), ['en', 'ar'], true) ? $_POST['language'] : 'en';
$ipPacked = @inet_pton($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0') ?: null;

try {
    $db = new PDO(
        "mysql:host={$config['db']['host']};dbname={$config['db']['name']};charset={$config['db']['charset']}",
        $config['db']['user'],
        $config['db']['pass'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]
    );

    // Re-subscribing an existing address is not an error — reactivate quietly.
    $db->prepare(
        'INSERT INTO newsletter_subscribers (email, language, source_page, ip, status)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status), language = VALUES(language)'
    )->execute([
        $email,
        $language,
        mb_substr((string) ($_SERVER['HTTP_REFERER'] ?? ''), 0, 255),
        $ipPacked,
        'active',
    ]);

} catch (Throwable $e) {
    error_log('NLC subscribe: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => 'false', 'message' => 'Something went wrong. Please email info@nlc.com.sa']);
    exit;
}

// Notification is best-effort — the address is already stored.
try {
    nlc_send($config, [
        'to'         => $config['recipients']['_default'],
        'bcc'        => [],
        'subject'    => 'Newsletter subscription — ' . $email,
        'html'       => '<p>New newsletter subscriber:</p><p><strong>'
                        . htmlspecialchars($email, ENT_QUOTES, 'UTF-8')
                        . '</strong><br>Language: ' . htmlspecialchars($language, ENT_QUOTES, 'UTF-8')
                        . '<br>Date: ' . date('D, d M Y H:i') . '</p>',
        'text'       => "New newsletter subscriber: $email\nLanguage: $language\nDate: " . date('D, d M Y H:i'),
        'from_email' => $config['from_email'],
        'from_name'  => $config['from_name'],
        'reply_to'   => $email,
        'attachment' => null,
    ]);
} catch (Throwable $e) {
    error_log('NLC subscribe mail: ' . $e->getMessage());
}

echo json_encode(['success' => 'true']);
