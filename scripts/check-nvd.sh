#!/bin/bash
# Query NVD API for existing CVEs on a package
# Usage: ./check-nvd.sh <package-name>

set -euo pipefail

PACKAGE="${1:?Usage: check-nvd.sh <package-name>}"
API_URL="https://services.nvd.nist.gov/rest/json/cves/2.0"

echo "[*] Searching NVD for: $PACKAGE"

RESPONSE=$(curl -s "${API_URL}?keywordSearch=${PACKAGE}&resultsPerPage=20")
TOTAL=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('totalResults', 0))" 2>/dev/null)

echo "[*] Total CVEs found: $TOTAL"

if [ "$TOTAL" -gt 0 ]; then
    echo ""
    echo "CVE ID | Severity | Description"
    echo "-------|----------|------------"
    echo "$RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for vuln in data.get('vulnerabilities', []):
    cve = vuln['cve']
    cve_id = cve['id']
    desc = cve['descriptions'][0]['value'][:80]
    metrics = cve.get('metrics', {})
    severity = 'N/A'
    for key in ['cvssMetricV31', 'cvssMetricV30', 'cvssMetricV2']:
        if key in metrics:
            severity = metrics[key][0]['cvssData'].get('baseSeverity', 'N/A')
            break
    print(f'{cve_id} | {severity} | {desc}')
" 2>/dev/null
fi
