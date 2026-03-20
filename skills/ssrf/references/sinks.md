# HTTP Request Sinks by Language

## JavaScript / TypeScript
| Sink | Follows Redirects? | Notes |
|------|-------------------|-------|
| `fetch()` | Yes (by default) | Native, supports all methods |
| `axios.get/post()` | Yes | Popular, follows redirects by default |
| `got()` | Yes | Follows redirects by default |
| `node-fetch` | Yes | Follows up to 20 redirects by default |
| `http.get()` / `https.get()` | No | Native, no redirect following |
| `request()` | Yes | Deprecated but widely used |
| `superagent` | Yes | |
| `needle` | Yes | Follows redirects |
| `undici.fetch()` | Yes | Modern HTTP client |

## Python
| Sink | Follows Redirects? | Notes |
|------|-------------------|-------|
| `requests.get()` | Yes | Up to 30 redirects by default |
| `urllib.request.urlopen()` | Yes | Standard library |
| `httpx.get()` | Yes | Modern async-capable |
| `aiohttp.ClientSession.get()` | Yes | Async |
| `urllib3` | Configurable | |

## Go
| Sink | Follows Redirects? | Notes |
|------|-------------------|-------|
| `http.Get()` | Yes | Up to 10 redirects |
| `http.Client.Do()` | Configurable | CheckRedirect function |
| `http.NewRequest()` + `Do()` | Configurable | |

## Ruby
| Sink | Follows Redirects? | Notes |
|------|-------------------|-------|
| `Net::HTTP.get()` | No | Must handle manually |
| `open-uri open()` | Yes | Follows redirects |
| `Faraday.get()` | Configurable | |
| `HTTParty.get()` | Yes | |
| `RestClient.get()` | Yes | |
