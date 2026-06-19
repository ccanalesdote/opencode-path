import { existsSync, readdirSync } from "node:fs";
import {
  resolveTarget,
  type InstallScope,
  type InstallTarget,
} from "../lib/paths.js";
import {
  detectManageableScopes,
  fileHasManagedMarker,
  deleteCustomAgent,
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
  uiConfirm,
  resolveScope,
  type CommandOptions,
  type SummaryLine,
} from "../lib/ui.js";
import * as messages from "../lib/messages.js";
import { join, basename } from "node:path";

// ---------------------------------------------------------------------------
// Uninstall plan
// ---------------------------------------------------------------------------

interface UninstallPlan {
  managedToDelete: string[];
  unmarkedToSkip: string[];
}

interface UninstallResult {
  deleted: string[];
  skipped: string[];
}

/**
 * Compute what uninstall would remove.
 *
 * Scans the actual agent directory for all .md files to detect both
 * managed files (with MANAGED_MARKER) and unmarked manual files.
 *
 * Built-in agent config entries (disable, model) are preserved because
 * we cannot prove provenance — the entries may have been set manually
 * by the user rather than by opencode-path.
 */
function computeUninstallPlan(target: InstallTarget): UninstallPlan {
  const managedToDelete: string[] = [];
  const unmarkedToSkip: string[] = [];

  // Scan the agent directory for all .md files
  if (existsSync(target.agentDir)) {
    let files: string[];
    try {
      files = readdirSync(target.agentDir).filter((f) => f.endsWith(".md"));
    } catch {
      files = [];
    }

    for (const file of files) {
      const name = basename(file, ".md");
      const filePath = join(target.agentDir, file);

      if (fileHasManagedMarker(filePath)) {
        managedToDelete.push(name);
      } else {
        unmarkedToSkip.push(name);
      }
    }
  }

  // Config entries are NOT cleaned during uninstall. Built-in agent
  // config (disable, model) is preserved because we cannot distinguish
  // user-set entries from opencode-path-set entries. Users can restore
  // hidden built-in agents via `opencode-path agents` before uninstalling.

  return { managedToDelete, unmarkedToSkip };
}

/**
 * Build a summary for the uninstall plan or result.
 */
function buildUninstallSummary(
  plan: UninstallPlan,
  result?: UninstallResult
): SummaryLine[] {
  const lines: SummaryLine[] = [];

  if (result) {
    if (result.deleted.length > 0) {
      lines.push({
        label: "Deleted:",
        value: result.deleted.join(", "),
        color: "green",
      });
    }
    if (result.skipped.length > 0) {
      lines.push({
        label: "Skipped (unmarked):",
        value: result.skipped.join(", "),
        color: "yellow",
      });
    }
  } else {
    if (plan.managedToDelete.length > 0) {
      lines.push({
        label: "Delete:",
        value: plan.managedToDelete.join(", "),
        color: "red",
      });
    }
    if (plan.unmarkedToSkip.length > 0) {
      lines.push({
        label: "Skip (unmarked):",
        value: plan.unmarkedToSkip.join(", "),
        color: "dim",
      });
    }
  }

  return lines;
}

/**
 * Apply the uninstall plan.
 *
 * Only managed custom agent .md files are deleted. Config entries
 * (including built-in agent disable/model fields) are preserved.
 */
function applyUninstallPlan(
  plan: UninstallPlan,
  target: InstallTarget
): UninstallResult {
  const deleted: string[] = [];
  const skipped: string[] = [...plan.unmarkedToSkip];

  // Delete managed custom agent files
  for (const name of plan.managedToDelete) {
    const wasDeleted = deleteCustomAgent(name, target);
    if (wasDeleted) {
      deleted.push(name);
    } else {
      skipped.push(name);
    }
  }

  return { deleted, skipped };
}

// ---------------------------------------------------------------------------
// Main uninstall command
// ---------------------------------------------------------------------------

export async function uninstallCommand(
  options: CommandOptions = {}
): Promise<void> {
  printHeader("OpenCode Path Uninstall", "🗑️");

  // Step 1: Resolve scope
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

  // Step 2: Compute plan
  const plan = computeUninstallPlan(target);

  if (plan.managedToDelete.length === 0) {
    if (plan.unmarkedToSkip.length > 0) {
      printWarning(
        `Found ${plan.unmarkedToSkip.length} unmarked custom file(s) that will not be deleted: ${plan.unmarkedToSkip.join(", ")}`
      );
    }
    printNoChanges();
    return;
  }

  // Step 3: Show plan
  console.log("\n   Planned removals:");
  printSummary(buildUninstallSummary(plan));

  if (plan.unmarkedToSkip.length > 0) {
    printWarning(
      `Unmarked files will NOT be deleted: ${plan.unmarkedToSkip.join(", ")}`
    );
  }

  // Step 4: Confirm
  if (!options.yes) {
    const proceed = await uiConfirm(
      "Remove the files listed above?",
      { default: false }
    );

    if (!proceed) {
      printCancelled();
      return;
    }
  }

  // Step 5: Apply
  const result = applyUninstallPlan(plan, target);

  // Step 6: Print results
  printComplete("Uninstall");
  printSummary(buildUninstallSummary(plan, result));

  if (result.skipped.length > 0) {
    printWarning(
      `Unmarked files were not deleted: ${result.skipped.join(", ")}`
    );
  }

  printRestartWarning();
}


