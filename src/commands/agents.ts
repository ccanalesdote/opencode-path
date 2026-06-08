import pc from "picocolors";
import { select, checkbox, confirm } from "@inquirer/prompts";
import { resolveTarget, detectDefaultScope, type InstallScope } from "../lib/paths.js";
import {
  listManagedAgentStatuses,
  detectManageableScopes,
  installCustomAgent,
  deleteCustomAgent,
  hideBuiltinAgent,
  restoreBuiltinAgent,
  type ManagedAgentStatus,
} from "../lib/agents.js";

interface AgentsResult {
  installed: string[];
  deleted: string[];
  restored: string[];
  hidden: string[];
  unchanged: string[];
  conflicts: string[];
}

/**
 * Build a display label for a managed agent in the checkbox list.
 */
function agentCheckboxLabel(agent: ManagedAgentStatus): string {
  const kindBadge = agent.kind === "builtin" ? pc.dim("[built-in]") : pc.dim("[custom]");
  const stateIndicator =
    agent.state === "active"
      ? pc.green("●")
      : agent.state === "missing"
        ? pc.dim("○")
        : agent.state === "hidden"
          ? pc.yellow("◌")
          : pc.red("✕");
  const stateLabel =
    agent.state === "active"
      ? ""
      : agent.state === "missing"
        ? pc.dim("(not installed)")
        : agent.state === "hidden"
          ? pc.yellow("(hidden)")
          : pc.red("(conflict — manual file)");

  return `${stateIndicator} ${agent.name} ${kindBadge} ${stateLabel}`;
}

/**
 * Run the `opencode-path agents` command — full agent management.
 *
 * - Checked agents will be active after the command.
 * - Unchecked custom agents are deleted (with confirmation).
 * - Unchecked built-ins (plan, build, explore) are hidden via config.
 * - Conflict agents are displayed but not modifiable.
 */
export async function agentsCommand(): Promise<void> {
  console.log(pc.bold("\n🤖 OpenCode Path Agent Management\n"));

  // Step 1: Target selection
  const defaultScope = detectDefaultScope();
  const projectTarget = resolveTarget("project");
  const globalTarget = resolveTarget("global");

  // Use managed-agents-aware detection: built-ins (plan, build, explore) are
  // active by default even without init, so the project target is always
  // a valid choice. Gracefully handles unreadable configs.
  const { projectManageable, globalManageable } = detectManageableScopes(projectTarget, globalTarget);

  let scope: InstallScope;

  if (!projectManageable && !globalManageable) {
    // Should not happen since built-ins are always in the catalog
    console.log(pc.dim("\n   No managed agents available.\n"));
    return;
  }

  if (!projectManageable) {
    scope = "global";
    console.log(`   Target: Global (auto-detected)`);
  } else if (!globalManageable) {
    scope = "project";
    console.log(`   Target: Project (auto-detected)`);
  } else {
    scope = await select<InstallScope>({
      message: "Which installation do you want to manage?",
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

  // Show resolved target
  console.log(pc.bold(`\n   Agent dir: ${target.agentDir}`));
  console.log(pc.bold(`   Config:    ${target.configPath}\n`));

  // Step 2: Get agent statuses and build checkbox
  const statuses = listManagedAgentStatuses(target);

  if (statuses.length === 0) {
    console.log(pc.dim("\n   No managed agents available.\n"));
    return;
  }

  const choices = statuses.map((agent) => {
    // Checked = active state; unchecked = missing/hidden
    // Conflict agents are shown as unchecked and not modifiable
    const isChecked = agent.state === "active";

    return {
      value: agent.name,
      name: agentCheckboxLabel(agent),
      checked: isChecked,
    };
  });

  const hasConflicts = statuses.some((a) => a.state === "conflict");

  if (hasConflicts) {
    console.log(
      pc.yellow(
        "   ⚠ Agents marked with ✕ have manual files without the managed marker."
      )
    );
    console.log(
      pc.dim(
        "     They cannot be managed here. Resolve manually or add the marker.\n"
      )
    );
  }

  console.log(pc.dim("   Checked = active. Unchecked = will be deactivated.\n"));

  const selectedNames = await checkbox<string>({
    message: "Select active agents (space to toggle, enter to confirm):",
    choices,
    required: false,
  });

  const selectedSet = new Set(selectedNames);

  // Compute all planned changes WITHOUT applying them yet.
  // All mutations are deferred behind a single confirmation.
  const toInstall: string[] = [];
  const toDelete: string[] = [];
  const toRestore: string[] = [];
  const toHide: string[] = [];
  const unchanged: string[] = [];
  const conflicts: string[] = [];

  for (const agent of statuses) {
    const shouldBeActive = selectedSet.has(agent.name);
    const isCurrentlyActive = agent.state === "active";

    if (agent.state === "conflict") {
      conflicts.push(agent.name);
      continue;
    }

    if (agent.kind === "custom") {
      if (agent.state === "missing" && shouldBeActive) {
        toInstall.push(agent.name);
      } else if (agent.state === "active" && !shouldBeActive) {
        toDelete.push(agent.name);
      } else if (agent.state === "active" && shouldBeActive) {
        unchanged.push(agent.name);
      } else if (agent.state === "missing" && !shouldBeActive) {
        unchanged.push(agent.name);
      }
      continue;
    }

    if (agent.kind === "builtin") {
      if (agent.state === "hidden" && shouldBeActive) {
        toRestore.push(agent.name);
      } else if (agent.state === "active" && !shouldBeActive) {
        toHide.push(agent.name);
      } else if (agent.state === "active" && shouldBeActive) {
        unchanged.push(agent.name);
      } else if (agent.state === "hidden" && !shouldBeActive) {
        unchanged.push(agent.name);
      }
      continue;
    }
  }

  // Check if there are any changes at all
  const hasChanges =
    toInstall.length > 0 ||
    toDelete.length > 0 ||
    toRestore.length > 0 ||
    toHide.length > 0;

  if (!hasChanges && conflicts.length === 0) {
    console.log(pc.dim("\n   No changes needed. All agents are already in the desired state.\n"));
    return;
  }

  // Confirm all changes before applying any
  if (hasChanges) {
    console.log(pc.bold("\n📋 The following changes will be performed:"));

    if (toInstall.length > 0) {
      console.log(pc.green(`   Install:  ${toInstall.join(", ")}`));
    }
    if (toDelete.length > 0) {
      console.log(pc.red(`   Delete:   ${toDelete.join(", ")}`));
    }
    if (toRestore.length > 0) {
      console.log(pc.green(`   Restore:  ${toRestore.join(", ")}`));
    }
    if (toHide.length > 0) {
      console.log(pc.yellow(`   Hide:     ${toHide.join(", ")}`));
    }

    const proceed = await confirm({
      message: "Apply these changes?",
      default: false,
    });

    if (!proceed) {
      console.log(pc.yellow("\nCancelled. No changes were made.\n"));
      return;
    }

    // Now apply all changes
    const result: AgentsResult = {
      installed: [],
      deleted: [],
      restored: [],
      hidden: [],
      unchanged: [],
      conflicts,
    };

    for (const name of toInstall) {
      const installResult = installCustomAgent(name as any, target);
      if (installResult === "created") {
        result.installed.push(name);
      } else if (installResult === "conflict") {
        result.conflicts.push(name);
      } else {
        result.unchanged.push(name);
      }
    }

    for (const name of toDelete) {
      const deleted = deleteCustomAgent(name, target);
      if (deleted) {
        result.deleted.push(name);
      } else {
        result.unchanged.push(name);
      }
    }

    for (const name of toRestore) {
      restoreBuiltinAgent(name, target);
      result.restored.push(name);
    }

    for (const name of toHide) {
      hideBuiltinAgent(name, target);
      result.hidden.push(name);
    }

    // Add unchanged
    result.unchanged.push(...unchanged);

    // Print results
    console.log(pc.bold("\n✅ Agent management complete!\n"));

    if (result.installed.length > 0) {
      console.log(pc.green(`   Installed:  ${result.installed.join(", ")}`));
    }
    if (result.deleted.length > 0) {
      console.log(pc.red(`   Deleted:    ${result.deleted.join(", ")}`));
    }
    if (result.restored.length > 0) {
      console.log(pc.green(`   Restored:   ${result.restored.join(", ")}`));
    }
    if (result.hidden.length > 0) {
      console.log(pc.yellow(`   Hidden:     ${result.hidden.join(", ")}`));
    }
    if (result.unchanged.length > 0) {
      console.log(pc.dim(`   Unchanged:  ${result.unchanged.join(", ")}`));
    }
    if (result.conflicts.length > 0) {
      console.log(pc.red(`   Conflicts:  ${result.conflicts.join(", ")}`));
      console.log(
        pc.yellow(
          `     These agents have manual files without the managed marker. Resolve manually.`
        )
      );
    }
  } else {
    // Only conflicts, no changes
    if (conflicts.length > 0) {
      console.log(pc.red(`\n   Conflicts:  ${conflicts.join(", ")}`));
      console.log(
        pc.yellow(
          `     These agents have manual files without the managed marker. Resolve manually.`
        )
      );
    }
  }

  console.log(
    pc.yellow(
      "\n⚠️  Restart opencode to apply changes.\n"
    )
  );
}
