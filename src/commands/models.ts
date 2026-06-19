import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  resolveTarget,
  type InstallScope,
  type InstallTarget,
} from "../lib/paths.js";
import { getAgentModel, setAgentModel } from "../lib/frontmatter.js";
import { getConfigAgentModel, setConfigAgentModel } from "../lib/config.js";
import * as messages from "../lib/messages.js";
import {
  listActiveManagedModelAgents,
  type ManagedAgentStatus,
} from "../lib/agents.js";
import {
  CUSTOM_MODEL_VALUE,
  buildModelOptions,
  listOpenCodeModelsAsync,
} from "../lib/opencode-models.js";
import {
  printHeader,
  printPaths,
  printWarning,
  printComplete,
  printSummary,
  printRestartWarning,
  CancellationError,
  buildAgentRow,
  uiSelect,
  uiInput,
  uiConfirm,
  resolveScope,
  withSpinner,
  type GlobalProjectOptions,
} from "../lib/ui.js";

const ALL_AGENTS_VALUE = "__all_active_agents__";

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
  const agentPath = join(target.agentDir, `${agent.name}.md`);
  if (!existsSync(agentPath)) {
    throw new Error(`Agent file not found: ${agentPath}`);
  }
  setAgentModel(agentPath, model);
}

async function promptCustomModel(agentName: string): Promise<string> {
  let newModel = await uiInput(
    `Enter model for ${agentName} (e.g., anthropic/claude-sonnet-4-6):`,
    {
      validate: (value: string) => {
        const trimmed = value.trim();
        if (trimmed.length === 0) {
          return "Model cannot be empty. Enter a model ID like 'anthropic/claude-sonnet-4-6'.";
        }
        return true;
      },
    }
  );

  let trimmedModel = newModel.trim();

  // Warn about missing provider prefix — ask for confirmation as a separate step
  if (trimmedModel.length > 0 && !trimmedModel.includes("/")) {
    const proceed = await uiConfirm(
      "OpenCode models normally use 'provider/model-id' format (e.g., 'anthropic/claude-sonnet-4-6'). Continue anyway?",
      { default: false }
    );

    if (!proceed) {
      newModel = await uiInput(
        `Enter model for ${agentName} (provider/model-id format):`,
        {
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
        }
      );
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

  const selectedModel = await uiSelect<string>(
    `Choose a model for: ${agentName}`,
    [
      ...modelOptions.map((model) => ({
        value: model,
        name: model === currentModel ? `${model} (current)` : model,
      })),
      {
        value: CUSTOM_MODEL_VALUE,
        name: "Custom model...",
      },
    ]
  );

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
export async function modelsCommand(
  options: GlobalProjectOptions = {}
): Promise<void> {
  printHeader("OpenCode Path Model Configuration", "🎯");

  // Step 1: Resolve target
  const projectTarget = resolveTarget("project");
  const globalTarget = resolveTarget("global");

  if (
    !hasActiveManagedAgents(projectTarget) &&
    !hasActiveManagedAgents(globalTarget)
  ) {
    printWarning(
      "No active managed agents found. Use opencode-path agents to activate agents."
    );
    console.log();
    return;
  }

  const scope: InstallScope = await resolveScope(options, {
    projectViable: hasActiveManagedAgents(projectTarget),
    globalViable: hasActiveManagedAgents(globalTarget),
    projectTarget,
    globalTarget,
  });

  const target = resolveTarget(scope);
  printPaths(target);

  // Get active managed agents
  const activeAgents = listActiveManagedModelAgents(target);

  if (activeAgents.length === 0) {
    printWarning(
      "No active managed agents to configure. Use opencode-path agents to activate agents."
    );
    console.log();
    return;
  }

  // Load available models asynchronously with a spinner
  let availableModels: string[];
  try {
    availableModels = await withSpinner(
      "Loading models from OpenCode...",
      async (signal) => listOpenCodeModelsAsync({ signal })
    );
  } catch (err) {
    if (err instanceof CancellationError) {
      throw err;
    }
    availableModels = [];
  }

  if (availableModels.length > 0) {
    console.log(
      `   Loaded ${availableModels.length} models from OpenCode.\n`
    );
  } else {
    console.log(
      `   Could not read models from opencode models. Falling back to manual input.\n`
    );
  }

  // Step 2: Agent selection loop
  const configured: { agent: string; model: string }[] = [];
  let configureAnother = true;

  while (configureAnother) {
    // Refresh active agents each iteration (in case config changed)
    const currentActiveAgents = listActiveManagedModelAgents(target);

    if (currentActiveAgents.length === 0) {
      printWarning("No active managed agents remaining to configure.");
      console.log();
      break;
    }

    const agentChoices = currentActiveAgents.map((agent) => {
      const currentModel = getCurrentModel(agent, target);
      const modelDisplay = currentModel
        ? ` (current: ${currentModel})`
        : " (no model set)";

      return {
        value: agent.name,
        name: buildAgentRow(agent) + modelDisplay,
      };
    });

    const agentName = await uiSelect<string>(
      "Select an agent to configure:",
      [
        {
          value: ALL_AGENTS_VALUE,
          name: "Set all active agents to the same model",
        },
        ...agentChoices,
      ]
    );

    if (agentName === ALL_AGENTS_VALUE) {
      const selectedModel = await promptModelFromOpenCode(
        "all active agents",
        availableModels
      );

      const failed: string[] = [];
      for (const agent of currentActiveAgents) {
        try {
          setCurrentModel(agent, target, selectedModel);
          configured.push({ agent: agent.name, model: selectedModel });
        } catch (err: any) {
          failed.push(agent.name);
          console.error(
            `   Error setting model for ${agent.name}: ${err.message}`
          );
        }
      }

      if (failed.length > 0) {
        console.error(messages.PARTIAL_STATE_WARNING);
      }

      configureAnother = false;
      continue;
    }

    const selectedAgent = currentActiveAgents.find((a) => a.name === agentName);
    if (!selectedAgent) {
      printWarning(`Agent ${agentName} is no longer active.`);
      configureAnother = await uiConfirm("Configure another agent?", {
        default: true,
      });
      continue;
    }

    const currentModel = getCurrentModel(selectedAgent, target);
    if (currentModel) {
      console.log(`   Current model: ${currentModel}`);
    } else {
      console.log(`   No model set`);
    }

    const trimmedModel = await promptModelFromOpenCode(
      selectedAgent.name,
      availableModels,
      currentModel
    );

    try {
      setCurrentModel(selectedAgent, target, trimmedModel);
      configured.push({ agent: selectedAgent.name, model: trimmedModel });
      console.log(
        `\n   ✓ ${selectedAgent.name} model set to: ${trimmedModel}\n`
      );
    } catch (err: any) {
      console.error(`\n   Error setting model: ${err.message}\n`);
    }

    configureAnother = await uiConfirm("Configure another agent?", {
      default: false,
    });
  }

  if (configured.length > 0) {
    printComplete("Model configuration");
    printSummary(
      configured.map((entry) => ({
        label: entry.agent,
        value: entry.model,
        color: "green" as const,
      })),
      { indent: 3 }
    );
  } else {
    printSummary([{ label: "Configured:", value: "none", color: "dim" }]);
  }

  printRestartWarning();
}
