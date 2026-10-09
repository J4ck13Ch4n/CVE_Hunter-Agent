---
name: hunt
description: "Parent-owned CVE research pipeline with Registry, Recon (or Recon-WP), Hunter, Exploiter, Validator, and Director approval gates. Usage: /hunt <package>."
---

# /hunt <package>

Parent session owns workflow state, agent delegation, human approvals, cloning, and Registry updates. Execute phases in order. Never let a role agent assume direct communication with another role.

## Target Type Detection

Before Phase 1, determine whether `<package>` is a WordPress plugin or a generic package (npm/PyPI/RubyGems/Go/GitHub repo):

```bash
curl -s "https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&request[slug]=<package>" | python3 -m json.tool
```

- If this returns a valid plugin record (not an error), treat `<package>` as a **WordPress plugin target**: use the **Recon-WP** agent in Phase 2, source acquisition is `svn export`, and this run is scoped to the Patchstack bug bounty (install-bucket and Unauthenticated/Subscriber/Customer privilege rules apply throughout -- see [`knowledge/../plans/patchstack-wordpress-bounty-plan.md`](../plans/patchstack-wordpress-bounty-plan.md)).
- Otherwise, treat it as a **generic package target**: use the generic **Recon** agent in Phase 2, source acquisition is `git clone`, as before.

Record which path was taken in `workflow.json` as `targetType: "wordpress-plugin"` or `targetType: "generic"`.

## State

Create `targets/<repo>/workflow.json` with `currentPhase`, `targetType`, `targetApproved`, `pocApproved`, and `submissionApproved` fields as shown in the bundled workflow-state template. Record phase and boolean approvals only; never store credentials.

## Phase 1: Registry Check

1. Ask Registry for exact local status and known-advisory evidence.
2. For a WordPress-plugin target, also check Patchstack's public database for the slug in addition to REGISTRY.md -- a report already published there is a `DUPLICATE` even if REGISTRY.md has never seen it.
3. Stop for `SUBMITTED`, `SKIP`, or `DUPLICATE`.
4. For `IN_PROGRESS`, resume existing artifacts instead of cloning.
5. For `FALSE_POSITIVE`, show prior reason and require Director approval to reopen.
6. Continue only with `CLEAN` or explicitly reopened work.

## Phase 2: Recon and Target Approval

1. Run **Recon-WP** (WordPress-plugin target) or **Recon** (generic target), per the Target Type Detection step, and require `targets/<repo>/brief.md`.
2. Present package/plugin identity, attack surface, existing advisories, version, and top vectors. For a WordPress-plugin target, also present the active-install bucket (must be `5000` or `10000` for the Patchstack plan) and the lowest role that reaches a sink (must be Unauthenticated, Subscriber, or Customer -- reject the proposal outright if Recon-WP surfaces only Contributor+-gated findings).
3. Ask Director to approve target.
4. If rejected, set phase `target_rejected` and stop before clone.
5. If approved, set `targetApproved: true`, update Registry to `IN_PROGRESS`, then acquire source into `targets/<repo>/repo`:
   - Generic target: `git clone`.
   - WordPress-plugin target: `svn export https://plugins.svn.wordpress.org/<slug>/trunk targets/<repo>/repo` (or the attached unmodified premium archive if the plugin is not free/public).

Parent verifies exact checked-out version and latest release before invoking Hunter.

## Phase 3: Hunter Review

Run Hunter with brief and existing local source. Require `targets/<repo>/findings.md` containing either complete source-to-sink evidence or explicit clean vectors.

If no exploitable finding:

1. Move Registry entry from `IN_PROGRESS` to `SKIP`.
2. Set phase `complete_skip`.
3. Report checked vectors and stop.

## Phase 4: PoC Plan Approval

For each finding, parent presents:

```text
Finding: <claim>
Root cause: <file:line>
CWE: <id>
Local PoC plan: <setup, trigger, benign evidence, cleanup>
Chaining opportunity: <none or evidence-based chain>
Estimated CVSS: <vector and score>
Approve PoC?
```

If rejected, keep finding, set phase `poc_rejected`, and stop. Approval must be explicit; set `pocApproved: true` before any `poc_*` write.

## Phase 5: Exploiter

Run Exploiter only after PoC approval. Require a local-only `targets/<repo>/poc_<type>.*` with exact version, benign evidence, deterministic exit status, and cleanup. Parent then passes finding and PoC artifacts to Validator.

## Phase 6: Validator

Validator independently applies all six gates and writes `targets/<repo>/verdict.md`.

- `FALSE_POSITIVE`: move Registry entry accordingly, set phase `complete_false_positive`, report reason, stop.
- `NEEDS_MORE_INFO`: route exact questions back to Hunter or Exploiter, set phase `needs_more_info`, and do not report or submit.
- `CONFIRMED`: set phase `confirmed`, then continue.

For a WordPress-plugin target, Validator must additionally re-derive the CVSS v3.1 **base** vector with the official FIRST calculator and reject as `FALSE_POSITIVE` (reason: out of Patchstack scope) if any of: `AC:H`, base score ≤ 8.0, the PoC requires WP-CLI or server-side-only steps (no remote-attacker PoC), or the lowest reachable role is Contributor or higher.

## Phase 7: Report Draft and Submission Approval

1. Run `/report` to write `targets/<repo>/report.md` as a draft. For a WordPress-plugin target, the channel is always the Patchstack report form (`patchstack.com/database/report`), not the generic HackerOne/GHSA/SECURITY.md auto-detection -- populate component slug/link, affected version, prerequisite role, OWASP 2021 class, description, and step-by-step remote PoC per that form's fields, and attach the original unmodified archive if the plugin is premium.
2. Present channel, CVSS, evidence, and report path to Director.
3. Ask for separate submission approval.
4. If rejected, record Director drop reason as `SKIP` or `FALSE POSITIVES`, then stop.
5. If approved, set `submissionApproved: true` and phase `approved_for_submission`.
6. Do not mark `SUBMITTED` until Director confirms report was actually sent.

## Phase 8: Final Registry Update

After confirmed submission, move entry to `SUBMITTED` with channel, date, severity, and `awaiting triage`. Every terminal path must leave one Registry entry and a final workflow phase.

## Resume Rule

On resume, read `workflow.json`, Registry, and existing artifacts. Continue from first incomplete phase. Never repeat approved work or overwrite evidence without explaining why.
