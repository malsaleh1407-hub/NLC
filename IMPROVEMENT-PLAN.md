# NLC Work Improvement Plan

Prepared 2026-07-11 from a direct audit of this repository, `CLAUDE.md`, `STYLE-GUIDE.md`, `SERVER-AUTH.md`, `PROMPTS-ALL.md`, and the QA scripts. Everything below is grounded in what the repo actually shows, not generic advice.

**Companion tool:** open `workboard.html` in your browser. It is a self-contained NLC-branded task board that ships with this plan pre-loaded, tracks your KPIs, and works offline. See section 7.

---

## 1. Findings: where the time is actually going

| # | Finding | Evidence | Cost to you |
|---|---------|----------|-------------|
| F1 | **The GitHub repo is a stale partial snapshot.** 31 files, one commit ("Add files via upload"). The real site (286 pages, `ar/`, `product/`, `images/`, `datasheets/`, `js/dl-gate.js`) exists only on your Mac. | `git log`, missing directories | One disk failure or lost laptop erases months of work. No history, no rollback, no diff. |
| F2 | **Your entire product toolchain lives in `/tmp` on your Mac.** `build_products.py`, `inject_prev_next.py`, `product_order.txt` and 4 more scripts. macOS wipes `/tmp` periodically and on some reboots. | `CLAUDE.md` "Key Scripts (in /tmp)" | Losing these means rebuilding the generator for 142 products from memory. This is the single largest delay risk you have. |
| F3 | **Every content change is done twice, by hand.** EN page + AR mirror, catalog card in 2 files, 6 manual steps per new product. | `CLAUDE.md` "Adding a New Product" | Adding one product touches 6+ files across 4 locations. Linear time, high error rate. |
| F4 | **Breakage is fixed reactively, not prevented.** `fix_all.py`, `fix_ar_paths.py`, `fix_remaining.py` at repo root are one-off repair scripts for path bugs that already shipped. | repo root | Each "fix_" script represents a debugging session that a pre-commit check would have prevented. |
| F5 | **Real passwords are committed to the repo.** `SERVER-AUTH.md` line 21 contains the live admin password; `CLAUDE.md` contains the admin panel password. | both files | Anyone with repo access owns your admin panel. If this repo ever goes public, it is immediate compromise. |
| F6 | **Deploys are manual uploads.** The repo itself arrived via drag-and-drop upload; there is no deploy pipeline. | commit message | Every release costs upload time plus "did I upload everything" anxiety. Partial uploads cause the path bugs in F4. |
| F7 | **A very large AI content pipeline runs on copy-paste.** `PROMPTS-ALL.md` consolidates 8 prompt sections including 30 academy episodes x 8 stills + 8 motion clips, pasted manually into Gemini/Higgsfield. | `PROMPTS-ALL.md` | Hundreds of manual generate-download-rename-place cycles. |
| F8 | **QA exists but is not wired to anything.** `check_links.py` and `test_site.py` are good and portable, but only run when you remember. | both scripts | Broken links reach production, then trigger F4-style repair sessions. |

## 2. The three delay killers, in priority order

1. **Unprotected work (F1, F2).** You are one bad day away from the largest delay of the project's life. Fix costs about 1 hour.
2. **Doing multiplied work by hand (F3, F7).** The 6-step product flow and the EN/AR mirror are scriptable. Fix converts a 45-minute task into a 5-minute one.
3. **React-and-repair loop (F4, F6, F8).** Prevention (CI + automated deploy) removes whole categories of future work.

---

## 3. P0. Protect the work (do this week, ~2 hours total)

### 3.1 Rescue the /tmp toolchain (15 minutes, do it first)
On your Mac, right now:
```bash
cd /Users/mohammedalsaleh/Documents/Claude/Projects/Website
mkdir -p tools
cp /tmp/build_products.py /tmp/inject_prev_next.py /tmp/product_order.txt \
   /tmp/add_legacy_catalog.py /tmp/catalog_reorg.py /tmp/inject_full.py \
   /tmp/spec_legacy.py tools/ 2>/dev/null
ls tools/
```
Then update the paths inside the scripts (`/tmp/` becomes `tools/`) and update `CLAUDE.md`. A `tools/README.md` with these exact steps is included in this branch. If any file is already gone from `/tmp`, tell Claude in your next session; the generator can be rebuilt from `CLAUDE.md`'s spec plus one existing product page as a template.

### 3.2 Put the whole site under git (30 minutes)
```bash
cd /Users/mohammedalsaleh/Documents/Claude/Projects/Website
git init   # if not already a repo
git remote add origin https://github.com/malsaleh1407-hub/nlc.git   # if not set
git add -A
git commit -m "Full site snapshot: 286 pages, images, datasheets, tools"
git push -u origin main
```
Notes:
- If `images/` + `datasheets/` push slowly, that is fine for now. If GitHub rejects files over 100 MB, install Git LFS (`brew install git-lfs`) for the PDFs. Do not skip the images to save time; they are part of the work being protected.
- From now on the rule is: **work is not done until it is pushed.** One `git add -A && git commit && git push` at the end of every work block.

### 3.3 Remove and rotate the committed passwords (20 minutes)
1. Change the admin password on the server and in the base44 portal (both leaked values).
2. Delete the plaintext passwords from `SERVER-AUTH.md` and `CLAUDE.md` (keep the instructions, replace the secret with `<your-password>`).
3. Implement `SERVER-AUTH.md` Option C (Cloudflare Access) when you get a chance. It is the option in your own doc marked easiest and most secure, and it removes the password entirely.

---

## 4. P1. Automate the multiplied work (week 2)

### 4.1 One-command product add
Once `tools/` is in the repo, have Claude wrap the 6 manual steps into a single script:
```bash
python tools/add_product.py --config new-product.json
```
doing: image resize (RGBA preserved), datasheet placement, `build_product()` for EN + AR, both catalog cards, `product_order.txt` insertion, prev/next re-injection, then `test_site.py`. The repo skill `.claude/skills/add-product` (included in this branch) already encodes the full procedure, so any Claude session can build or run this reliably.

### 4.2 QA on every push
`.github/workflows/site-qa.yml` (included in this branch) runs `test_site.py` on every push and publishes a broken-link report. It is report-only until the full site is in the repo; flip `STRICT: "1"` after 3.2 and it will fail the build on any broken internal link. That deletes the F4 repair loop.

### 4.3 Automated deploy
Pick one, in order of preference for your setup:
1. **Cloudflare Pages or Netlify connected to the GitHub repo.** Push = deploy, free, with preview URLs. Pairs perfectly with Cloudflare Access for `/admin.html`.
2. If you must stay on current hosting: a `tools/deploy.sh` doing `rsync` over SSH, so a deploy is one command instead of an FTP session.

Result: change goes live in about 1 minute after push, complete and atomic. No more partial uploads.

---

## 5. P2. The work system (ongoing)

Rules, not tools. These target delay directly:

1. **Batch by mode, do not alternate.** Code/pages, content/images, and admin/email are different mental modes. Group same-type tasks into one block (all 8 stills for an episode in one sitting, all catalog edits in one sitting). Context switching is where afternoons disappear.
2. **WIP limit: 3.** No more than 3 tasks in "In Progress" on the workboard. Finish or push back to Today before pulling new work.
3. **Definition of done:** EN done + AR mirrored + links pass `test_site.py` + committed + pushed. A task that misses any of these stays "In Progress". This single rule prevents the half-mirrored-AR class of bugs.
4. **Deploy on a cadence, not on impulse.** One consolidated deploy per work day (end of Thursday block at minimum). Every deploy preceded by the QA run.
5. **Touch email/admin approvals twice a day** (start and end of day), not on every notification. The dl-gate approval flow is mailto-based and takes seconds when batched.

### Weekly rhythm (Saudi work week, Sun-Thu)

| Block | Sun | Mon | Tue | Wed | Thu |
|-------|-----|-----|-----|-----|-----|
| 09:00-09:30 | Plan week on workboard | Admin + approvals | Admin + approvals | Admin + approvals | Admin + approvals |
| 09:30-12:30 | Deep build 1 (site/pages) | Deep build (site/pages) | Content batch (images/prompts) | Deep build (site/pages) | Finish + QA sweep |
| 12:30-14:00 | Break | Break | Break | Break | Break |
| 14:00-16:30 | Deep build 2 | Content batch | Deep build | Content batch | Deploy + verify live |
| 16:30-17:00 | Push + log done | Push + log done | Push + log done | Push + log done | Week review, plan next |

The point is not the exact hours. The point is: mornings for deep work, admin only in fixed slots, Thursday afternoon is always integrate-QA-deploy-review, and every day ends with a push.

---

## 6. P3. Multipliers (as capacity allows)

1. **Repo Claude skills (included in this branch).** `.claude/skills/` now contains `add-product`, `new-page`, and `site-qa`. Any future Claude Code session on this repo auto-loads them and executes your procedures exactly, without you re-explaining. Marketplace check: your account already has the `productivity` and `product-management` plugins plus `web-artifacts-builder` and `theme-factory` enabled; nothing else worth installing was found.
2. **Image budget guard.** Add a check to CI: fail if any shipped image exceeds 500 KB (your own STYLE-GUIDE rule). One `find` command in the workflow.
3. **Batch the image pipeline.** `PROMPTS-ALL.md` notes the CLI generator (`~/.claude/skills/banana/scripts/generate.py`). Drive it from the consolidated file in batches per section instead of pasting prompts one by one; have Claude write the loop once.
4. **base44 automation.** The approval email is currently manual mailto. base44 supports automations; an auto-email on `PortalUser.status = approved` removes that touchpoint entirely.

---

## 7. Measure it: KPIs on the workboard

`workboard.html` tracks these automatically from your task activity:

| KPI | Target | Why |
|-----|--------|-----|
| Tasks completed per week | trend up | Output |
| Overdue tasks | 0 | Delay, visible daily |
| In Progress count | 3 or fewer | Focus |
| Days with a push (log manually as a task) | 5/5 | Work protection |
| Broken links at deploy | 0 (CI enforces) | Quality |

Weekly review (Thursday 16:30): look at the 7-day chart, clear or reschedule overdue items, plan Sunday.

---

## 8. What this branch adds

| File | Purpose |
|------|---------|
| `IMPROVEMENT-PLAN.md` | This plan |
| `workboard.html` | Self-contained web task board + KPI dashboard, NLC-branded, offline, localStorage, pre-seeded with the P0/P1 roadmap |
| `tools/README.md` | Exact rescue steps for the /tmp toolchain |
| `.claude/skills/add-product/SKILL.md` | Full add-a-product procedure as an auto-loading Claude skill |
| `.claude/skills/new-page/SKILL.md` | New EN+AR page procedure per STYLE-GUIDE |
| `.claude/skills/site-qa/SKILL.md` | QA sweep procedure (links, images, parity) |
| `.github/workflows/site-qa.yml` | Broken-link CI on every push (report-only until full site is pushed) |

**Order of operations for you:** 3.1 today (15 minutes, highest risk), then 3.2, then 3.3, then open `workboard.html` and work the seeded tasks. Everything in P1 can be delegated to Claude sessions once P0 is done.
