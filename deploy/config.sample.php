<?php
/**
 * NLC Website — configuration
 *
 * ============================================================================
 * THIS FILE MUST LIVE **OUTSIDE** public_html
 * ============================================================================
 * Upload it to:   /home/<cpanel-user>/nlc-config/config.php
 * NOT to:         /home/<cpanel-user>/public_html/config.php
 *
 * It holds your database password. Anything inside public_html can, under a
 * misconfiguration, be served as plain text. Outside public_html it cannot be
 * reached over HTTP at all.
 *
 * Setup: copy this file to config.php, fill in the values, upload it.
 */

return [

    // -----------------------------------------------------------------------
    // Database  (cPanel → MySQL® Databases)
    // cPanel prefixes both names with your account, e.g. "nlcuser_website"
    // -----------------------------------------------------------------------
    'db' => [
        'host'     => 'localhost',
        'name'     => 'CPANELUSER_nlcweb',
        'user'     => 'CPANELUSER_nlcweb',
        'pass'     => 'PUT-YOUR-DATABASE-PASSWORD-HERE',
        'charset'  => 'utf8mb4',
    ],

    // -----------------------------------------------------------------------
    // Where uploaded attachments are stored.
    // MUST be outside public_html — CVs and quote documents are confidential
    // and must never be guessable over HTTP.
    // Create it in File Manager and leave permissions at 0755.
    // -----------------------------------------------------------------------
    'upload_dir'      => '/home/CPANELUSER/nlc-uploads',
    'max_upload_mb'   => 10,
    'allowed_ext'     => ['pdf','doc','docx','xls','xlsx','png','jpg','jpeg','dwg','zip'],

    // -----------------------------------------------------------------------
    // Where notifications go, by inquiry type.
    // The key must match the value of the form's inquiry_type field exactly.
    // '_default' catches anything not listed.
    // -----------------------------------------------------------------------
    'recipients' => [
        'Request for Quotation' => 'cr@nlc.com.sa',
        'Careers'               => 'career@nlc.com.sa',
        '_default'              => 'info@nlc.com.sa',
    ],

    // Always blind-copy these, whatever the inquiry type. Your safety net:
    // even if a departmental mailbox is misrouted, the lead still lands here.
    'always_bcc'      => ['info@nlc.com.sa'],

    // Envelope sender. MUST be a real address on a domain you control, or
    // SPF/DMARC will reject the mail. Do NOT put the visitor's address here —
    // the visitor's address goes in Reply-To, which is set automatically.
    'from_email'      => 'website@nlc.com.sa',
    'from_name'       => 'NLC Website',

    // -----------------------------------------------------------------------
    // Mail transport
    //
    //   'mail' — PHP's built-in mail(). Works with zero setup. Use this first.
    //   'smtp' — authenticated SMTP. Switch to this once your Exchange admin
    //            has authorised the server IP (54.251.3.164) or issued
    //            SMTP AUTH credentials.
    //
    // Flip 'transport' to 'smtp' and fill the block below. Nothing else changes.
    // -----------------------------------------------------------------------
    'transport' => 'mail',

    'smtp' => [
        'host'       => 'smtp.office365.com',
        'port'       => 587,
        'encryption' => 'tls',        // 'tls' (STARTTLS, port 587) or 'ssl' (port 465)
        'username'   => 'website@nlc.com.sa',
        'password'   => '',
        'timeout'    => 20,
    ],

    // -----------------------------------------------------------------------
    // Abuse controls
    // -----------------------------------------------------------------------
    // Max submissions per IP per window. Generous enough that a real person
    // filling in two forms is never blocked.
    'rate_limit'        => ['max' => 5, 'window_minutes' => 10],

    // Reject submissions whose message body contains any of these. Keep short —
    // over-filtering silently drops real enquiries.
    'spam_keywords'     => ['viagra', 'casino', 'crypto investment', 'seo services'],

    // -----------------------------------------------------------------------
    // Error log. Outside public_html. Created automatically.
    // -----------------------------------------------------------------------
    'log_file'          => '/home/CPANELUSER/nlc-config/form-errors.log',

    // Set true ONLY while debugging — it returns PHP error details in the JSON
    // response, which you do not want visitors to see. Set back to false after.
    'debug'             => false,
];
