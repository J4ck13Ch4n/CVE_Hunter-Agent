import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

function run(hook, event, project) {
  return spawnSync(process.execPath, [join(root, "hooks", hook)], {
    input: JSON.stringify(event), encoding: "utf8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: project },
  });
}

function workspace() {
  const dir = mkdtempSync(join(tmpdir(), "find-cve-workflow-"));
  mkdirSync(join(dir, "targets", "repo"), { recursive: true });
  return dir;
}

test("fake target keeps approval gates and terminal registry outcome", () => {
  const dir = workspace();
  const target = join(dir, "targets", "repo");
  writeFileSync(join(dir, "REGISTRY.md"), "## IN PROGRESS\n| Repo | Started |\n|---|---|\n");
  writeFileSync(join(target, "workflow.json"), JSON.stringify({
    repository: "owner/repo", currentPhase: "recon", targetApproved: false,
    pocApproved: false, submissionApproved: false,
  }));

  const clone = run("pretooluse-clone-dedup.mjs", {
    tool_input: { command: "git clone https://github.com/owner/repo.git targets/repo/repo" },
  }, dir);
  assert.equal(clone.status, 2);

  writeFileSync(join(target, "workflow.json"), JSON.stringify({
    repository: "owner/repo", currentPhase: "recon", targetApproved: true,
    pocApproved: false, submissionApproved: false,
  }));
  const poc = { tool_input: { file_path: "targets/repo/poc_local.py", content: "print('evidence')" } };
  assert.equal(run("pretooluse-finding-selfcheck.mjs", poc, dir).status, 2);

  writeFileSync(join(target, "workflow.json"), JSON.stringify({
    repository: "owner/repo", currentPhase: "poc_plan", targetApproved: true,
    pocApproved: true, submissionApproved: false,
  }));
  assert.equal(run("pretooluse-finding-selfcheck.mjs", poc, dir).status, 0);
  assert.equal(existsSync(join(target, "poc_local.py")), false);

  writeFileSync(join(target, "verdict.md"), "Status: NEEDS_MORE_INFO\n");
  assert.match(readFileSync(join(target, "verdict.md"), "utf8"), /NEEDS_MORE_INFO/);
  assert.equal(existsSync(join(target, "report.md")), false);

  writeFileSync(join(target, "workflow.json"), JSON.stringify({
    repository: "owner/repo", currentPhase: "complete_skip", targetApproved: true,
    pocApproved: false, submissionApproved: false,
  }));
  writeFileSync(join(dir, "REGISTRY.md"), "## SKIP\n| Repo | Vectors Checked | Date |\n|---|---|---|\n| owner/repo | all | 2026-08-30 |\n");
  const sections = readFileSync(join(dir, "REGISTRY.md"), "utf8").match(/^## /gm) || [];
  assert.equal(sections.length, 1);
});
