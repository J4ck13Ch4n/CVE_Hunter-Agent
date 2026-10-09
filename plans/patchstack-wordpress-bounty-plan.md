# Patchstack WordPress Plugin Bounty — Hunting Plan

**Scope filter for this plan:** WordPress plugins, 5,000–10,000 active installs, CVSS v3.1 base score > 8.0, exploitable by **Unauthenticated**, **Subscriber**, or **Customer** roles only (no Contributor+ prerequisite).

Sources read 2026-10-09: [Bug Bounty Guidelines & Rules](https://patchstack.com/articles/bug-bounty-guidelines-rules/), [Report page](https://patchstack.com/database/report). Program terms "may change without notice" per the page itself (an update was noted effective Oct 1, 2026) — re-check both pages before submitting anything.

---

## 1. Program facts that constrain this plan

| Rule | Detail |
|---|---|
| Install floor | <1,000 installs out of scope unless CVSS ≥ 8.5; <100 always out of scope. Our 5K–10K band clears this with room to spare. |
| Privilege ceiling | Editor/Author/Admin/Shop Manager/SuperAdmin = **not accepted**. Contributor is mVDP-only (no XP). We only want **Unauthenticated / Subscriber / Customer** — matches the plan's goal exactly. |
| CVSS | v3.1 **base** score only, computed with the official FIRST calculator. `AC:H` findings are rejected outright. One-Low-impact-CIA unauthenticated findings are rejected. We're targeting >8.0, which is comfortably High/Critical and avoids most of these traps if the vector is honest. |
| Vulnerability types accepted | SQLi, RCE/arbitrary code exec, arbitrary file upload/delete/download (full path+ext control), PHP object injection, privilege escalation to Contributor+, broken access control exposing sensitive objects, IDOR (significant impact), CSRF→accepted write action, LFI/RFI (full path+ext control), site-wide/reflected XSS. |
| Reward shape | XP = CVSS base × install multiplier × privilege multiplier × vuln-type multiplier, penalties for `UI:R`/`AC:H`(mVDP)/unchained POI. At 5K–10K installs the install multiplier is 0.75–1.0; Unauthenticated gets ×2, Subscriber/Customer ×1. Highest-value bug classes: RCE/arbitrary-file-upload/admin-priv-esc (×3), then SQLi/deserialization (×2). |
| Zeroday track (separate $ pool) | Needs full site compromise incl. working backdoor, default config, zero user interaction, never-before-reported. Higher bar than the monthly-XP track — treat as a stretch goal, not the primary target. |
| Submission | English, latest plugin version only, correct slug/version, **remote-attacker PoC** (HTTP requests/screenshots/video) — WP-CLI-only or server-side-only PoCs are rejected. Premium plugins need the original unmodified archive attached. |
| Hard bans | AI-generated "incorrect assumptions," untested-against-the-actual-plugin reports, or clearly out-of-scope submissions → **1-week ban**. This makes sloppy/speculative submissions actively costly, not just low-value — every candidate must be verified end-to-end before submission. |

## 2. Target-selection funnel (5K–10K installs)

Goal: generate a short list of plugins that are *likely* to contain a high-severity, low-privilege-reachable bug, before spending PoC time.

1. **Source the install-count band.** WordPress.org's plugin API (`https://api.wordpress.org/plugins/info/1.2/?action=query_plugins&request[browse]=popular&request[per_page]=...`) returns `active_installs` as a bucketed value (e.g. `5000`, `10000`). Pull the full plugin list (or a category slice — e.g. "forms", "ecommerce", "membership", "booking", "multi-vendor") and filter to `active_installs` in `{5000, 10000}` (WordPress.org buckets installs, so this is effectively an exact-match filter, not a range query).
2. **Prioritize plugin categories by role-exposed surface area**, since we need Unauth/Subscriber/Customer reachability, not admin-only bugs:
   - Front-end form builders, contact forms, booking/reservation plugins (unauthenticated POST handlers)
   - Membership / subscription / LMS plugins (Subscriber-role dashboards, profile editing, file access)
   - WooCommerce extensions (Customer role: checkout, account pages, order/coupon handling)
   - REST API / AJAX-heavy plugins (`wp_ajax_nopriv_*` hooks are a strong unauthenticated signal)
   - File upload / media / import-export plugins (arbitrary file upload is ×3 multiplier)
   - Plugins wrapping deserialization (`unserialize()`, `maybe_unserialize()` on user input) for PHP object injection
3. **Cheap pre-filters before cloning anything:**
   - Skip if already in Patchstack's DB with an open/duplicate report for the same class (check `patchstack.com/database` search).
   - Skip if last updated >3 years ago combined with abandoned support forum (still technically in-scope per the "3 years" rule, but dead plugins are lower priority unless the bug is trivial to confirm).
   - Prefer plugins where the free/public version on WordPress.org SVN is sufficient to audit (avoids the premium-archive requirement entirely).
4. **Static triage signals to grep for** once source is pulled (SVN checkout, not a live site):
   - `register_rest_route` / `add_action('wp_ajax_nopriv_...')` → unauthenticated entry points
   - Capability checks: look for **missing** `current_user_can()` / nonce checks on state-changing AJAX/REST handlers
   - Raw SQL: `$wpdb->query(`, string-concatenated `$wpdb->prepare()` misuse
   - `unserialize(`, `maybe_unserialize(` on `$_POST`/`$_GET`/meta values
   - File handling: `move_uploaded_file`, `file_put_contents`, `fopen` with attacker-influenced path/extension
   - `include`/`require` with variable paths (LFI/RFI)

This matches and should reuse this repo's existing [`/recon`](../commands/recon.md) command — adapt Step 1 from npm/GitHub search to the WordPress.org plugin API + SVN checkout, and adapt the ranking criteria in Step 4 to install-count band + role-reachability instead of GitHub stars.

## 3. Deep-dive workflow (per candidate)

Reuse this repo's existing pipeline ([`/hunt`](../commands/hunt.md)) with these WordPress-specific adjustments:

1. **Registry check** — before auditing, confirm the plugin/slug isn't already `SUBMITTED`/`DUPLICATE` in our own tracking ([`agents/registry.md`](../agents/registry.md)) and isn't already published in Patchstack's public DB for the same bug class.
2. **Recon → target approval** — brief must record: plugin slug, exact version audited (must be the *current* published version), active-install count (must read 5,000–10,000 to qualify for this plan), and the specific role(s) that can reach the suspected sink (Unauthenticated/Subscriber/Customer only — reject anything that needs Contributor+).
3. **Hunter review** — full source-to-sink trace, every finding must name file:line and the exact capability/nonce check that's missing or bypassable. No "likely vulnerable" claims without a traced sink.
4. **PoC plan approval** — PoC **must** be reproducible as a remote HTTP interaction (curl/Burp/browser), never WP-CLI-only or server-only, since Patchstack explicitly rejects those. Plan the PoC against a **local WordPress install you control** (local-by-flywheel/wp-env/Docker + the plugin's public archive) — never against a third party's live production site.
5. **Exploiter** — build the PoC locally, capture benign evidence (e.g., a harmless file write, a read of a non-sensitive marker, a controlled privilege check bypass) and a deterministic exit status, then clean up.
6. **Validator** — independently re-derive the CVSS v3.1 **base** vector and score. Hard gate: reject anything that resolves to `AC:H`, or to an unauthenticated finding with only one Low-impact CIA component, or below 8.0 base — these are automatically out of scope or outside this plan's target band.
7. **Report** — adapt [`/report`](../commands/report.md)'s channel-detection step: for this plan the channel is always the Patchstack report form, not HackerOne/GHSA auto-detection. Draft must include: component slug + link, affected version, prerequisite role, OWASP 2021 class, description (≤10,000 chars), step-by-step remote PoC (≤50,000 chars, HTTP requests/screenshots/video), CVSS v3.1 vector string, and (for premium plugins) the unmodified archive as an attachment.

## 4. CVSS targeting cheat-sheet (to hit >8.0 with low privilege)

To clear **base score > 8.0** at `PR:N` (unauthenticated) or `PR:L` (Subscriber/Customer), you generally need `AC:L` plus high impact on at least two of C/I/A, or a single High + broad scope change (`S:C`). Concretely:

- **Unauthenticated SQLi** (`AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N` → ~9.1) — strong fit, ×2 vuln multiplier, ×2 priv multiplier.
- **Unauthenticated arbitrary file upload → RCE** (`AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H` → 10.0 or close) — best fit, ×3 vuln multiplier, ×2 priv multiplier. Highest priority class to hunt for.
- **Subscriber-triggered PHP object injection with a POP chain to RCE** — must have a working POP chain (unchained POI gets a 0.5 penalty) — still clears >8.0 if it lands on `C:H/I:H`.
- **Subscriber/Customer privilege escalation to Admin** (e.g., unprotected `update_user_meta`/`wp_update_user` role field) — ×3 vuln multiplier for "privilege escalation to admin", and `S:C/PR:L` commonly scores 8.8.
- Avoid chasing CSRF (×0.25 multiplier, and base score caps lower without a serious write action) and race conditions (×0.2) for this >8.0/high-multiplier plan — low ROI even when in scope.

## 5. Compliance / authorization boundaries (hard rules for this plan)

- **Only test against a local WordPress instance you control**, built from the plugin's own publicly distributed archive (WordPress.org SVN, vendor site, or — for premium plugins — the original unmodified purchased/trial archive). Never run exploitation steps against a live third-party site, even one that happens to run the vulnerable version — that would be unauthorized access to a system you don't own and is out of scope for what this plan can execute, regardless of bounty eligibility.
- Every PoC step and the written report must come from observing your own local test environment, not from a production target.
- Do not publish, share, or sell the finding to anyone before Patchstack's official disclosure (permanent-ban clause) — keep it inside this repo's `targets/<slug>/` working directory until Director approves submission.
- Don't submit speculative or AI-asserted findings — the program explicitly treats untested/incorrect-assumption reports as a bannable offense, so the Validator gate in this repo's workflow must not be skipped.

## 6. Immediate next actions

1. Pull WordPress.org's plugin directory, filter to `active_installs ∈ {5000, 10000}`, bucket by the high-value categories in §2.2.
2. Run `/recon` (adapted per §2) against 2–3 categories to produce a ranked candidate list.
3. Set up one local WP test harness (Docker/wp-env) reused across all candidates.
4. Run `/hunt <slug>` on the top candidate; do not advance past Validator's CVSS gate if it can't clear `AC:L` and base >8.0 at PR:N/PR:L.
5. On CONFIRMED, draft via `/report` using the Patchstack form fields in §3 step 7, then route through this repo's human-approval gates before actual submission to Patchstack.
