# Verdict: {{PROJECT_NAME}} — {{VULN_TYPE}}

## Status: {{CONFIRMED / FALSE_POSITIVE / NEEDS_MORE_INFO}}

## Verification Summary
- **Tested Version**: {{EXACT_VERSION}}
- **Tested Locally**: YES/NO
- **PoC Executed**: {{COUNT}} times
- **PoC Result**: {{What happened — concrete evidence}}

## fp-check Gates
| Gate | Result | Evidence |
|------|--------|----------|
| 1. Process | PASS/FAIL | {{brief}} |
| 2. Reachability | PASS/FAIL | {{brief}} |
| 3. Real Impact | PASS/FAIL | {{brief}} |
| 4. PoC Validation | PASS/FAIL | {{brief}} |
| 5. Math Bounds | PASS/FAIL | {{brief}} |
| 6. Environment | PASS/FAIL | {{brief}} |

## CVSS Vector
AV:{{_}}/AC:{{_}}/PR:{{_}}/UI:{{_}}/S:{{_}}/C:{{_}}/I:{{_}}/A:{{_}} = {{SCORE}} {{SEVERITY}}

## Reproduction
```
{{exact command to reproduce}}
```

## Recommended Channel
{{GitHub Advisory / HackerOne / security@email}}

## Notes
{{Any additional context, false positive indicators checked, version warnings}}
