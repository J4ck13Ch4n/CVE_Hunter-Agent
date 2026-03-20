---
name: jwt-attacks
description: "Detect JWT implementation vulnerabilities including algorithm confusion, none algorithm acceptance, weak secrets, and JWK injection attacks."
metadata:
  filePattern:
    - "**/*.js"
    - "**/*.ts"
    - "**/*.py"
    - "**/*.go"
  bashPattern:
    - "grep.*(jwt|jsonwebtoken|jose|JWK|JWS)"
  priority: 82
---

# JWT Attack Detection

## When to Use

Audit JWT verification/generation libraries, authentication implementations, and any code that validates or creates JSON Web Tokens.

## Attack Types

### 1. Algorithm Confusion (RS256 to HS256)

The server uses RS256 (asymmetric) but the attacker changes the token header to HS256 (symmetric) and signs with the public key as the HMAC secret.

**Conditions**: Library accepts algorithm from token header without allowlist validation.

### 2. alg:none Bypass

Token header specifies `"alg": "none"`, and the library accepts unsigned tokens.

**Conditions**: Library does not validate algorithm or allows "none".

### 3. JWK Header Injection

Attacker embeds their own public key in the token header via the `jwk` parameter, and the library uses it for verification.

### 4. Weak HMAC Secrets

HMAC secrets that are short, common words, or default values. Can be brute-forced offline.

### 5. kid (Key ID) Attacks

- **Path traversal**: `"kid": "../../dev/null"` -- sign with empty key
- **SQL injection**: `"kid": "' UNION SELECT 'secret' --"` -- inject known key
- **Command injection**: `"kid": "|id"` -- if kid is passed to shell

### 6. jku/x5u URL Manipulation

`jku` (JWK Set URL) or `x5u` (X.509 URL) in header points to attacker-controlled server hosting a JWK Set with the attacker key.

## Process

### Step 1: Find JWT Usage

```
grep -rn "jwt\.verify\|jwt\.decode\|jwt\.sign\|jwt\.encode" .
grep -rn "jsonwebtoken\|jose\|PyJWT\|go-jose\|nimbus-jose" .
grep -rn "JWTVerify\|jwtVerify\|createRemoteJWKSet" .
```

### Step 2: Check Algorithm Validation

```
grep -rn "algorithms\|algorithm.*=\|alg.*:" . | grep -i jwt
```

Is the algorithm explicitly specified or taken from the token header?

```js
// VULNERABLE: no algorithm specified
jwt.verify(token, key);

// SAFE: algorithm allowlist
jwt.verify(token, key, { algorithms: ['RS256'] });
```

### Step 3: Check for none Algorithm

```
grep -rn "none\|None\|NONE" . | grep -i "alg\|algorithm"
```

### Step 4: Check kid Parameter Handling

```
grep -rn "kid\|keyId\|key_id\|getKey\|keyStore" .
```

Is the kid value used in file paths, database queries, or command execution?

### Step 5: Check Secret Strength

```
grep -rn "secret\|SECRET\|JWT_SECRET\|TOKEN_SECRET" .
```

Is the secret hardcoded, from environment variable, or sufficiently random?

## CVSS Guidance

- Algorithm confusion to forge admin tokens: CRITICAL 9.1
- alg:none bypass: CRITICAL 9.1
- JWK injection: HIGH 8.1
- Weak HMAC secret (brute-forceable): HIGH 7.5
- kid path traversal: HIGH 7.5-8.1
- kid SQLi: CRITICAL 9.8

## References

- [Sinks](references/sinks.md) -- JWT libraries and vulnerability status
- [False Positive Indicators](references/false-positive-indicators.md)
- [PoC Skeleton](references/poc-skeleton.md)
