# find-cve-agent

**Open Source CVE Hunting Harness for Claude Code**

A Claude Code plugin that systematically finds real CVEs in open source packages through coordinated multi-agent security research.

---

## What It Is

`find-cve-agent` is a battle-tested harness of 22 skills organized as a 6-agent team. It provides structured workflows for every phase of vulnerability research: target discovery, code review, PoC development, false positive elimination, and responsible disclosure.

Every skill encodes practical knowledge about what gets accepted, what gets rejected, and how to avoid wasting time on false positives.

## Philosophy

- **Quality over quantity.** One confirmed CVE beats ten false positives.
- **False positive elimination is a first-class concern.** Every finding passes a 6-gate verification process before submission.
- **Responsible disclosure only.** 90-day coordinated timeline, no production exploitation, PoCs run locally.
- **Learn from mistakes.** The plugin encodes patterns from past false positives so you don't repeat them.

---

## Quick Start

```bash
# Clone the plugin
git clone https://github.com/J4ck13Ch4n/CVE_Hunter-Agent.git

# Run directly as a plugin while developing
cd CVE_Hunter-Agent
claude --plugin-dir .

# Or install project-local commands, agents, skills, hooks, and resources
./install.sh --project /path/to/your-research-workspace
./install.sh --project /path/to/your-research-workspace --check

# Start hunting inside Claude Code
/hunt <package-name>
```

Project-local install preserves existing `CLAUDE.md` and `REGISTRY.md`. Re-running installer updates managed plugin files without duplicating hook settings.

### Troubleshooting

- **Hooks missing:** run `./install.sh --project /path/to/workspace --check`; reinstall if entry files are absent. For direct use, launch Claude Code from plugin root with `claude --plugin-dir .`.
- **GitHub auth fails:** run `gh auth status`, then `gh auth login`; clone over HTTPS or SSH according to configured credentials.
- **`gh` missing:** install GitHub CLI and rerun `gh auth status`. Registry/API checks return `UNKNOWN` when required external checks fail.
- **Registry conflict:** inspect `REGISTRY.md`; resume `IN_PROGRESS`, or choose another target for `SUBMITTED`, `SKIP`, `DUPLICATE`, and unresolved `FALSE POSITIVES` entries. Clone gate blocks exact owner/repo identity.
- **Approval block:** set only boolean approval fields in target `workflow.json` after Director approval. PoCs remain local-only; remote endpoints are blocked.
- **API failure:** treat helper exit status `1` and JSON `status: UNKNOWN` as unknown, never as `CLEAN`; retry later or verify through another source.

**Recommended:** Also install [blader/humanizer](https://github.com/blader/humanizer) to auto-clean AI patterns from disclosure reports before sending.

---

## Agent Team

| Agent | Role | Key Responsibility |
|-------|------|--------------------|
| **Director** | Human lead | Approves targets, approves PoC plans, final submit/drop |
| **Recon** | Target discovery | Finds promising packages on npm/PyPI/GitHub |
| **Hunter** | Code review | Traces data flows from source to sink |
| **Exploiter** | PoC builder | Writes exploits, chains findings for max impact |
| **Validator** | FP eliminator | 6-gate verification, kills false positives |
| **Registry** | Bookkeeper | Tracks all targets, prevents duplicate work |

---

## Available Commands

| Command | Description |
|---------|-------------|
| `/hunt <package>` | Full pipeline: registry check -> clone -> review -> PoC -> validate -> report |
| `/recon <category>` | Find targets in a category (e.g., "csv parsers", "template engines") |
| `/recon-wp <category>` | Find WordPress plugin targets for the Patchstack bug bounty (5K-10K installs, Unauthenticated/Subscriber/Customer only) |
| `/check-nvd <package>` | Query NVD and OSV.dev for existing CVEs |
| `/fp-check` | Run the 6-gate false positive elimination on current finding |
| `/report` | Generate a disclosure report from current finding |
| `/registry [query]` | Query or update the research registry |
| `/cross-pollinate` | Find the same vulnerability pattern in similar packages |

---

## Available Skills

### Reconnaissance
1. **Target Discovery** — Find under-audited packages with high attack surface
2. **Download Analysis** — Assess real-world usage via registry download counts
3. **Advisory Mining** — Find incomplete fixes for existing CVEs
4. **Attack Surface Mapping** — Identify entry points and data flows

### Hunting
5. **Command Injection Search** — Find exec/spawn/system sinks
6. **Path Traversal Search** — Find file write operations with user paths
7. **Template Injection Search** — Find compile-from-string patterns
8. **Deserialization Search** — Find unsafe object reconstruction
9. **SSRF Search** — Find user-controlled URL fetching
10. **XXE Search** — Find XML parsing without entity limits
11. **SQL Injection Search** — Find string concatenation in queries
12. **Auth Bypass Search** — Find missing or flawed auth checks
13. **ReDoS Search** — Find exponential-backtracking regex patterns
14. **Prototype Pollution Search** — Find unsafe merge/clone/assign

### Exploitation
15. **PoC Builder** — Structured exploit script generation
16. **Chain Escalation** — Combine findings for higher impact
17. **CVSS Calculator** — Accurate severity scoring

### Validation
18. **FP-Check (6 Gates)** — Systematic false positive elimination
19. **Version Verification** — Confirm vuln exists in latest release

### Reporting
20. **Disclosure Report Generator** — Format findings for submission channels

---

## Directory Structure

```
find-cve-agent/
+-- .claude-plugin/
|   +-- plugin.json          # Plugin manifest
+-- knowledge/agent-architecture.md  # Extended architecture reference
+-- README.md                # This file
+-- LICENSE                  # Apache-2.0
+-- install.sh               # Installation script
+-- agents/
|   +-- recon.md             # Target discovery agent
|   +-- recon-wp.md          # WordPress plugin target discovery agent (Patchstack)
|   +-- hunter.md            # Code review agent
|   +-- exploiter.md         # PoC builder agent
|   +-- validator.md         # FP elimination agent
|   +-- registry.md          # Tracking agent
+-- commands/
|   +-- hunt.md              # /hunt command
|   +-- recon.md             # /recon command
|   +-- recon-wp.md          # /recon-wp command
|   +-- check-nvd.md         # /check-nvd command
|   +-- fp-check.md          # /fp-check command
|   +-- report.md            # /report command
|   +-- registry.md          # /registry command
|   +-- cross-pollinate.md   # /cross-pollinate command
+-- hooks/
|   +-- hooks.json           # Hook configuration
|   +-- session-start-context.mjs
|   +-- pretooluse-clone-dedup.mjs
|   +-- pretooluse-finding-selfcheck.mjs
|   +-- posttooluse-version-check.mjs
+-- skills/                  # 22 runtime skills
+-- scripts/                 # NVD, OSV, and npm helpers
+-- rules/                   # Disclosure and validation rules
+-- knowledge/               # Research references
+-- semgrep/                 # Static-analysis rules
+-- grep-patterns/           # Language search patterns
+-- templates/
    +-- REGISTRY.md          # Empty registry template
```

---

## Environment Requirements

- **Required:** git, gh (GitHub CLI), python3, node, curl
- **Optional:** npm, pip3 (for target-specific testing)
- **Platform:** macOS or Linux
- **Claude Code:** Latest version with plugin support

---

## Contributing

Contributions welcome. Areas of interest:

- **New vulnerability search patterns** — Add skills for emerging vuln classes
- **False positive patterns** — Document new FP patterns you've encountered
- **Disclosure templates** — Improve report formatting for different channels
- **Agent improvements** — Better prompts, better workflows

Please open an issue first to discuss significant changes.

---

## License

Apache-2.0. See [LICENSE](LICENSE).

---

## Disclaimer

This tool is for **authorized security research only**. It is designed for:

- Coordinated vulnerability disclosure in open source projects
- Security research with responsible disclosure timelines
- CTF competitions and educational contexts

Do NOT use this tool to:
- Attack production systems without authorization
- Exploit vulnerabilities for malicious purposes
- Bypass responsible disclosure timelines
- Mass-scan repositories without manual review

The authors assume no liability for misuse. You are responsible for ensuring your research complies with applicable laws and the target project's security policy.
