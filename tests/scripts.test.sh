#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/bin"

cat > "$TMP/bin/curl" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
url=""
data=""
for arg in "$@"; do
  case "$arg" in
    http://*|https://*) url="$arg" ;;
    \{"*\}) data="$arg" ;;
  esac
done
if [ "${FAKE_CURL_FAIL:-0}" = 1 ]; then exit 22; fi
if [[ "$data" == *'invalid-ecosystem'* ]]; then exit 22; fi
case "$url" in
  *api.osv.dev*) printf '%s' "${FAKE_OSV_RESPONSE:-{\"vulns\":[]}}" ;;
  *services.nvd.nist.gov*) printf '%s' "${FAKE_NVD_RESPONSE:-{\"totalResults\":0,\"vulnerabilities\":[]}}" ;;
  *registry.npmjs.org*) printf '%s' "${FAKE_NPM_META:-{\"dist-tags\":{\"latest\":\"1.2.3\"},\"repository\":{\"url\":\"git+https://github.com/example/pkg.git\"},\"maintainers\":[{\"name\":\"maintainer\"}]}}" ;;
  *api.npmjs.org*) printf '%s' "${FAKE_NPM_DOWNLOADS:-{\"downloads\":42}}" ;;
  *) exit 22 ;;
esac
SH
chmod +x "$TMP/bin/curl"

json_status() {
  python3 -c 'import json,sys; assert json.load(sys.stdin)["status"] == sys.argv[1]' "$1"
}

run_unknown() {
  local output
  output=$(PATH="$TMP/bin:$PATH" FAKE_CURL_FAIL=1 "$@" 2>&1 || true)
  printf '%s\n' "$output" | grep -q 'UNKNOWN'
  ! printf '%s\n' "$output" | grep -q 'CLEAN'
}

PATH="$TMP/bin:$PATH" FAKE_OSV_RESPONSE='{"vulns":[]}' \
  "$ROOT/scripts/check-osv.sh" npm lodash 4.17.21 | json_status CLEAN
PATH="$TMP/bin:$PATH" FAKE_OSV_RESPONSE='{"vulns":[{"id":"CVE-TEST-1"}]}' \
  "$ROOT/scripts/check-osv.sh" npm '@scope/name' 1.2.3 | python3 -c 'import json,sys; d=json.load(sys.stdin); assert d["status"] == "FINDINGS" and d["package"] == "@scope/name" and d["version"] == "1.2.3"'
PATH="$TMP/bin:$PATH" FAKE_OSV_RESPONSE='{"vulns":[]}' \
  "$ROOT/scripts/check-osv.sh" PyPI requests 2.28.0 | python3 -c 'import json,sys; d=json.load(sys.stdin); assert d["ecosystem"] == "PyPI" and d["version"] == "2.28.0"'
run_unknown env PATH="$TMP/bin:$PATH" "$ROOT/scripts/check-osv.sh" npm lodash 1.0.0

PATH="$TMP/bin:$PATH" FAKE_OSV_RESPONSE='not-json' \
  "$ROOT/scripts/check-osv.sh" npm lodash 1.0.0 | json_status UNKNOWN
run_unknown "$ROOT/scripts/check-osv.sh" npm lodash 1.0.0
PATH="$TMP/bin:$PATH" FAKE_OSV_RESPONSE='not-json' \
  "$ROOT/scripts/check-osv.sh" npm lodash 1.0.0 | json_status UNKNOWN
PATH="$TMP/bin:$PATH" FAKE_OSV_RESPONSE='{"vulns":[{"id":"CVE-TEST-2"}]}' \
  "$ROOT/scripts/check-osv.sh" npm lodash 4.17.10 | json_status FINDINGS

PATH="$TMP/bin:$PATH" FAKE_NVD_RESPONSE='{"totalResults":0,"vulnerabilities":[]}' \
  "$ROOT/scripts/check-nvd.sh" lodash | json_status CLEAN
PATH="$TMP/bin:$PATH" FAKE_NVD_RESPONSE='{"totalResults":1,"vulnerabilities":[{"cve":{"id":"CVE-TEST-3"}}]}' \
  "$ROOT/scripts/check-nvd.sh" 'pkg"with"quotes' | python3 -c 'import json,sys; d=json.load(sys.stdin); assert d["status"] == "CANDIDATES" and d["package"] == "pkg\"with\"quotes"'
PATH="$TMP/bin:$PATH" FAKE_NVD_RESPONSE='not-json' \
  "$ROOT/scripts/check-nvd.sh" lodash | json_status UNKNOWN
run_unknown "$ROOT/scripts/check-nvd.sh" lodash

PATH="$TMP/bin:$PATH" NPM_REGISTRY_URL=https://registry.npmjs.org NPM_DOWNLOADS_URL=https://api.npmjs.org \
  FAKE_NPM_META='{"dist-tags":{"latest":"9.9.9"},"repository":{"url":"git+https://github.com/example/pkg.git"},"maintainers":[{"name":"maintainer"}]}' \
  FAKE_NPM_DOWNLOADS='{"downloads":123}' "$ROOT/scripts/npm-stats.sh" '@scope/name' | python3 -c 'import json,sys; d=json.load(sys.stdin); assert d["status"] == "OK" and d["package"] == "@scope/name" and d["latestVersion"] == "9.9.9" and d["weeklyDownloads"] == 123'
PATH="$TMP/bin:$PATH" FAKE_NPM_META='not-json' "$ROOT/scripts/npm-stats.sh" lodash | json_status UNKNOWN
run_unknown "$ROOT/scripts/npm-stats.sh" lodash

echo "script fixtures: PASS"
