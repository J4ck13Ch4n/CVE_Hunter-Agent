#!/usr/bin/env bash
set -euo pipefail

PACKAGE="${1:?Usage: check-nvd.sh <package-name>}"
QUERY="$(python3 - "$PACKAGE" <<'PY'
import sys, urllib.parse
print(urllib.parse.urlencode({"keywordSearch": sys.argv[1], "resultsPerPage": 20}))
PY
)"

if ! RESPONSE="$(curl --fail-with-body --silent --show-error --connect-timeout 10 --max-time 30 \
  "${NVD_URL:-https://services.nvd.nist.gov/rest/json/cves/2.0}?$QUERY")"; then
  printf '%s\n' '{"status":"UNKNOWN","source":"NVD","reason":"request_failed"}' >&2
  exit 1
fi

python3 - "$PACKAGE" 3<<<"$RESPONSE" <<'PY'
import json, sys
package = sys.argv[1]
try: data = json.load(open(3))
except json.JSONDecodeError:
    print(json.dumps({"status": "UNKNOWN", "source": "NVD", "package": package, "reason": "invalid_json"}))
    raise SystemExit(1)
candidates = data.get("vulnerabilities", [])
if not isinstance(candidates, list):
    print(json.dumps({"status": "UNKNOWN", "source": "NVD", "package": package, "reason": "invalid_schema"}))
    raise SystemExit(1)
print(json.dumps({"status": "CANDIDATES" if candidates else "CLEAN", "source": "NVD", "package": package, "totalResults": data.get("totalResults", len(candidates)), "vulnerabilities": candidates}, separators=(",", ":")))
PY
