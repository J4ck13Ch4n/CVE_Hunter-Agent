import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

export function readEvent() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

export function projectRoot() {
  return process.env.CLAUDE_PROJECT_DIR || process.env.PROJECT_DIR || process.cwd();
}

export function block(message) {
  console.error(message);
  process.exit(2);
}

export function exactStatus(content) {
  const match = content.match(
    /^(?:##\s+Status:|status:)\s*(CONFIRMED|FALSE_POSITIVE|NEEDS_MORE_INFO)\s*$/im,
  );
  return match?.[1] || "";
}

export function sectionBody(content, heading) {
  for (const section of content.split(/^##\s+/m).slice(1)) {
    const newline = section.indexOf("\n");
    const title = (newline < 0 ? section : section.slice(0, newline))
      .replace(/\s+\([^)]*\)\s*$/, "")
      .trim();
    if (title.toLowerCase() === heading.toLowerCase()) {
      return newline < 0 ? "" : section.slice(newline + 1);
    }
  }
  return "";
}

export function workflowState(targetDir) {
  const statePath = resolve(targetDir, "workflow.json");
  if (!existsSync(statePath)) return null;
  try {
    const state = JSON.parse(readFileSync(statePath, "utf8"));
    return state && typeof state === "object" && !Array.isArray(state) ? state : null;
  } catch {
    return null;
  }
}

export function targetDirectory(root, filePath) {
  const absolute = resolve(root, filePath);
  const rootRelative = relative(resolve(root), absolute);
  if (rootRelative.startsWith(`..${sep}`) || isAbsolute(rootRelative)) return null;
  const parts = absolute.split(sep);
  const targetsIndex = parts.lastIndexOf("targets");
  if (targetsIndex < 0 || !parts[targetsIndex + 1]) return null;
  return parts.slice(0, targetsIndex + 2).join(sep) || sep;
}

export function localHost(hostname) {
  const host = hostname.toLowerCase().replace(/[\[\]]/g, "");
  return host === "localhost" || host === "::1" || host === "0.0.0.0" ||
    /^127(?:\.\d{1,3}){3}$/.test(host) || /^unix(?:-socket)?$/.test(host);
}

function remoteUrl(value) {
  const urls = value.match(/\b(?:https?|wss?|ssh|ftp):\/\/[^\s"'`<>)]*/gi) || [];
  return urls.some((raw) => {
    try {
      return !localHost(new URL(raw).hostname);
    } catch {
      return true;
    }
  });
}

export function hasRemoteTarget(value) {
  if (!value) return false;
  if (remoteUrl(value)) return true;

  const ip = value.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b|\b(?:[0-9a-f]{0,4}:){2,}[0-9a-f:]+\b/gi) || [];
  if (ip.some((host) => !localHost(host))) return true;

  const networkCall = /\b(?:curl|wget|fetch|requests?\.(?:get|post|request)|axios\.(?:get|post|request))\s*\(?\s*["']?([a-z0-9.-]+\.[a-z]{2,})/gi;
  const endpoint = /\b(?:host|target|endpoint|url)\s*[:=]\s*["']?([a-z0-9.-]+\.[a-z]{2,})/gi;
  return [...value.matchAll(networkCall), ...value.matchAll(endpoint)].some((match) => !localHost(match[1]));
}

export function approvedWorkflow(root, repository, field) {
  const targetName = repository.split("/").pop()?.toLowerCase();
  if (!targetName) return false;
  const state = workflowState(resolve(root, "targets", targetName));
  return state?.[field] === true &&
    (!state.repository || state.repository.toLowerCase() === repository.toLowerCase() ||
      state.repository.toLowerCase() === targetName);
}
