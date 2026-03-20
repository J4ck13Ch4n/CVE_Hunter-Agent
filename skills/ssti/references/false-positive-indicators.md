# False Positive Indicators -- SSTI

### 1. User Input Only in Template Variables
User input is passed as template context/data, NOT as the template string itself. This is normal and safe template usage.

### 2. Template Loaded From File System
Template string comes from a file on disk, not user input. Even if variables are user-controlled, the template structure is trusted.

### 3. Sandboxed Template Engine
Engine runs in sandboxed mode (Jinja2 SandboxedEnvironment, Liquid). Still check for known bypasses.

### 4. Logic-Less Template Engine
Mustache and similar logic-less engines cannot execute code -- they only do variable substitution and basic looping.

### 5. Auto-Escaping Enabled
Auto-escaping prevents XSS in template output BUT does NOT prevent SSTI. This is NOT a valid mitigation for SSTI.

### 6. Client-Side Template Only
Template renders in the browser (Angular, Vue, React). Impact is XSS, not RCE. Still reportable but different severity.

### 7. Admin-Only Feature
Template editing is restricted to admin users who already have full system access. Check if the access level genuinely provides no new capability.
