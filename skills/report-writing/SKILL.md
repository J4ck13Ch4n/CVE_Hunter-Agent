---
name: report-writing
description: "Generate polished, human-sounding vulnerability disclosure reports for GHSA, HackerOne, and email. Auto-selects channel, calculates CVSS, and adapts tone."
metadata:
  filePattern:
    - "**/verdict.md"
    - "**/findings.md"
    - "**/poc_*"
  bashPattern:
    - "report"
    - "disclose"
    - "submit"
  priority: 85
---

# Report Writing — Professional Vulnerability Disclosure

## When to Use

- `/report` command invoked
- Validator has issued a CONFIRMED verdict
- Director decides to submit a finding
- Need to draft a follow-up or clarification to a maintainer

## Writing Principles

### Sound Human, Not AI

Reports go to real maintainers. They can spot AI-generated text instantly and will take your report less seriously.

**Avoid:**
- Starting sentences with "It is worth noting that..." or "It should be noted..."
- "This vulnerability allows an attacker to..." (every single sentence)
- Bullet-point-only reports with no narrative flow
- Overly formal language ("hereby", "aforementioned", "thus")
- Repeating the same sentence structure back to back
- Hedging everything ("potentially", "could possibly", "might theoretically")
- Filler phrases ("in order to", "it is important to", "as a matter of fact")
- Numbered lists for everything — use prose where it reads better

**Do:**
- Write like a competent engineer explaining a bug to a colleague
- Vary sentence length — mix short punchy sentences with longer explanations
- Use active voice: "The parser accepts..." not "It can be observed that the parser..."
- Be direct about impact: "This crashes the process" not "This may potentially lead to a denial of service condition"
- Use contractions naturally: "doesn't", "won't", "can't" — especially in emails
- Start paragraphs differently — not every paragraph should begin the same way
- Include one specific detail that shows you actually tested it (Node version, OS, exact error message)

### Tone by Channel

| Channel | Tone | Length | Format |
|---------|------|--------|--------|
| GHSA | Professional, structured | Medium (300-500 words) | Markdown with headers |
| HackerOne | Concise, impact-focused | Short-medium (200-400 words) | Their template format |
| Email (first contact) | Friendly, brief | Short (100-150 words) | Plain text, no attachments |
| Email (full report) | Professional, thorough | Medium (300-500 words) | Plain text or markdown |
| Follow-up / clarification | Conversational, helpful | Short (50-150 words) | Plain text |

## Process

### Step 1: Gather Inputs

Read these files from the target directory:
- `findings.md` — Hunter's technical details
- `verdict.md` — Validator's confirmed verdict with CVSS
- `poc_*.py` or `poc_*.js` — Working PoC code
- `brief.md` — Target metadata (version, repo URL, maintainer contacts)

### Step 2: Determine Channel

```
Does the project have a HackerOne program?
  YES -> HackerOne report
  NO  -> Does the project have SECURITY.md with email?
    YES -> Email first, then GHSA if no response in 7 days
    NO  -> Does the repo have Security Advisories enabled?
      YES -> GHSA
      NO  -> Find maintainer email from package.json/GitHub profile -> Email
```

### Step 3: Calculate CVSS

Use CVSS 3.1 calculator logic:

| Factor | Question | Values |
|--------|----------|--------|
| AV (Attack Vector) | How does attacker reach it? | N=network, A=adjacent, L=local, P=physical |
| AC (Attack Complexity) | Special conditions needed? | L=no special conditions, H=race/specific config |
| PR (Privileges Required) | Auth needed? | N=none, L=low user, H=admin |
| UI (User Interaction) | Victim must do something? | N=no, R=yes (click link, open file) |
| S (Scope) | Breaks out of component? | U=no, C=yes (sandbox escape, affects other users) |
| C (Confidentiality) | Data exposed? | N=none, L=limited, H=all data |
| I (Integrity) | Data modified? | N=none, L=limited, H=full control |
| A (Availability) | Service disrupted? | N=none, L=degraded, H=full DoS |

Common patterns:
- **Unauthenticated RCE**: AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H = 9.8 CRITICAL
- **Auth required RCE**: AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H = 8.8 HIGH
- **Unauthenticated DoS (crash)**: AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H = 7.5 HIGH
- **Unauthenticated DoS (catchable)**: AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L = 5.3 MEDIUM
- **Stored XSS**: AV:N/AC:L/PR:L/UI:R/S:C/C:L/I:L/A:N = 5.4 MEDIUM
- **Path traversal read**: AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N = 7.5 HIGH
- **Path traversal write**: AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:H = 9.1 CRITICAL
- **SSRF to metadata**: AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:N/A:N = 7.7 HIGH

### Step 4: Write the Report

Select the appropriate template from `templates/` and fill it in. Then apply these rewrites:

**Humanization pass:**
1. Read the draft aloud in your head — does it sound like a person wrote it?
2. Replace any "It is important to note that X" with just "X"
3. Replace "This vulnerability allows an attacker to" with varied openers: "An attacker can...", "Parsing untrusted input...", "When processing...", "The [function] doesn't..."
4. Remove duplicate information — don't say the same thing in Summary and Description
5. Check that the PoC section is copy-pasteable (exact commands, exact version)
6. Add one human touch — a note about what you tested on, or a brief suggestion for the fix

**Structure check:**
1. Summary is one sentence, max two
2. Impact section answers "so what?" for a non-security person
3. PoC has exact reproduction steps a developer can follow in 2 minutes
4. Suggested fix is actionable (not just "validate input" — say HOW)

### Step 5: Write Subject Line (for email)

Format: `[Security] [SEVERITY] vulnerability in [PROJECT] [VERSION]`

Good: `[Security] HIGH severity path traversal in archiver v5.3.1`
Bad: `Security Vulnerability Found In Your Project`
Bad: `URGENT: Critical Security Issue Detected`

## Follow-Up Templates

### No response after 7 days
```
Hi [name],

Just following up on my security report from [date]. I understand you may be busy — happy to provide any additional details or clarify anything about the finding.

If you'd prefer I submit this through a different channel (GitHub Security Advisory, etc.), I'm happy to do that instead.

Best,
[name]
```

### Maintainer asks for more info
```
Sure — here's the additional detail:

[answer their specific question concisely]

The key thing is [restate the core issue in one sentence]. Happy to jump on a call if that would be easier.
```

### Maintainer disputes severity
```
Thanks for looking at this. I see your point about [their argument].

My reasoning for [SEVERITY] was [brief CVSS justification]. But I'm happy to adjust — the important thing is getting it fixed. Would [LOWER_SEVERITY] work better for you?
```

### Maintainer says "won't fix"
```
I understand — thanks for taking the time to review it.

Would you be open to adding a note in the README about [the risk] so users handling untrusted input are aware? That way the behavior is documented and users can make an informed decision.

Either way, thanks for your time.
```

## References

- [Humanization Guide](references/humanization-guide.md) — Detailed patterns for natural writing
- [CVSS Quick Reference](references/cvss-quick-reference.md) — Common vectors and score calculation
- [Channel Selection](references/channel-selection.md) — How to find the right disclosure channel
