# JavaScript / TypeScript Grep Patterns

Grep patterns for hunting vulnerabilities in JS/TS codebases.
Use with `rg` (ripgrep) or `grep -rn`. All patterns are case-sensitive unless noted.

---

## Sources (User Input Entry Points)

```bash
# Express / Koa / Fastify request data
rg "req\.(body|query|params|headers|cookies)" --type js --type ts
rg "request\.(body|query|params|headers)" --type js --type ts
rg "ctx\.(request|query|params)" --type js --type ts

# URL / search params
rg "URL\(|URLSearchParams|location\.(search|hash|href)" --type js --type ts

# File uploads
rg "req\.files?|multer|formidable|busboy" --type js --type ts

# WebSocket messages
rg "ws\.on\('message'|socket\.on\('message'|\.onmessage" --type js --type ts

# stdin / argv
rg "process\.argv|process\.stdin|readline" --type js --type ts
```

---

## Command Injection (CWE-78)

```bash
# Sinks — shell execution
rg "child_process|require\(['\"]child_process['\"]\)" --type js --type ts
rg "\.exec\(|\.execSync\(" --type js --type ts
rg "\.spawn\(|\.spawnSync\(" --type js --type ts
rg "\.execFile\(|\.execFileSync\(" --type js --type ts
rg "shell:\s*true" --type js --type ts
rg "shelljs|execa|cross-spawn" --type js --type ts

# Template literals in exec (high signal)
rg "exec\(\`" --type js --type ts
rg "execSync\(\`" --type js --type ts
```

---

## Path Traversal (CWE-22)

```bash
# Sinks — file operations with dynamic paths
rg "fs\.(readFile|writeFile|readFileSync|writeFileSync|createReadStream|createWriteStream|unlink|rename|mkdir)" --type js --type ts
rg "path\.join\(|path\.resolve\(" --type js --type ts
rg "res\.sendFile\(|res\.download\(" --type js --type ts

# Archive extraction (Zip Slip)
rg "\.extractAll|\.extract\(|yauzl|adm-zip|unzipper|decompress|tar\.extract" --type js --type ts
rg "entry\.(fileName|entryName|path|name)" --type js --type ts

# Traversal checks (good sign)
rg "\.includes\('\.\.'|\.indexOf\('\.\." --type js --type ts
rg "\.startsWith\(|\.normalize\(" --type js --type ts
```

---

## Code Injection (CWE-94)

```bash
# Sinks — dynamic code construction via Function constructor
rg "Function\(" --type js --type ts
rg "vm\.run|vm\.Script|vm\.createContext" --type js --type ts
rg "vm2|isolated-vm|safe-eval" --type js --type ts

# Code generation patterns (validators, template engines)
rg "\.compile\(|\.precompile\(" --type js --type ts

# Constructor chain (sandbox escape)
rg "constructor\[|\.constructor\." --type js --type ts
rg "__proto__|prototype\[" --type js --type ts

# Block comment escape in code gen
rg "JSON\.stringify" --type js --type ts
```

---

## Prototype Pollution (CWE-1321)

```bash
# Sinks — recursive merge / deep clone
rg "deepmerge|deep-extend|merge-deep|lodash\.merge|_.merge|_.defaultsDeep" --type js --type ts
rg "Object\.assign\(" --type js --type ts
rg "function.*merge|function.*extend|function.*defaults" --type js --type ts

# Dynamic property assignment
rg "\[.*\]\[.*\]\s*=" --type js --type ts
rg "\[key\]|\.set\(key|\.set\(prop" --type js --type ts

# Missing proto guards
rg "__proto__|constructor|prototype" --type js --type ts -g '!node_modules'
rg "hasOwnProperty" --type js --type ts
rg "Object\.create\(null\)" --type js --type ts
```

---

## XSS (CWE-79)

```bash
# Sinks — HTML rendering without escaping
rg "innerHTML|outerHTML|document\.write|\.html\(" --type js --type ts
rg "\.insertAdjacentHTML\(" --type js --type ts
rg "DOMPurify|sanitize-html|xss\(|escape-html" --type js --type ts

# Server-side rendering sinks
rg "res\.send\(.*<|res\.write\(.*<" --type js --type ts
rg "template\(|render\(|ejs\.render|pug\.render|handlebars\.compile" --type js --type ts
```

---

## SSRF (CWE-918)

```bash
# Sinks — HTTP requests with dynamic URL
rg "fetch\(|axios\.(get|post|put|delete|request)\(|got\(|node-fetch|request\(" --type js --type ts
rg "http\.(get|request)\(|https\.(get|request)\(" --type js --type ts
rg "superagent|needle|undici" --type js --type ts

# URL construction from user input
rg "new URL\(.*req\.|new URL\(.*params|new URL\(.*query" --type js --type ts

# Private IP check (good sign if present)
rg "isPrivate|isReserved|ssrf-filter|ssrf-req-filter" --type js --type ts
```

---

## SQL Injection (CWE-89)

```bash
# Sinks — raw SQL queries
rg "\.query\(|\.raw\(|\.execute\(" --type js --type ts
rg "sequelize\.query|knex\.raw|prisma\.\$queryRaw|prisma\.\$executeRaw" --type js --type ts
rg "db\.run\(|db\.all\(|db\.get\(|db\.exec\(" --type js --type ts

# String concatenation in SQL
rg "SELECT.*\+|INSERT.*\+|UPDATE.*\+|DELETE.*\+" --type js --type ts
rg "SELECT.*\$\{|INSERT.*\$\{|UPDATE.*\$\{|DELETE.*\$\{" --type js --type ts
```

---

## Deserialization (CWE-502)

```bash
# Sinks — unsafe deserialization
rg "unserialize|deserialize|node-serialize|serialize-javascript" --type js --type ts
rg "yaml\.load\(|js-yaml|yamljs" --type js --type ts
rg "JSON\.parse\(" --type js --type ts

# Object reconstruction
rg "class-transformer|plainToClass|plainToInstance" --type js --type ts
```

---

## Template Injection (CWE-1336)

```bash
# Sinks — template compilation with user input
rg "handlebars\.compile\(|Handlebars\.compile\(" --type js --type ts
rg "ejs\.render\(|ejs\.compile\(" --type js --type ts
rg "pug\.compile\(|pug\.render\(" --type js --type ts
rg "nunjucks\.(render|renderString|compile)" --type js --type ts
rg "mustache\.render\(|Mustache\.render\(" --type js --type ts
rg "doT\.template\(|dot\.template\(" --type js --type ts
rg "art-template|template\.render|template\.compile" --type js --type ts
rg "eta\.render|Eta\.render|liquidjs|Liquid\(" --type js --type ts
```

---

## ReDoS (CWE-1333)

```bash
# Patterns — nested quantifiers (catastrophic backtracking)
rg "new RegExp\(" --type js --type ts
rg "RegExp\(\s*[^)]*req\." --type js --type ts

# Dangerous regex patterns in source
rg "\(\.\*\)\+|\(\.\+\)\+|\(\.\+\)\*|\(\.\*\)\*" --type js --type ts
rg "\([^)]+\)\{[0-9]+,\}" --type js --type ts
rg "\(\[.*\]\+\)\+" --type js --type ts

# Validation libraries (common ReDoS targets)
rg "validator\.js|is-email|is-url|is-ip" --type js --type ts
```

---

## Decompression Bomb (CWE-409)

```bash
# Sinks — decompression without size limits
rg "zlib\.(inflate|gunzip|unzip|brotliDecompress)" --type js --type ts
rg "pako\.(inflate|ungzip)" --type js --type ts
rg "fflate|lz-string|lz4|snappy" --type js --type ts
rg "JSZip|archiver|adm-zip|tar-stream|decompress" --type js --type ts

# Size checks (good sign if present)
rg "maxSize|MAX_SIZE|sizeLimit|decompressedSize|outputLimit" --type js --type ts
```

---

## Entity Expansion / Billion Laughs (CWE-776)

```bash
# Sinks — XML/SVG parsing
rg "DOMParser|xml2js|fast-xml-parser|xmldom|sax\.|htmlparser2|cheerio" --type js --type ts
rg "libxmljs|node-expat|xml-js|saxes" --type js --type ts
rg "svgo|svg-parser|parse.*svg" --type js --type ts

# Entity handling checks
rg "entityExpansion|maxExpansion|ENTITY|DOCTYPE|noent" --type js --type ts
rg "processEntities|resolveEntities" --type js --type ts
```
