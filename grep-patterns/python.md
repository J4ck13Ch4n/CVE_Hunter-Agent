# Python Grep Patterns

Grep patterns for hunting vulnerabilities in Python codebases.
Use with `rg` (ripgrep) or `grep -rn`.

---

## Sources (User Input Entry Points)

```bash
# Flask / Django / FastAPI request data
rg "request\.(form|args|json|data|files|values|cookies|headers)" --type py
rg "request\.GET|request\.POST|request\.META|request\.body" --type py
rg "request\.query_params|request\.data" --type py  # DRF

# FastAPI path/query params
rg "def .*(request:|Query\(|Path\(|Body\(|Header\(|Cookie\()" --type py

# CLI args / stdin
rg "sys\.argv|argparse|click\.|typer\." --type py
rg "input\(|sys\.stdin" --type py

# File uploads
rg "request\.files|UploadFile|FileStorage" --type py
rg "save\(|filename|secure_filename" --type py
```

---

## Command Injection (CWE-78)

```bash
# Sinks — shell execution
rg "subprocess\.(call|run|Popen|check_output|check_call|getoutput|getstatusoutput)" --type py
rg "os\.(system|popen|popen2|popen3|popen4)" --type py
rg "commands\.(getoutput|getstatusoutput)" --type py

# shell=True (critical flag)
rg "shell\s*=\s*True" --type py

# Format strings in commands
rg "subprocess.*f\"|subprocess.*\.format\(|subprocess.*%" --type py
rg "os\.system\(f\"|os\.system\(.*\.format|os\.system\(.*%" --type py
rg "os\.popen\(f\"|os\.popen\(.*\.format" --type py
```

---

## Path Traversal (CWE-22)

```bash
# Sinks — file operations
rg "open\(|with open\(" --type py
rg "os\.path\.join\(" --type py
rg "shutil\.(copy|copy2|move|copyfile|copytree|rmtree)" --type py
rg "os\.(rename|remove|unlink|mkdir|makedirs|rmdir)" --type py
rg "pathlib\.Path\(" --type py
rg "send_file\(|send_from_directory\(" --type py  # Flask

# Archive extraction (Zip Slip)
rg "zipfile\.ZipFile|ZipFile\(" --type py
rg "\.extractall\(|\.extract\(" --type py
rg "tarfile\.open|TarFile\(" --type py
rg "shutil\.unpack_archive" --type py

# Path validation (good sign)
rg "os\.path\.realpath|os\.path\.abspath" --type py
rg "\.startswith\(|\.resolve\(\)" --type py
rg "secure_filename" --type py  # Werkzeug
```

---

## Code Injection (CWE-94)

```bash
# Sinks — dynamic code execution
rg "\bexec\(|\bcompile\(" --type py
rg "ast\.literal_eval" --type py  # safe alternative (good sign)
rg "__import__\(" --type py

# Dangerous builtins
rg "getattr\(|setattr\(|delattr\(" --type py
rg "globals\(\)|locals\(\)" --type py

# Template rendering as code
rg "jinja2\.Environment|Environment\(" --type py
rg "from_string\(|Template\(" --type py
```

---

## SSRF (CWE-918)

```bash
# Sinks — HTTP requests
rg "requests\.(get|post|put|delete|patch|head|options|request)\(" --type py
rg "urllib\.request\.(urlopen|urlretrieve|Request)" --type py
rg "urllib3|httpx\.(get|post|AsyncClient)|aiohttp\.(get|post|ClientSession)" --type py
rg "http\.client\.HTTPConnection|http\.client\.HTTPSConnection" --type py

# URL construction with user input
rg "f\"https?://\{|f'https?://\{|\"https?://\".*\.format\(|\"https?://\".*%" --type py

# Private IP protection (good sign)
rg "ipaddress\.(ip_address|ip_network)|is_private|is_loopback|is_reserved" --type py
rg "ssrf|private_ip|internal_ip|blocklist" --type py
```

---

## SQL Injection (CWE-89)

```bash
# Sinks — raw SQL
rg "cursor\.execute\(|\.execute\(" --type py
rg "\.raw\(|RawSQL|extra\(|\.executemany\(" --type py
rg "text\(|TextClause" --type py  # SQLAlchemy text()
rg "connection\.execute\(" --type py

# String formatting in SQL
rg "execute\(f\"|execute\(.*\.format|execute\(.*%" --type py
rg "SELECT.*f\"|INSERT.*f\"|UPDATE.*f\"|DELETE.*f\"" --type py
rg "WHERE.*\{|WHERE.*%s.*%" --type py

# ORM safe patterns (good sign)
rg "\.filter\(|\.filter_by\(|\.get\(|\.where\(" --type py  # ORM filters
rg "parameterized|placeholder|\%s.*,\s*\(" --type py  # parameterized queries
```

---

## Deserialization (CWE-502)

```bash
# Sinks — unsafe deserialization (can execute arbitrary code via __reduce__)
rg "pickle\.\w+load" --type py
rg "cPickle\.\w+load" --type py
rg "_pickle\.\w+load" --type py
rg "marshal\.(loads|load)" --type py
rg "shelve\.open\(" --type py
rg "yaml\.(load|unsafe_load|full_load)" --type py
rg "yaml\.safe_load" --type py  # safe pattern (good sign)

# JSON is safe for code exec but check for special handling
rg "json\.loads\(|json\.load\(" --type py
rg "jsonpickle|dill\.\w+load" --type py

# Dangerous Loader patterns
rg "Loader=yaml\.Loader|Loader=yaml\.UnsafeLoader|Loader=yaml\.FullLoader" --type py
```

---

## Template Injection (CWE-1336)

```bash
# Sinks — template engines with user-controlled templates
rg "jinja2|Jinja2|Environment\(" --type py
rg "\.from_string\(|Template\(.*request|render_template_string" --type py
rg "mako\.template|MakoTemplate|Template\(" --type py
rg "django\.template\.Template\(" --type py
rg "tornado\.template\.Template\(" --type py
rg "Cheetah\.Template|CheetahTemplate" --type py

# Key distinction: render_template(name, **data) is SAFE
# render_template_string(user_input) is DANGEROUS
rg "render_template_string" --type py  # high signal

# Sandbox configuration (good sign)
rg "SandboxedEnvironment|sandbox" --type py
rg "autoescape\s*=\s*True" --type py
```
