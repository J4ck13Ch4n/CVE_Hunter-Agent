# Ruby Grep Patterns

Grep patterns for hunting vulnerabilities in Ruby codebases.
Use with `rg` (ripgrep) or `grep -rn`.

---

## Sources (User Input Entry Points)

```bash
# Rails request data
rg "params\[|params\.permit|params\.require|params\.fetch" --type ruby
rg "request\.body|request\.headers|request\.env" --type ruby
rg "cookies\[|session\[" --type ruby

# Sinatra
rg "params\[|request\.body\.read" --type ruby

# File uploads
rg "params\[.*\]\[.*tempfile|ActionDispatch::Http::UploadedFile" --type ruby

# User model fields (indirect)
rg "current_user\.|@user\." --type ruby
```

---

## Command Injection (CWE-78)

```bash
# Sinks — shell execution
rg "system\(|exec\(|spawn\(" --type ruby
rg "\`[^`]*\`" --type ruby  # backtick execution
rg "%x\[|%x\{|%x\(" --type ruby  # %x literal
rg "IO\.popen\(|Open3\.(capture|popen|pipeline)" --type ruby
rg "Kernel\.system|Kernel\.exec|Kernel\.spawn" --type ruby
rg "Process\.spawn\(" --type ruby
rg "Open3\." --type ruby

# String interpolation in commands (high signal)
rg "system\(\".*\#\{|system\('.*\#\{" --type ruby
rg "\`.*\#\{" --type ruby
rg "%x\{.*\#\{|%x\[.*\#\{" --type ruby
rg "IO\.popen\(\".*\#\{" --type ruby

# Shellwords (good sign — escaping)
rg "Shellwords\.escape|Shellwords\.shellescape|shellescape" --type ruby
```

---

## Path Traversal (CWE-22)

```bash
# Sinks — file operations
rg "File\.(open|read|write|delete|rename|new|join|expand_path)" --type ruby
rg "FileUtils\.(cp|mv|rm|mkdir|copy|move|remove)" --type ruby
rg "IO\.(read|write|readlines|foreach)" --type ruby
rg "Dir\.(glob|entries|foreach|mkdir)" --type ruby
rg "Pathname\.new\(" --type ruby

# Rails file serving
rg "send_file\(|send_data\(" --type ruby
rg "render.*file:" --type ruby

# Archive extraction
rg "Zip::File|RubyZip|Archive::Zip" --type ruby
rg "Gem::Package::TarReader|Archive::Tar" --type ruby
rg "\.extract\(|\.extractall" --type ruby

# Path validation (good sign)
rg "File\.expand_path|File\.realpath|Pathname.*cleanpath" --type ruby
rg "\.start_with\?\(|\.include\?\(\"\.\.\"\)" --type ruby
rg "ActiveStorage::Filename|sanitize_filename" --type ruby
```

---

## Code Injection (CWE-94)

```bash
# Sinks — dynamic code execution
rg "instance_eval|class_eval|module_eval" --type ruby
rg "send\(|public_send\(|__send__\(" --type ruby
rg "method\(|define_method\(" --type ruby
rg "const_get\(|const_set\(" --type ruby
rg "binding\.eval\(" --type ruby

# String interpolation in eval-like methods
rg "instance_eval\(\".*\#\{|class_eval\(\".*\#\{" --type ruby
rg "send\(params|send\(.*\[" --type ruby  # method dispatch from user input
rg "public_send\(params" --type ruby

# ERB with user input
rg "ERB\.new\(.*params|ERB\.new\(.*request|ERB\.new\(.*input" --type ruby

# Deserialization
rg "Marshal\.load\(|Marshal\.restore\(" --type ruby
```

---

## SQL Injection (CWE-89)

```bash
# Sinks — raw SQL
rg "\.where\(\".*\#\{|\.where\('.*\#\{" --type ruby  # interpolation in where
rg "find_by_sql\(|execute\(|select_all\(" --type ruby
rg "ActiveRecord.*\.connection\.execute" --type ruby
rg "\.order\(\".*\#\{|\.group\(\".*\#\{|\.having\(\".*\#\{" --type ruby
rg "\.pluck\(.*Arel\.sql" --type ruby

# String interpolation in SQL
rg "\"SELECT.*\#\{|\"INSERT.*\#\{|\"UPDATE.*\#\{|\"DELETE.*\#\{" --type ruby
rg "\"WHERE.*\#\{|\"FROM.*\#\{|\"ORDER BY.*\#\{" --type ruby

# Safe patterns (good sign)
rg "\.where\(\{|\.where\(.*=>|\.where\(\".*\?\",\s" --type ruby  # hash or placeholder
rg "sanitize_sql|sanitize_sql_array|quote\(" --type ruby
```

---

## Deserialization (CWE-502)

```bash
# Sinks — unsafe deserialization
rg "Marshal\.load\(|Marshal\.restore\(" --type ruby
rg "YAML\.load\(|Psych\.load\(" --type ruby
rg "YAML\.unsafe_load\(" --type ruby
rg "JSON\.parse\(" --type ruby  # safe for code exec

# Safe patterns
rg "YAML\.safe_load\(|Psych\.safe_load\(" --type ruby
rg "permitted_classes:|allowed_classes:" --type ruby

# Oj (fast JSON parser)
rg "Oj\.load\(|Oj\.object_load\(" --type ruby  # object mode can be dangerous
```

---

## Template Injection (CWE-1336)

```bash
# Sinks — template rendering
rg "ERB\.new\(" --type ruby
rg "Liquid::Template\.parse\(" --type ruby
rg "Slim::Template\.new\(|Slim\.render\(" --type ruby
rg "Haml::Engine\.new\(" --type ruby
rg "Tilt\[|Tilt\.new\(" --type ruby

# Dangerous: user input AS the template
rg "ERB\.new\(params|ERB\.new\(.*body|ERB\.new\(.*input" --type ruby
rg "render\s+inline:" --type ruby  # Rails render inline with user data
rg "render.*inline:.*params" --type ruby  # high signal

# Safe patterns
rg "render.*template:|render.*partial:" --type ruby  # file-based rendering
```
