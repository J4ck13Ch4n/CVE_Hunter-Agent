# Channel Selection — Finding the Right Disclosure Path

## Decision Tree

```
1. Check HackerOne directory (hackerone.com/directory)
   Found? -> Use HackerOne

2. Check repo's SECURITY.md (or .github/SECURITY.md)
   Has security email? -> Email first contact

3. Check repo's Security tab on GitHub
   Advisories enabled? -> Submit GHSA

4. Check package.json / setup.py / go.mod for author email
   Found? -> Email first contact

5. Check GitHub profile of top maintainer
   Public email? -> Email first contact

6. Last resort: Open a private GitHub issue (NOT public)
   Or: Submit GHSA even without maintainer response
```

## How to Check Each Channel

### HackerOne
```bash
# Search the directory
curl -s "https://hackerone.com/directory/programs" | grep -i "PROJECT_NAME"

# Or just visit: hackerone.com/directory and search
```

### SECURITY.md
```bash
# Check common locations
gh api repos/OWNER/REPO/contents/SECURITY.md --jq '.content' | base64 -d
gh api repos/OWNER/REPO/contents/.github/SECURITY.md --jq '.content' | base64 -d
```

### GitHub Security Advisories
```bash
# Check if the repo has the security tab
gh api repos/OWNER/REPO --jq '.has_vulnerability_alerts'
# Or just navigate to: github.com/OWNER/REPO/security/advisories/new
```

### Package Maintainer Email
```bash
# npm
npm view PACKAGE maintainers
npm view PACKAGE author

# PyPI
pip show PACKAGE | grep -i "author-email"

# Go
# Check go.mod for module path, then find repo
```

## Channel Comparison

| Factor | HackerOne | GHSA | Email | GitHub Issue |
|--------|-----------|------|-------|-------------|
| CVE assignment | Auto (via HackerOne CNA) | Auto (via GitHub CNA) | Manual (MITRE) | No |
| Tracking | Full | Good | None | Public |
| Confidential | Yes | Yes (until published) | Depends | No |
| Payment | If bounty program | No | No | No |
| Response time | 1-30 days | 1-14 days | Varies wildly | Varies |
| Mediation | Yes (HackerOne team) | No | No | No |

## Timing

| Event | Action |
|-------|--------|
| Day 0 | Discover and verify |
| Day 1-3 | Write report, select channel |
| Day 3-7 | Submit via chosen channel |
| Day 14 | Follow up if no acknowledgment |
| Day 30 | Second follow-up, consider alternate channel |
| Day 60 | Final reminder with disclosure date |
| Day 90 | Disclosure (notify maintainer 7 days before) |

## Multi-Channel Strategy

Sometimes you need to use multiple channels:

1. **Email first, GHSA second**: Email the maintainer. If no response in 7-14 days, submit a GHSA. Mention in the GHSA that you already tried email.

2. **HackerOne scope miss**: If HackerOne triager says "out of scope" but it's a real vuln, submit a GHSA instead. Don't argue with HackerOne triage — just use another channel.

3. **Maintainer unresponsive**: After 30 days with no response via email, submit a GHSA. GitHub will attempt to notify the maintainer through their platform.
