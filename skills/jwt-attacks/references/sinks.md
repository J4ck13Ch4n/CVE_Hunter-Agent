# JWT Libraries by Language

## JavaScript / TypeScript

| Library | alg:none Safe? | Alg Confusion Safe? | Notes |
|---------|---------------|-------------------|-------|
| jsonwebtoken (>= 9.0) | YES | YES (requires algorithms option) | Most popular |
| jsonwebtoken (< 9.0) | VULNERABLE | VULNERABLE without algorithms | Upgrade! |
| jose | YES | YES | Modern, well-designed |
| fast-jwt | YES | CHECK | |
| njwt | CHECK | CHECK | |

## Python

| Library | alg:none Safe? | Alg Confusion Safe? | Notes |
|---------|---------------|-------------------|-------|
| PyJWT (>= 2.0) | YES | YES (requires algorithms param) | |
| PyJWT (< 2.0) | VULNERABLE | VULNERABLE | Upgrade! |
| python-jose | CHECK | CHECK | |
| authlib | CHECK version | CHECK whitespace bypass | |

## Go

| Library | alg:none Safe? | Alg Confusion Safe? | Notes |
|---------|---------------|-------------------|-------|
| golang-jwt/jwt (v5) | YES | YES | Requires method validation |
| dgrijalva/jwt-go (v3) | VULNERABLE | VULNERABLE | Deprecated |
| go-jose | YES | YES | |
| lestrrat-go/jwx | YES | YES | |
