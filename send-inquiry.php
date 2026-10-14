<?php
/*
 * ALVION PERFORMANCE — quote request sender (GoDaddy cPanel hosting, PHP mail()).
 * Emails each request, with up to 6 photos attached, to the inbox below.
 * A plain-text backup of every request is also saved outside the public website folder.
 *
 * After uploading: send yourself a test from contact.html and check Gmail (also the Spam folder).
 */

const ALVION_TO        = 'alvionperformance@gmail.com';
const ALVION_FROM      = 'no-reply@alvionperformance.com'; // must be on your own domain for delivery
const ALVION_FROM_NAME = 'ALVION Website';
const MAX_PHOTOS       = 6;
const MAX_PHOTO_BYTES  = 10 * 1024 * 1024;  // per photo (the site resizes photos before upload)
const MAX_TOTAL_BYTES  = 18 * 1024 * 1024;  // all photos together (Gmail limit is 25 MB after encoding)
const MAX_PER_HOUR     = 6;                 // requests per visitor per hour

date_default_timezone_set('America/Los_Angeles');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$wantsJson = stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

function respond(bool $ok, string $message, int $code = 200): void {
    global $wantsJson;
    http_response_code($code);
    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'message' => $message]);
    } else {
        // Works without JavaScript: return to the contact page with a result flag.
        header('Location: contact.html?' . ($ok ? 'sent=1' : 'error=1') . '#projectForm', true, 303);
    }
    exit;
}

function clean(string $key, int $max = 200): string {
    $v = trim((string)($_POST[$key] ?? ''));
    $v = str_replace(["\r\n", "\r"], "\n", $v);
    $v = preg_replace('/[^\P{C}\n\t]/u', '', $v) ?? '';   // strip control characters, keep newlines
    return mb_substr($v, 0, $max);
}

function oneLine(string $v): string { return trim(preg_replace('/\s+/', ' ', $v)); }

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') respond(false, 'Please use the form on the contact page.', 405);

// Spam checks: hidden field must stay empty; humans take a few seconds to fill the form.
if (clean('website') !== '') respond(true, 'Thank you.');
$started = (int)($_POST['started'] ?? 0);
if ($started > 0 && (time() * 1000 - $started) < 2500) respond(true, 'Thank you.');

// Simple per-visitor rate limit.
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = sys_get_temp_dir() . '/alvion_rate_' . hash('sha256', $ip . __FILE__);
$hits = array_filter(array_map('intval', @file($rateFile, FILE_IGNORE_NEW_LINES) ?: []), fn($t) => $t > time() - 3600);
if (count($hits) >= MAX_PER_HOUR) respond(false, 'Too many requests. Please call or text (909) 450-6843.', 429);

$name    = oneLine(clean('name', 100));
$phone   = oneLine(clean('phone', 40));
$email   = oneLine(clean('email', 150));
$reply   = in_array($_POST['reply'] ?? '', ['text', 'call', 'email'], true) ? $_POST['reply'] : 'text';
$vehicle = oneLine(clean('vehicle', 150));
$service = oneLine(clean('service', 120));
$message = clean('message', 4000);

$digits = preg_replace('/\D/', '', $phone);
if ($name === '') respond(false, 'Please add your name.', 422);
if (($reply === 'text' || $reply === 'call') && strlen($digits) < 10) respond(false, 'Please add a phone number so we can ' . $reply . ' you.', 422);
if ($reply === 'email' && !filter_var($email, FILTER_VALIDATE_EMAIL)) respond(false, 'Please add a valid email address.', 422);
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) $email = '';
if (strlen($digits) === 10) $phone = sprintf('(%s) %s-%s', substr($digits, 0, 3), substr($digits, 3, 3), substr($digits, 6));

// Collect photos.
$attachments = [];
$total = 0;
$allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/heic' => 'heic', 'image/heif' => 'heif'];
if (!empty($_FILES['photos']) && is_array($_FILES['photos']['name'])) {
    $finfo = function_exists('finfo_open') ? finfo_open(FILEINFO_MIME_TYPE) : null;
    foreach ($_FILES['photos']['name'] as $i => $origName) {
        if (count($attachments) >= MAX_PHOTOS) break;
        $err = $_FILES['photos']['error'][$i] ?? UPLOAD_ERR_NO_FILE;
        if ($err === UPLOAD_ERR_NO_FILE) continue;
        $tmp  = $_FILES['photos']['tmp_name'][$i] ?? '';
        $size = (int)($_FILES['photos']['size'][$i] ?? 0);
        if ($err !== UPLOAD_ERR_OK || !is_uploaded_file($tmp) || $size <= 0 || $size > MAX_PHOTO_BYTES) continue;
        if ($total + $size > MAX_TOTAL_BYTES) break;
        $type = $finfo ? finfo_file($finfo, $tmp) : ($_FILES['photos']['type'][$i] ?? '');
        if (!isset($allowed[$type])) continue;
        $data = file_get_contents($tmp);
        if ($data === false) continue;
        $total += $size;
        $attachments[] = ['name' => 'photo-' . (count($attachments) + 1) . '.' . $allowed[$type], 'type' => $type, 'data' => $data];
    }
}

// Compose the email.
$replyText = ['text' => 'TEXT me back', 'call' => 'CALL me', 'email' => 'EMAIL me'][$reply];
$lines = [
    'New quote request from alvionperformance.com',
    '',
    'Reply preference: ' . $replyText,
    'Name:     ' . $name,
    'Phone:    ' . ($phone ?: '—'),
    'Email:    ' . ($email ?: '—'),
    'Vehicle:  ' . ($vehicle ?: '—'),
    'Service:  ' . ($service ?: '—'),
    'Photos:   ' . count($attachments),
    '',
    'Project details:',
    $message !== '' ? $message : '—',
    '',
    '—',
    'Sent ' . date('D, M j, Y g:i A T') . ' · ' . $ip,
];
$text = implode("\n", $lines);

$subjectRaw = 'Quote request: ' . ($service ?: 'Project') . ' — ' . $name . ($vehicle ? ' (' . $vehicle . ')' : '');
$subject = '=?UTF-8?B?' . base64_encode(mb_substr($subjectRaw, 0, 150)) . '?=';
$fromName = '=?UTF-8?B?' . base64_encode(ALVION_FROM_NAME) . '?=';

$headers = [
    'From: ' . $fromName . ' <' . ALVION_FROM . '>',
    'MIME-Version: 1.0',
    'X-Mailer: ALVION-Website',
];
if ($email !== '') {
    $replyName = '=?UTF-8?B?' . base64_encode($name) . '?=';
    $headers[] = 'Reply-To: ' . $replyName . ' <' . $email . '>';
}

$eol = "\r\n";
if ($attachments) {
    $boundary = 'alvion_' . bin2hex(random_bytes(12));
    $headers[] = 'Content-Type: multipart/mixed; boundary="' . $boundary . '"';
    $body  = '--' . $boundary . $eol;
    $body .= 'Content-Type: text/plain; charset=UTF-8' . $eol . 'Content-Transfer-Encoding: base64' . $eol . $eol;
    $body .= chunk_split(base64_encode($text)) . $eol;
    foreach ($attachments as $a) {
        $body .= '--' . $boundary . $eol;
        $body .= 'Content-Type: ' . $a['type'] . '; name="' . $a['name'] . '"' . $eol;
        $body .= 'Content-Transfer-Encoding: base64' . $eol;
        $body .= 'Content-Disposition: attachment; filename="' . $a['name'] . '"' . $eol . $eol;
        $body .= chunk_split(base64_encode($a['data'])) . $eol;
    }
    $body .= '--' . $boundary . '--' . $eol;
} else {
    $headers[] = 'Content-Type: text/plain; charset=UTF-8';
    $headers[] = 'Content-Transfer-Encoding: base64';
    $body = chunk_split(base64_encode($text));
}

// Backup copy (text only) outside the public folder, so no request is lost if an email is filtered.
$backupDir = dirname(__DIR__) . '/alvion-quote-requests';
if (!is_dir($backupDir)) @mkdir($backupDir, 0700, true);
if (is_dir($backupDir) && is_writable($backupDir)) {
    @file_put_contents($backupDir . '/' . date('Y-m-d_His') . '_' . bin2hex(random_bytes(3)) . '.txt', $text);
}

$sent = @mail(ALVION_TO, $subject, $body, implode($eol, $headers), '-f' . ALVION_FROM);

$hits[] = time();
@file_put_contents($rateFile, implode("\n", $hits));

if (!$sent) respond(false, 'We could not send your request. Please call or text (909) 450-6843.', 502);
respond(true, 'Thank you — your request was sent.');
