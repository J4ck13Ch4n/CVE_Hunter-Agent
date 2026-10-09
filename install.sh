#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE="install"
TARGET_DIR="."

while [ "$#" -gt 0 ]; do
  case "$1" in
    --project) TARGET_DIR="${2:?--project requires a directory}"; shift 2 ;;
    --check) MODE="check"; shift ;;
    --uninstall) MODE="uninstall"; shift ;;
    -h|--help)
      echo "Usage: $0 [--project DIR] [--check|--uninstall] [DIR]"
      exit 0
      ;;
    --*) echo "Unknown option: $1" >&2; exit 2 ;;
    *) TARGET_DIR="$1"; shift ;;
  esac
done

TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"
CLAUDE_DIR="$TARGET_DIR/.claude"
STATE_DIR="$CLAUDE_DIR/find-cve-agent"
MANIFEST="$STATE_DIR/.install-manifest"
ADDED_HOOKS="$STATE_DIR/.added-hooks.json"

required=(git python3 node curl)
missing=()
for tool in "${required[@]}"; do
  command -v "$tool" >/dev/null 2>&1 || missing+=("$tool")
done
if [ "${#missing[@]}" -gt 0 ]; then
  echo "Missing required tools: ${missing[*]}" >&2
  [ "$MODE" = check ] && exit 1
fi

if [ "$MODE" = uninstall ]; then
  if [ ! -f "$MANIFEST" ]; then
    echo "No installer manifest found; leaving files unchanged." >&2
    exit 1
  fi
  while IFS= read -r relative; do
    [ -n "$relative" ] || continue
    path="$TARGET_DIR/$relative"
    [ -f "$path" ] && rm -f "$path"
  done < "$MANIFEST"
  rm -f "$ADDED_HOOKS" "$MANIFEST"
  find "$STATE_DIR" -type d -empty -delete 2>/dev/null || true
  echo "Removed find-cve-agent managed files from $TARGET_DIR"
  exit 0
fi

if [ "$MODE" = check ]; then
  expected=(
    "$CLAUDE_DIR/agents"/*.md
    "$CLAUDE_DIR/commands"/*.md
    "$CLAUDE_DIR/skills"/*/SKILL.md
    "$CLAUDE_DIR/hooks"/*.mjs
    "$CLAUDE_DIR/find-cve-agent/scripts"/*.sh
    "$TARGET_DIR/REGISTRY.md"
    "$CLAUDE_DIR/settings.json"
  )
  dirs=(agents commands skills hooks find-cve-agent/scripts find-cve-agent/rules find-cve-agent/knowledge find-cve-agent/semgrep find-cve-agent/grep-patterns find-cve-agent/templates find-cve-agent/.claude-plugin)
  failed=0
  [ -f "$MANIFEST" ] || { echo "Missing installer manifest: $MANIFEST" >&2; failed=1; }
  for dir in "${dirs[@]}"; do
    if [ ! -d "$CLAUDE_DIR/$dir" ]; then echo "Missing: $CLAUDE_DIR/$dir" >&2; failed=1; fi
  done
  for file in "${expected[@]}"; do
    if [ ! -f "$file" ]; then echo "Missing: $file" >&2; failed=1; fi
  done
  exit "$failed"
fi

mkdir -p \
  "$CLAUDE_DIR/agents" \
  "$CLAUDE_DIR/commands" \
  "$CLAUDE_DIR/skills" \
  "$CLAUDE_DIR/hooks" \
  "$CLAUDE_DIR/find-cve-agent" \
  "$TARGET_DIR/targets"

cp -R "$SCRIPT_DIR/agents/." "$CLAUDE_DIR/agents/"
cp -R "$SCRIPT_DIR/commands/." "$CLAUDE_DIR/commands/"
cp -R "$SCRIPT_DIR/skills/." "$CLAUDE_DIR/skills/"
cp -R "$SCRIPT_DIR/hooks/." "$CLAUDE_DIR/hooks/"

for dir in scripts rules knowledge semgrep grep-patterns templates .claude-plugin; do
  rm_target="$CLAUDE_DIR/find-cve-agent/$dir"
  mkdir -p "$rm_target"
  cp -R "$SCRIPT_DIR/$dir/." "$rm_target/"
done

registry_created=0
if [ ! -f "$TARGET_DIR/REGISTRY.md" ]; then
  cp "$SCRIPT_DIR/templates/REGISTRY.md" "$TARGET_DIR/REGISTRY.md"
  registry_created=1
fi

find "$CLAUDE_DIR/agents" "$CLAUDE_DIR/commands" "$CLAUDE_DIR/skills" "$CLAUDE_DIR/hooks" "$STATE_DIR/scripts" "$STATE_DIR/rules" "$STATE_DIR/knowledge" "$STATE_DIR/semgrep" "$STATE_DIR/grep-patterns" "$STATE_DIR/templates" "$STATE_DIR/.claude-plugin" -type f -print 2>/dev/null |
  while IFS= read -r file; do printf '%s\n' "${file#"$TARGET_DIR/"}"; done > "$MANIFEST"

# REGISTRY.md is research data, never managed by uninstall.

python3 - "$CLAUDE_DIR/settings.json" "$SCRIPT_DIR/hooks/hooks.json" <<'PY'
import json, pathlib, sys
settings_path = pathlib.Path(sys.argv[1])
hooks_path = pathlib.Path(sys.argv[2])
try:
    settings = json.loads(settings_path.read_text()) if settings_path.exists() else {}
except json.JSONDecodeError as exc:
    raise SystemExit(f"Invalid existing {settings_path}: {exc}")
plugin_hooks = json.loads(hooks_path.read_text())["hooks"]
for entries in plugin_hooks.values():
    for entry in entries:
        for hook in entry.get("hooks", []):
            hook["command"] = hook["command"].replace(
                "${CLAUDE_PLUGIN_ROOT}/hooks/",
                "${CLAUDE_PROJECT_DIR}/.claude/hooks/",
            )
target_hooks = settings.setdefault("hooks", {})
for event, entries in plugin_hooks.items():
    current = target_hooks.setdefault(event, [])
    for entry in entries:
        if entry not in current:
            current.append(entry)
settings_path.write_text(json.dumps(settings, indent=2) + "\n")
PY

printf 'Installed find-cve-agent into %s\n' "$TARGET_DIR"
printf 'Run: %s --project %q --check\n' "$0" "$TARGET_DIR"
