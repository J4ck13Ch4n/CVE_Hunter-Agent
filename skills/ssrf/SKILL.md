---
name: ssrf
description: "Detect Server-Side Request Forgery where user-controlled URLs can reach internal services, cloud metadata endpoints, or bypass network boundaries."
metadata:
  filePattern:
    - "**/*.js"
    - "**/*.ts"
    - "**/*.py"
    - "**/*.go"
    - "**/*.rb"
  bashPattern:
    - "semgrep.*ssrf"
    - "grep.*(fetch|axios|requests\\.get|http\\.get)"
  priority: 85
---

# SSRF Detection

## When to Use

Audit webhook handlers, URL preview generators, import-from-URL features, image proxy endpoints, PDF generators that fetch remote resources, and any endpoint that makes HTTP requests based on user-supplied URLs.

## Process

### Step 1: Find HTTP Request Sinks

```
# JavaScript
grep -rn "fetch(\|axios\|got(\|node-fetch\|http\.get\|https\.get\|request(" .
grep -rn "urllib\|url\.parse\|new URL(" .

# Python
grep -rn "requests\.get\|requests\.post\|urllib\.request\|urlopen\|httpx" .

# Go
grep -rn "http\.Get\|http\.Post\|http\.NewRequest\|httpClient" .

# Ruby
grep -rn "Net::HTTP\|open-uri\|Faraday\|HTTParty\|RestClient" .
```

### Step 2: Check If URL is User-Controlled

Trace the URL parameter backwards:
- Does it come from request parameters, body, headers?
- Is it stored in database but originally user-supplied?
- Can the user control the host/port/path/scheme?

### Step 3: Check URL Validation

```
grep -rn "isPrivate\|isInternal\|isLocalhost\|blocked\|allowlist\|blocklist" .
grep -rn "127\.0\.0\.1\|0\.0\.0\.0\|169\.254\|10\.\|172\.16\|192\.168" .
```

### Step 4: Test IP Validation Bypasses

Common bypass techniques:
- Decimal IP: `2130706433` = 127.0.0.1
- Hex IP: `0x7f000001` = 127.0.0.1
- Octal IP: `0177.0.0.1` = 127.0.0.1
- IPv6 mapped: `::ffff:127.0.0.1`
- IPv6 localhost: `::1`, `0:0:0:0:0:0:0:1`
- URL encoding: `http://127%2e0%2e0%2e1`
- DNS rebinding: domain that resolves to 127.0.0.1 after initial check
- Redirect following: allowed URL redirects to internal URL
- `0.0.0.0` on some systems maps to localhost
- `localtest.me` resolves to 127.0.0.1

### Step 5: Check Protocol Handling

Dangerous protocols beyond http/https:
- `file:///etc/passwd` -- local file read
- `gopher://` -- arbitrary TCP data (SSRF amplifier)
- `dict://` -- dictionary service probe
- `ftp://` -- FTP data exfiltration

### Step 6: Evaluate Cloud Metadata Access

If the target runs on cloud infrastructure:
- AWS IMDSv1: `http://169.254.169.254/latest/meta-data/iam/security-credentials/`
- AWS IMDSv2: requires token header (harder to exploit)
- GCP: `http://metadata.google.internal/computeMetadata/v1/`
- Azure: `http://169.254.169.254/metadata/instance`
- DigitalOcean: `http://169.254.169.254/metadata/v1/`

## CVSS Guidance

- SSRF to cloud credentials (AWS IMDSv1): CRITICAL 9.1
- SSRF to internal service interaction: HIGH 7.5
- Blind SSRF (no response body): MEDIUM 5.3-6.5
- SSRF with redirect-only: MEDIUM 5.0
- Authenticated SSRF: reduce PR to L

## References

- [Sinks](references/sinks.md) -- HTTP request sinks by language
- [False Positive Indicators](references/false-positive-indicators.md)
- [PoC Skeleton](references/poc-skeleton.md)
