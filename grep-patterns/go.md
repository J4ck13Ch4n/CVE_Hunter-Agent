# Go Grep Patterns

Grep patterns for hunting vulnerabilities in Go codebases.
Use with `rg` (ripgrep) or `grep -rn`.

---

## Sources (User Input Entry Points)

```bash
# net/http handlers
rg "r\.URL\.Query\(\)|r\.FormValue\(|r\.PostFormValue\(" --type go
rg "r\.Header\.Get\(|r\.Body|r\.ParseForm\(\)" --type go
rg "mux\.Vars\(|chi\.URLParam\(|gin\.Param\(|c\.Param\(" --type go
rg "c\.Query\(|c\.PostForm\(|c\.Bind\(" --type go  # Gin
rg "echo\.Context|c\.FormValue\(" --type go  # Echo

# File uploads
rg "r\.MultipartForm|r\.FormFile\(|multipart\.FileHeader" --type go

# gRPC / protobuf
rg "pb\.\w+Request|\.GetName\(\)|\.GetPath\(\)|\.GetUrl\(" --type go

# CLI args
rg "os\.Args|flag\.String|flag\.Parse|cobra\.Command" --type go
```

---

## Command Injection (CWE-78)

```bash
# Sinks — command execution
rg "exec\.Command\(|exec\.CommandContext\(" --type go
rg "os/exec" --type go

# Shell invocation (high signal)
rg "exec\.Command\(\"sh\"|exec\.Command\(\"bash\"|exec\.Command\(\"/bin/sh\"|exec\.Command\(\"/bin/bash\"" --type go
rg "\"-c\"" --type go

# String formatting in commands
rg "exec\.Command.*fmt\.Sprintf|exec\.Command.*\+" --type go
rg "fmt\.Sprintf.*exec\.Command" --type go

# Dangerous: shell with user input
rg "exec\.Command\(\"sh\",\s*\"-c\",\s*[^\"']" --type go
```

---

## Path Traversal (CWE-22)

```bash
# Sinks — file operations
rg "os\.Open\(|os\.OpenFile\(|os\.Create\(|os\.ReadFile\(|os\.WriteFile\(" --type go
rg "ioutil\.ReadFile\(|ioutil\.WriteFile\(|ioutil\.ReadAll\(" --type go
rg "os\.Remove\(|os\.Rename\(|os\.Mkdir\(|os\.MkdirAll\(" --type go
rg "os\.Stat\(|os\.Lstat\(" --type go

# Path construction
rg "filepath\.Join\(|filepath\.Clean\(|path\.Join\(" --type go
rg "filepath\.Abs\(|filepath\.EvalSymlinks\(" --type go

# HTTP file serving
rg "http\.ServeFile\(|http\.FileServer\(|http\.Dir\(" --type go
rg "http\.ServeContent\(" --type go
rg "c\.File\(|c\.FileAttachment\(" --type go  # Gin

# Archive extraction (Zip Slip)
rg "archive/zip|archive/tar" --type go
rg "zip\.OpenReader|zip\.NewReader" --type go
rg "tar\.NewReader|tar\.Header" --type go
rg "\.Name\b.*os\.Create|\.Name\b.*os\.OpenFile" --type go

# Path validation (good sign)
rg "strings\.HasPrefix\(|filepath\.Rel\(" --type go
rg "strings\.Contains.*\"\.\.\"|!strings\.HasPrefix" --type go
```

---

## SSRF (CWE-918)

```bash
# Sinks — HTTP requests
rg "http\.Get\(|http\.Post\(|http\.PostForm\(|http\.Head\(" --type go
rg "http\.NewRequest\(|http\.NewRequestWithContext\(" --type go
rg "client\.Do\(|client\.Get\(|client\.Post\(" --type go
rg "httputil\.NewSingleHostReverseProxy\(" --type go

# URL from user input
rg "url\.Parse\(.*r\.|url\.Parse\(.*req\.|url\.Parse\(.*param" --type go
rg "fmt\.Sprintf\(\"https?://" --type go

# IP validation (good sign)
rg "net\.ParseIP\(|net\.LookupIP\(|net\.LookupHost\(" --type go
rg "IsLoopback\(\)|IsPrivate\(\)|IsLinkLocalUnicast\(\)|IsLinkLocalMulticast\(\)" --type go
rg "169\.254|127\.0\.0\.1|0\.0\.0\.0|metadata\.google" --type go
```

---

## SQL Injection (CWE-89)

```bash
# Sinks — raw SQL
rg "db\.Query\(|db\.QueryRow\(|db\.Exec\(" --type go
rg "tx\.Query\(|tx\.QueryRow\(|tx\.Exec\(" --type go
rg "\.Raw\(|\.Where\(" --type go  # GORM
rg "squirrel\.|sqlx\." --type go

# String formatting in SQL
rg "fmt\.Sprintf.*SELECT|fmt\.Sprintf.*INSERT|fmt\.Sprintf.*UPDATE|fmt\.Sprintf.*DELETE" --type go
rg "fmt\.Sprintf.*WHERE|fmt\.Sprintf.*FROM" --type go
rg "\"SELECT.*\"\s*\+|\"INSERT.*\"\s*\+|\"UPDATE.*\"\s*\+|\"DELETE.*\"\s*\+" --type go

# Parameterized queries (good sign)
rg "\$1|\$2|\$3" --type go  # PostgreSQL placeholders
rg "\?.*,\s*(req|r\.|param|arg)" --type go  # MySQL placeholders
```

---

## Template Injection (CWE-1336)

```bash
# Sinks — Go templates
rg "template\.New\(|template\.Must\(" --type go
rg "text/template|html/template" --type go
rg "\.Parse\(|\.ParseFiles\(|\.ParseGlob\(" --type go
rg "\.Execute\(|\.ExecuteTemplate\(" --type go

# Dangerous: user input as template string
rg "template\.New.*\.Parse\(.*r\.|template\.New.*\.Parse\(.*req\." --type go
rg "template\.Must.*Parse\(.*fmt\.Sprintf" --type go

# html/template vs text/template
rg "text/template" --type go  # no auto-escaping — higher risk
rg "html/template" --type go  # auto-escapes HTML — safer
```

---

## XML Parsing / XXE (CWE-611)

```bash
# Sinks — XML parsers
rg "xml\.Decoder|xml\.NewDecoder\(|xml\.Unmarshal\(" --type go
rg "encoding/xml" --type go
rg "etree\.NewDocument|etree\.ReadFrom" --type go  # go-etree
rg "libxml2|xmlquery|xmlpath|goquery" --type go

# Entity handling
rg "CharsetReader|Strict|Entity|AutoClose" --type go
rg "xml\.Decoder\{" --type go

# Note: Go's encoding/xml does NOT process external entities by default.
# But third-party XML libraries (etree, libxml2 bindings) may.
rg "ENTITY|DOCTYPE|SYSTEM|PUBLIC" --type go
```

---

## Panic / DoS (CWE-400)

```bash
# Patterns that can cause panics with crafted input
rg "panic\(|recover\(\)" --type go
rg "\[\w+\].*\[" --type go  # nested index access (potential out-of-bounds)
rg "make\(.*,\s*\w+\)" --type go  # allocation with user-controlled size

# Division by zero
rg "/\s*\w+" --type go -g '!*_test.go'

# Recursive functions (stack overflow)
rg "func (\w+)\(.*\{[^}]*\1\(" --type go  # self-referencing functions

# Resource exhaustion
rg "io\.ReadAll\(|ioutil\.ReadAll\(" --type go  # unbounded read
rg "json\.NewDecoder.*Decode|xml\.NewDecoder.*Decode" --type go  # large input parsing
```
