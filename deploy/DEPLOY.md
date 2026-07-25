# NLC Website — Deployment Guide

Everything needed to get nlc.com.sa working, in order. Budget about 90 minutes
the first time.

Two things happen here: the site's missing files finally reach the server, and
the contact form stops losing enquiries.

---

## What was wrong

**1. The upload was incomplete.** Only the loose files in the root of the
Website folder reached `public_html`. Every subdirectory — `images/`,
`product/`, `ar/`, `fonts/`, `datasheets/`, `certificates/`, `js/`,
`solutions/`, `news/`, `forms/` — never went up. That is 660+ broken
references: no logo, no product photos, no product pages, no brand font.

The cause is almost certainly a browser drag-and-drop upload of a large folder
tree timing out partway. File Manager reports success for the files that made
it. **This guide uploads a single ZIP instead**, which either arrives whole or
fails loudly.

**2. Every CV submitted through the Careers tab was silently discarded.**

The contact form POSTed to `formsubmit.co/ajax/…`. FormSubmit's AJAX endpoint
does not support file attachments — attachments only work on their standard
non-AJAX endpoint. The file was dropped server-side while the endpoint returned
`{"success":"true"}`, so the applicant was shown *"Message sent successfully!"*
every time.

Separately, FormSubmit requires a one-time activation click **per recipient
address**. `cr@nlc.com.sa` and `career@nlc.com.sa` are separate recipients from
`info@nlc.com.sa`; if those were never confirmed, nothing was delivered at all.

`contact.php` replaces it. Submissions are written to MySQL **before** email is
attempted, so a mail failure can no longer lose a lead.

---

## Before you start

Collect these four things:

| Need | Where |
|---|---|
| cPanel login | your hosting welcome email |
| cPanel username | cPanel home page, right sidebar — used in paths below as `CPANELUSER` |
| The Website folder | `~/Documents/Claude/Projects/Website` |
| 90 minutes | — |

### Take a backup first

cPanel → **Files → Backup → Download a Home Directory Backup**. Wait for the
email, confirm the file downloaded. Do not skip this — Step 5 deletes files.

### Look at what is in `public_html` right now

cPanel → **File Manager** → `public_html`. Click **Settings** (top right) and
tick **Show Hidden Files (dotfiles)**.

Screenshot the listing. You are looking for survivors of the old Laravel site:

| If you see | It means |
|---|---|
| `index.php` | **Serious.** Apache tries `index.php` before `index.html`, so this is what visitors get instead of the new site |
| `.htaccess` with `RewriteRule ^ index.php` | Laravel's router — sends every product URL into a dead front controller |
| `vendor/`, `bootstrap/`, `storage/`, `artisan`, `composer.json` | Laravel application files, all dead weight |

Step 5 clears these. The `.htaccess` shipped here also forces `index.html`
first, as a second line of defence.

> **`storage/` is worth a look before you delete it.** If it survived, it holds
> the chairman and leadership photos. Step 1's `--fetch` flag can pull them back
> automatically — run that *before* clearing anything.

---

## Step 1 — Build the upload package

On your Mac, in Terminal:

```bash
cd ~/Documents/Claude/Projects/Website
git clone https://github.com/malsaleh1407-hub/nlc.git /tmp/nlc-tools
python3 /tmp/nlc-tools/tools/patch_site.py \
    --site . \
    --deploy /tmp/nlc-tools/deploy \
    --out ~/Desktop/nlc-upload.zip \
    --fetch
```

`--fetch` tries to recover the missing chairman / leadership / news photos from
the old server, then from the Internet Archive. Drop the flag to skip it.

The script does not touch your Website folder — it works on a copy. (Add
`--in-place` if you also want your original updated.)

### Read the output

```
REFERENCE CHECK
  4231 of 4231 internal references resolve
BUILT CLEAN — every internal reference resolves
```

**If it says `BUILT WITH n MISSING FILE(S)`, stop and read the list.** Each
entry names a file the site expects and the pages that reference it. Add the
missing files to your Website folder and re-run. Uploading with known-missing
files just reproduces the current problem.

The recovered-photo section tells you which images came back:

```
RECOVERING CMS PHOTOS
  recovered  images/chairman.png            (live server)
  recovered  images/team/01KFJ93RV6…png     (web archive)
  NOT FOUND  images/values/innov.svg
```

Copy anything recovered back into your real `Website/images/` folder so it is
not lost next time.

### What is deliberately excluded from the ZIP

`CLAUDE.md`, `SERVER-AUTH.md`, `PROMPTS-ALL.md`, `STYLE-GUIDE.md`, all `.py`
scripts, the `.pptx`, `base44-documents-import.csv`, the brand-guidelines
source, `admin.html` and `index-option-a.html`.

These are currently in your public GitHub repo. Had they been uploaded, every
one would have been downloadable by anyone. `admin.html` in particular has a
client-side-only password gate whose password sits in plain text in
`SERVER-AUTH.md` — it stays off the server until real server-side auth exists.

### Credentials are never packaged

`private/`, `_backup/`, `_audit/` and `admin/` are excluded unconditionally.

`private/` holds the live CMS token and admin credential hash. On the server
those sit behind `private/.htaccess` → `Require all denied`, but **that
protection does not travel inside a ZIP** — anyone who opens the archive reads
them as plain text. `_backup/` is worse still, since it accumulates dated
copies of every secret ever rotated.

Provision `private/` on the server directly, once, out-of-band.

A fail-closed scan runs before packaging and **aborts the build** if anything
credential-shaped is staged, whatever directory it turned up in. A blocklist
only stops what it was told about; the scan catches the rest. If it stops on a
false positive, add the path to `SECRET_ALLOWLIST` in `tools/patch_site.py`.

---

## Step 2 — Create the database

cPanel → **Databases → MySQL® Databases**.

1. **New Database:** `nlcweb` → Create. Real name becomes `CPANELUSER_nlcweb`.
2. **New User:** `nlcweb` + a strong generated password.
   **Copy the password somewhere safe now** — it is not shown again.
3. **Add User To Database:** select both → **ALL PRIVILEGES** → Make Changes.

Then cPanel → **phpMyAdmin** → select `CPANELUSER_nlcweb` → **Import** tab →
choose `deploy/schema.sql` → **Go**.

You should see three tables and two views.

---

## Step 3 — Put the config outside `public_html`

This file holds your database password. Anything inside `public_html` can, under
a misconfiguration, be served as plain text. Outside it, it cannot be requested
over HTTP at all.

In File Manager, go **up one level** from `public_html` — to `/home/CPANELUSER`.
You should see `public_html`, `mail`, `etc` as siblings.

1. Create folder `nlc-config`
2. Create folder `nlc-uploads` — where CVs and quote documents land
3. Upload `deploy/config.sample.php` into `nlc-config`, then **rename it to
   `config.php`**
4. Right-click → **Edit** and fill in:

```php
'name' => 'CPANELUSER_nlcweb',
'user' => 'CPANELUSER_nlcweb',
'pass' => 'the password from Step 2',

'upload_dir' => '/home/CPANELUSER/nlc-uploads',
'log_file'   => '/home/CPANELUSER/nlc-config/form-errors.log',
```

Replace `CPANELUSER` with your actual cPanel username everywhere — there are
five occurrences.

Final layout:

```
/home/CPANELUSER/
├── nlc-config/     config.php          ← password lives here, unreachable over HTTP
├── nlc-uploads/                        ← CVs land here, unreachable over HTTP
└── public_html/                        ← the website
```

---

## Step 4 — Create the sender mailbox

`from_email` must be a real address on a domain you control, or SPF and DMARC
will reject the notifications.

cPanel → **Email → Email Accounts → Create** → `website@nlc.com.sa`.

> **If your MX is on Microsoft 365**, do not create a local mailbox — it would
> shadow the real one. Instead ask your Exchange admin for a `website@nlc.com.sa`
> send-only account, and set `from_email` to an address that already exists,
> such as `info@nlc.com.sa`.

### Check Email Routing — this one silently breaks everything

cPanel → **Email → Email Routing** → select `nlc.com.sa`.

| Setting | Meaning |
|---|---|
| **Remote Mail Exchanger** | Mail goes to Microsoft 365. **Correct if your mail is on M365.** |
| **Local Mail Exchanger** | cPanel delivers locally. With 0 mailboxes on the server, every notification is accepted and then vanishes. |

If your mail is on Microsoft 365 and this says *Local*, change it to **Remote**.
This alone can account for notifications that were never received.

---

## Step 5 — Clear `public_html`

Backup done? Then in File Manager, open `public_html`, **Select All**, and
untick these before deleting:

- **`.well-known`** — SSL certificate renewal depends on it. Deleting it can
  break HTTPS at the next AutoSSL run.
- **`cgi-bin`** — cPanel-managed.
- **Any subdomain folders** — cPanel nests subdomain document roots inside
  `public_html`. If you have `shop.nlc.com.sa`, there will be a `shop` folder
  here. Deleting it deletes that site.

Delete the rest. Tick **Skip the trash** to avoid filling your disk quota.

Email, databases and DNS are untouched by this — they live outside
`public_html`.

---

## Step 6 — Upload and extract

1. File Manager → inside `public_html` → **Upload**
2. Select `~/Desktop/nlc-upload.zip` and wait for 100%
3. Back in `public_html`, right-click the ZIP → **Extract** → into
   `/public_html` → Extract Files
4. **Delete the ZIP afterwards** — otherwise your whole site is downloadable as
   one archive

### Confirm the dotfiles arrived

With *Show Hidden Files* on, you should see `.htaccess` and `.user.ini` in
`public_html`. Some extractors skip dotfiles. If either is missing, upload
`deploy/htaccess-for-public_html.txt` and
`deploy/user.ini-for-public_html.txt` individually and rename them to
`.htaccess` and `.user.ini`.

### Permissions

Select all → **Permissions**: folders `0755`, files `0644`. Never `0777` — most
hosts refuse to execute PHP with world-writable permissions.

---

## Step 7 — Verify

Open a **private/incognito window** so you are not served a cached copy.

| # | Check | Pass |
|---|---|---|
| 1 | `https://nlc.com.sa` | Loads over HTTPS, padlock shown |
| 2 | Logo, top-left | Renders — not a broken-image icon |
| 3 | Body text | Bizmo, not Times/Arial fallback |
| 4 | `http://nlc.com.sa` | Redirects to `https://` |
| 5 | Products page | Product photos load |
| 6 | Any product card | Opens a real detail page, not a 404 |
| 7 | Chairman photo, homepage | Loads (or is a known gap from Step 1) |
| 8 | Arabic toggle | Opens `/ar/`, lays out right-to-left |
| 9 | `https://nlc.com.sa/CLAUDE.md` | **403 or 404 — must NOT display** |
| 10 | `https://nlc.com.sa/admin.html` | **404 — must NOT exist** |

### Then test the form properly

Submit the contact form as **Careers**, with a real PDF attached.

Confirm all four:

1. Success message appears, showing a reference like `NLC-7K2M4P9X`
2. Email arrives at `career@nlc.com.sa` **with the PDF attached**
3. phpMyAdmin → `contact_submissions` → your row is there, `mail_status` = `sent`
4. File Manager → `/home/CPANELUSER/nlc-uploads/2026/07/` → the PDF is there

Point 4 is the important one. Even if email breaks completely, the submission
and its attachment are on disk. That is the failure that lost the July 23 CV,
and it cannot happen this way.

---

## If something is wrong

**500 error on every page** — almost always `.htaccess`. Rename it to
`.htaccess.off` and reload. If the site returns, an `IfModule` block is
unsupported on your host; re-add the file section by section to find it.

**Form returns "Server is not configured"** — `config.php` is not where
`contact.php` expects it. It must be at exactly
`/home/CPANELUSER/nlc-config/config.php`, one level *above* `public_html`.

**Form returns a 500** — set `'debug' => true` in `config.php`, submit again,
read the `debug` field in the response. **Set it back to `false` afterwards.**

**Submission saved but `mail_status` = `failed`** — the lead is safe; only
delivery failed. Check `/home/CPANELUSER/nlc-config/form-errors.log`, then
recheck Email Routing (Step 4). In phpMyAdmin, the `v_failed_emails` view lists
everything affected.

**Fonts still fall back** — confirm `fonts/fonts.css` and the `.woff2` files are
present, then check the Network tab for a 404 or a wrong `Content-Type`. The
shipped `.htaccess` sets `font/woff2` correctly.

**Rollback:** restore the home-directory backup from *Before you start* via
cPanel → Backup → Restore.

---

## Later

### Switch to authenticated SMTP

Once your Exchange admin authorises the server IP (`54.251.3.164`) or issues
SMTP AUTH credentials, edit `config.php`:

```php
'transport' => 'smtp',
'smtp' => [
    'host'       => 'smtp.office365.com',
    'port'       => 587,
    'encryption' => 'tls',
    'username'   => 'website@nlc.com.sa',
    'password'   => 'the app password',
],
```

Nothing else changes. Test with one submission and confirm `mail_status` is
`sent`.

### Turn the catalog downloads back on

Every PDF link currently renders greyed out with a **Coming Soon** chip, because
the PDFs are not ready. When they are, upload them to `datasheets/` and
`certificates/`, then re-run the packaging script **without** the download patch
— comment out this line in `tools/patch_site.py`:

```python
text = patch_downloads(text, report)
```

### Restore the admin panel

`admin.html` needs server-side authentication before it goes near the server. A
JavaScript password check is bypassed by pressing Ctrl-U. The quickest safe
option is cPanel → **Directory Privacy** on an `/admin` folder, which puts real
HTTP auth in front of it. Rotate the password in `SERVER-AUTH.md` first — it has
been in a public GitHub repo.

### Stop this happening again

Commit the complete site — images and all — to GitHub, then use cPanel → **Git
Version Control** to deploy. Updates become a pull, and a partial upload stops
being possible. The repo will grow to a few hundred MB, which is fine.

---

## File reference

| File | Goes to | Notes |
|---|---|---|
| `contact.php` | `public_html/` | Contact form handler |
| `subscribe.php` | `public_html/` | Newsletter handler |
| `lib/mailer.php` | `public_html/lib/` | MIME + SMTP, no dependencies |
| `htaccess-for-public_html.txt` | `public_html/.htaccess` | **Rename on upload** |
| `user.ini-for-public_html.txt` | `public_html/.user.ini` | **Rename on upload** |
| `config.sample.php` | `/home/CPANELUSER/nlc-config/config.php` | **Outside public_html.** Rename and fill in |
| `schema.sql` | phpMyAdmin → Import | Run once |
| `tools/patch_site.py` | your Mac | Never uploaded |

The packaging script places the first five automatically. Only `config.php` and
`schema.sql` are manual, because both need your credentials.
