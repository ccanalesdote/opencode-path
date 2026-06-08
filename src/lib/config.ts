import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

/**
 * Shape of the OpenCode config file.
 * We keep this loose to preserve unknown fields.
 */
export type OpenCodeConfig = Record<string, unknown>;

const OPENCODE_SCHEMA = "https://opencode.ai/config.json";

/**
 * Read and parse an OpenCode config file.
 * Returns undefined if the file doesn't exist.
 * Throws if the file exists but is not valid JSON.
 */
export function readConfig(filePath: string): OpenCodeConfig | undefined {
  if (!existsSync(filePath)) {
    return undefined;
  }

  const content = readFileSync(filePath, "utf-8");
  return JSON.parse(content) as OpenCodeConfig;
}

/**
 * Write an OpenCode config to disk, creating parent directories if needed.
 * Uses 2-space JSON formatting for readability.
 */
export function writeConfig(filePath: string, config: OpenCodeConfig): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const content = JSON.stringify(config, null, 2) + "\n";
  writeFileSync(filePath, content, "utf-8");
}

/**
 * Ensure an OpenCode config has the minimum required structure:
 * - `$schema` field
 * - `agent` object
 *
 * Preserves all existing fields. Returns the updated config.
 * Does NOT create any agent sub-objects — those are only created
 * when an explicit action (e.g., setting a model or hiding) requires it.
 */
export function ensureConfigStructure(
  config: OpenCodeConfig
): OpenCodeConfig {
  const result = { ...config };

  // Ensure $schema
  if (!result.$schema) {
    result.$schema = OPENCODE_SCHEMA;
  }

  // Ensure agent object
  if (!result.agent || typeof result.agent !== "object" || Array.isArray(result.agent)) {
    result.agent = {};
  }

  return result;
}

/**
 * Create or merge an OpenCode config at the given path.
 * - If the file doesn't exist, creates it with the minimum structure.
 * - If the file exists, parses it and ensures the minimum structure without
 *   removing unrelated fields.
 */
export function createOrMergeConfig(filePath: string): OpenCodeConfig {
  let config = readConfig(filePath);
  if (!config) {
    config = {};
  }
  config = ensureConfigStructure(config);
  writeConfig(filePath, config);
  return config;
}

/**
 * Get the explore model from the config.
 * Returns undefined if the file doesn't exist or has no explore.model.
 */
export function getExploreModel(filePath: string): string | undefined {
  const config = readConfig(filePath);
  if (!config) return undefined;

  const agent = config.agent as Record<string, unknown> | undefined;
  if (!agent) return undefined;

  const explore = agent.explore as Record<string, unknown> | undefined;
  if (!explore) return undefined;

  const model = explore.model;
  return typeof model === "string" ? model : undefined;
}

/**
 * Set the explore model in the config at the given path.
 * Preserves all other config fields.
 * Creates the config with minimum structure if it doesn't exist.
 */
export function setExploreModel(filePath: string, model: string): void {
  setConfigAgentModel(filePath, "explore", model);
}

/**
 * Get the model for a config-based agent (e.g., plan, build, explore).
 * Returns undefined if the file doesn't exist or has no model set.
 */
export function getConfigAgentModel(
  filePath: string,
  agentName: string
): string | undefined {
  const config = readConfig(filePath);
  if (!config) return undefined;

  const agent = config.agent as Record<string, unknown> | undefined;
  if (!agent) return undefined;

  const agentConfig = agent[agentName] as Record<string, unknown> | undefined;
  if (!agentConfig) return undefined;

  const model = agentConfig.model;
  return typeof model === "string" ? model : undefined;
}

/**
 * Set the model for a config-based agent (e.g., plan, build, explore).
 * Preserves all other config fields.
 * Creates the config with minimum structure if it doesn't exist.
 * Creates the agent sub-object if needed.
 */
export function setConfigAgentModel(
  filePath: string,
  agentName: string,
  model: string
): void {
  let config = readConfig(filePath);
  if (!config) {
    config = {};
  }
  config = ensureConfigStructure(config);

  const agent = config.agent as Record<string, unknown>;

  if (!agent[agentName] || typeof agent[agentName] !== "object" || Array.isArray(agent[agentName])) {
    agent[agentName] = {};
  }

  const agentConfig = agent[agentName] as Record<string, unknown>;
  agentConfig.model = model;

  writeConfig(filePath, config);
}
