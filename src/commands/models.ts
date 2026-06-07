import { existsSync } from "node:fs";
import { join } from "node:path";
import pc from "picocolors";
import { select, input, confirm } from "@inquirer/prompts";
import {
  resolveTarget,
  detectDefaultScope,
  PACK_AGENTS,
  ALL_AGENT_NAMES,
  isPackAgent,
  isExploreAgent,
  type InstallScope,
  type AgentName,
  type PackAgentName,
} from "../lib/paths.js";
import { getAgentModel, setAgentModel } from "../lib/frontmatter.js";
import { getExploreModel, setExploreModel } from "../lib/config.js";
import { getTemplatePath } from "../lib/templates.js";
import {
  CUSTOM_MODEL_VALUE,
  buildModelOptions,
  listOpenCodeModels,
} from "../lib/opencode-models.js";

/**
 * Get the current model for an agent at the given target.
 */
function getCurrentModel(
  agentName: AgentName,
  target: { agentDir: string; configPath: string }
): string | undefined {
  if (isExploreAgent(agentName)) {
    return getExploreModel(target.configPath);
  }
  const agentPath = join(target.agentDir, `${agentName}.md`);
  return getAgentModel(agentPath);
}

/**
 * Check whether any pack agents are installed at the given target.
 */
function hasInstalledAgents(target: { agentDir: string }): boolean {
  return PACK_AGENTS.some((name) =>
    existsSync(join(target.agentDir, `${name}.md`))
  );
}

async function promptCustomModel(agentName: AgentName): Promise<string> {
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
  agentName: AgentName,
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
 * Run the `oc-workflow models` command.
 */
export async function modelsCommand(): Promise<void> {
  console.log(pc.bold("\n🎯 OpenCode Workflow Model Configuration\n"));

  // Step 1: Detect target
  const defaultScope = detectDefaultScope();
  let scope: InstallScope;

  const projectTarget = resolveTarget("project");
  const hasProjectAgents = hasInstalledAgents(projectTarget);

  if (!hasProjectAgents) {
    // Only global target available
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
          description: resolveTarget("global").agentDir,
        },
      ],
      default: defaultScope,
    });
  }

  const target = resolveTarget(scope);

  // Verify target has installed agents (unless user picked it for explore-only config)
  if (!hasInstalledAgents(target) && !hasInstalledAgents(resolveTarget("global"))) {
    console.log(
      pc.red(
        `\n   No installed agents found. Run ${pc.cyan("oc-workflow init")} first.\n`
      )
    );
    return;
  }

  // Show resolved paths
  console.log(`   Agent dir: ${target.agentDir}`);
  console.log(`   Config:    ${target.configPath}\n`);

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
    // Show current models
    const agentChoices = ALL_AGENT_NAMES.map((name) => {
      const currentModel = getCurrentModel(name, target);
      const modelDisplay = currentModel
        ? pc.dim(` (current: ${currentModel})`)
        : pc.dim(" (no model set)");

      return {
        value: name as AgentName,
        name: `${name}${modelDisplay}`,
      };
    });

    const agentName = await select<AgentName>({
      message: "Select an agent to configure:",
      choices: agentChoices,
    });

    // Check if the agent file exists (for pack agents)
    if (isPackAgent(agentName)) {
      const agentPath = join(target.agentDir, `${agentName}.md`);
      if (!existsSync(agentPath)) {
        console.log(
          pc.red(
            `\n   Agent file not found: ${agentPath}`
          )
        );
        console.log(
          pc.yellow(
            `   Run ${pc.cyan("oc-workflow init")} for the ${scope} target first.\n`
          )
        );
        const continueAnyway = await confirm({
          message: "Configure another agent?",
          default: true,
        });
        if (!continueAnyway) break;
        continue;
      }
    }

    // Show current model
    const currentModel = getCurrentModel(agentName, target);
    if (currentModel) {
      console.log(pc.dim(`   Current model: ${currentModel}`));
    } else {
      console.log(pc.dim(`   No model set`));
    }

    const trimmedModel = await promptModelFromOpenCode(
      agentName,
      availableModels,
      currentModel
    );

    // Apply the model
    if (isExploreAgent(agentName)) {
      setExploreModel(target.configPath, trimmedModel);
    } else if (isPackAgent(agentName)) {
      const agentPath = join(target.agentDir, `${agentName}.md`);
      const templatePath = getTemplatePath(agentName);
      setAgentModel(agentPath, trimmedModel, templatePath);
    }

    console.log(
      pc.green(`\n   ✓ ${agentName} model set to: ${pc.bold(trimmedModel)}\n`)
    );

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
