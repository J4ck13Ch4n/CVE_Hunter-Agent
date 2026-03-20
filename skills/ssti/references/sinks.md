# Template Engine Sinks

## JavaScript / TypeScript

| Engine | Compilation Function | RCE Possible? |
|--------|---------------------|---------------|
| EJS | `ejs.render(template, data)` | YES -- full Node.js access |
| Nunjucks | `nunjucks.renderString(template, ctx)` | YES -- via constructor chain |
| Pug | `pug.render(template)`, `pug.compile(template)` | YES -- full Node.js access |
| Handlebars | `Handlebars.compile(template)` | LIMITED -- sandboxed, check version |
| Mustache | `Mustache.render(template, data)` | NO -- logic-less, safe |
| doT | `doT.template(template)` | YES -- compiles to Function |
| eta | `Eta.renderString(template, data)` | YES -- check for incomplete fix |
| art-template | `template.render(template, data)` | YES -- check for RCE |
| Liquid | `Liquid.parse(template)` | LIMITED -- sandboxed |

## Python

| Engine | Compilation Function | RCE Possible? |
|--------|---------------------|---------------|
| Jinja2 | `Template(string)`, `env.from_string(string)` | YES -- class hierarchy |
| Jinja2 Sandboxed | `SandboxedEnvironment().from_string(string)` | MAYBE -- check bypasses |
| Mako | `Template(string)` | YES -- full Python access |
| Django templates | `Template(string)` | LIMITED -- sandboxed |

## Ruby

| Engine | Compilation Function | RCE Possible? |
|--------|---------------------|---------------|
| ERB | `ERB.new(string).result` | YES -- full Ruby access |
| Erubi | `Erubi::Engine.new(string)` | YES |
| Slim | `Slim::Template.new { string }` | YES |
| Haml | `Haml::Engine.new(string)` | YES |
| Liquid | `Liquid::Template.parse(string)` | NO -- sandboxed |

## PHP

| Engine | Compilation Function | RCE Possible? |
|--------|---------------------|---------------|
| Twig | `createTemplate(string)` | LIMITED -- check version |
| Blade | `Blade::compileString(string)` | YES |
| Smarty | `Smarty->fetch("string:"+string)` | YES -- {php} tag |
