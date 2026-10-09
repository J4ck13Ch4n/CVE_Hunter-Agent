#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

command -v claude >/dev/null 2>&1 || { echo "Missing required tool: claude" >&2; exit 1; }
claude plugin validate . --strict
node --check hooks/*.mjs
bash -n install.sh scripts/*.sh tests/install.sh
python3 -m json.tool .claude-plugin/plugin.json >/dev/null
python3 -m json.tool hooks/hooks.json >/dev/null
node --test tests/*.test.mjs
bash tests/install.sh

agents=$(find agents -maxdepth 1 -type f -name '*.md' | wc -l)
commands=$(find commands -maxdepth 1 -type f -name '*.md' | wc -l)
skills=$(find skills -mindepth 2 -maxdepth 2 -type f -name SKILL.md | wc -l)
hooks=$(find hooks -maxdepth 1 -type f -name '*.mjs' ! -name 'hook-utils.mjs' | wc -l)
[ "$agents" -eq 6 ] || { echo "Expected 6 agents, found $agents" >&2; exit 1; }
[ "$commands" -eq 8 ] || { echo "Expected 8 commands, found $commands" >&2; exit 1; }
[ "$skills" -eq 22 ] || { echo "Expected 22 skills, found $skills" >&2; exit 1; }
[ "$hooks" -eq 5 ] || { echo "Expected 5 hook entry scripts, found $hooks" >&2; exit 1; }
printf 'plugin validation: PASS (agents=%s commands=%s skills=%s hook_entries=%s)\n' "$agents" "$commands" "$skills" "$hooks"
