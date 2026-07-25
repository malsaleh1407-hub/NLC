<?php
/**
 * One-off forensic helper — identify an unknown file on the server.
 *
 * Reads only the first and last 400 bytes, so it is safe on a multi-gigabyte
 * file: nothing large is ever loaded into memory or sent to the browser.
 *
 * USAGE
 *   1. Upload to public_html
 *   2. Visit  https://nlc.com.sa/inspect-file.php?k=LOOKNOW&f=ziZdfEjB
 *   3. DELETE THIS FILE IMMEDIATELY AFTERWARDS
 *
 * The ?k= token is a speed bump, not security. Delete the file when done.
 */

const KEY = 'LOOKNOW';

header('Content-Type: text/plain; charset=utf-8');

if (($_GET['k'] ?? '') !== KEY) {
    http_response_code(404);
    exit("Not found\n");
}

// Confine to the web root — no traversal into the rest of the account.
$name = basename($_GET['f'] ?? '');
$path = __DIR__ . '/' . $name;

if ($name === '' || !is_file($path)) {
    exit("No such file: $name\n");
}

$size = filesize($path);

printf("FILE      : %s\n", $name);
printf("SIZE      : %s bytes (%.2f GB)\n", number_format($size), $size / 1073741824);
printf("MODIFIED  : %s\n", date('Y-m-d H:i:s', filemtime($path)));
printf("PERMS     : %o\n", fileperms($path) & 0777);
printf("OWNER UID : %s\n", fileowner($path));

if (function_exists('finfo_open')) {
    $fi = finfo_open(FILEINFO_MIME_TYPE);
    printf("MIME      : %s\n", finfo_file($fi, $path) ?: 'unknown');
    finfo_close($fi);
}

$fh = fopen($path, 'rb');
$head = fread($fh, 400);
fseek($fh, max(0, $size - 400));
$tail = fread($fh, 400);
fclose($fh);

/** Side-by-side hex and printable ASCII, 16 bytes per row. */
function dump(string $data): string {
    $out = '';
    foreach (str_split($data, 16) as $i => $row) {
        $hex = implode(' ', array_map(fn($c) => sprintf('%02x', ord($c)), str_split($row)));
        $asc = preg_replace('/[^\x20-\x7E]/', '.', $row);
        $out .= sprintf("%04x  %-47s  %s\n", $i * 16, $hex, $asc);
    }
    return $out;
}

echo "\n=== FIRST 400 BYTES ===\n" . dump($head);
echo "\n=== LAST 400 BYTES ===\n"  . dump($tail);

// Magic bytes identify most container formats from the first few bytes alone.
$sigs = [
    "\x50\x4B\x03\x04"         => 'ZIP archive (or docx/xlsx/jar)',
    "\x1F\x8B"                 => 'GZIP — likely a .sql.gz or .tar.gz dump',
    "\x42\x5A\x68"             => 'BZIP2',
    "\xFD\x37\x7A\x58\x5A"     => 'XZ',
    "\x7F\x45\x4C\x46"         => 'ELF executable — should NOT be in public_html',
    "\x25\x50\x44\x46"         => 'PDF',
    "SQLite format 3"          => 'SQLite database',
    "-- MySQL dump"            => 'MySQL text dump',
    "-- phpMyAdmin SQL Dump"   => 'phpMyAdmin SQL export',
    "<?php"                    => 'PHP source — suspicious at this size',
];

echo "\n=== SIGNATURE ===\n";
$hit = false;
foreach ($sigs as $magic => $desc) {
    if (strncmp($head, $magic, strlen($magic)) === 0) {
        echo "MATCH: $desc\n";
        $hit = true;
        break;
    }
}
if (!$hit) {
    echo "No known signature. If the ASCII column above is mostly dots, it is\n";
    echo "binary; if it is readable text, it is probably a log or a dump.\n";
}

echo "\nDELETE THIS SCRIPT NOW.\n";
