#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { approvedWorkflow, block, projectRoot, readEvent, sectionBody, workflowState } from "./hook-utils.mjs";

const event = readEvent();
const command = event.tool_input?.command || "";
if (!/(?:^|[;&|]\s*)git\s+clone\b/.test(command)) process.exit(0);

const match = command.match(
  /(?:https?:\/\/github\.com\/|git@github\.com:)([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?(?=[\s"']|$)/,
);
if (!match) process.exit(0);

const owner = match[1].toLowerCase();
const repo = match[2].toLowerCase();
const identity = `${owner}/${repo}`;
const root = projectRoot();
const registryPath = join(root, "REGISTRY.md");

if (existsSync(registryPath)) {
  const registry = readFileSync(registryPath, "utf8");
  for (const section of ["IN PROGRESS", "SUBMITTED", "FALSE POSITIVES", "SKIP", "DUPLICATE"]) {
    const body = sectionBody(registry, section);
    if (!body) continue;
    const found = body
      .split("\n")
      .filter((line) => line.startsWith("|") && !line.includes("---"))
      .map((line) => line.split("|")[1]?.trim().toLowerCase())
      .some((name) => name === repo || name === identity);
    if (found) {
      block(`Clone blocked: ${identity} already exists in REGISTRY.md section ${section}. Resume or choose another target.`);
    }
  }
}

const targetPath = command.match(/(?:^|\s)(targets[\/\\]([^\s"']+))/)?.[1];
if (targetPath && !approvedWorkflow(root, identity, "targetApproved")) {
  block(`Clone blocked: Director target approval missing for ${identity}.`);
}
if (targetPath && targetPath.toLowerCase().split(/[\\/]/).pop() !== repo &&
    !workflowState(join(root, "targets", repo))?.targetApproved) {
  block(`Clone blocked: target state does not approve ${identity}.`);
}

if (!targetPath && workflowState(join(root, "targets", repo)) &&
    !approvedWorkflow(root, identity, "targetApproved")) {
  block(`Clone blocked: Director target approval missing for ${identity}.`);
}

if (targetPath && targetPath.toLowerCase().split(/[\\/]/).pop() === repo &&
    !workflowState(join(root, "targets", repo)) &&
    !existsSync(join(root, "targets", repo))) {
  block(`Clone blocked: target workflow state missing for ${identity}.`);
}

if (targetPath && targetPath.toLowerCase().split(/[\\/]/).pop() === repo &&
    workflowState(join(root, "targets", repo))?.targetApproved !== true) {
  block(`Clone blocked: Director target approval missing for ${identity}.`);
}

if (targetPath && targetPath.toLowerCase().split(/[\\/]/).pop() === repo &&
    existsSync(join(root, "targets", repo))) {
  block(`Clone blocked: targets/${repo}/ already exists. Use existing target.`);
}

if (!targetPath && !workflowState(join(root, "targets", repo))) {
  // Bare clones remain compatible with manual use; target approval binds explicit workflow paths.
}

if (existsSync(join(root, "targets", repo))) {
  block(`Clone blocked: targets/${repo}/ already exists. Use existing target.`);
}
