# False Positive Indicators -- SSRF

### 1. URL From Config, Not User Input
URL is hardcoded or from config file, not user-controlled.

### 2. Strict Allowlist Validation
URL validated against a strict allowlist of allowed domains/IPs. Blocklist is NOT sufficient (bypasses exist).

### 3. No Internal Services Reachable
Application runs in an environment with no internal services or cloud metadata endpoints.

### 4. Private Network Ranges Properly Blocked
Validates resolved IP (after DNS resolution, not just the hostname) against private ranges. Must check AFTER DNS to prevent DNS rebinding.

### 5. Redirect Following Disabled
HTTP client configured to not follow redirects. Prevents redirect-based SSRF bypass.

### 6. IMDSv2 Only (AWS)
AWS IMDSv2 requires a PUT request to get a token, which most SSRF vectors cannot perform.

### 7. URL Scheme Restricted
Only `http://` and `https://` schemes allowed. `file://`, `gopher://`, etc. blocked.
