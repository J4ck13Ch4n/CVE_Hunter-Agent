# PHP Grep Patterns

Grep patterns for hunting vulnerabilities in PHP codebases.
Use with `rg` (ripgrep) or `grep -rn`.

---

## Sources (User Input Entry Points)

```bash
# Superglobals
rg "\\\$_GET|\\\$_POST|\\\$_REQUEST|\\\$_COOKIE|\\\$_SERVER|\\\$_FILES" --type php
rg "\\\$_SESSION|\\\$_ENV" --type php

# Framework request objects
rg "\\\$request->input\(|\\\$request->get\(|\\\$request->query\(|\\\$request->post\(" --type php
rg "\\\$request->file\(|\\\$request->header\(" --type php  # Laravel
rg "Request::input\(|Request::get\(" --type php

# php://input (raw body)
rg "php://input|file_get_contents\('php://input'\)" --type php

# argv
rg "\\\$argv|\\\$argc|getopt\(" --type php
```

---

## Command Injection (CWE-78)

```bash
# Sinks — shell execution
rg "shell_exec\(|exec\(|system\(|passthru\(|popen\(|proc_open\(" --type php
rg "pcntl_exec\(" --type php
rg "backtick|\`" --type php

# String concatenation in commands
rg "shell_exec\(.*\\\$|exec\(.*\\\$|system\(.*\\\$|passthru\(.*\\\$" --type php
rg "shell_exec\(.*\\..*\\\$|exec\(.*\\..*\\\$" --type php
rg "popen\(.*\\\$" --type php

# Sanitization (good sign)
rg "escapeshellarg\(|escapeshellcmd\(" --type php
```

---

## Path Traversal (CWE-22)

```bash
# Sinks — file operations
rg "file_get_contents\(|file_put_contents\(|fopen\(|readfile\(|file\(" --type php
rg "include\(|include_once\(|require\(|require_once\(" --type php
rg "move_uploaded_file\(|copy\(|rename\(|unlink\(|mkdir\(|rmdir\(" --type php
rg "symlink\(|link\(" --type php
rg "SplFileObject\(" --type php
rg "ZipArchive|PharData" --type php

# Dynamic file inclusion (LFI/RFI)
rg "include\(.*\\\$|require\(.*\\\$|include_once\(.*\\\$|require_once\(.*\\\$" --type php

# Archive extraction
rg "ZipArchive.*extractTo|PharData.*extractTo" --type php
rg "->extractTo\(" --type php

# Path validation (good sign)
rg "realpath\(|basename\(|pathinfo\(" --type php
rg "DIRECTORY_SEPARATOR|\.\." --type php
rg "str_contains.*\.\.|strpos.*\.\." --type php
```

---

## Code Injection (CWE-94)

```bash
# Sinks — dynamic code execution
rg "assert\(.*\\\$" --type php  # assert() evaluates strings in PHP < 8
rg "preg_replace.*\/e" --type php  # /e modifier (deprecated but exists)
rg "create_function\(" --type php  # deprecated but exists in legacy
rg "call_user_func\(|call_user_func_array\(" --type php
rg "array_map\(.*\\\$|array_filter\(.*\\\$|usort\(.*\\\$" --type php

# Variable variables
rg "\\\$\\\$" --type php  # $$var — variable variable

# Dynamic class instantiation
rg "new \\\$|new \\\${" --type php
rg "ReflectionClass\(.*\\\$|ReflectionMethod\(.*\\\$" --type php

# Unserialize
rg "unserialize\(" --type php  # also deserialization

# Safe patterns
rg "allowed_classes\s*=>\s*false|allowed_classes.*\[\]" --type php
```

---

## SQL Injection (CWE-89)

```bash
# Sinks — raw SQL
rg "mysqli_query\(|mysql_query\(|pg_query\(" --type php
rg "->query\(|->exec\(|->execute\(" --type php
rg "PDO::query|PDO::exec" --type php
rg "DB::raw\(|DB::select\(|DB::statement\(" --type php  # Laravel
rg "whereRaw\(|havingRaw\(|orderByRaw\(|selectRaw\(|groupByRaw\(" --type php  # Laravel raw

# String concatenation in SQL
rg "\"SELECT.*\\\$|'SELECT.*\\\$|\"INSERT.*\\\$|\"UPDATE.*\\\$|\"DELETE.*\\\$" --type php
rg "\"WHERE.*\\\$|\"FROM.*\\\$|\"ORDER BY.*\\\$" --type php
rg "->query\(\".*\\\$|->query\('.*\\\$" --type php

# Prepared statements (good sign)
rg "->prepare\(|bindParam\(|bindValue\(|PDO::PARAM" --type php
rg "DB::select\(.*\?" --type php  # Laravel parameterized
```

---

## Deserialization (CWE-502)

```bash
# Sinks — unsafe deserialization
rg "unserialize\(" --type php
rg "maybe_unserialize\(" --type php  # WordPress

# Object injection indicators
rg "__wakeup\(|__destruct\(|__toString\(|__call\(" --type php  # magic methods (gadget chains)
rg "__unserialize\(|__serialize\(" --type php

# Safe patterns
rg "allowed_classes.*false|allowed_classes.*\[\]" --type php  # PHP 7+ option
rg "json_decode\(" --type php  # safe alternative

# Phar deserialization
rg "phar://|Phar\(" --type php  # phar:// wrapper triggers unserialize
rg "file_exists\(.*phar|is_file\(.*phar|file_get_contents\(.*phar" --type php
```

---

## SSRF (CWE-918)

```bash
# Sinks — HTTP requests
rg "file_get_contents\(|fopen\(.*http" --type php  # PHP wrappers can fetch URLs
rg "curl_init\(|curl_setopt.*CURLOPT_URL|curl_exec\(" --type php
rg "Guzzle|GuzzleHttp|->request\(|->get\(|->post\(" --type php
rg "SoapClient\(|SimpleXMLElement\(.*http" --type php
rg "HttpClient|Symfony.*HttpClient" --type php

# URL from user input
rg "curl_setopt.*\\\$|CURLOPT_URL.*\\\$" --type php
rg "file_get_contents\(.*\\\$_(GET|POST|REQUEST)" --type php

# PHP stream wrappers (can be abused)
rg "php://|data://|expect://|glob://|phar://|zip://|compress\." --type php

# Validation (good sign)
rg "filter_var.*FILTER_VALIDATE_URL|parse_url\(" --type php
rg "gethostbyname\(|dns_get_record\(" --type php
```

---

## File Upload (CWE-434)

```bash
# Upload handling
rg "move_uploaded_file\(|\\\$_FILES" --type php
rg "getClientOriginalName\(|getClientOriginalExtension\(|getMimeType\(" --type php  # Laravel

# Dangerous: trusting client-provided values
rg "\\\$_FILES\[.*\]\['name'\]|\\\$_FILES\[.*\]\['type'\]" --type php
rg "getClientOriginalExtension\(\)" --type php  # can be spoofed

# Validation (good sign)
rg "getimagesize\(|finfo_file\(|mime_content_type\(" --type php
rg "in_array.*\\\$ext|allowed_extensions|ALLOWED_TYPES" --type php
rg "php_upload_max|upload_max_filesize" --type php
```
