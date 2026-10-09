#!/usr/bin/env node

import { dirname, join, normalize, resolve, sep } from "node:path";
import { block, hasRemoteTarget, projectRoot, readEvent, targetDirectory, workflowState } from "./hook-utils.mjs";

const event = readEvent();
const filePath = event.tool_input?.file_path || event.tool_input?.path || "";
if (!filePath) process.exit(0);

const content = [event.tool_input?.content, event.tool_input?.new_string]
  .filter((value) => typeof value === "string")
  .join("\n");
const normalized = normalize(filePath);
const isRegistry = (normalized.split(sep).pop() || "") === "REGISTRY.md";
const submittedEdit = typeof event.tool_input?.new_string === "string"
  ? event.tool_input.new_string
  : typeof event.tool_input?.content === "string"
    ? event.tool_input.content
    : "";
const registrySubmission = isRegistry && /(?:^|\n)\s*(?:##\s+SUBMITTED|\|[^\n]*\bSUBMITTED\b)/im.test(submittedEdit);
if (registrySubmission) {
  const repository = submittedEdit.match(/^\|\s*([^|]+?)\s*\|/m)?.[1]?.trim();
  const targetName = repository?.split("/").pop()?.toLowerCase();
  const state = targetName ? workflowState(join(projectRoot(), "targets", targetName)) : null;
  if (state?.submissionApproved !== true || !["approved_for_submission", "submitted"].includes(state.currentPhase)) {
    block("Registry submission blocked: Director submission approval missing or workflow is not ready.");
  }
}

const basename = normalized.split(sep).pop() || "";
const isFindings = basename === "findings.md";
const isVerdict = basename === "verdict.md";
const isPoc = basename.startsWith("poc_");
if (!isFindings && !isVerdict && !isPoc) process.exit(0);

if (isPoc) {
  const root = projectRoot();
  const targetDir = targetDirectory(root, normalized) || dirname(resolve(root, normalized));
  const statePath = join(targetDir, "workflow.json");
  if (workflowState(targetDir)?.pocApproved !== true) {
    block(`PoC write blocked: Director approval missing in ${statePath}.`);
  }
  if (hasRemoteTarget(content)) {
    block("PoC write blocked: remote target detected; PoCs must use local targets only.");
  }
}

const reminders = [];
if (isFindings) reminders.push("FINDING CHECK: trace attacker-controlled source to sink; verify validation, auth, docs, and real impact.");
if (isVerdict) reminders.push("VERDICT CHECK: require exact latest version, default config, concrete evidence, and 3/3 successful PoC runs.");
if (isPoc) reminders.push("POC CHECK: local target only, benign evidence, exact version, deterministic cleanup.");
if (reminders.length) console.log(reminders.join("\n"));
