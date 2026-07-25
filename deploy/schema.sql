-- NLC Website — database schema
-- Import via cPanel → phpMyAdmin → (select your DB) → Import
--
-- Create the database and user first in cPanel → MySQL® Databases.
-- Grant the user ALL PRIVILEGES on the database.

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- Contact / inquiry submissions
--
-- Every submission is written here BEFORE any email is attempted, so a mail
-- failure can never lose a lead. mail_status records what happened afterwards.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `contact_submissions` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `reference`       CHAR(20)        NOT NULL COMMENT 'Human-quotable ref, e.g. NLC-7K2M4P9X',

  `inquiry_type`    VARCHAR(60)     NOT NULL DEFAULT 'General Inquiry',
  `first_name`      VARCHAR(100)    NOT NULL,
  `last_name`       VARCHAR(100)    NOT NULL,
  `email`           VARCHAR(190)    NOT NULL,
  `phone`           VARCHAR(60)         NULL,
  `company`         VARCHAR(190)        NULL,
  `subject`         VARCHAR(255)    NOT NULL,
  `message`         TEXT            NOT NULL,

  -- Attachment is stored OUTSIDE public_html; this is the path relative to
  -- the configured upload dir, plus the name the visitor uploaded it under.
  `attachment_path` VARCHAR(255)        NULL,
  `attachment_name` VARCHAR(255)        NULL,
  `attachment_size` INT UNSIGNED        NULL,
  `attachment_mime` VARCHAR(120)        NULL,

  `recipient`       VARCHAR(190)    NOT NULL COMMENT 'Address the notification was routed to',
  `mail_status`     ENUM('pending','sent','failed') NOT NULL DEFAULT 'pending',
  `mail_error`      VARCHAR(500)        NULL,

  `ip`              VARBINARY(16)       NULL COMMENT 'Packed via inet_pton',
  `user_agent`      VARCHAR(500)        NULL,
  `referer`         VARCHAR(500)        NULL,
  `language`        VARCHAR(10)     NOT NULL DEFAULT 'en',

  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_reference` (`reference`),
  KEY `idx_created`     (`created_at`),
  KEY `idx_email`       (`email`),
  KEY `idx_type`        (`inquiry_type`),
  KEY `idx_mail_status` (`mail_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------------
-- Newsletter subscribers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `newsletter_subscribers` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email`        VARCHAR(190)    NOT NULL,
  `language`     VARCHAR(10)     NOT NULL DEFAULT 'en',
  `source_page`  VARCHAR(255)        NULL,
  `ip`           VARBINARY(16)       NULL,
  `status`       ENUM('active','unsubscribed') NOT NULL DEFAULT 'active',
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email` (`email`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------------
-- Rate limiting — one row per IP per endpoint per window.
-- Cheap, self-cleaning (contact.php prunes rows older than the window).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `rate_limit` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ip`         VARBINARY(16)   NOT NULL,
  `endpoint`   VARCHAR(40)     NOT NULL,
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_lookup` (`ip`, `endpoint`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------------
-- Handy views for reading submissions in phpMyAdmin
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW `v_recent_submissions` AS
SELECT
  `reference`                              AS `Ref`,
  `created_at`                             AS `Received`,
  `inquiry_type`                           AS `Type`,
  CONCAT(`first_name`, ' ', `last_name`)   AS `Name`,
  `email`                                  AS `Email`,
  `phone`                                  AS `Phone`,
  `company`                                AS `Company`,
  `subject`                                AS `Subject`,
  IF(`attachment_path` IS NULL, '', `attachment_name`) AS `Attachment`,
  `mail_status`                            AS `Email Sent`
FROM `contact_submissions`
ORDER BY `created_at` DESC;

-- Anything the mailer could not deliver. Should always be empty.
CREATE OR REPLACE VIEW `v_failed_emails` AS
SELECT `reference`, `created_at`, `inquiry_type`, `email`, `recipient`, `mail_error`
FROM `contact_submissions`
WHERE `mail_status` = 'failed'
ORDER BY `created_at` DESC;
