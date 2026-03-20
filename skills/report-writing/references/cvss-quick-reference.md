# CVSS 3.1 Quick Reference

## Vector String Format

`CVSS:3.1/AV:_/AC:_/PR:_/UI:_/S:_/C:_/I:_/A:_`

## Metrics

### Attack Vector (AV)
| Value | Meaning | Example |
|-------|---------|---------|
| N (Network) | Exploitable over the internet | Web API, npm package processing untrusted input |
| A (Adjacent) | Same network segment required | Bluetooth, local WiFi |
| L (Local) | Local access required | CLI tool processing local files |
| P (Physical) | Physical access to device | USB attacks, hardware |

### Attack Complexity (AC)
| Value | Meaning | Example |
|-------|---------|---------|
| L (Low) | No special conditions | Send a crafted request, done |
| H (High) | Race condition, specific config, MITM needed | Timing-dependent, requires non-default settings |

### Privileges Required (PR)
| Value | Meaning | Example |
|-------|---------|---------|
| N (None) | No auth needed | Public API, unauthenticated endpoint |
| L (Low) | Basic user account | Logged-in user, API key holder |
| H (High) | Admin/root | Requires admin panel access |

### User Interaction (UI)
| Value | Meaning | Example |
|-------|---------|---------|
| N (None) | Fully automated | Server-side processing, API call |
| R (Required) | Victim must click/open something | XSS needing click, malicious file opened |

### Scope (S)
| Value | Meaning | Example |
|-------|---------|---------|
| U (Unchanged) | Stays within the vulnerable component | Crash the parser, read its files |
| C (Changed) | Escapes to affect other components | Sandbox escape, XSS affecting other users |

### Impact: Confidentiality (C), Integrity (I), Availability (A)
| Value | Meaning |
|-------|---------|
| N (None) | No impact on this dimension |
| L (Low) | Limited data exposed/modified, degraded service |
| H (High) | All data exposed/modified, full service outage |

## Common Vulnerability CVSS Vectors

### Critical (9.0-10.0)
```
Unauthenticated RCE:           AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H = 9.8
Unauthenticated RCE (sandbox): AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H = 10.0
Path traversal + write (unauth):AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:H = 9.1
Code injection (unauth):       AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H = 9.8
```

### High (7.0-8.9)
```
Authenticated RCE:              AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H = 8.8
Unauthenticated DoS (crash):   AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H = 7.5
Path traversal read (unauth):  AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N = 7.5
SSRF to cloud metadata:        AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:N/A:N = 7.7
Entity expansion DoS (unauth): AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H = 7.5
Sandbox escape (auth):         AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:H = 9.9
Code injection (auth):         AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H = 8.8
Decompression bomb (unauth):   AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H = 7.5
```

### Medium (4.0-6.9)
```
Stored XSS (auth):             AV:N/AC:L/PR:L/UI:R/S:C/C:L/I:L/A:N = 5.4
IDOR read:                     AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:N/A:N = 4.3
IDOR write:                    AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:L/A:N = 4.3
ReDoS (unauth):                AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L = 5.3
DoS catchable error (unauth):  AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L = 5.3
Auth header leak on redirect:  AV:N/AC:H/PR:N/UI:R/S:U/C:H/I:N/A:N = 5.3
Proto pollution (no gadget):   AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:N = 5.3
```

## DoS Severity Guide

Not all DoS is equal:

| Behavior | CVSS A: | Reasoning |
|----------|---------|-----------|
| Process crashes (OOM, segfault) | H | Server goes down, may need manual restart |
| Infinite loop / hang | H | Thread/process blocked indefinitely |
| 100:1 amplification ratio | H | 1KB input = 100KB+ memory/CPU |
| Caught exception, server continues | L | Temporary error, no lasting impact |
| RangeError (stack overflow, caught) | L | Framework catches it, returns 500 |
| 10:1 amplification ratio | L | Minor slowdown, not meaningful DoS |

## Quick Decision

```
Can attacker run arbitrary code?     -> C:H/I:H/A:H (adjust AV/AC/PR/UI)
Can attacker read sensitive data?    -> C:H (adjust I/A based on other impacts)
Can attacker write/modify data?      -> I:H (adjust C/A)
Can attacker crash the service?      -> A:H if unrecoverable, A:L if caught
Does it escape a security boundary?  -> S:C
```
