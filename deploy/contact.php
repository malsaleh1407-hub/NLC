<?php
/**
 * NLC Website — contact / inquiry form handler
 *
 * Replaces the previous formsubmit.co integration.
 *
 * Why this exists: the old handler POSTed to formsubmit.co/ajax/…, whose AJAX
 * endpoint silently discards file attachments and returns {success:"true"}
 * regardless. Every CV submitted through the Careers tab was dropped while the
 * applicant was shown a success message.
 *
 * Order of operations here is deliberate:
 *   1. validate
 *   2. store the attachment on disk (outside public_html)
 *   3. INSERT the submission into MySQL
 *   4. only then attempt email
 *
 * A mail failure therefore can never lose an enquiry — it lands in the database
 * either way, and the row is flagged mail_status='failed' so it is visible.
 *
 * Responds with JSON. Keeps the {"success":"true"} shape the existing frontend
 * already understands.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

/** Locate config.php outside public_html. */
$configPath = dirname(__DIR__) . '/nlc-config/config.php';
if (!is_readable($configPath)) {
    http_response_code(500);
    error_log('NLC contact.php: config not found at ' . $configPath);
    echo json_encode([
        'success' => 'false',
        'message' => 'Server is not configured. Please email info@nlc.com.sa directly.',
    ]);
    exit;
}

$config = require $configPath;
require __DIR__ . '/lib/mailer.php';

$DEBUG = !empty($config['debug']);

/** Write to the private log and, in debug mode only, surface the detail. */
function nlc_log(array $config, string $msg): void
{
    $line = '[' . date('Y-m-d H:i:s') . '] ' . $msg . PHP_EOL;
    if (!empty($config['log_file'])) {
        @file_put_contents($config['log_file'], $line, FILE_APPEND | LOCK_EX);
    }
    error_log('NLC: ' . $msg);
}

function nlc_fail(int $code, string $public, array $config, string $internal = ''): void
{
    global $DEBUG;
    if ($internal !== '') {
        nlc_log($config, $internal);
    }
    http_response_code($code);
    $out = ['success' => 'false', 'message' => $public];
    if ($DEBUG && $internal !== '') {
        $out['debug'] = $internal;
    }
    echo json_encode($out);
    exit;
}

// ---------------------------------------------------------------------------
// Request gate
// ---------------------------------------------------------------------------

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    nlc_fail(405, 'Method not allowed.', $config);
}

// Honeypot. Real browsers leave the hidden field empty; bots fill everything.
// Return a success shape so the bot believes it worked and does not retry.
if (!empty($_POST['_honey'])) {
    echo json_encode(['success' => 'true']);
    exit;
}

$ipRaw    = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$ipPacked = @inet_pton($ipRaw) ?: null;

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

function nlc_in(string $key, int $maxLen = 255): string
{
    $v = $_POST[$key] ?? '';
    if (!is_string($v)) {
        return '';
    }
    // Strip control characters — they have no business in a form field and are
    // the vector for header injection.
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v);
    return mb_substr(trim($v), 0, $maxLen);
}

$inquiryType = nlc_in('inquiry_type', 60) ?: 'General Inquiry';
$firstName   = nlc_in('first_name', 100);
$lastName    = nlc_in('last_name', 100);
$email       = mb_strtolower(nlc_in('email', 190));
$phone       = nlc_in('phone', 60);
$company     = nlc_in('company', 190);
$subject     = nlc_in('subject', 255);
$message     = nlc_in('message', 20000);
$language    = nlc_in('language', 10) ?: 'en';

// --- Validation ------------------------------------------------------------
$errors = [];

if ($firstName === '')                                   { $errors['first_name'] = 'First name is required.'; }
if ($lastName === '')                                    { $errors['last_name']  = 'Last name is required.'; }
if ($subject === '')                                     { $errors['subject']    = 'Subject is required.'; }
if (mb_strlen($message) < 10)                            { $errors['message']    = 'Please give us a little more detail.'; }
if (!filter_var($email, FILTER_VALIDATE_EMAIL))          { $errors['email']      = 'Please enter a valid email address.'; }

// Newline in a header-bound field means someone is attempting header injection.
foreach (['first_name' => $firstName, 'last_name' => $lastName, 'email' => $email, 'subject' => $subject] as $k => $v) {
    if (preg_match('/[\r\n]/', $v)) {
        $errors[$k] = 'Invalid characters.';
    }
}

if ($errors) {
    http_response_code(422);
    echo json_encode(['success' => 'false', 'message' => 'Please check the highlighted fields.', 'errors' => $errors]);
    exit;
}

// --- Keyword spam filter ---------------------------------------------------
$haystack = mb_strtolower($subject . ' ' . $message);
foreach (($config['spam_keywords'] ?? []) as $kw) {
    if ($kw !== '' && mb_strpos($haystack, mb_strtolower($kw)) !== false) {
        // Accept silently. Telling a spammer they were filtered invites tuning.
        nlc_log($config, "Spam filtered from $ipRaw (matched '$kw'), email=$email");
        echo json_encode(['success' => 'true']);
        exit;
    }
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

try {
    $db = new PDO(
        "mysql:host={$config['db']['host']};dbname={$config['db']['name']};charset={$config['db']['charset']}",
        $config['db']['user'],
        $config['db']['pass'],
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (Throwable $e) {
    nlc_fail(500, 'We could not record your message. Please email info@nlc.com.sa directly.',
             $config, 'DB connect failed: ' . $e->getMessage());
}

// --- Rate limit ------------------------------------------------------------
$rl     = $config['rate_limit'] ?? ['max' => 5, 'window_minutes' => 10];
$window = (int) $rl['window_minutes'];

try {
    $db->prepare('DELETE FROM rate_limit WHERE created_at < (NOW() - INTERVAL ? MINUTE)')
       ->execute([$window]);

    if ($ipPacked !== null) {
        $q = $db->prepare(
            'SELECT COUNT(*) FROM rate_limit
             WHERE ip = ? AND endpoint = ? AND created_at > (NOW() - INTERVAL ? MINUTE)'
        );
        $q->execute([$ipPacked, 'contact', $window]);

        if ((int) $q->fetchColumn() >= (int) $rl['max']) {
            nlc_fail(429, 'You have sent several messages already. Please try again shortly.', $config);
        }

        $db->prepare('INSERT INTO rate_limit (ip, endpoint) VALUES (?, ?)')
           ->execute([$ipPacked, 'contact']);
    }
} catch (Throwable $e) {
    // Rate limiting is a nicety. Never block a real enquiry because it broke.
    nlc_log($config, 'Rate limit check failed (continuing): ' . $e->getMessage());
}

// ---------------------------------------------------------------------------
// Attachment — stored outside public_html under a non-guessable name
// ---------------------------------------------------------------------------

$attach = null;

if (!empty($_FILES['attachment']['name']) && ($_FILES['attachment']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
    $f = $_FILES['attachment'];

    if ($f['error'] !== UPLOAD_ERR_OK) {
        $reason = [
            UPLOAD_ERR_INI_SIZE   => 'larger than the server allows',
            UPLOAD_ERR_FORM_SIZE  => 'larger than the form allows',
            UPLOAD_ERR_PARTIAL    => 'only partially uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'could not be written (no temp dir)',
            UPLOAD_ERR_CANT_WRITE => 'could not be written to disk',
        ][$f['error']] ?? 'could not be uploaded (code ' . $f['error'] . ')';

        nlc_fail(422, "Your attachment $reason. Please try a smaller file, or send it to info@nlc.com.sa.",
                 $config, 'Upload error ' . $f['error']);
    }

    $maxBytes = (int) ($config['max_upload_mb'] ?? 10) * 1024 * 1024;
    if ($f['size'] > $maxBytes) {
        nlc_fail(422, 'That file is larger than ' . $config['max_upload_mb'] . ' MB.', $config);
    }

    $ext = mb_strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $config['allowed_ext'], true)) {
        nlc_fail(422, 'That file type is not accepted. Allowed: ' . implode(', ', $config['allowed_ext']) . '.', $config);
    }

    // Trust the sniffed type, not the browser-supplied one.
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime  = $finfo->file($f['tmp_name']) ?: 'application/octet-stream';

    $dir = rtrim($config['upload_dir'], '/') . '/' . date('Y/m');
    if (!is_dir($dir) && !@mkdir($dir, 0755, true) && !is_dir($dir)) {
        nlc_fail(500, 'We could not save your attachment. Please email it to info@nlc.com.sa.',
                 $config, 'mkdir failed: ' . $dir);
    }

    // Random name — the original is preserved in the DB and in the email.
    $storedName = date('Ymd-His') . '-' . bin2hex(random_bytes(8)) . '.' . $ext;
    $storedPath = $dir . '/' . $storedName;

    if (!move_uploaded_file($f['tmp_name'], $storedPath)) {
        nlc_fail(500, 'We could not save your attachment. Please email it to info@nlc.com.sa.',
                 $config, 'move_uploaded_file failed to ' . $storedPath);
    }
    @chmod($storedPath, 0644);

    $attach = [
        'path' => $storedPath,
        'rel'  => date('Y/m') . '/' . $storedName,
        'name' => mb_substr(preg_replace('/[\r\n"]/', '', $f['name']), 0, 255),
        'size' => (int) $f['size'],
        'mime' => $mime,
    ];
}

// ---------------------------------------------------------------------------
// Persist  — this is the point after which the enquiry cannot be lost
// ---------------------------------------------------------------------------

$recipient = $config['recipients'][$inquiryType] ?? $config['recipients']['_default'];

// Reference the visitor can quote back at us. Ambiguous characters omitted.
$alphabet  = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
$reference = 'NLC-';
for ($i = 0; $i < 8; $i++) {
    $reference .= $alphabet[random_int(0, strlen($alphabet) - 1)];
}

try {
    $stmt = $db->prepare(
        // mail_status is omitted deliberately — the column defaults to
        // 'pending', which avoids a string literal in the SQL entirely.
        'INSERT INTO contact_submissions
            (reference, inquiry_type, first_name, last_name, email, phone, company,
             subject, message, attachment_path, attachment_name, attachment_size,
             attachment_mime, recipient, ip, user_agent, referer, language)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    );
    $stmt->execute([
        $reference, $inquiryType, $firstName, $lastName, $email, $phone ?: null, $company ?: null,
        $subject, $message,
        $attach['rel']  ?? null, $attach['name'] ?? null,
        $attach['size'] ?? null, $attach['mime'] ?? null,
        $recipient,
        $ipPacked,
        mb_substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500),
        mb_substr($_SERVER['HTTP_REFERER'] ?? '', 0, 500),
        $language,
    ]);
    $submissionId = (int) $db->lastInsertId();
} catch (Throwable $e) {
    nlc_fail(500, 'We could not record your message. Please email info@nlc.com.sa directly.',
             $config, 'INSERT failed: ' . $e->getMessage());
}

// ---------------------------------------------------------------------------
// Notify
// ---------------------------------------------------------------------------

$fullName = trim("$firstName $lastName");
$esc      = fn(string $s): string => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');

$rows = [
    'Reference'    => $reference,
    'Inquiry Type' => $inquiryType,
    'Name'         => $fullName,
    'Email'        => $email,
    'Phone'        => $phone ?: '—',
    'Company'      => $company ?: '—',
    'Subject'      => $subject,
    'Received'     => date('D, d M Y H:i') . ' (server time)',
];
if ($attach) {
    $rows['Attachment'] = $attach['name'] . ' (' . round($attach['size'] / 1024) . ' KB)';
}

$html = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto">'
      . '<div style="background:#24285e;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0">'
      . '<h2 style="margin:0;font-size:18px">New ' . $esc($inquiryType) . '</h2>'
      . '<p style="margin:4px 0 0;font-size:13px;opacity:.8">NLC website contact form</p>'
      . '</div>'
      . '<table style="width:100%;border-collapse:collapse;font-size:14px">';

foreach ($rows as $label => $value) {
    $html .= '<tr>'
           . '<td style="padding:10px 24px;background:#f7f7fb;border-bottom:1px solid #e8e8ef;'
           . 'font-weight:600;color:#24285e;width:150px;vertical-align:top">' . $esc((string) $label) . '</td>'
           . '<td style="padding:10px 24px;border-bottom:1px solid #e8e8ef">' . $esc((string) $value) . '</td>'
           . '</tr>';
}

$html .= '</table>'
       . '<div style="padding:20px 24px">'
       . '<div style="font-weight:600;color:#24285e;margin-bottom:8px">Message</div>'
       . '<div style="white-space:pre-wrap;line-height:1.6">' . $esc($message) . '</div>'
       . '</div>'
       . '<div style="padding:14px 24px;background:#f7f7fb;border-radius:0 0 8px 8px;'
       . 'font-size:12px;color:#666">Reply directly to this email to reach '
       . $esc($fullName) . '.</div></div>';

$text = '';
foreach ($rows as $label => $value) {
    $text .= str_pad((string) $label . ':', 16) . $value . "\n";
}
$text .= "\n" . str_repeat('-', 50) . "\nMESSAGE\n" . str_repeat('-', 50) . "\n" . $message . "\n";

try {
    nlc_send($config, [
        'to'            => $recipient,
        'bcc'           => array_values(array_diff($config['always_bcc'] ?? [], [$recipient])),
        'subject'       => '[' . $inquiryType . '] ' . $subject . ' — ' . $reference,
        'html'          => $html,
        'text'          => $text,
        'from_email'    => $config['from_email'],
        'from_name'     => $config['from_name'],
        'reply_to'      => $email,
        'reply_to_name' => $fullName,
        'attachment'    => $attach ? [
            'path' => $attach['path'],
            'name' => $attach['name'],
            'mime' => $attach['mime'],
        ] : null,
    ]);

    $db->prepare('UPDATE contact_submissions SET mail_status = ? WHERE id = ?')
       ->execute(['sent', $submissionId]);

} catch (Throwable $e) {
    // The enquiry is already safely in the database. Record why mail failed and
    // still report success — the visitor did nothing wrong, and we have their
    // message. v_failed_emails surfaces these for follow-up.
    $db->prepare('UPDATE contact_submissions SET mail_status = ?, mail_error = ? WHERE id = ?')
       ->execute(['failed', mb_substr($e->getMessage(), 0, 500), $submissionId]);

    nlc_log($config, "Mail failed for $reference -> $recipient: " . $e->getMessage());
}

echo json_encode(['success' => 'true', 'reference' => $reference]);
