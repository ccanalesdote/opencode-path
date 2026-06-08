import { homedir } from "node:os";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

export type InstallScope = "project" | "global";

export interface InstallTarget {
  scope: InstallScope;
  agentDir: string;
  configPath: string;
}

/**
 * Resolve the install target paths for a given scope.
 * - project: resolves relative to the given working directory
 * - global: resolves to ~/.config/opencode/
 */
export function resolveTarget(scope: InstallScope, cwd?: string): InstallTarget {
  if (scope === "project") {
    const base = cwd ?? process.cwd();
    return {
      scope: "project",
      agentDir: resolve(base, ".opencode", "agent"),
      configPath: resolve(base, ".opencode", "opencode.json"),
    };
  }

  const globalBase = resolve(homedir(), ".config", "opencode");
  return {
    scope: "global",
    agentDir: resolve(globalBase, "agent"),
    configPath: resolve(globalBase, "opencode.json"),
  };
}

/**
 * Detect which installation scope to suggest as default.
 * If a project-level installation exists (./.opencode/agent/), return 'project'.
 * Otherwise, return 'global'.
 */
export function detectDefaultScope(cwd?: string): InstallScope {
  const base = cwd ?? process.cwd();
  const projectAgentDir = resolve(base, ".opencode", "agent");
  if (existsSync(projectAgentDir)) {
    return "project";
  }
  return "global";
}

/**
 * List of pack agent template names (without .md extension).
 * Used by both init and models commands.
 */
export const PACK_AGENTS = [
  "spec",
  "architect",
  "developer",
  "reviewer",
  "auditor",
  "research",
] as const;

export type PackAgentName = (typeof PACK_AGENTS)[number];

/**
 * Check if an agent name is a pack agent (has a .md template file).
 */
export function isPackAgent(name: string): name is PackAgentName {
  return (PACK_AGENTS as readonly string[]).includes(name);
}
