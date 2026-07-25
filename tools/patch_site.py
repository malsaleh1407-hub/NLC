#!/usr/bin/env python3
"""
NLC Website — patch and package for upload.

Run this on the Mac that holds the real Website folder (the one with images/,
product/, ar/, fonts/, datasheets/, certificates/). It:

  1. copies the site into a staging folder, leaving your original untouched
  2. rewrites the dead /storage/ CMS photo URLs to local paths
  3. repoints the contact and newsletter forms at the new PHP handlers
  4. marks the catalog / datasheet downloads as Coming Soon
  5. drops the base44 download gate
  6. adds contact.php, subscribe.php, .htaccess and .user.ini
  7. checks that every internal reference resolves, and reports what is missing
  8. writes a single upload-ready ZIP

Nothing is deleted and nothing is uploaded. The ZIP is the deliverable.

Usage
-----
    python3 patch_site.py --site ~/Documents/Claude/Projects/Website

    # also try to recover the missing CMS photos from the old server / archive
    python3 patch_site.py --site ~/.../Website --fetch

    # patch the real folder too, not just the staging copy
    python3 patch_site.py --site ~/.../Website --in-place

Requires Python 3.8+. No third-party packages.
"""

from __future__ import annotations

import argparse
import html
import os
import re
import shutil
import ssl
import sys
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

# --------------------------------------------------------------------------
# What must never reach the public server
#
# These are internal notes, source scripts and credentials. Several are in the
# public GitHub repo; none of them belong in public_html.
# --------------------------------------------------------------------------
EXCLUDE_NAMES = {
    "CLAUDE.md",
    "SERVER-AUTH.md",
    "PROMPTS-ALL.md",
    "STYLE-GUIDE.md",
    "README.md",
    "base44-documents-import.csv",
    "NLC-Brand-Guidelines-source.html",
    "NLC-Brand-Guidelines-v1.0.pdf",
    "NLC-Low-Current-Division.pptx",
    # Client-side password gate only; the password is in the public repo.
    # Leave it off the server until real server-side auth exists.
    "admin.html",
    # Superseded alternate homepage.
    "index-option-a.html",
    ".DS_Store",
    "Thumbs.db",
}

EXCLUDE_SUFFIXES = {".py", ".pyc", ".pptx", ".xlsx", ".docx", ".csv", ".sql",
                    ".log", ".bak", ".orig", ".tmp"}

EXCLUDE_DIRS = {
    ".git", ".github", "__pycache__", "node_modules", "deploy",
    "tools", ".vscode", ".idea", ".claude",
    # Credential and working directories.
    #
    # private/ holds the live CMS token and the admin credential hash. On the
    # server it is protected by private/.htaccess, but that protection does not
    # travel inside a ZIP — anyone who opens the archive reads the tokens in
    # plain text. It must be provisioned on the server out-of-band, never
    # shipped in a build artifact.
    #
    # _backup/ is worse: it accumulates dated copies of every secret ever
    # rotated, so shipping it would expose the old values as well as the new.
    "private", "_backup", "_audit", "admin", "_site", ".netlify",
}

# Fail-closed secret scan.
#
# A blocklist only stops what it has been told about. This pattern is checked
# against everything actually staged, and packaging aborts on a match — so a
# credential file in a directory nobody thought of still cannot ship.
SECRET_PATTERNS = re.compile(
    r"(^\.env)|(^\.htpasswd$)|(secret)|(admin-auth)|(credential)|(_rsa$)"
    r"|(\.pem$)|(\.key$)|(\.p12$)|(\.pfx$)|(token)|(password)",
    re.I,
)

# Files whose names trip the pattern but are demonstrably safe to publish.
SECRET_ALLOWLIST = {
    "js/dl-gate.js",       # references a gate, contains no credential
    "tokens.css",          # design tokens
}

# HTML files that are patched but never shipped — skip them entirely.
SKIP_PATCH = {"NLC-Brand-Guidelines-source.html"}


# --------------------------------------------------------------------------
# /storage/  ->  local path
#
# The previous site was Laravel; these URLs point at its storage directory,
# which no longer exists. Each becomes a normal local file.
# --------------------------------------------------------------------------
STORAGE_RULES = [
    (re.compile(r"^imgs/chairman\.(png|jpg|jpeg)$", re.I),      lambda m, f: f"images/chairman.{m.group(1).lower()}"),
    (re.compile(r"^imgs/(.+)\.svg$", re.I),                     lambda m, f: f"images/values/{slug(m.group(1))}.svg"),
    (re.compile(r"^imgs/(.+)\.(gif|png|jpg|jpeg|webp)$", re.I),  lambda m, f: f"images/{slug(m.group(1))}.{m.group(2).lower()}"),
    (re.compile(r"^team/images/(.+)$", re.I),                   lambda m, f: f"images/team/{m.group(1)}"),
    (re.compile(r"^news/(.+)$", re.I),                          lambda m, f: f"images/news/{m.group(1)}"),
    (re.compile(r"^projects/thumbnails/(.+)$", re.I),           lambda m, f: f"images/projects/thumbnails/{m.group(1)}"),
    (re.compile(r"^projects/banners/(.+)$", re.I),              lambda m, f: f"images/projects/banners/{m.group(1)}"),
    (re.compile(r"^products/images/(.+)$", re.I),               lambda m, f: f"images/products/{m.group(1)}"),
]

# Only rewrite URLs that name a real image file. This is what keeps the
# JavaScript placeholder strings in admin.html ("…/storage/news/…") untouched.
STORAGE_URL = re.compile(
    r"https?://(?:www\.)?nlc\.com\.sa/storage/([^\s\"'<>)]+\.(?:png|jpe?g|gif|svg|webp|ico))",
    re.I,
)

ASSET_EXT = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico",
             ".css", ".js", ".woff", ".woff2", ".ttf", ".otf", ".eot",
             ".pdf", ".mp4", ".webm", ".html", ".htm", ".xml", ".txt", ".php"}


def slug(name: str) -> str:
    """'low%20current' -> 'low-current'. Keeps filenames shell- and URL-safe."""
    name = urllib.parse.unquote(name)
    name = re.sub(r"[\s_]+", "-", name.strip())
    name = re.sub(r"[^A-Za-z0-9.\-]", "", name)
    return name.lower()


def storage_to_local(path: str) -> str | None:
    """Map a /storage/ tail to a local site-root-relative path."""
    path = path.lstrip("/")
    for pattern, build in STORAGE_RULES:
        m = pattern.match(path)
        if m:
            return build(m, path)
    return None


# ==========================================================================
# HTML patches
# ==========================================================================

def patch_storage_urls(text: str, report: dict) -> str:
    """Rewrite dead CMS photo URLs to local paths."""
    def repl(m: re.Match) -> str:
        tail = m.group(1)
        local = storage_to_local(tail)
        if not local:
            report.setdefault("storage_unmapped", set()).add(m.group(0))
            return m.group(0)
        report.setdefault("storage_mapped", {})[m.group(0)] = local
        return local

    return STORAGE_URL.sub(repl, text)


def patch_forms(text: str, report: dict) -> str:
    """
    Point the forms at the new PHP handlers.

    The contact form previously POSTed to formsubmit.co/ajax/<address>. That
    endpoint discards file attachments and answers {"success":"true"} anyway,
    so every CV uploaded through the Careers tab was silently lost. The
    recipient is now decided server-side from inquiry_type.
    """
    before = text

    # Newsletter — a literal address in the URL.
    text = re.sub(
        r"""(['"])https?://formsubmit\.co/ajax/info@nlc\.com\.sa\1""",
        r"\1/subscribe.php\1",
        text,
    )

    # Contact — address built by concatenation.
    text = re.sub(
        r"""(['"])https?://formsubmit\.co/ajax/\1\s*\+\s*recipient""",
        r"\1/contact.php\1",
        text,
    )

    # Any other formsubmit endpoint.
    text = re.sub(
        r"""(['"])https?://formsubmit\.co/(?:ajax/)?[^'"]*\1""",
        r"\1/contact.php\1",
        text,
    )

    # Remove the now-dead client-side recipient routing.
    text = re.sub(
        r"[ \t]*const\s+recipient\s*=\s*inqType[^;]*;\s*\n",
        "",
        text,
    )

    # Tag the submission with the page language so replies go out in kind.
    text = text.replace(
        "body: new FormData(form)",
        "body: (function(){ var fd = new FormData(form);"
        " fd.set('language', document.documentElement.lang || 'en');"
        " return fd; })()",
    )

    if text != before:
        report["forms_patched"] = report.get("forms_patched", 0) + 1

    return text


def patch_success_reference(text: str) -> str:
    """Show the visitor the reference number the server assigns."""
    needle = "successBox.style.display = 'block';"
    if needle not in text or "data-ref-injected" in text:
        return text

    replacement = (
        "successBox.style.display = 'block';\n"
        "                if(res.reference){ successBox.setAttribute('data-ref-injected','1');\n"
        "                    successBox.innerHTML += ' <span style=\"font-weight:500\">"
        "Your reference: <strong>' + res.reference + '</strong></span>'; }"
    )
    return text.replace(needle, replacement, 1)


def patch_downloads(text: str, report: dict) -> str:
    """
    Catalog and datasheet PDFs are not ready yet.

    Rather than leave a button that 404s, disable it and label it clearly. One
    regex swap reverses this when the PDFs are uploaded.
    """
    before = text

    def disable(m: re.Match) -> str:
        tag = m.group(0)
        if "nlc-soon" in tag:
            return tag  # already processed — this script is idempotent
        tag = re.sub(r'\shref="[^"]*"', ' href="#" aria-disabled="true"', tag)
        tag = re.sub(r"\sdownload\b", "", tag)
        tag = re.sub(r'\starget="_blank"', "", tag)
        tag = tag.replace(
            "<a ",
            '<a data-nlc-soon="1" onclick="return false;" '
            'style="opacity:.55;cursor:not-allowed;pointer-events:auto;" ',
            1,
        )
        tag = re.sub(r'class="([^"]*)"', r'class="\1 nlc-soon"', tag)
        return tag

    text = re.sub(r"<a\b[^>]*href=\"[^\"]*\.pdf\"[^>]*>", disable, text, flags=re.I)

    # Append a "Coming Soon" chip to the disabled link's own text.
    text = re.sub(
        r'(<a\b[^>]*data-nlc-soon="1"[^>]*>)(.*?)(</a>)',
        lambda m: m.group(1) + m.group(2) +
        '<span class="soon-chip" style="margin-inline-start:8px;font-size:.7em;'
        'font-weight:700;letter-spacing:.04em;text-transform:uppercase;'
        'background:#F6851F;color:#fff;padding:2px 8px;border-radius:999px;'
        'vertical-align:middle;">Coming Soon</span>' + m.group(3)
        if "soon-chip" not in m.group(2) else m.group(0),
        text,
        flags=re.I | re.S,
    )

    if text != before:
        report["downloads_disabled"] = report.get("downloads_disabled", 0) + 1
    return text


def patch_dl_gate(text: str, report: dict) -> str:
    """Remove the base44 download gate — nothing is downloadable right now."""
    before = text
    text = re.sub(r"[ \t]*<script[^>]*\bsrc=\"[^\"]*dl-gate\.js\"[^>]*>\s*</script>\s*\n?", "", text, flags=re.I)
    if text != before:
        report["dl_gate_removed"] = report.get("dl_gate_removed", 0) + 1
    return text


def patch_html(path: Path, report: dict) -> bool:
    original = path.read_text(encoding="utf-8", errors="ignore")
    text = original

    text = patch_storage_urls(text, report)
    text = patch_forms(text, report)
    text = patch_success_reference(text)
    text = patch_downloads(text, report)
    text = patch_dl_gate(text, report)

    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


# ==========================================================================
# Reference checking
# ==========================================================================

REF_RE = re.compile(
    r"""(?:href|src|poster|data-src)\s*=\s*["']([^"'#][^"']*)["']"""
    r"""|url\(\s*['"]?([^'")]+)['"]?\s*\)""",
    re.I,
)


def collect_refs(root: Path) -> dict[str, set[str]]:
    """Map each site-root-relative asset path -> the files that reference it."""
    refs: dict[str, set[str]] = {}

    for f in sorted(root.rglob("*")):
        if not f.is_file() or f.suffix.lower() not in {".html", ".htm", ".css"}:
            continue
        if f.name in SKIP_PATCH:
            continue

        text = f.read_text(encoding="utf-8", errors="ignore")

        for m in REF_RE.finditer(text):
            raw = (m.group(1) or m.group(2) or "").strip()
            if not raw:
                continue
            low = raw.lower()
            if low.startswith(("http://", "https://", "//", "data:", "mailto:",
                               "tel:", "javascript:", "#", "{{")):
                continue

            clean = html.unescape(raw.split("?")[0].split("#")[0])
            if not clean:
                continue

            # Resolve relative to the referencing file, or to root if absolute.
            if clean.startswith("/"):
                target = (root / clean.lstrip("/")).resolve()
            else:
                target = (f.parent / clean).resolve()

            try:
                rel = target.relative_to(root.resolve()).as_posix()
            except ValueError:
                continue  # escapes the site root

            if Path(rel).suffix.lower() in ASSET_EXT:
                refs.setdefault(rel, set()).add(f.relative_to(root).as_posix())

    return refs


def check_refs(root: Path) -> tuple[dict[str, set[str]], int]:
    refs = collect_refs(root)
    missing = {p: srcs for p, srcs in refs.items() if not (root / p).exists()}
    return missing, len(refs)


# Files pulled in at runtime by JavaScript rather than by markup. These are
# reported separately: markup references are hard failures, whereas a fetch()
# is usually written with a fallback and its absence may be entirely intended.
FETCH_RE = re.compile(
    r"""(?:fetch|\.open)\s*\(\s*['"]([^'"]+?)(?:\?[^'"]*)?['"]""",
    re.I,
)


def check_runtime_fetches(root: Path) -> list[tuple[str, str, bool]]:
    """Return (target, referencing file, exists) for each local fetch() target."""
    found: dict[tuple[str, str], bool] = {}

    for f in sorted(root.rglob("*")):
        if not f.is_file() or f.suffix.lower() not in {".html", ".htm", ".js"}:
            continue

        text = f.read_text(encoding="utf-8", errors="ignore")

        for m in FETCH_RE.finditer(text):
            target = m.group(1).strip()
            low = target.lower()
            if low.startswith(("http://", "https://", "//", "data:", "blob:")):
                continue
            # Server endpoints are generated, not files on disk.
            if low.lstrip("/") in {"contact.php", "subscribe.php"}:
                continue

            probe = (root / target.lstrip("/")) if target.startswith("/") else (f.parent / target)
            found[(target, f.relative_to(root).as_posix())] = probe.exists()

    return [(t, src, ok) for (t, src), ok in sorted(found.items())]


# ==========================================================================
# Optional recovery of the CMS photos
# ==========================================================================

def try_fetch(url: str, dest: Path, timeout: int = 20) -> bool:
    ctx = ssl.create_default_context()
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (NLC site migration)"})
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
            if r.status != 200:
                return False
            data = r.read()
        if len(data) < 100:
            return False
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
        return True
    except Exception:
        return False


def recover_photos(root: Path, mapped: dict[str, str]) -> tuple[list[str], list[str]]:
    """
    Try the original CMS URL, then the Wayback Machine.

    If the old Laravel storage directory survived the overwrite, this recovers
    the leadership and news photos with no manual work.
    """
    got, lost = [], []

    for original_url, local in sorted(mapped.items()):
        dest = root / local
        if dest.exists():
            continue

        if try_fetch(original_url, dest):
            got.append(f"{local}  (live server)")
            continue

        archive = "https://web.archive.org/web/2024id_/" + original_url
        if try_fetch(archive, dest):
            got.append(f"{local}  (web archive)")
            continue

        lost.append(local)

    return got, lost


# ==========================================================================
# Staging and packaging
# ==========================================================================

def is_excluded(p: Path, base: Path) -> bool:
    rel = p.relative_to(base)
    if any(part in EXCLUDE_DIRS for part in rel.parts):
        return True
    if p.name in EXCLUDE_NAMES:
        return True
    if p.suffix.lower() in EXCLUDE_SUFFIXES:
        return True
    return False


def stage(site: Path, staging: Path) -> int:
    if staging.exists():
        shutil.rmtree(staging)
    staging.mkdir(parents=True)

    count = 0
    for src in site.rglob("*"):
        if not src.is_file() or is_excluded(src, site):
            continue
        dst = staging / src.relative_to(site)
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        count += 1
    return count


def add_backend(staging: Path, deploy: Path) -> list[str]:
    """Drop in the PHP handlers and the Apache / PHP config, correctly named."""
    added = []
    pairs = [
        (deploy / "contact.php",                    staging / "contact.php"),
        (deploy / "subscribe.php",                  staging / "subscribe.php"),
        (deploy / "lib" / "mailer.php",             staging / "lib" / "mailer.php"),
        (deploy / "htaccess-for-public_html.txt",   staging / ".htaccess"),
        (deploy / "user.ini-for-public_html.txt",   staging / ".user.ini"),
    ]
    for src, dst in pairs:
        if not src.exists():
            print(f"  !  missing deploy file: {src}")
            continue
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        added.append(dst.relative_to(staging).as_posix())
    return added


def scan_for_secrets(staging: Path) -> list[str]:
    """
    Last line of defence before anything is packaged.

    Returns the staged paths that look like credentials. Packaging must abort
    on a non-empty result: a ZIP is an outbound file, and unlike the server
    there is no .htaccess inside it to keep anyone out.
    """
    hits = []
    for f in sorted(staging.rglob("*")):
        if not f.is_file():
            continue
        rel = f.relative_to(staging).as_posix()
        if rel in SECRET_ALLOWLIST:
            continue
        # Match on the filename, and on any directory component, so that
        # private/backups/20260630 is caught by the directory as well.
        if SECRET_PATTERNS.search(f.name) or any(
            SECRET_PATTERNS.search(part) for part in f.relative_to(staging).parts[:-1]
        ):
            hits.append(rel)
    return hits


def make_zip(staging: Path, out: Path) -> tuple[int, float]:
    if out.exists():
        out.unlink()
    n = 0
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for f in sorted(staging.rglob("*")):
            if f.is_file():
                z.write(f, f.relative_to(staging).as_posix())
                n += 1
    return n, out.stat().st_size / 1024 / 1024


# ==========================================================================

def main() -> int:
    ap = argparse.ArgumentParser(description="Patch and package the NLC website.")
    ap.add_argument("--site", required=True, type=Path, help="Path to the Website folder")
    ap.add_argument("--out", type=Path, default=Path("nlc-upload.zip"), help="Output ZIP")
    ap.add_argument("--staging", type=Path, default=Path("nlc-staging"), help="Staging folder")
    ap.add_argument("--deploy", type=Path, default=Path(__file__).resolve().parent.parent / "deploy",
                    help="Folder holding contact.php etc.")
    ap.add_argument("--fetch", action="store_true", help="Try to recover missing CMS photos")
    ap.add_argument("--in-place", action="store_true", help="Also patch the original Website folder")
    ap.add_argument("--no-zip", action="store_true",
                    help="Patch and verify only; skip packaging. Use when your own "
                         "publish.sh builds the archive.")
    args = ap.parse_args()

    site = args.site.expanduser().resolve()
    if not site.is_dir():
        print(f"ERROR: --site is not a folder: {site}")
        return 1
    if not (site / "index.html").exists():
        print(f"ERROR: no index.html in {site} — is this the Website folder?")
        return 1

    deploy = args.deploy.expanduser().resolve()
    print(f"\nSource : {site}\nBackend: {deploy}\n")

    # ---- Sanity check the source before doing anything -------------------
    print("=" * 74)
    print("SOURCE FOLDER")
    print("=" * 74)
    expected = ["images", "product", "ar", "fonts", "datasheets", "certificates", "js"]
    absent = []
    for d in expected:
        p = site / d
        if p.is_dir():
            n = sum(1 for _ in p.rglob("*") if _.is_file())
            print(f"  ok      {d:<16} {n:>5} files")
        else:
            print(f"  MISSING {d}")
            absent.append(d)

    if absent:
        print(f"\n  These folders are absent: {', '.join(absent)}")
        print("  The package will build, but pages referencing them will 404.")
        if input("\n  Continue anyway? [y/N] ").strip().lower() != "y":
            return 1

    # ---- Stage ------------------------------------------------------------
    staging = args.staging.expanduser().resolve()
    print(f"\nStaging into {staging} ...")
    copied = stage(site, staging)
    print(f"  {copied} files copied ({len(EXCLUDE_NAMES)} name rules applied)")

    # ---- Patch ------------------------------------------------------------
    print("\n" + "=" * 74)
    print("PATCHING")
    print("=" * 74)

    report: dict = {}
    targets = [staging] + ([site] if args.in_place else [])

    for target in targets:
        where = "staging" if target == staging else "ORIGINAL folder"
        changed = 0
        for f in sorted(target.rglob("*.html")):
            if f.name in SKIP_PATCH:
                continue
            if target is site and is_excluded(f, site):
                continue
            if patch_html(f, report if target == staging else {}):
                changed += 1
        print(f"  {changed} HTML files rewritten in {where}")

    mapped = report.get("storage_mapped", {})
    print(f"  {len(mapped)} CMS photo URLs repointed to local paths")
    print(f"  {report.get('forms_patched', 0)} files had form endpoints switched to PHP")
    print(f"  {report.get('downloads_disabled', 0)} files had PDF links marked Coming Soon")
    print(f"  {report.get('dl_gate_removed', 0)} files had the base44 gate removed")

    if report.get("storage_unmapped"):
        print("\n  Unmapped CMS URLs (left as-is, please check):")
        for u in sorted(report["storage_unmapped"]):
            print(f"    {u}")

    # ---- Backend ----------------------------------------------------------
    print("\nAdding backend files ...")
    for a in add_backend(staging, deploy):
        print(f"  + {a}")

    # ---- Recover photos ---------------------------------------------------
    if args.fetch and mapped:
        print("\n" + "=" * 74)
        print("RECOVERING CMS PHOTOS")
        print("=" * 74)
        got, lost = recover_photos(staging, mapped)
        for g in got:
            print(f"  recovered  {g}")
        for l in lost:
            print(f"  NOT FOUND  {l}")
        if got:
            print(f"\n  {len(got)} photo(s) recovered into staging.")
            print("  Copy them back into your Website/images folder to keep them.")

    # ---- Verify -----------------------------------------------------------
    print("\n" + "=" * 74)
    print("REFERENCE CHECK")
    print("=" * 74)
    missing, total = check_refs(staging)
    ok = total - len(missing)
    print(f"  {ok} of {total} internal references resolve")

    if missing:
        buckets: dict[str, list[str]] = {}
        for path in missing:
            top = path.split("/")[0] if "/" in path else "(root)"
            buckets.setdefault(top, []).append(path)

        print(f"\n  {len(missing)} unresolved — you must supply these files:\n")
        for top in sorted(buckets, key=lambda k: -len(buckets[k])):
            items = sorted(buckets[top])
            print(f"    {top}/  — {len(items)} missing")
            for p in items[:6]:
                srcs = sorted(missing[p])
                print(f"        {p}")
                print(f"            referenced by: {', '.join(srcs[:3])}"
                      + (f" +{len(srcs)-3} more" if len(srcs) > 3 else ""))
            if len(items) > 6:
                print(f"        … and {len(items) - 6} more")
            print()

    # Runtime fetch() targets — informational, never a build failure.
    runtime = check_runtime_fetches(staging)
    if runtime:
        print("  Runtime fetch() targets (JavaScript, not markup):")
        for target, src, ok in runtime:
            print(f"    {'ok     ' if ok else 'absent '} {target:<34} <- {src}")
        if any(not ok for _, _, ok in runtime):
            print("    'absent' is only a problem if the page has no fallback;")
            print("    products-order.json is optional by design.")
        print()

    # ---- Secret scan — fail closed ----------------------------------------
    print("=" * 74)
    print("SECRET SCAN")
    print("=" * 74)
    leaks = scan_for_secrets(staging)
    if leaks:
        print(f"  ABORTED — {len(leaks)} credential-like file(s) staged:\n")
        for p in leaks[:25]:
            print(f"    {p}")
        if len(leaks) > 25:
            print(f"    … and {len(leaks) - 25} more")
        print(
            "\n  These would be readable by anyone who opens the ZIP. On the"
            "\n  server they may sit behind .htaccess, but that protection does"
            "\n  not travel inside an archive."
            "\n"
            "\n  Add the directory to EXCLUDE_DIRS, or the file to"
            "\n  SECRET_ALLOWLIST if it genuinely holds no credential."
            "\n\n  No ZIP was written."
        )
        return 2
    print("  clean — nothing credential-like is staged\n")

    # ---- Package ----------------------------------------------------------
    if args.no_zip:
        print("=" * 74)
        print("PACKAGING SKIPPED (--no-zip)")
        print("=" * 74)
        print("  Source is patched. Build the archive with your own publish.sh.")
        out = None
    else:
        print("=" * 74)
        print("PACKAGING")
        print("=" * 74)
        out = args.out.expanduser().resolve()
        n, mb = make_zip(staging, out)
        print(f"  {n} files -> {out}  ({mb:.1f} MB)")

    # ---- Result -----------------------------------------------------------
    print("\n" + "=" * 74)
    if missing:
        print(f"{len(missing)} REFERENCE(S) STILL UNRESOLVED")
        print("=" * 74)
        noun = "Your archive" if args.no_zip else "The ZIP"
        print(f"{noun} will work, but those references will 404 until you add")
        print("the files to the Website folder and re-run this script.")
    else:
        print("BUILT CLEAN — every internal reference resolves")
        print("=" * 74)

    if out:
        print(f"\nUpload:  {out}")
    print("Next:    follow deploy/DEPLOY.md\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
