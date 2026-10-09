---
name: check-nvd
description: "Query OSV and NVD for an exact package identity. Usage: /check-nvd <ecosystem> <package> [version]."
---

# /check-nvd <ecosystem> <package> [version]

Do not assume npm. Require ecosystem, package name, and exact version when available.

## Process

1. Run the bundled OSV helper:

```bash
"${CLAUDE_PLUGIN_ROOT}/scripts/check-osv.sh" <ecosystem> <package> [version]
```

For project-local manual installs use:

```bash
"${CLAUDE_PROJECT_DIR}/.claude/find-cve-agent/scripts/check-osv.sh" <ecosystem> <package> [version]
```

2. Run NVD keyword search as secondary candidate discovery:

```bash
"${CLAUDE_PLUGIN_ROOT}/scripts/check-nvd.sh" <package>
```

3. Verify every candidate against package identity, repository, affected range, and exact version. A keyword match alone is not a duplicate.
4. Check repository security advisories and security-related release notes.
5. Return one status:
   - `CLEAN`: no matching advisory after successful queries.
   - `DUPLICATE`: existing advisory covers exact issue and version.
   - `GAPS_REMAIN`: advisories exist but target vectors remain uncovered.
   - `UNKNOWN`: any required API query or identity check failed.
6. Update Registry only for verified duplicates. Never convert an API failure into `CLEAN`.
