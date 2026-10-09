#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { exactStatus, projectRoot, sectionBody } from "./hook-utils.mjs";

const root = projectRoot();
const registryPath = join(root, "REGISTRY.md");
const targetsDir = join(root, "targets");
const lines = [];

if (existsSync(registryPath)) {
  try {
    const content = readFileSync(registryPath, "utf8");
    const sectionCount = (heading) => {
      const body = sectionBody(content, heading);
      return body
        .split("\n")
        .filter(
          (line) =>
            line.startsWith("|") &&
            !line.includes("---") &&
            !/^\|\s*Repo\s*\|/i.test(line),
        ).length;
    };

    lines.push("REGISTRY STATUS:");
    lines.push(`  In Progress: ${sectionCount("IN PROGRESS")}`);
    lines.push(`  Submitted: ${sectionCount("SUBMITTED")}`);
    lines.push(`  False Positives: ${sectionCount("FALSE POSITIVES")}`);
    lines.push(`  Skipped: ${sectionCount("SKIP")}`);
    lines.push(`  Duplicates: ${sectionCount("DUPLICATE")}`);
  } catch {
    lines.push("REGISTRY STATUS: unreadable");
  }
} else {
  lines.push("No REGISTRY.md found. Initialize registry before hunting.");
}

if (existsSync(targetsDir)) {
  try {
    const targets = readdirSync(targetsDir).filter((name) =>
      statSync(join(targetsDir, name)).isDirectory(),
    );
    if (targets.length) lines.push("", "ACTIVE TARGETS:");

    for (const target of targets) {
      const dir = join(targetsDir, target);
      const brief = join(dir, "brief.md");
      const findings = join(dir, "findings.md");
      const verdict = join(dir, "verdict.md");
      const hasPoc = readdirSync(dir).some((name) => name.startsWith("poc_"));
      let status = "recon";

      if (existsSync(verdict)) {
        status = exactStatus(readFileSync(verdict, "utf8")).toLowerCase() || "validating";
      } else if (hasPoc) status = "poc_ready";
      else if (existsSync(findings)) status = "findings_ready";
      else if (existsSync(brief)) status = "brief_ready";

      lines.push(`  ${target}: ${status}`);
    }
  } catch {
    lines.push("ACTIVE TARGETS: unreadable");
  }
}

console.log(lines.join("\n"));
