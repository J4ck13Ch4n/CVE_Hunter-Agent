#!/usr/bin/env bash
set -euo pipefail

PACKAGE="${1:?Usage: npm-stats.sh <package-name>}"
ENCODED="$(python3 - "$PACKAGE" <<'PY'
import sys, urllib.parse
print(urllib.parse.quote(sys.argv[1], safe="@"))
PY
)"
CURL=(curl --fail-with-body --silent --show-error --connect-timeout 10 --max-time 30)
REGISTRY_URL="${NPM_REGISTRY_URL:-https://registry.npmjs.org}"
DOWNLOADS_URL="${NPM_DOWNLOADS_URL:-https://api.npmjs.org}"

if ! META="$("${CURL[@]}" "$REGISTRY_URL/$ENCODED")"; then
  printf '%s\n' '{"status":"UNKNOWN","source":"npm","reason":"metadata_request_failed"}' >&2
  exit 1
fi
if ! DOWNLOADS="$("${CURL[@]}" "$DOWNLOADS_URL/downloads/point/last-week/$ENCODED")"; then
  printf '%s\n' '{"status":"UNKNOWN","source":"npm","reason":"downloads_request_failed"}' >&2
  exit 1
fi

python3 - "$PACKAGE" "$DOWNLOADS" 3<<<"$META" <<'PY'
import json, sys
package, downloads_json = sys.argv[1:]
try:
    meta = json.load(open(3))
    downloads = json.loads(downloads_json)
except json.JSONDecodeError:
    print(json.dumps({"status": "UNKNOWN", "source": "npm", "package": package, "reason": "invalid_json"}))
    raise SystemExit(1)
if not isinstance(meta, dict) or not isinstance(downloads, dict):
    print(json.dumps({"status": "UNKNOWN", "source": "npm", "package": package, "reason": "invalid_schema"}))
    raise SystemExit(1)
repo = meta.get("repository", {})
repo = repo.get("url", "N/A") if isinstance(repo, dict) else str(repo)
print(json.dumps({"status": "OK", "source": "npm", "package": package, "latestVersion": meta.get("dist-tags", {}).get("latest"), "weeklyDownloads": downloads.get("downloads"), "repository": repo.replace("git+", "").removesuffix(".git"), "maintainers": [m.get("name", "N/A") for m in meta.get("maintainers", [])]}, separators=(",", ":")))
PY
