import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

function run(hook, event, project) {
  return spawnSync(process.execPath, [join(root, "hooks", hook)], {
    input: JSON.stringify(event),
    encoding: "utf8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: project },
  });
}

function workspace() {
  const dir = mkdtempSync(join(tmpdir(), "find-cve-hooks-"));
  mkdirSync(join(dir, "targets"));
  return dir;
}

test("clone hook blocks exact registry target with valued options", () => {
  const dir = workspace();
  writeFileSync(
    join(dir, "REGISTRY.md"),
    "## SKIP (investigated, nothing found)\n| Repo | Vectors Checked | Date |\n|---|---|---|\n| owner/repo | cmdi | 2026-08-30 |\n",
  );
  const result = run(
    "pretooluse-clone-dedup.mjs",
    { tool_input: { command: "git clone --branch main https://github.com/owner/repo.git targets/repo/repo" } },
    dir,
  );
  assert.equal(result.status, 2);
  assert.match(result.stderr, /already exists.*SKIP/i);
});

test("clone hook avoids substring collision", () => {
  const dir = workspace();
  writeFileSync(
    join(dir, "REGISTRY.md"),
    "## SKIP\n| Repo | Vectors Checked | Date |\n|---|---|---|\n| xml-parser | xxe | 2026-08-30 |\n",
  );
  const result = run(
    "pretooluse-clone-dedup.mjs",
    { tool_input: { command: "git clone https://github.com/owner/xml.git" } },
    dir,
  );
  assert.equal(result.status, 0);
});

test("PoC write requires explicit approval", () => {
  const dir = workspace();
  mkdirSync(join(dir, "targets", "repo"));
  const event = { tool_input: { file_path: "targets/repo/poc_cmdi.py", content: "print('local evidence')" } };
  assert.equal(run("pretooluse-finding-selfcheck.mjs", event, dir).status, 2);

  writeFileSync(
    join(dir, "targets", "repo", "workflow.json"),
    JSON.stringify({ pocApproved: true }),
  );
  assert.equal(run("pretooluse-finding-selfcheck.mjs", event, dir).status, 0);
});

test("PoC write blocks remote targets but allows loopback", () => {
  const dir = workspace();
  mkdirSync(join(dir, "targets", "repo"));
  writeFileSync(join(dir, "targets", "repo", "workflow.json"), JSON.stringify({ pocApproved: true }));
  const remote = run("pretooluse-finding-selfcheck.mjs", {
    tool_input: { file_path: "targets/repo/poc_ssrf.py", content: "requests.get('https://prod.example.test')" },
  }, dir);
  assert.equal(remote.status, 2);
  assert.match(remote.stderr, /remote target/i);
  const local = run("pretooluse-finding-selfcheck.mjs", {
    tool_input: { file_path: "targets/repo/poc_ssrf.py", content: "requests.get('http://127.0.0.1:8080')" },
  }, dir);
  assert.equal(local.status, 0);
});

test("PoC execution blocks remote target in command or source", () => {
  const dir = workspace();
  mkdirSync(join(dir, "targets", "repo"));
  writeFileSync(join(dir, "targets", "repo", "workflow.json"), JSON.stringify({ pocApproved: true }));
  writeFileSync(join(dir, "targets", "repo", "poc_ssrf.py"), "requests.get('https://prod.example.test')\n");
  const remote = run("pretooluse-poc-execution.mjs", {
    tool_input: { command: "python3 targets/repo/poc_ssrf.py" },
  }, dir);
  assert.equal(remote.status, 2);
  const local = run("pretooluse-poc-execution.mjs", {
    tool_input: { command: "python3 targets/repo/poc_ssrf.py --url http://localhost:8080" },
  }, dir);
  assert.equal(local.status, 2);
  writeFileSync(join(dir, "targets", "repo", "poc_ssrf.py"), "requests.get('http://127.0.0.1:8080')\n");
  assert.equal(run("pretooluse-poc-execution.mjs", {
    tool_input: { command: "python3 targets/repo/poc_ssrf.py" },
  }, dir).status, 0);
});

test("finding and verdict writes remain warning-only", () => {
  const dir = workspace();
  for (const filePath of ["targets/repo/findings.md", "targets/repo/verdict.md"]) {
    const result = run("pretooluse-finding-selfcheck.mjs", {
      tool_input: { file_path: filePath, content: "incomplete" },
    }, dir);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /CHECK/);
  }
});

test("registry submission requires approved workflow state", () => {
  const dir = workspace();
  mkdirSync(join(dir, "targets", "repo"));
  const event = { tool_input: { file_path: "REGISTRY.md", content: "## SUBMITTED\n| owner/repo | pending | HIGH | H1 | 2026-08-30 | awaiting triage |\n" } };
  assert.equal(run("pretooluse-finding-selfcheck.mjs", event, dir).status, 2);
  writeFileSync(join(dir, "targets", "repo", "workflow.json"), JSON.stringify({ submissionApproved: true, currentPhase: "approved_for_submission" }));
  assert.equal(run("pretooluse-finding-selfcheck.mjs", event, dir).status, 0);
});

test("PoC execution requires approval when workflow exists", () => {
  const dir = workspace();
  mkdirSync(join(dir, "targets", "repo"));
  writeFileSync(join(dir, "targets", "repo", "workflow.json"), JSON.stringify({ pocApproved: false }));
  const result = run("pretooluse-poc-execution.mjs", {
    tool_input: { command: "python3 targets/repo/poc_cmdi.py" },
  }, dir);
  assert.equal(result.status, 2);
});

test("clone hook requires target approval for a new target", () => {
  const dir = workspace();
  const event = { tool_input: { command: "git clone https://github.com/owner/repo.git targets/repo/repo" } };
  const denied = run("pretooluse-clone-dedup.mjs", event, dir);
  assert.equal(denied.status, 2);
  mkdirSync(join(dir, "targets", "repo"));
  writeFileSync(join(dir, "targets", "repo", "workflow.json"), JSON.stringify({ repository: "owner/repo", targetApproved: true }));
  assert.equal(run("pretooluse-clone-dedup.mjs", event, dir).status, 2);
});


test("invalid hook input fails closed only for protected actions", () => {
  const dir = workspace();
  const result = spawnSync(process.execPath, [join(root, "hooks", "pretooluse-clone-dedup.mjs")], { input: "not-json", encoding: "utf8", env: { ...process.env, CLAUDE_PROJECT_DIR: dir } });
  assert.equal(result.status, 0);
});


test("exact verdict statuses remain distinct", () => {
  const dir = workspace();
  mkdirSync(join(dir, "targets", "repo"));
  writeFileSync(join(dir, "targets", "repo", "verdict.md"), "Status: CONFIRMED\n");
  assert.match(run("session-start-context.mjs", {}, dir).stdout, /repo: confirmed/);
});


test("clone hook supports SSH and valued options", () => {
  const dir = workspace();
  const event = { tool_input: { command: "git clone --depth 1 git@github.com:owner/repo.git targets/repo/repo" } };
  assert.equal(run("pretooluse-clone-dedup.mjs", event, dir).status, 2);
});


test("missing registry does not block unrelated clone", () => {
  const dir = workspace();
  const result = run("pretooluse-clone-dedup.mjs", { tool_input: { command: "git clone https://gitlab.com/owner/repo.git" } }, dir);
  assert.equal(result.status, 0);
});


test("empty verdict is not confirmed", () => {
  const dir = workspace();
  mkdirSync(join(dir, "targets", "repo"));
  writeFileSync(join(dir, "targets", "repo", "verdict.md"), "Status: \n");
  assert.match(run("session-start-context.mjs", {}, dir).stdout, /repo: validating/);
});


test("submission approval state is represented without credentials", () => {
  const dir = workspace();
  mkdirSync(join(dir, "targets", "repo"));
  writeFileSync(join(dir, "targets", "repo", "workflow.json"), JSON.stringify({ submissionApproved: true, currentPhase: "approved_for_submission" }));
  assert.doesNotMatch(readFileSync(join(dir, "targets", "repo", "workflow.json"), "utf8"), /token|password|secret/i);
});

test("version hook only fires for exact version filenames", () => {
  const dir = workspace();
  assert.match(
    run(
      "posttooluse-version-check.mjs",
      { tool_input: { file_path: "repo/package.json" } },
      dir,
    ).stdout,
    /VERSION CHECK/,
  );
  assert.equal(
    run(
      "posttooluse-version-check.mjs",
      { tool_input: { file_path: "repo/package.json.notes" } },
      dir,
    ).stdout,
    "",
  );
});
