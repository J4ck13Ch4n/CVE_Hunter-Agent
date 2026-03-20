# Finding: {{VULN_TYPE}} in {{PROJECT_NAME}}

## Summary
{{One-line description}}

## Details
- **File**: {{FILE_PATH}}:{{LINE}}
- **Sink**: {{Function/operation at vulnerable line}}
- **Source**: {{Where user input enters}} ({{FILE}}:{{LINE}})
- **Data Flow**: {{endpoint -> parameter -> function chain -> sink}}
- **Validation**: {{None found / what exists and why insufficient}}
- **Auth Required**: {{Yes/No}} ({{privilege level}})
- **Default Config**: {{Yes — vulnerable in default config / No — requires specific config}}

## CVSS Estimate
- **Score**: {{X.X}} {{SEVERITY}}
- **Vector**: AV:{{N/A/L/P}}/AC:{{L/H}}/PR:{{N/L/H}}/UI:{{N/R}}/S:{{U/C}}/C:{{N/L/H}}/I:{{N/L/H}}/A:{{N/L/H}}

## CWE
- **Primary**: CWE-{{NUMBER}} — {{Name}}
- **Secondary**: CWE-{{NUMBER}} — {{Name}} (if applicable)

## Similar CVEs
{{CVE-XXXX-XXXXX if known similar vulnerabilities exist, or "None found"}}

## Chaining Opportunities
{{Can this combine with other findings for higher severity?}}

## Recommendation for Exploiter
{{Specific guidance on PoC approach}}
