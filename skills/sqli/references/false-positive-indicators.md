# False Positive Indicators -- SQL Injection

### 1. Uses Parameterized Queries
Query uses `?` or `$1` placeholders with separate parameter array.

### 2. ORM Handles Escaping
Query uses ORM query builder (not raw methods). Verify no `.raw()` or `.query()` bypass.

### 3. Input From Trusted Source
Query parameters come from internal/admin sources, not user input.

### 4. Integer-Only Parameter
Input is validated as integer only (`parseInt`, `Number`, type check) before use in query.

### 5. Strict Allowlist for Dynamic Columns
Column/table names validated against strict allowlist before use in ORDER BY or similar.

### 6. Read-Only Query With No Sensitive Data
SELECT query on public data with no way to UNION or extract other tables.
