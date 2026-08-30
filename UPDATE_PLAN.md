# CVE Hunter Agent Update Plan

- **Target release:** `v1.1.0 - Plugin Runtime Repair`
- **Created:** 2026-08-30
- **Repository:** `J4ck13Ch4n/CVE_Hunter-Agent`
- **Working branch:** `fix/plugin-runtime-v1`
- **Current status:** Planning

## Goal

Repair plugin runtime, make multi-agent workflow explicit, enforce safety gates, install all shipped resources, and leave repeatable validation for every update.

Final gate:

```bash
claude plugin validate . --strict
```

Expected result: exit code `0`, no validation errors.

## Current Baseline

Known blocking issues:

- [ ] `.claude-plugin/plugin.json` fails strict validation.
- [ ] `hooks/hooks.json` lacks required top-level `hooks` key.
- [ ] Root `CLAUDE.md` is not loaded as plugin context.
- [ ] `install.sh` omits skills, scripts, rules, knowledge, Semgrep rules, grep patterns, and most templates.
- [ ] `/hunt` describes role handoffs but does not explicitly orchestrate subagents.
- [ ] Hooks print reminders but do not enforce approval or local-only rules.
- [ ] Hunter role requires clone behavior but has no Bash tool.
- [ ] Session hook can classify `NOT CONFIRMED` as `CONFIRMED`.
- [ ] README says 20 skills; repository contains 21 skill directories.

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

**Status:** Pending  
**Priority:** P0  
**Files:**

```text
.claude-plugin/plugin.json
hooks/hooks.json
```

### Tasks

- [ ] Change `author` from string to supported object.
- [ ] Remove invalid `hooks`, `commands`, and `agents` fields when default plugin directories suffice.
- [ ] Remove ignored `templates` and `requires` fields.
- [ ] Update version to `1.1.0` only during release preparation, or document deferred version bump.
- [ ] Wrap hook events under top-level `hooks` key.
- [ ] Use `${CLAUDE_PLUGIN_ROOT}` for hook script paths.
- [ ] Validate manifest and hook JSON syntax.

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

- [ ] Plugin manifest has no validation error.
- [ ] Hook configuration has no validation error.
- [ ] Hook commands resolve independent of current working directory.

---

## Phase 2 - Load Runtime Context Correctly

**Status:** Pending  
**Priority:** P0  
**Files:**

```text
CLAUDE.md
skills/find-cve-orchestrator/SKILL.md
commands/hunt.md
commands/recon.md
```

### Tasks

- [ ] Create `find-cve-orchestrator` skill.
- [ ] Move runtime-critical role boundaries into skill.
- [ ] Include artifact contract and approval gates.
- [ ] Include local-only PoC and responsible disclosure constraints.
- [ ] Include registry state transitions and stop conditions.
- [ ] Keep root `CLAUDE.md` as contributor/reference documentation.
- [ ] Remove runtime dependence on root `CLAUDE.md` auto-loading.

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

- [ ] Plugin does not depend on root `CLAUDE.md` for runtime behavior.
- [ ] Orchestrator skill loads through standard skill discovery.

---

## Phase 3 - Make Multi-Agent Orchestration Explicit

**Status:** Pending  
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

- [ ] Make `/hunt` parent orchestrator instead of role-playing entire workflow.
- [ ] Replace peer-to-peer “message agent” wording with return-to-parent handoffs.
- [ ] Define exact input and output for every role.
- [ ] Move target cloning to parent workflow.
- [ ] Keep Hunter read-only; do not add Bash unless later evidence requires it.
- [ ] Add stop condition after every failed/rejected phase.
- [ ] Add explicit behavior for `NEEDS_MORE_INFO`.
- [ ] Add workflow approval state.
- [ ] Ensure Registry receives every terminal outcome.

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

- [ ] Every handoff has defined artifact.
- [ ] Parent owns approvals and phase transitions.
- [ ] Agent tool permissions match actual duties.

---

## Phase 4 - Repair and Enforce Hooks

**Status:** Pending  
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

- [ ] Parse hook event JSON.
- [ ] Handle missing or invalid event input safely.
- [ ] Parse Git clone options with values.
- [ ] Support HTTPS and SSH GitHub URLs.
- [ ] Compare normalized owner/repo identity, not bare substring.
- [ ] Block clone for terminal registry states.
- [ ] Block duplicate local target directory.
- [ ] Block PoC write without approval state.
- [ ] Block PoC targeting remote production systems.
- [ ] Keep finding completeness checks as warnings unless data loss/security requires block.
- [ ] Parse verdict status exactly.
- [ ] Remove unused session counter code.
- [ ] Parse registry tables by section.

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

- [ ] Security-critical violations return blocking status.
- [ ] Warning-only hooks do not break normal editing.
- [ ] No hook relies on ambiguous `input.includes()` checks.

---

## Phase 5 - Repair Installer and Distribution

**Status:** Pending  
**Priority:** P0  
**Files:**

```text
install.sh
README.md
```

### Tasks

- [ ] Decide primary install mode: standard plugin installation.
- [ ] Keep manual installer only if project-local install remains supported.
- [ ] Copy all required resources in manual mode.
- [ ] Install each skill as `.claude/skills/<name>/SKILL.md`.
- [ ] Copy scripts, rules, knowledge, Semgrep rules, grep patterns, and templates.
- [ ] Preserve existing `REGISTRY.md`.
- [ ] Avoid repeated append to existing `CLAUDE.md`.
- [ ] Add managed marker block if project context edit remains necessary.
- [ ] Add `--check` mode.
- [ ] Add safe `--uninstall` mode only if ownership can be tracked.
- [ ] Ensure uninstall never removes unrelated user files.

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

- [ ] Five agents exist.
- [ ] Seven commands exist.
- [ ] Twenty-one `SKILL.md` files exist.
- [ ] Four hook scripts exist.
- [ ] Scripts and templates exist.
- [ ] Existing registry remains unchanged.
- [ ] Context marker is not duplicated.
- [ ] Plugin validates from installed location.

### Exit Criteria

- [ ] Fresh install contains all advertised functionality.
- [ ] Reinstall is idempotent.
- [ ] Existing project files remain safe.

---

## Phase 6 - Repair Scripts and Ecosystem Handling

**Status:** Pending  
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

- [ ] Stop hard-coding npm where ecosystem is unknown.
- [ ] Pass ecosystem explicitly or detect from package metadata.
- [ ] Build JSON payloads with Python `json.dumps`.
- [ ] Add `curl` timeout and failure handling.
- [ ] Check HTTP status before parsing response.
- [ ] Distinguish zero findings from API failure.
- [ ] Support exact-version OSV queries.
- [ ] Handle scoped package names.
- [ ] Treat NVD keyword results as candidates, not automatic duplicates.
- [ ] Normalize output for Registry consumption.

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

**Status:** Pending  
**Priority:** P1  
**Files:**

```text
tests/hooks.test.mjs
tests/install.sh
scripts/validate-plugin.sh
.github/workflows/validate.yml
```

### Tasks

- [ ] Add hook tests using native `node:test`.
- [ ] Add installer inventory and idempotency test.
- [ ] Add plugin validation wrapper.
- [ ] Add shell syntax checks.
- [ ] Add JSON syntax checks.
- [ ] Add CI workflow for pull requests and `main`.
- [ ] Keep test suite dependency-free where possible.

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

- [ ] Manifest validation.
- [ ] Hook configuration validation.
- [ ] Node syntax.
- [ ] Shell syntax.
- [ ] Hook behavior tests.
- [ ] Installer inventory.
- [ ] Installer idempotency.
- [ ] Documentation inventory check.

### Exit Criteria

- [ ] Pull request fails when manifest or hooks break.
- [ ] Non-trivial hook logic has runnable tests.
- [ ] Full local validation runs through one command.

---

## Phase 8 - Align Documentation

**Status:** Pending  
**Priority:** P2  
**Files:**

```text
README.md
CLAUDE.md
```

### Tasks

- [ ] Change advertised skill count from 20 to 21 or generate count during validation.
- [ ] Document standard plugin install.
- [ ] Document optional manual project install.
- [ ] Document three Director approval gates.
- [ ] Document local-only PoC policy.
- [ ] Document artifact lifecycle.
- [ ] Document resume behavior.
- [ ] Document registry status transitions.
- [ ] Document plugin validation command.
- [ ] Add troubleshooting for missing hooks, GitHub auth, missing `gh`, and registry conflicts.
- [ ] Ensure README file tree matches repository and installed output.

### Verification

```bash
find agents -maxdepth 1 -name '*.md' | wc -l
find commands -maxdepth 1 -name '*.md' | wc -l
find skills -mindepth 1 -maxdepth 1 -type d | wc -l
find hooks -maxdepth 1 -name '*.mjs' | wc -l
```

Expected counts:

```text
agents: 5
commands: 7
skills: 21
hook scripts: 4
```

### Exit Criteria

- [ ] README claims match repository inventory.
- [ ] Installation instructions produce documented output.

---

## Phase 9 - Release `v1.1.0`

**Status:** Pending  
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
- [ ] All 21 skills load.
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
| 2026-08-30 | Keep HTTPS remote for now | SSH authentication currently fails | GitHub accepts local SSH public key |

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
