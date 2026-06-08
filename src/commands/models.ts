import { existsSync } from "node:fs";
import { join } from "node:path";
import pc from "picocolors";
import { select, input, confirm } from "@inquirer/prompts";
import { resolveTarget, detectDefaultScope, type InstallScope, type InstallTarget } from "../lib/paths.js";
import { getAgentModel, setAgentModel } from "../lib/frontmatter.js";
import { getConfigAgentModel, setConfigAgentModel } from "../lib/config.js";
import {
  listActiveManagedModelAgents,
  type ManagedAgentStatus,
} from "../lib/agents.js";
import {
  CUSTOM_MODEL_VALUE,
  buildModelOptions,
  listOpenCodeModels,
} from "../lib/opencode-models.js";

/**
 * Get the current model for a managed agent at the given target.
 */
function getCurrentModel(
  agent: ManagedAgentStatus,
  target: { agentDir: string; configPath: string }
): string | undefined {
  if (agent.kind === "builtin") {
    return getConfigAgentModel(target.configPath, agent.name);
  }
  // Custom agent: read from frontmatter
  const agentPath = join(target.agentDir, `${agent.name}.md`);
  return getAgentModel(agentPath);
}

/**
 * Set the model for a managed agent at the given target.
 */
function setCurrentModel(
  agent: ManagedAgentStatus,
  target: { agentDir: string; configPath: string },
  model: string
): void {
  if (agent.kind === "builtin") {
    setConfigAgentModel(target.configPath, agent.name, model);
    return;
  }
  // Custom agent: write to frontmatter
  const agentPath = join(target.agentDir, `${agent.name}.md`);
  // Do NOT create the file from a template if missing — only set model on existing files
  if (!existsSync(agentPath)) {
    throw new Error(`Agent file not found: ${agentPath}`);
  }
  setAgentModel(agentPath, model);
}

async function promptCustomModel(agentName: string): Promise<string> {
  let newModel = await input({
    message: `Enter model for ${agentName} (e.g., anthropic/claude-sonnet-4-6):`,
    validate: (value: string) => {
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        return "Model cannot be empty. Enter a model ID like 'anthropic/claude-sonnet-4-6'.";
      }
      return true;
    },
  });

  let trimmedModel = newModel.trim();

  // Warn about missing provider prefix — ask for confirmation as a separate step
  if (trimmedModel.length > 0 && !trimmedModel.includes("/")) {
    const proceed = await confirm({
      message:
        "OpenCode models normally use 'provider/model-id' format (e.g., 'anthropic/claude-sonnet-4-6'). Continue anyway?",
      default: false,
    });

    if (!proceed) {
      newModel = await input({
        message: `Enter model for ${agentName} (provider/model-id format):`,
        validate: (value: string) => {
          const trimmed = value.trim();
          if (trimmed.length === 0) {
            return "Model cannot be empty.";
          }
          if (!trimmed.includes("/")) {
            return "Model must use 'provider/model-id' format.";
          }
          return true;
        },
      });
      trimmedModel = newModel.trim();
    }
  }

  return trimmedModel;
}

async function promptModelFromOpenCode(
  agentName: string,
  availableModels: string[],
  currentModel?: string
): Promise<string> {
  const modelOptions = buildModelOptions(availableModels, currentModel);

  if (modelOptions.length === 0) {
    return promptCustomModel(agentName);
  }

  const selectedModel = await select<string>({
    message: `Select model for ${agentName}:`,
    choices: [
      ...modelOptions.map((model) => ({
        value: model,
        name: model === currentModel ? `${model} ${pc.dim("(current)")}` : model,
      })),
      {
        value: CUSTOM_MODEL_VALUE,
        name: "Custom model...",
      },
    ],
  });

  if (selectedModel === CUSTOM_MODEL_VALUE) {
    return promptCustomModel(agentName);
  }

  return selectedModel;
}

/**
 * Check whether any managed agents are active at the given target.
 */
function hasActiveManagedAgents(target: InstallTarget): boolean {
  const activeAgents = listActiveManagedModelAgents(target);
  return activeAgents.length > 0;
}

/**
 * Run the `opencode-path models` command.
 *
 * Only shows active managed agents. Custom agents store models in frontmatter;
 * built-in agents (plan, build, explore) store models in opencode config.
 * Built-ins are active by default even without init.
 */
export async function modelsCommand(): Promise<void> {
  console.log(pc.bold("\n🎯 OpenCode Path Model Configuration\n"));

  // Step 1: Detect target
  const defaultScope = detectDefaultScope();
  const projectTarget = resolveTarget("project");
  const globalTarget = resolveTarget("global");

  const hasProjectActiveAgents = hasActiveManagedAgents(projectTarget);
  const hasGlobalActiveAgents = hasActiveManagedAgents(globalTarget);

  let scope: InstallScope;

  if (!hasProjectActiveAgents && !hasGlobalActiveAgents) {
    // No active managed agents on either target
    console.log(
      pc.yellow(
        `\n   No active managed agents found. Use ${pc.cyan("opencode-path agents")} to activate agents.\n`
      )
    );
    return;
  }

  if (!hasProjectActiveAgents) {
    scope = "global";
    console.log(`   Target: Global (auto-detected)`);
  } else {
    scope = await select<InstallScope>({
      message: "Which installation do you want to configure?",
      choices: [
        {
          value: "project" as InstallScope,
          name: `Project .opencode/`,
          description: projectTarget.agentDir,
        },
        {
          value: "global" as InstallScope,
          name: `Global ~/.config/opencode/`,
          description: globalTarget.agentDir,
        },
      ],
      default: defaultScope,
    });
  }

  const target = resolveTarget(scope);

  // Show resolved paths
  console.log(`   Agent dir: ${target.agentDir}`);
  console.log(`   Config:    ${target.configPath}\n`);

  // Get active managed agents
  const activeAgents = listActiveManagedModelAgents(target);

  if (activeAgents.length === 0) {
    console.log(
      pc.yellow(
        `\n   No active managed agents to configure. Use ${pc.cyan("opencode-path agents")} to activate agents.\n`
      )
    );
    return;
  }

  const availableModels = listOpenCodeModels();
  if (availableModels.length > 0) {
    console.log(
      pc.dim(`   Loaded ${availableModels.length} models from OpenCode.\n`)
    );
  } else {
    console.log(
      pc.yellow(
        `   Could not read models from ${pc.cyan("opencode models")}. Falling back to manual input.\n`
      )
    );
  }

  // Step 2: Agent selection loop
  let configureAnother = true;

  while (configureAnother) {
    // Refresh active agents each iteration (in case config changed)
    const currentActiveAgents = listActiveManagedModelAgents(target);

    if (currentActiveAgents.length === 0) {
      console.log(
        pc.yellow(
          "\n   No active managed agents remaining to configure.\n"
        )
      );
      break;
    }

    // Show current models
    const agentChoices = currentActiveAgents.map((agent) => {
      const currentModel = getCurrentModel(agent, target);
      const modelDisplay = currentModel
        ? pc.dim(` (current: ${currentModel})`)
        : pc.dim(" (no model set)");

      const kindBadge = agent.kind === "builtin" ? pc.dim("[built-in]") : pc.dim("[custom]");

      return {
        value: agent.name,
        name: `${agent.name} ${kindBadge}${modelDisplay}`,
      };
    });

    const agentName = await select<string>({
      message: "Select an agent to configure:",
      choices: agentChoices,
    });

    const selectedAgent = currentActiveAgents.find((a) => a.name === agentName);
    if (!selectedAgent) {
      // Shouldn't happen, but handle gracefully
      console.log(pc.red(`\n   Agent ${agentName} is no longer active.\n`));
      const continueAnyway = await confirm({
        message: "Configure another agent?",
        default: true,
      });
      if (!continueAnyway) break;
      continue;
    }

    // Show current model
    const currentModel = getCurrentModel(selectedAgent, target);
    if (currentModel) {
      console.log(pc.dim(`   Current model: ${currentModel}`));
    } else {
      console.log(pc.dim(`   No model set`));
    }

    const trimmedModel = await promptModelFromOpenCode(
      selectedAgent.name,
      availableModels,
      currentModel
    );

    // Apply the model
    try {
      setCurrentModel(selectedAgent, target, trimmedModel);
      console.log(
        pc.green(`\n   ✓ ${selectedAgent.name} model set to: ${pc.bold(trimmedModel)}\n`)
      );
    } catch (err: any) {
      console.log(
        pc.red(`\n   Error setting model: ${err.message}\n`)
      );
    }

    // Configure another?
    configureAnother = await confirm({
      message: "Configure another agent?",
      default: false,
    });
  }

  console.log(
    pc.yellow("\n⚠️  Restart opencode to apply changes.\n")
  );
}
