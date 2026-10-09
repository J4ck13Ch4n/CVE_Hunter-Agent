#!/usr/bin/env node

import { readEvent } from "./hook-utils.mjs";

const event = readEvent();
const filePath = event.tool_input?.file_path || event.tool_input?.path || "";
const versionFiles = new Set([
  "package.json",
  "package-lock.json",
  "requirements.txt",
  "setup.py",
  "setup.cfg",
  "pyproject.toml",
  "go.mod",
  "go.sum",
  "Gemfile",
  "Gemfile.lock",
  "composer.json",
  "Cargo.toml",
  "pom.xml",
]);
const name = filePath.split(/[\\/]/).pop();
if (!versionFiles.has(name)) process.exit(0);

console.log(`VERSION CHECK:
  - Record exact installed version.
  - Query OSV/GHSA for package, ecosystem, and exact version.
  - Compare with latest registry release and security-related changelog entries.
  - An already-patched issue is DUPLICATE, not a new finding.`);
