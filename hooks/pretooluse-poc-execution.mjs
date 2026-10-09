#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { block, hasRemoteTarget, projectRoot, readEvent, workflowState } from "./hook-utils.mjs";

const event = readEvent();
const command = event.tool_input?.command || "";
if (!/\bpoc_[A-Za-z0-9_.-]+\b/.test(command)) process.exit(0);

const root = projectRoot();
const target = command.match(/(?:^|[\s"'])(?:\.\/)?targets[\\/]([^\\/\s"']+)/i)?.[1];
const source = [];
if (target) {
  const targetDir = resolve(root, "targets", target);
  const state = workflowState(targetDir);
  if (existsSync(join(targetDir, "workflow.json")) && state?.pocApproved !== true) {
    block(`PoC execution blocked: Director approval missing in ${join(targetDir, "workflow.json")}.`);
  }

  const pathInCommand = command.match(/(?:^|[\s"'])(targets[\\/][^\\s"']*\bpoc_[A-Za-z0-9_.-]+\b)/i)?.[1];
  let files = pathInCommand ? [resolve(root, pathInCommand)] : [];
  if (!files.length) {
    try {
      files = readdirSync(targetDir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && /^poc_[A-Za-z0-9_.-]+$/.test(entry.name))
        .map((entry) => join(targetDir, entry.name));
    } catch {
      files = [];
    }
  }
  for (const file of files) {
    try {
      source.push(readFileSync(file, "utf8"));
    } catch {
      // Command validation still applies when source file is unavailable.
    }
  }
}

if (hasRemoteTarget(`${command}\n${source.join("\n")}`)) {
  block("PoC execution blocked: remote target detected; PoCs must use local targets only.");
}

process.exit(0);
