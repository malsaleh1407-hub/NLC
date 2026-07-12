# NLC Website — Action Checklist

One list, in order. Do the next unchecked box. Nothing else matters until it's done.

---

## Phase 1 — On your Mac (only you can do these — the files are on your computer)

- [ ] **1. Rescue the scripts from `/tmp`** (they get deleted when the Mac restarts!)
      Copy these files into `Documents/Claude/Projects/Website/scripts/` (create the `scripts` folder):
  - [ ] `/tmp/build_products.py`
  - [ ] `/tmp/inject_prev_next.py`
  - [ ] `/tmp/product_order.txt`
  - [ ] `/tmp/inject_full.py`
  - [ ] `/tmp/add_legacy_catalog.py`
  - [ ] `/tmp/catalog_reorg.py`
  - [ ] `/tmp/spec_legacy.py`
- [ ] **2. Push the WHOLE Website folder to GitHub** — right now GitHub only has 31 of ~286+ files.
      Missing: `ar/`, `product/`, `images/`, `datasheets/`, `js/`, `admin/`, and the new `scripts/` folder.
      Easiest way: install [GitHub Desktop](https://desktop.github.com) → Add Existing Repository →
      point it at the Website folder → commit → push. Or start a Claude Code session on your Mac
      and say: *"push everything in this folder to github.com/malsaleh1407-hub/nlc"*.

## Phase 2 — Claude's jobs (just tell Claude "Phase 1 is done" and it does these)

- [ ] Create `/add-product` skill — one command runs the whole 6-step add-a-product process
- [ ] Create `/update-photo` skill — resize + save a product photo correctly (keeps transparency)
- [ ] Create `/check-links` skill — runs `check_links.py` and reports broken links
- [ ] Update `CLAUDE.md` so it points to `scripts/` instead of `/tmp`

## Phase 3 — Optional habits (no deadline, pick up whenever)

- [ ] Try one free mini-course at [skills.github.com](https://skills.github.com) (~30 min each)
- [ ] Use GitHub **Issues** as your idea inbox: idea → open issue → close tab → back to work
- [ ] Add a `quick-win` label for small tasks to grab on low-energy days

---

**Where you left off:** if you're reading this and can't remember the plan — do the first unchecked box in Phase 1. That's it.
