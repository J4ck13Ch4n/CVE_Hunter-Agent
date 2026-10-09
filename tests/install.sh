#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

printf '# Existing project context\n' > "$TMP/CLAUDE.md"
printf '# Existing registry\n' > "$TMP/REGISTRY.md"

bash "$ROOT/install.sh" --project "$TMP"
FIRST_SETTINGS="$(cat "$TMP/.claude/settings.json")"
bash "$ROOT/install.sh" --project "$TMP"
bash "$ROOT/install.sh" --project "$TMP" --check

[ "$(find "$TMP/.claude/agents" -maxdepth 1 -name '*.md' | wc -l)" -eq 6 ]
[ "$(find "$TMP/.claude/commands" -maxdepth 1 -name '*.md' | wc -l)" -eq 8 ]
[ "$(find "$TMP/.claude/skills" -mindepth 2 -maxdepth 2 -name SKILL.md | wc -l)" -eq 22 ]
[ "$(find "$TMP/.claude/hooks" -maxdepth 1 -name '*.mjs' | wc -l)" -eq 6 ]
[ -f "$TMP/.claude/find-cve-agent/.install-manifest" ]
[ -f "$TMP/.claude/settings.json" ]
[ -f "$TMP/REGISTRY.md" ]
[ "$(find "$TMP/.claude/agents" -maxdepth 1 -name '*.md' | wc -l)" -eq 6 ]
[ "$(find "$TMP/.claude/commands" -maxdepth 1 -name '*.md' | wc -l)" -eq 8 ]
[ "$(find "$TMP/.claude/skills" -mindepth 2 -maxdepth 2 -name SKILL.md | wc -l)" -eq 22 ]
[ "$(cat "$TMP/CLAUDE.md")" = '# Existing project context' ]
[ "$(cat "$TMP/REGISTRY.md")" = '# Existing registry' ]
[ "$(cat "$TMP/.claude/settings.json")" = "$FIRST_SETTINGS" ]
python3 -m json.tool "$TMP/.claude/settings.json" >/dev/null
bash "$ROOT/install.sh" --project "$TMP" --uninstall
[ -f "$TMP/REGISTRY.md" ]
[ ! -e "$TMP/.claude/agents/recon.md" ]

printf 'installer test: PASS\n'
