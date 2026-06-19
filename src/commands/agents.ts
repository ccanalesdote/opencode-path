import {
  resolveTarget,
  type InstallScope,
} from "../lib/paths.js";
import {
  listManagedAgentStatuses,
  detectManageableScopes,
  computeAgentChanges,
  applyAgentChanges,
  type ManagedAgentStatus,
} from "../lib/agents.js";
import {
  printHeader,
  printPaths,
  printWarning,
  printCancelled,
  printNoChanges,
  printComplete,
  printSummary,
  printRestartWarning,
  buildAgentRow,
  uiCheckbox,
  uiConfirm,
  resolveScope,
  type CommandOptions,
  type SummaryLine,
} from "../lib/ui.js";
import * as messages from "../lib/messages.js";

interface AgentsResult {
  installed: string[];
  deleted: string[];
  restored: string[];
  hidden: string[];
  unchanged: string[];
  conflicts: string[];
}

function buildAgentSummary(
  result: AgentsResult,
  mode: "plan" | "result"
): SummaryLine[] {
  if (mode === "plan") {
    return [
      ...(result.installed.length > 0
        ? [
            {
              label: "Install:",
              value: result.installed.join(", "),
              color: "green" as const,
            },
          ]
        : []),
      ...(result.deleted.length > 0
        ? [
            {
              label: "Delete:",
              value: result.deleted.join(", "),
              color: "red" as const,
            },
          ]
        : []),
      ...(result.restored.length > 0
        ? [
            {
              label: "Restore:",
              value: result.restored.join(", "),
              color: "green" as const,
            },
          ]
        : []),
      ...(result.hidden.length > 0
        ? [
            {
              label: "Hide:",
              value: result.hidden.join(", "),
              color: "yellow" as const,
            },
          ]
        : []),
      ...(result.unchanged.length > 0
        ? [
            {
              label: "Unchanged:",
              value: result.unchanged.join(", "),
              color: "dim" as const,
            },
          ]
        : []),
      ...(result.conflicts.length > 0
        ? [
            {
              label: "Conflicts:",
              value: result.conflicts.join(", "),
              color: "red" as const,
            },
          ]
        : []),
    ];
  }

  return [
    ...(result.installed.length > 0
      ? [
          {
            label: "Installed:",
            value: result.installed.join(", "),
            color: "green" as const,
          },
        ]
      : []),
    ...(result.deleted.length > 0
      ? [
          {
            label: "Deleted:",
            value: result.deleted.join(", "),
            color: "red" as const,
          },
        ]
      : []),
    ...(result.restored.length > 0
      ? [
          {
            label: "Restored:",
            value: result.restored.join(", "),
            color: "green" as const,
          },
        ]
      : []),
    ...(result.hidden.length > 0
      ? [
          {
            label: "Hidden:",
            value: result.hidden.join(", "),
            color: "yellow" as const,
          },
        ]
      : []),
    ...(result.unchanged.length > 0
      ? [
          {
            label: "Unchanged:",
            value: result.unchanged.join(", "),
            color: "dim" as const,
          },
        ]
      : []),
    ...(result.conflicts.length > 0
      ? [
          {
            label: "Conflicts:",
            value: result.conflicts.join(", "),
            color: "red" as const,
          },
        ]
      : []),
  ];
}

/**
 * Run the `opencode-path agents` command — full agent management.
 *
 * - Checked agents will be active after the command.
 * - Unchecked custom agents are deleted.
 * - Unchecked built-ins (plan, build, explore) are hidden via config.
 * - Conflict agents are displayed but not modifiable.
 */
export async function agentsCommand(
  options: CommandOptions = {}
): Promise<void> {
  printHeader("OpenCode Path Agent Management", "🤖");

  // Step 1: Resolve target
  const projectTarget = resolveTarget("project");
  const globalTarget = resolveTarget("global");
  const { projectManageable, globalManageable } = detectManageableScopes(
    projectTarget,
    globalTarget
  );

  const scope: InstallScope = await resolveScope(options, {
    projectViable: projectManageable,
    globalViable: globalManageable,
    projectTarget,
    globalTarget,
  });

  const target = resolveTarget(scope);
  printPaths(target);

  // Step 2: Get agent statuses and build checkbox
  const statuses = listManagedAgentStatuses(target);

  if (statuses.length === 0) {
    printNoChanges();
    return;
  }

  const choices = statuses.map((agent) => ({
    value: agent.name,
    name: buildAgentRow(agent, { showGlyph: true }),
    checked: agent.state === "active",
  }));

  const hasConflicts = statuses.some((a) => a.state === "conflict");

  if (hasConflicts) {
    printWarning(
      "Agents marked with ✕ have manual files without the managed marker."
    );
    console.log(
      "     They cannot be managed here. Resolve manually or add the marker.\n"
    );
  }

  console.log("   Checked = active. Unchecked = will be deactivated.\n");

  const selectedNames = await uiCheckbox<string>(
    "Select active agents (space to toggle, enter to confirm):",
    choices,
    { required: false }
  );

  const selectedSet = new Set(selectedNames);

  // Step 3: Compute planned changes
  const {
    toInstall,
    toDelete,
    toRestore,
    toHide,
    unchanged,
    conflicts,
  } = computeAgentChanges(statuses, selectedSet);

  const hasChanges =
    toInstall.length > 0 ||
    toDelete.length > 0 ||
    toRestore.length > 0 ||
    toHide.length > 0;

  if (!hasChanges && conflicts.length === 0) {
    printNoChanges();
    return;
  }

  // Step 4: Show plan (dry-run uses this as final output)
  const planResult: AgentsResult = {
    installed: toInstall,
    deleted: toDelete,
    restored: toRestore,
    hidden: toHide,
    unchanged,
    conflicts,
  };

  console.log("\n   Planned changes:");
  printSummary(buildAgentSummary(planResult, "plan"));

  if (options.dryRun) {
    console.log(`\n   ${messages.DRY_RUN_LABEL} No files were modified.\n`);
    return;
  }

  // Step 5: Confirm and apply
  if (hasChanges && !options.yes) {
    const proceed = await uiConfirm(messages.APPLY_CHANGES, { default: false });

    if (!proceed) {
      printCancelled();
      return;
    }
  }

  const changes = { toInstall, toDelete, toRestore, toHide, unchanged, conflicts };
  const applyResult = applyAgentChanges(changes, target);

  const result: AgentsResult = {
    installed: applyResult.installed,
    deleted: applyResult.deleted,
    restored: applyResult.restored,
    hidden: applyResult.hidden,
    unchanged: applyResult.unchanged,
    conflicts: applyResult.conflicts,
  };

  // Step 6: Print results
  printComplete("Agent management");
  printSummary(buildAgentSummary(result, "result"));

  if (result.conflicts.length > 0) {
    console.log(
      `\n   ${messages.CONFLICT_RESOLVE_HINT}`
    );
  }

  printRestartWarning();
}
