---
name: recon-wp
description: "Find WordPress plugin targets for the Patchstack bug bounty in a specific category, filtered to 5,000-10,000 active installs and Unauthenticated/Subscriber/Customer reachability. Usage: /recon-wp <category>. Examples: /recon-wp form-builders, /recon-wp booking, /recon-wp membership, /recon-wp woocommerce-extensions."
---

# /recon-wp <category>

Find promising WordPress.org plugin targets in a specific category for the Patchstack bug bounty, pre-filtered to this program's scope: **5,000-10,000 active installs**, and vulnerability classes reachable by **Unauthenticated, Subscriber, or Customer** roles only (never Contributor+).

Before running this for a new category, confirm against the current rules at
[patchstack.com/articles/bug-bounty-guidelines-rules](https://patchstack.com/articles/bug-bounty-guidelines-rules/) and
[patchstack.com/database/report](https://patchstack.com/database/report) -- terms change without notice.

## Process

### Step 1: Pull the WordPress.org Plugin Directory

```bash
# Browse popular plugins in bulk (paginate request[page] until results run dry
# or active_installs drops below 5000)
curl -s "https://api.wordpress.org/plugins/info/1.2/?action=query_plugins&request[browse]=popular&request[per_page]=250&request[page]=1&request[fields][]=active_installs&request[fields][]=tags&request[fields][]=last_updated&request[fields][]=version" \
  | python3 -m json.tool

# Or search by category keyword directly
curl -s "https://api.wordpress.org/plugins/info/1.2/?action=query_plugins&request[search]=$ARGUMENTS&request[per_page]=100" \
  | python3 -m json.tool
```

Filter the JSON response to `active_installs` in `{5000, 10000}` (WordPress.org buckets this field -- treat it as exact-match on those two bucket values, not a numeric range). Discard anything outside that bucket set immediately.

### Step 2: Filter Candidates

For each plugin left after Step 1, quickly evaluate:
1. `active_installs` is exactly `5000` or `10000`? (skip if outside this band)
2. `last_updated` within 3 years? (program requires latest version update not older than 3 years -- skip if stale)
3. Already in REGISTRY.md or already published in Patchstack's DB for the same bug class? (skip if yes -- check both)
4. Free/public plugin on SVN, or premium requiring a purchased archive? (prefer free/public first -- avoids the premium-archive attachment requirement)

### Step 3: Role-Reachability Triage (fetch SVN trunk, do not install on a live site)

```bash
# Pull the public source for static triage
svn export "https://plugins.svn.wordpress.org/<slug>/trunk" "targets/<slug>/repo" --force

# Signals for Unauthenticated-reachable entry points
grep -rn "wp_ajax_nopriv_" targets/<slug>/repo
grep -rn "register_rest_route" targets/<slug>/repo

# Signals for missing capability/nonce checks near state-changing handlers
grep -rn "add_action( *'wp_ajax_" targets/<slug>/repo
grep -rLn "current_user_can\|wp_verify_nonce\|check_ajax_referer" targets/<slug>/repo --include="*.php" | xargs grep -l "wp_ajax" 2>/dev/null

# High-value sink signals
grep -rn "\$wpdb->query\|\$wpdb->get_results\|\$wpdb->prepare" targets/<slug>/repo   # SQLi
grep -rn "unserialize(\|maybe_unserialize(" targets/<slug>/repo                      # PHP object injection
grep -rn "move_uploaded_file\|file_put_contents\|fopen(" targets/<slug>/repo         # arbitrary file upload
grep -rn "include(\|require(\|include_once(\|require_once(" targets/<slug>/repo | grep "\$"  # LFI/RFI
```

Discard a candidate at this step if every state-changing entry point is gated behind a role check of Contributor or higher -- that is out of scope for this plan even if the bug itself is otherwise solid.

### Step 4: Deep Evaluation (Top 5)

For the top 5 candidates, gather confirming detail:

```bash
# Confirm exact current version and changelog (must audit the latest published version)
curl -s "https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&request[slug]=<slug>" | python3 -m json.tool

# Check Patchstack's own DB for existing reports on this slug
curl -s "https://patchstack.com/database/search?term=<slug>"

# Check support forum activity (dead plugin signal, informational only -- still in-scope per 3-year rule)
curl -s "https://wordpress.org/support/plugin/<slug>/" -o /dev/null -w "%{http_code}\n"
```

### Step 5: Rank and Present

Present candidates to the Director ranked by promise:

```
RECON-WP RESULTS: <category>

#1. <plugin-slug>
    Active installs: <5000|10000> | Last updated: <date> | Version: <ver>
    Reachable without privilege escalation by: Unauthenticated / Subscriber / Customer
    Attack surface: <brief -- e.g. "unauthenticated AJAX handler writes arbitrary post meta">
    Suspected vuln class: <SQLi / arbitrary file upload / PHP object injection / priv-esc / IDOR / ...>
    Patchstack multiplier fit: <vuln-type multiplier x privilege multiplier, e.g. "x3 (file upload) * x2 (unauth)">
    Existing Patchstack/NVD reports: <count/none>
    Rating: HIGH / MEDIUM / LOW

#2. <plugin-slug>
    ...

#3. <plugin-slug>
    ...
```

### Step 6: Propose Top Pick

Recommend the best candidate to the Director:

```
Proposed target: <plugin-slug> (WordPress plugin, Patchstack bounty)
Active installs: <5000|10000>
Reachable by: <Unauthenticated|Subscriber|Customer>
Reason: <why this is the best candidate -- cite the specific missing check / sink found in Step 3>
Full brief: targets/<slug>/brief.md
Approve target?
```

Brief must record, in addition to the standard `brief.md` fields: plugin slug, exact version audited, active-install bucket (5000 or 10000), the lowest role that can reach the suspected sink, and the suspected OWASP 2021 class -- these map directly to the required fields on the Patchstack report form.

## Category Keywords (WordPress-specific)

| Category Argument | WordPress.org search terms | Why it's role-exposed |
|---|---|---|
| form-builders | contact form, form builder, lead form | Unauthenticated POST handlers by design |
| booking | booking, reservation, appointment, scheduling | Unauthenticated booking submission endpoints |
| membership | membership, subscription, restrict content | Subscriber-role dashboards, profile/file access |
| lms | lms, course, quiz, elearning | Subscriber/Student-role quiz/profile endpoints |
| woocommerce-extensions | woocommerce, checkout, cart, coupon | Customer-role checkout/account/order handling |
| multi-vendor | marketplace, vendor, multi-vendor | Vendor/Customer-role dashboards |
| file-upload | upload, file manager, media, import export | Arbitrary file upload (x3 vuln multiplier) |
| rest-api | rest api, ajax, api connector | `wp_ajax_nopriv_*` / `register_rest_route` surface |
| social-login | social login, oauth login, sso | Unauthenticated auth-flow endpoints |
| forums-comments | forum, comments, discussion, reviews | Unauthenticated/Subscriber comment submission |
| import-export | import, export, csv import, xml import | Deserialization / arbitrary file read-write |
| popup-optin | popup, optin, newsletter, subscribe | Unauthenticated AJAX submission endpoints |

## Out-of-Scope Reminders (do not propose if any apply)

- Active installs outside the `5000`/`10000` bucket set (unless CVSS looks like it will clear 8.5+, per program rule for <1,000 installs -- still prefer staying in-band for this plan).
- Bug only reachable by Editor/Author/Admin/Shop Manager/SuperAdmin, or requiring Contributor+ (Contributor is mVDP-only, no XP -- do not propose it for this plan).
- Already published in Patchstack's DB, or a duplicate of an open report.
- Plugin requires a premium archive you don't have in hand (flag it, don't block recon, but prioritize free/public plugins first).
- Vulnerability class on the program's exclusion list (CSRF without an accepted write action, open redirect, CSV injection, CAPTCHA bypass unless CAPTCHA is the plugin's main function, rate-limiting gaps, low-impact enumeration, full path disclosure, 2FA bypass).
