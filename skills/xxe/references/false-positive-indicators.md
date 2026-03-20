# False Positive Indicators -- XXE

### 1. Parser Disables External Entities by Default
Most modern parsers (lxml, Nokogiri, encoding/xml) disable external entities by default. Check the library documentation.

### 2. DTD Processing Disabled
Parser configured with disallow-doctype-decl or equivalent.

### 3. Input Not User-Controlled
XML comes from trusted internal sources, not user input.

### 4. PHP 8.0+ Default
PHP 8.0+ disables LIBXML_NOENT by default, preventing most XXE attacks.

### 5. defusedxml Used
Python code uses defusedxml wrapper, which blocks all dangerous XML features.

### 6. Network-Isolated Environment
Server has no network access to fetch external entities. file:// may still work.

### 7. Go encoding/xml
Go standard library XML parser does not support custom entities at all.
