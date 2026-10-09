#!/usr/bin/env bash
set -euo pipefail

ECOSYSTEM="${1:?Usage: check-osv.sh <ecosystem> <package-name> [version]}"
PACKAGE="${2:?Usage: check-osv.sh <ecosystem> <package-name> [version]}"
VERSION="${3:-}"

PAYLOAD="$(python3 - "$ECOSYSTEM" "$PACKAGE" "$VERSION" <<'PY'
import json, sys
query = {"package": {"ecosystem": sys.argv[1], "name": sys.argv[2]}}
if sys.argv[3]: query["version"] = sys.argv[3]
print(json.dumps(query))
PY
)"

OSV_URL="${OSV_URL:-https://api.osv.dev/v1/query}"
if ! RESPONSE="$(curl --fail-with-body --silent --show-error --connect-timeout 10 --max-time 30 \
  -X POST -H 'Content-Type: application/json' -d "$PAYLOAD" "$OSV_URL")"; then
  printf '%s\n' '{"status":"UNKNOWN","source":"OSV","reason":"request_failed"}' >&2
  exit 1
fi

python3 - "$PACKAGE" "$ECOSYSTEM" "$VERSION" 3<<<"$RESPONSE" <<'PY'
import json, sys
package, ecosystem, version = sys.argv[1:]
try: data = json.load(open(3))
except json.JSONDecodeError as exc:
    print(json.dumps({"status": "UNKNOWN", "source": "OSV", "package": package, "ecosystem": ecosystem, "version": version, "reason": "invalid_json"}))
    raise SystemExit(1)
vulns = data.get("vulns", [])
if not isinstance(vulns, list):
    print(json.dumps({"status": "UNKNOWN", "source": "OSV", "package": package, "ecosystem": ecosystem, "version": version, "reason": "invalid_schema"}))
    raise SystemExit(1)
print(json.dumps({"status": "CLEAN" if not vulns else "FINDINGS", "source": "OSV", "package": package, "ecosystem": ecosystem, "version": version, "vulnerabilities": vulns}, separators=(",", ":")))
PY
