# XML Parser Default Safety by Language

## Python
| Parser | External Entities | Safe by Default? |
|--------|-------------------|-----------------|
| xml.etree.ElementTree | YES | NO |
| xml.sax | YES | NO |
| xml.dom.minidom | YES | NO |
| lxml etree | NO (default) | YES |
| defusedxml | NO | YES (hardened wrapper) |
| xmltodict | Uses expat | CHECK |

### Making Python XML Safe
```python
# Option 1: Use defusedxml (recommended)
import defusedxml.ElementTree as ET

# Option 2: Disable external entities manually
from xml.sax.handler import feature_external_ges
parser = xml.sax.make_parser()
parser.setFeature(feature_external_ges, False)
```

## Java
| Parser | External Entities | Safe by Default? |
|--------|-------------------|-----------------|
| DocumentBuilderFactory | YES | NO |
| SAXParserFactory | YES | NO |
| XMLReader | YES | NO |
| TransformerFactory | YES | NO |
| SchemaFactory | YES | NO |
| XMLInputFactory (StAX) | YES | NO |

### Making Java XML Safe
```java
DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
dbf.setFeature("http://xml.org/sax/features/external-general-entities", false);
dbf.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
```

## PHP
| Parser | External Entities | Safe by Default? |
|--------|-------------------|-----------------|
| simplexml_load_string | libxml2 defaults | CHECK PHP version |
| DOMDocument::loadXML | libxml2 defaults | CHECK PHP version |
| XMLReader | libxml2 defaults | CHECK PHP version |

PHP 8.0+ sets LIBXML_NOENT to false by default.

## Go
encoding/xml does NOT support external entities. SAFE.

## Ruby
| Parser | External Entities | Safe by Default? |
|--------|-------------------|-----------------|
| Nokogiri | NO | YES |
| REXML | YES | NO |
