# False Positive Indicators -- JWT Attacks

### 1. Library Validates Algorithm Against Allowlist
Modern libraries (jsonwebtoken >= 9, PyJWT >= 2) require explicit algorithm specification. The algorithm from the token header is not trusted.

### 2. Ignores Header alg
Library uses configured algorithm regardless of token header value.

### 3. Uses Asymmetric Keys Only
If only RSA/ECDSA keys are available (no HMAC secret configured), algorithm confusion from RS256 to HS256 requires access to the public key AND the library accepting the switch.

### 4. kid Parameter is Validated
kid value is validated against allowlist or sanitized before use in file/DB operations.

### 5. Strong Secret
HMAC secret is 256+ bits of random data, not brute-forceable.

### 6. Token Validation at Gateway Level
JWT validation happens at API gateway/reverse proxy level with fixed configuration, not in application code.
