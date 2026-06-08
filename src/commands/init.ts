import { existsSync, mkdirSync } from "node:fs";
import pc from "picocolors";
import { select, checkbox } from "@inquirer/prompts";
import { resolveTarget, detectDefaultScope, type InstallScope } from "../lib/paths.js";
import { createOrMergeConfig } from "../lib/config.js";
import {
  listManagedAgentStatuses,
  installCustomAgent,
  restoreBuiltinAgent,
  type ManagedAgentStatus,
} from "../lib/agents.js";

interface InitResult {
  created: string[];
  restored: string[];
  alreadyActive: string[];
  conflicts: string[];
  skipped: string[];
}

/**
 * Build a display label for a managed agent suitable for checkbox lists.
 * Includes kind badge and state indicator.
 */
function agentStatusLabel(agent: ManagedAgentStatus): string {
  const kindBadge = agent.kind === "builtin" ? pc.dim("[built-in]") : pc.dim("[custom]");
  const stateLabel =
    agent.state === "active"
      ? pc.green("(active)")
      : agent.state === "missing"
        ? pc.dim("(not installed)")
        : agent.state === "hidden"
          ? pc.yellow("(hidden)")
          : agent.state === "conflict"
            ? pc.red("(conflict — manual file)")
            : "";
  return `${agent.name} ${kindBadge} ${stateLabel}`;
}

/**
 * Check if inquirer checkbox supports disabled items.
 * We use a safe approach: validate after selection.
 */

/**
 * Run the `opencode-path init` command.
 *
 * Init is add/restore only:
 * - Can install missing custom agents
 * - Can restore hidden built-ins (plan, build, explore)
 * - Active agents are informational, not removable
 * - Conflict agents are displayed but not modifiable
 */
export async function initCommand(): Promise<void> {
  console.log(pc.bold("\n🔧 OpenCode Path Installer\n"));

  // Step 1: Target selection
  const defaultScope = detectDefaultScope();
  const scope = await select<InstallScope>({
    message: "Where do you want to install the workflow?",
    choices: [
      {
        value: "project" as InstallScope,
        name: `Project .opencode/ (current directory)`,
        description: "Install to ./.opencode/agent/ and ./.opencode/opencode.json",
      },
      {
        value: "global" as InstallScope,
        name: `Global ~/.config/opencode/`,
        description: "Install to ~/.config/opencode/agent/ and ~/.config/opencode/opencode.json",
      },
    ],
    default: defaultScope,
  });

  const target = resolveTarget(scope);

  // Step 2: Get agent statuses
  const statuses = listManagedAgentStatuses(target);

  // Build checkbox choices
  // - Active agents: shown checked, but we'll validate they can't be removed
  // - Missing custom agents: shown unchecked (can be selected to install)
  // - Hidden built-ins: shown unchecked (can be selected to restore)
  // - Conflict agents: shown with warning, checked=false
  const choices = statuses.map((agent) => {
    const isDefaultChecked =
      agent.state === "active";

    return {
      value: agent.name,
      name: agentStatusLabel(agent),
      checked: isDefaultChecked,
    };
  });

  console.log(pc.bold("\n📋 Select agents to install/restore:"));
  console.log(pc.dim("   Already-active agents and conflicts cannot be changed here."));
  console.log(pc.dim("   Use 'opencode-path agents' for full management.\n"));

  if (statuses.some((a) => a.state === "conflict")) {
    console.log(
      pc.yellow(
        "   ⚠ Conflicting agents (manual files without managed marker) are shown but cannot be modified."
      )
    );
    console.log(
      pc.dim(
        "     To resolve: either delete the manual file and re-run, or add the marker manually.\n"
      )
    );
  }

  const selectedNames = await checkbox<string>({
    message: "Select agents to install/restore (space to toggle, enter to confirm):",
    choices,
    required: false,
  });

  // Validate: active agents must not be removed, conflict agents must not be selected.
  // Since @inquirer/prompts checkbox does not support disabled entries,
  // we enforce this by correcting the selection and printing feedback.
  const activeAgents = statuses.filter((a) => a.state === "active").map((a) => a.name);
  const conflictAgents = statuses.filter((a) => a.state === "conflict").map((a) => a.name);

  const finalSelection = new Set(selectedNames);
  let correctedActive = false;
  let correctedConflict = false;

  // Ensure all active agents remain in selection (they cannot be removed via init)
  for (const name of activeAgents) {
    if (!finalSelection.has(name)) {
      finalSelection.add(name);
      correctedActive = true;
    }
  }

  // Ensure conflict agents are NOT in the selection (they cannot be managed)
  for (const name of conflictAgents) {
    if (finalSelection.has(name)) {
      finalSelection.delete(name);
      correctedConflict = true;
    }
  }

  if (correctedActive) {
    console.log(
      pc.dim("\n   Note: Active agents cannot be removed via init. They have been kept selected.")
    );
  }
  if (correctedConflict) {
    console.log(
      pc.yellow("\n   Note: Conflict agents cannot be modified. They have been deselected.")
    );
  }

  // Step 3: Create agent directory
  if (!existsSync(target.agentDir)) {
    mkdirSync(target.agentDir, { recursive: true });
  }

  // Step 4: Apply changes
  const result: InitResult = {
    created: [],
    restored: [],
    alreadyActive: [],
    conflicts: [],
    skipped: [],
  };

  for (const agent of statuses) {
    const isSelected = finalSelection.has(agent.name);

    if (agent.state === "conflict") {
      result.conflicts.push(agent.name);
      continue;
    }

    if (agent.kind === "custom") {
      if (agent.state === "active") {
        result.alreadyActive.push(agent.name);
        continue;
      }

      if (agent.state === "missing" && isSelected) {
        const installResult = installCustomAgent(agent.name as any, target);
        if (installResult === "created") {
          result.created.push(agent.name);
        } else if (installResult === "conflict") {
          result.conflicts.push(agent.name);
        } else {
          result.alreadyActive.push(agent.name);
        }
        continue;
      }

      if (agent.state === "missing" && !isSelected) {
        result.skipped.push(agent.name);
        continue;
      }
    }

    if (agent.kind === "builtin") {
      if (agent.state === "active") {
        result.alreadyActive.push(agent.name);
        continue;
      }

      if (agent.state === "hidden" && isSelected) {
        restoreBuiltinAgent(agent.name, target);
        result.restored.push(agent.name);
        continue;
      }

      if (agent.state === "hidden" && !isSelected) {
        result.skipped.push(agent.name);
        continue;
      }
    }
  }

  // Step 5: Create or merge config
  createOrMergeConfig(target.configPath);

  // Step 6: Print results
  console.log(pc.bold("\n✅ Installation complete!\n"));

  if (result.created.length > 0) {
    console.log(pc.green(`   Created:      ${result.created.join(", ")}`));
  }
  if (result.restored.length > 0) {
    console.log(pc.green(`   Restored:     ${result.restored.join(", ")}`));
  }
  if (result.alreadyActive.length > 0) {
    console.log(pc.dim(`   Already active: ${result.alreadyActive.join(", ")}`));
  }
  if (result.skipped.length > 0) {
    console.log(pc.dim(`   Skipped:      ${result.skipped.join(", ")}`));
  }
  if (result.conflicts.length > 0) {
    console.log(pc.red(`   Conflicts:    ${result.conflicts.join(", ")}`));
    console.log(
      pc.yellow(
        `     These agents have manual files without the managed marker. Resolve manually.`
      )
    );
  }

  console.log(`\n   Config: ${target.configPath}`);
  console.log(`   Agents: ${target.agentDir}`);

  console.log(
    pc.bold(
      `\n📌 Next step: Configure models with ${pc.cyan("opencode-path models")}`
    )
  );
  console.log(
    pc.yellow(
      "⚠️  Restart opencode to apply changes.\n"
    )
  );
}
