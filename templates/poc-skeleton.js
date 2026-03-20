/**
 * CVE-CANDIDATE: {{VULN_TYPE}} in {{PACKAGE_NAME}}
 * CWE: CWE-{{NUMBER}}
 * CVSS: {{SCORE}} {{SEVERITY}}
 * Affected Version: {{VERSION}}
 * Tested On: Node.js {{NODE_VERSION}}
 *
 * Description: {{One-line description}}
 *
 * Usage: node poc_{{vuln_type}}.js
 */

const packageName = require('{{package-name}}');

// Step 1: Setup
console.log('[*] Setting up test environment...');
// {{Setup code}}

// Step 2: Craft malicious input
console.log('[*] Crafting malicious input...');
const payload = '{{PAYLOAD}}';

// Step 3: Trigger the vulnerability
console.log('[*] Triggering vulnerability...');
try {
  const result = packageName.vulnerableFunction(payload);

  // Step 4: Verify exploitation
  console.log('[+] Vulnerability triggered successfully!');
  console.log('[+] Evidence:', result);
} catch (error) {
  // For DoS vulns, the error/crash IS the evidence
  console.log('[+] Vulnerability triggered:', error.message);
}

// Step 5: Cleanup (if needed)
console.log('[*] Done.');
