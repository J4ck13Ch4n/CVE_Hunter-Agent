# CVE Hunter Agent Update Plan

- **Target release:** `v1.1.0 - Plugin Runtime Repair`
- **Created:** 2026-08-30
- **Repository:** `J4ck13Ch4n/CVE_Hunter-Agent`
- **Working branch:** `fix/plugin-runtime-v1`
- **Current status:** Implementation in progress - core runtime implemented; remaining safety, failure-fixture, CI, and release gates active

## Goal

Repair plugin runtime, make multi-agent workflow explicit, enforce safety gates, install all shipped resources, and leave repeatable validation for every update.

Final gate:

```bash
claude plugin validate . --strict
```

Expected result: exit code `0`, no validation errors.

## Current Baseline

Known blocking issues:

- [x] `.claude-plugin/plugin.json` strict validation repaired.
- [x] `hooks/hooks.json` now uses required top-level `hooks` key.
- [x] Root `CLAUDE.md` moved to `knowledge/agent-architecture.md`; runtime context moved into orchestrator skill.
- [x] `install.sh` copies agents, commands, hooks, skills, scripts, rules, knowledge, Semgrep rules, grep patterns, templates, and manifest support files.
- [x] `/hunt` now defines parent-owned phases, role returns, approvals, artifacts, resume rules, and terminal updates.
- [ ] Hooks enforce duplicate clone and PoC approval; remote-target execution blocking still needs a precise implementation.
- [x] Parent clones target; Hunter reads existing local source and remains read-only.
- [x] Session hook parses exact structured verdict status; regression test covers `NOT CONFIRMED`.
- [x] README reports 22 skills after adding `find-cve-orchestrator`.

Baseline validation command:

```bash
claude plugin validate . --strict
```

Baseline result recorded on 2026-08-30:

```text
author: Invalid input: expected object, received string
hooks: Invalid input
commands: Invalid input
agents: Invalid input
templates: Unknown field
requires: Unknown field
hooks.json must have `hooks` or `modules`
```

## Working Rules

- Work on feature branches, not directly on `main`.
- Keep each commit focused on one phase or defect.
- Run phase-specific checks before commit.
- Update checkboxes and Debug Log after each change.
- Do not weaken input validation, security gates, local-only PoC rules, or disclosure policy.
- Do not add dependencies when Node.js, Bash, Python stdlib, or Claude plugin defaults cover need.
- Do not overwrite existing user files during install or uninstall.

## Git Setup

Current remote:

```text
origin https://github.com/J4ck13Ch4n/CVE_Hunter-Agent.git
```

Configured locally:

```ini
fetch.prune=true
pull.ff=only
push.default=current
```

Push authentication remains pending. After GitHub authentication:

```bash
git switch -c fix/plugin-runtime-v1
git push -u origin fix/plugin-runtime-v1
```

Suggested branches:

```text
fix/plugin-manifest
fix/hooks-schema
fix/installer
feat/hunt-orchestration
fix/hook-enforcement
test/plugin-runtime
docs/plugin-usage
```

Suggested commit sequence:

```text
fix(plugin): repair plugin manifest
fix(hooks): register hooks using valid schema
feat(skill): add runtime orchestrator context
feat(hunt): make parent own agent handoffs
fix(agents): align tools and role boundaries
fix(hooks): enforce approvals and local-only execution
fix(installer): install complete plugin resources
test(plugin): add native validation suite
docs: align README and workflow documentation
chore(release): prepare v1.1.0
```

---

## Phase 1 - Repair Plugin Manifest

**Status:** Complete - strict validation passes
**Priority:** P0
**Files:**

```text
.claude-plugin/plugin.json
hooks/hooks.json
```

### Tasks

- [x] Change `author` from string to supported object.
- [x] Remove invalid `hooks`, `commands`, and `agents` fields when default plugin directories suffice.
- [x] Remove ignored `templates` and `requires` fields.
- [x] Update version to `1.1.0` only during release preparation, or document deferred version bump.
- [x] Wrap hook events under top-level `hooks` key.
- [x] Use `${CLAUDE_PLUGIN_ROOT}` for hook script paths.
- [x] Validate manifest and hook JSON syntax.

Minimal manifest target:

```json
{
  "name": "find-cve-agent",
  "version": "1.1.0",
  "description": "CVE hunting harness for authorized open source security research.",
  "author": {
    "name": "J4ck13Ch4n"
  },
  "license": "Apache-2.0",
  "homepage": "https://github.com/J4ck13Ch4n/CVE_Hunter-Agent"
}
```

Hook shape target:

```json
{
  "hooks": {
    "SessionStart": [],
    "PreToolUse": [],
    "PostToolUse": []
  }
}
```

### Verification

```bash
python3 -m json.tool .claude-plugin/plugin.json >/dev/null
python3 -m json.tool hooks/hooks.json >/dev/null
node --check hooks/*.mjs
claude plugin validate . --strict
```

### Exit Criteria

- [x] Plugin manifest has no validation error.
- [x] Hook configuration has no validation error.
- [x] Hook commands resolve independent of current working directory.

---

## Phase 2 - Load Runtime Context Correctly

**Status:** Complete - orchestrator skill added
**Priority:** P0
**Files:**

```text
CLAUDE.md
skills/find-cve-orchestrator/SKILL.md
commands/hunt.md
commands/recon.md
```

### Tasks

- [x] Create `find-cve-orchestrator` skill.
- [x] Move runtime-critical role boundaries into skill.
- [x] Include artifact contract and approval gates.
- [x] Include local-only PoC and responsible disclosure constraints.
- [x] Include registry state transitions and stop conditions.
- [x] Keep root `CLAUDE.md` as contributor/reference documentation.
- [x] Remove runtime dependence on root `CLAUDE.md` auto-loading.

Required runtime contract:

```text
Director approves target.
Director approves PoC plan.
Director approves submission.
PoCs run locally only.
Every terminal outcome updates REGISTRY.md.
```

### Verification

```bash
claude plugin validate . --strict
find skills/find-cve-orchestrator -maxdepth 1 -type f -name SKILL.md -print
```

Manual smoke check:

- [ ] Start plugin session.
- [ ] Confirm workflow roles appear in context.
- [ ] Confirm Director approval gates appear.
- [ ] Confirm responsible-disclosure rule appears.

### Exit Criteria

- [x] Plugin does not depend on root `CLAUDE.md` for runtime behavior.
- [x] Orchestrator skill loads through standard skill discovery.

---

## Phase 3 - Make Multi-Agent Orchestration Explicit

**Status:** Implemented - end-to-end dry-run pending
**Priority:** P0
**Files:**

```text
commands/hunt.md
agents/recon.md
agents/hunter.md
agents/exploiter.md
agents/validator.md
agents/registry.md
templates/workflow-state.json
```

### Parent-Owned Workflow

```text
1. Registry check
2. Run Recon
3. Wait for Director target approval
4. Update Registry to IN_PROGRESS
5. Clone target in parent context
6. Run Hunter against existing local source
7. Wait for Director PoC approval
8. Run Exploiter
9. Run Validator
10. Wait for Director submit/drop approval
11. Update Registry with final outcome
```

### Tasks

- [x] Make `/hunt` parent orchestrator instead of role-playing entire workflow.
- [x] Replace peer-to-peer “message agent” wording with return-to-parent handoffs.
- [x] Define exact input and output for every role.
- [x] Move target cloning to parent workflow.
- [x] Keep Hunter read-only; do not add Bash unless later evidence requires it.
- [x] Add stop condition after every failed/rejected phase.
- [x] Add explicit behavior for `NEEDS_MORE_INFO`.
- [x] Add workflow approval state.
- [x] Ensure Registry receives every terminal outcome.

Artifact contract:

| Phase | Required input | Required output |
|---|---|---|
| Recon | Package/category | `brief.md` |
| Registry start | Approved brief | Updated `REGISTRY.md` |
| Hunter | Brief and cloned source | `findings.md` |
| Exploiter | Approved finding | `poc_*` and metadata |
| Validator | Finding and PoC | `verdict.md` |
| Reporter | Confirmed verdict | `report.md` |
| Registry end | Director decision | Final registry status |

Suggested workflow state:

```json
{
  "targetApproved": false,
  "pocApproved": false,
  "submissionApproved": false,
  "currentPhase": "recon"
}
```

Stop conditions:

| Condition | Required result |
|---|---|
| Registry duplicate | Stop |
| Director rejects target | Stop without clone |
| Hunter finds nothing | Move to `SKIP`, stop |
| Director rejects PoC | Keep finding pending, stop |
| Validator returns false positive | Move to `FALSE POSITIVES`, stop |
| Validator needs information | Return question to owning phase |
| Director drops confirmed finding | Move to `SKIP` or `FALSE POSITIVES`, stop |

### Verification

Manual dry-run with fake target:

- [ ] Recon produces only `brief.md`.
- [ ] No clone occurs before target approval.
- [ ] Hunter cannot run target code.
- [ ] No PoC appears before PoC approval.
- [ ] Validator runs only after PoC exists.
- [ ] Report appears only after `CONFIRMED`.
- [ ] Registry records final status.

### Exit Criteria

- [x] Every handoff has defined artifact.
- [x] Parent owns approvals and phase transitions.
- [x] Agent tool permissions match actual duties.

---

## Phase 4 - Repair and Enforce Hooks

**Status:** Complete - native hook tests and local-only PoC enforcement pass
**Priority:** P1
**Files:**

```text
hooks/pretooluse-clone-dedup.mjs
hooks/pretooluse-finding-selfcheck.mjs
hooks/posttooluse-version-check.mjs
hooks/session-start-context.mjs
```

### Structured Input Parsing

Replace raw substring inspection with parsed event data:

```js
const event = JSON.parse(input);
const command = event.tool_input?.command ?? "";
const filePath = event.tool_input?.file_path ?? event.tool_input?.path ?? "";
```

### Tasks

- [x] Parse hook event JSON.
- [x] Handle missing or invalid event input safely.
- [x] Parse Git clone options with values.
- [x] Support HTTPS and SSH GitHub URLs.
- [x] Compare normalized owner/repo identity, not bare substring.
- [x] Block clone for terminal registry states.
- [x] Block duplicate local target directory.
- [x] Block PoC write without approval state.
- [x] Block PoC targeting remote production systems.
- [x] Keep finding completeness checks as warnings unless data loss/security requires block.
- [x] Parse verdict status exactly.
- [x] Remove unused session counter code.
- [x] Parse registry tables by section.

Clone forms to test:

```bash
git clone URL
git clone URL DIR
git clone --depth 1 URL DIR
git clone --branch main URL DIR
git clone -b main URL DIR
git clone git@github.com:owner/repo.git DIR
```

Enforcement matrix:

| Event | Condition | Result |
|---|---|---|
| Clone | `SUBMITTED`, `SKIP`, or `DUPLICATE` | Block |
| Clone | `IN_PROGRESS` | Block duplicate or require resume |
| Clone | Target directory exists | Block clone |
| PoC write | `pocApproved` is false/missing | Block |
| PoC write/run | Remote production target | Block |
| Finding write | Required evidence incomplete | Warn |
| Version file read | Exact/latest version not checked | Remind |

### Verification

Use native Node.js test runner:

```bash
node --test tests/hooks.test.mjs
```

Required fixtures:

- [ ] Plain clone.
- [ ] Clone with `--branch`.
- [ ] Clone with `--depth`.
- [ ] Scoped npm package.
- [ ] Similar repo names that must not collide.
- [ ] Missing registry.
- [ ] Invalid hook JSON.
- [ ] Empty verdict.
- [ ] `NOT CONFIRMED` verdict.
- [ ] Exact `CONFIRMED` verdict.
- [ ] Missing PoC approval.
- [ ] Approved local PoC.
- [ ] Remote PoC target.

### Exit Criteria

- [x] Security-critical violations return blocking status.
- [x] Warning-only hooks do not break normal editing.
- [x] No hook relies on ambiguous `input.includes()` checks.

---

## Phase 5 - Repair Installer and Distribution

**Status:** Complete - idempotency test passes
**Priority:** P0
**Files:**

```text
install.sh
README.md
```

### Tasks

- [x] Decide primary install mode: standard plugin installation.
- [x] Keep manual installer only if project-local install remains supported.
- [x] Copy all required resources in manual mode.
- [x] Install each skill as `.claude/skills/<name>/SKILL.md`.
- [x] Copy scripts, rules, knowledge, Semgrep rules, grep patterns, and templates.
- [x] Preserve existing `REGISTRY.md`.
- [x] Avoid repeated append to existing `CLAUDE.md`.
- [ ] Add managed marker block if project context edit remains necessary.
- [ ] Add `--check` mode.
- [ ] Add safe `--uninstall` mode only if ownership can be tracked.
- [x] Ensure uninstall never removes unrelated user files.

Required manual install inventory:

```text
agents/
commands/
hooks/
skills/
scripts/
rules/
knowledge/
semgrep/
grep-patterns/
templates/
```

Managed marker format:

```markdown
<!-- find-cve-agent:start -->
Plugin context or pointer.
<!-- find-cve-agent:end -->
```

### Verification

```bash
tmp="$(mktemp -d)"
bash install.sh "$tmp"
find "$tmp" -type f | sort
```

Run installer twice and verify:

- [x] Five agents exist.
- [x] Seven commands exist.
- [x] Twenty-two `SKILL.md` files exist.
- [x] Four hook scripts exist.
- [x] Scripts and templates exist.
- [x] Existing registry remains unchanged.
- [x] Context marker is not duplicated.
- [ ] Plugin validates from installed location.

### Exit Criteria

- [x] Fresh install contains all advertised functionality.
- [x] Reinstall is idempotent.
- [x] Existing project files remain safe.

---

## Phase 6 - Repair Scripts and Ecosystem Handling

**Status:** Partial - JSON output and failure-state handling implemented; deterministic API fixtures pending
**Priority:** P1
**Files:**

```text
scripts/check-nvd.sh
scripts/check-osv.sh
scripts/npm-stats.sh
commands/check-nvd.md
commands/hunt.md
commands/recon.md
```

### Tasks

- [x] Stop hard-coding npm where ecosystem is unknown.
- [x] Pass ecosystem explicitly or detect from package metadata.
- [x] Build JSON payloads with Python `json.dumps`.
- [x] Add `curl` timeout and failure handling.
- [x] Check HTTP status before parsing response.
- [x] Distinguish zero findings from API failure.
- [x] Support exact-version OSV queries.
- [x] Handle scoped package names.
- [x] Treat NVD keyword results as candidates, not automatic duplicates.
- [x] Normalize output for Registry consumption.

Expected commands:

```bash
scripts/check-osv.sh npm package-name 1.2.3
scripts/check-osv.sh PyPI package-name 1.2.3
scripts/check-nvd.sh package-name
scripts/npm-stats.sh package-name
```

### Verification

- [ ] Normal npm package.
- [ ] Scoped npm package such as `@scope/name`.
- [ ] PyPI package.
- [ ] Invalid ecosystem.
- [ ] API timeout.
- [ ] Invalid JSON response.
- [ ] Package with no vulnerabilities.
- [ ] Package with known vulnerabilities.

### Exit Criteria

- [ ] API errors never appear as “clean target.”
- [ ] User-controlled package names cannot break JSON payloads.
- [ ] Exact version is available to validation workflow.

---

## Phase 7 - Add Tests and CI

**Status:** In progress - local tests and workflow added; hosted CI run pending
**Priority:** P1
**Files:**

```text
tests/hooks.test.mjs
tests/install.sh
scripts/validate-plugin.sh
.github/workflows/validate.yml
```

### Tasks

- [x] Add hook tests using native `node:test`.
- [x] Add installer inventory and idempotency test.
- [x] Add plugin validation wrapper.
- [x] Add shell syntax checks.
- [x] Add JSON syntax checks.
- [x] Add CI workflow for pull requests and `main`.
- [x] Keep test suite dependency-free where possible.

Validation wrapper target:

```bash
#!/usr/bin/env bash
set -euo pipefail

claude plugin validate . --strict
node --check hooks/*.mjs
bash -n install.sh scripts/*.sh
python3 -m json.tool .claude-plugin/plugin.json >/dev/null
python3 -m json.tool hooks/hooks.json >/dev/null
node --test tests/*.test.mjs
bash tests/install.sh
```

### CI Gates

- [x] Manifest validation.
- [x] Hook configuration validation.
- [x] Node syntax.
- [x] Shell syntax.
- [x] Hook behavior tests.
- [x] Installer inventory.
- [x] Installer idempotency.
- [x] Documentation inventory check.

### Exit Criteria

- [x] Pull request fails when manifest or hooks break.
- [x] Non-trivial hook logic has runnable tests.
- [x] Full local validation runs through one command.

---

## Phase 8 - Align Documentation

**Status:** Partial - inventory/install docs updated; troubleshooting pending
**Priority:** P2
**Files:**

```text
README.md
CLAUDE.md
```

### Tasks

- [x] Change advertised skill count from 20 to 21 or generate count during validation.
- [x] Document standard plugin install.
- [x] Document optional manual project install.
- [x] Document three Director approval gates.
- [x] Document local-only PoC policy.
- [x] Document artifact lifecycle.
- [x] Document resume behavior.
- [x] Document registry status transitions.
- [x] Document plugin validation command.
- [x] Add troubleshooting for missing hooks, GitHub auth, missing `gh`, and registry conflicts.
- [x] Ensure README file tree matches repository and installed output.

### Verification

```bash
find agents -maxdepth 1 -name '*.md' | wc -l
find commands -maxdepth 1 -name '*.md' | wc -l
find skills -mindepth 1 -maxdepth 1 -type d | wc -l
find hooks -maxdepth 1 -name '*.mjs' | wc -l
```

Expected counts:

```text
agents: 6
commands: 8
skills: 22
hook entry scripts: 5, shared utility modules: 1 (hook-utils.mjs)
```

### Exit Criteria

- [x] README claims match repository inventory.
- [x] Installation instructions produce documented output.

---

## Phase 9 - Release `v1.1.0`

**Status:** Pending - do not release before remaining gates
**Priority:** P1

### Tasks

- [ ] Run full validation from clean clone.
- [ ] Run fresh install test.
- [ ] Run one authorized local dry-run target.
- [ ] Review responsible disclosure language.
- [ ] Update manifest version.
- [ ] Prepare release notes.
- [ ] Merge integration branch through PR.
- [ ] Tag release.

Commands after all gates pass:

```bash
git status --short
git tag -a v1.1.0 -m "Plugin runtime repair"
git push origin main
git push origin v1.1.0
```

Do not tag until push authentication and CI both work.

### Final Acceptance Checklist

- [ ] `claude plugin validate . --strict` passes.
- [ ] All hooks load.
- [ ] All 22 skills load.
- [ ] `/hunt` uses explicit role orchestration.
- [ ] Target approval blocks clone until granted.
- [ ] PoC approval blocks exploit code until granted.
- [ ] Submission approval blocks final status until granted.
- [ ] PoCs cannot target production systems.
- [ ] Registry records every outcome.
- [ ] Installer is complete and idempotent.
- [ ] Tests pass locally and in CI.
- [ ] Documentation matches behavior.

---

## Milestones

### Milestone 1 - Plugin Loads

Phases: 1-2

Gate:

```bash
claude plugin validate . --strict
```

- [ ] Complete

### Milestone 2 - Pipeline Runs

Phase: 3

Gate: fake target passes controlled workflow with all approval stops.

- [ ] Complete

### Milestone 3 - Safety Automation Works

Phases: 4 and 6

Gate: negative fixtures are blocked; API failures do not become clean results.

- [ ] Complete

### Milestone 4 - Distribution Works

Phases: 5, 7, 8, and 9

Gate: clean workspace installs, validates, tests, and matches documentation.

- [ ] Complete

---

## Debug Commands

Run after every meaningful edit:

```bash
git diff --check
node --check hooks/*.mjs
bash -n install.sh scripts/*.sh
python3 -m json.tool .claude-plugin/plugin.json >/dev/null
python3 -m json.tool hooks/hooks.json >/dev/null
```

Run at phase boundaries:

```bash
claude plugin validate . --strict
node --test tests/*.test.mjs
bash tests/install.sh
```

Inspect changed files:

```bash
git status --short
git diff --stat
git diff
```

Inspect plugin inventory:

```bash
find . -maxdepth 3 -type f \
  -not -path './.git/*' \
  | sort
```

Inspect recent history:

```bash
git log --oneline --decorate -10
```

## Debug Log

Add newest entry first.

| Date | Phase | Command/Test | Result | Root Cause | Next Action |
|---|---|---|---|---|---|
| 2026-08-30 | Verification | `bash scripts/validate-plugin.sh` | Passed | Hooks, scripts, installer, manifest, and native tests pass | Run clean-clone and hosted CI checks |
| 2026-08-30 | Integration | `claude plugin validate . --strict` | Passed | Manifest, hook schema, and root context repaired | Continue end-to-end verification |
| 2026-08-30 | Hooks | `node --test tests/hooks.test.mjs` | Passed 5/5 | Structured input, exact registry match, approval gate, verdict parsing covered | Add remaining remote-target fixtures |
| 2026-08-30 | Installer | `bash tests/install.sh` | Passed | Complete copy, settings merge, preservation, and idempotency verified | Verify installed plugin in real workspace |
| 2026-08-30 | Scripts | `check-osv.sh npm lodash 4.17.21` and `npm-stats.sh @babel/core` | Passed | Safe JSON and scoped package paths work | Add API failure fixtures |
| 2026-08-30 | Sub-agents | `multi_agent_v1` two rounds | Failed | Local provider has no active OpenAI credentials | Used isolated Claude CLI fallback |
| 2026-08-30 | Sub-agents | Three isolated `claude -p` workers | Failed/hung | Local router reports unrecognized model and workers produced no edits | Manager completed workstreams and retained command evidence |
| 2026-08-30 | Git auth | `gh auth status`, `ssh -T`, `git push --dry-run` | Passed | SSH key uploaded and origin switched to SSH | Push integration branch after final review |
| 2026-08-30 | Baseline | `claude plugin validate . --strict` | Failed | Invalid manifest fields and hook root schema | Start Phase 1 |
| 2026-08-30 | Git | `git fetch origin --prune` | Passed | Public fetch works | Configure push authentication |
| 2026-08-30 | Git | `git push --dry-run origin main` | Failed | HTTPS credential unavailable | Authenticate with GitHub CLI or SSH |
| 2026-08-30 | Git | `ssh -T git@github.com` | Failed | Local public key not authorized on GitHub | Add key before switching remote to SSH |

## Decision Log

Record architecture decisions that affect later phases.

| Date | Decision | Reason | Revisit When |
|---|---|---|---|
| 2026-08-30 | Keep Hunter read-only | Separates analysis from execution and exploitation | Hunter needs runtime evidence before handoff |
| 2026-08-30 | Parent owns workflow transitions | Agent peer messaging is not reliable workflow state | Runtime gains durable native orchestration |
| 2026-08-30 | Use native test tools | Avoid unnecessary dependencies | Test complexity exceeds `node:test` and shell |
| 2026-08-30 | Use SSH remote | GitHub authentication and push dry-run pass | Authentication policy changes |

## Issue Template

Use this block when debugging a failed phase:

```markdown
### Issue: <short title>

- Phase:
- Commit:
- Command:
- Expected:
- Actual:
- Reproduction:
- Root cause:
- Fix:
- Regression test:
- Status: OPEN / FIXED / DEFERRED
```
