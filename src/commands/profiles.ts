import {
  resolveTarget,
  type InstallScope,
  type InstallTarget,
} from "../lib/paths.js";
import {
  PROFILES,
  getProfile,
  applyProfileToAgents,
  type ProfileName,
  type ProfileApplyResult,
} from "../lib/profiles.js";
import {
  listActiveManagedAgents,
  listManagedAgentStatuses,
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
  uiCheckbox,
  uiConfirm,
  resolveScope,
  type CommandOptions,
  type SummaryLine,
} from "../lib/ui.js";
import * as messages from "../lib/messages.js";

/**
 * Patchable agent definitions: which agents get which variant.
 * Only active managed custom agents matching these names will be patched.
 */
const PATCHABLE_DEFS = [
  { name: "developer", variant: "dev" as const },
  { name: "reviewer", variant: "readonly" as const },
  { name: "auditor", variant: "readonly" as const },
];

/**
 * Filter the patchable agents down to only those that are active managed custom agents.
 * Returns the entries from PATCHABLE_DEFS whose names are active custom agents.
 *
 * When `silent` is true, conflict warnings are suppressed so the function can be
 * used purely for viability checks without surfacing warnings for scopes the user
 * may never choose.
 */
function getActivePatchableAgents(
  target: InstallTarget,
  { silent }: { silent?: boolean } = {}
): { name: string; variant: "dev" | "readonly" }[] {
  const activeAgents = listActiveManagedAgents(target);
  const activeCustomNames = new Set(
    activeAgents.filter((a) => a.kind === "custom").map((a) => a.name)
  );

  const allStatuses = listManagedAgentStatuses(target);
  const conflictNames = new Set(
    allStatuses.filter((a) => a.state === "conflict").map((a) => a.name)
  );

  const result: { name: string; variant: "dev" | "readonly" }[] = [];
  const conflictPatchable: string[] = [];

  for (const def of PATCHABLE_DEFS) {
    if (activeCustomNames.has(def.name)) {
      result.push(def);
    } else if (conflictNames.has(def.name)) {
      conflictPatchable.push(def.name);
    }
  }

  if (!silent && conflictPatchable.length > 0) {
    printWarning(
      `These patchable agents have manual files (conflict): ${conflictPatchable.join(
        ", "
      )}`
    );
    console.log(
      "     They will not be modified. Resolve conflicts manually or add the managed marker.\n"
    );
  }

  return result;
}

function buildPlanSummary(
  profileLabels: string[],
  agentNames: string[]
): SummaryLine[] {
  return [
    {
      label: "Apply:",
      value: profileLabels.join(", "),
      color: "green" as const,
    },
    {
      label: "Agents:",
      value: agentNames.join(", "),
      color: "dim" as const,
    },
  ];
}

function buildResultSummary(
  applied: string[],
  skipped: string[],
  failed: string[],
  changedFiles: string[]
): SummaryLine[] {
  return [
    ...(applied.length > 0
      ? [{ label: "Applied:", value: applied.join(", "), color: "green" as const }]
      : []),
    ...(skipped.length > 0
      ? [
          {
            label: "Skipped:",
            value: `${skipped.join(", ")} (already installed)`,
            color: "dim" as const,
          },
        ]
      : []),
    ...(failed.length > 0
      ? [{ label: "Failed:", value: failed.join(", "), color: "red" as const }]
      : []),
    ...(changedFiles.length > 0
      ? [{ label: "Changed:", value: changedFiles.join(", "), color: "green" as const }]
      : []),
  ];
}

/**
 * Run the `opencode-path profiles` command.
 *
 * Only applies to active managed custom agents that are in the patchable set
 * (developer, reviewer, auditor).
 */
export async function profilesCommand(
  options: CommandOptions = {}
): Promise<void> {
  printHeader("OpenCode Path Stack Profiles", "🧩");

  // Step 1: Resolve target
  const projectTarget = resolveTarget("project");
  const globalTarget = resolveTarget("global");

  const projectPatchable = getActivePatchableAgents(projectTarget, {
    silent: true,
  });
  const globalPatchable = getActivePatchableAgents(globalTarget, {
    silent: true,
  });

  if (projectPatchable.length === 0 && globalPatchable.length === 0) {
    printWarning(
      "No active patchable agents found. Use opencode-path agents to activate developer, reviewer, and/or auditor."
    );
    console.log();
    return;
  }

  const scope: InstallScope = await resolveScope(options, {
    projectViable: projectPatchable.length > 0,
    globalViable: globalPatchable.length > 0,
    projectTarget,
    globalTarget,
  });

  const target = resolveTarget(scope);

  // Get active patchable agents for this target
  const patchableAgents = getActivePatchableAgents(target);

  if (patchableAgents.length === 0) {
    printWarning(
      `No active patchable agents at this target. Activate developer, reviewer, or auditor with opencode-path agents.`
    );
    console.log();
    return;
  }

  printPaths(target);
  console.log(
    `   Active patchable agents: ${patchableAgents.map((a) => a.name).join(", ")}\n`
  );

  // Step 2: Show available profiles and let user select
  const selectedProfileNames = await uiCheckbox<ProfileName>(
    "Select stack profiles to apply (space to toggle, enter to confirm):",
    [
      ...PROFILES.map((p) => ({
        value: p.name as ProfileName,
        name: p.label,
      })),
      {
        value: "__all__" as ProfileName,
        name: "All stacks (apply every profile above)",
      },
    ],
    { required: true }
  );

  if (selectedProfileNames.length === 0) {
    printNoChanges();
    return;
  }

  // Handle "all" selection
  const profilesToApply: string[] = selectedProfileNames.includes("__all__")
    ? PROFILES.map((p) => p.name)
    : selectedProfileNames;

  // Step 3: Show plan and dry-run output
  console.log("\n   Planned changes:");
  printSummary(
    buildPlanSummary(
      profilesToApply.map((name) => getProfile(name)?.label ?? name),
      patchableAgents.map((a) => `${a.name} (${a.variant})`)
    )
  );

  if (options.dryRun) {
    console.log(`\n   ${messages.DRY_RUN_LABEL} No files were modified.\n`);
    return;
  }

  // Step 4: Confirm before applying
  if (!options.yes) {
    const proceed = await uiConfirm(messages.APPLY_CHANGES, { default: true });

    if (!proceed) {
      printCancelled();
      return;
    }
  }

  // Step 5: Apply profiles
  const results: ProfileApplyResult[] = [];

  for (const profileName of profilesToApply) {
    const profile = getProfile(profileName);
    if (!profile) continue;

    const result = applyProfileToAgents(target.agentDir, profile, patchableAgents);
    results.push(result);
  }

  // Step 6: Classify and print results
  const applied: string[] = [];
  const skipped: string[] = [];
  const failed: string[] = [];
  const changedFiles: Set<string> = new Set();

  for (const r of results) {
    const inserted = r.files.filter((f) => f.status === "inserted");
    const alreadyExists = r.files.filter((f) => f.status === "already_exists");
    const errors = r.files.filter((f) => f.status === "marker_not_found");

    for (const f of inserted) {
      changedFiles.add(`${f.agent}.md`);
    }

    if (inserted.length > 0) {
      applied.push(r.profileLabel);
    }

    if (errors.length > 0) {
      failed.push(r.profileLabel);
    }

    if (
      alreadyExists.length === r.files.length &&
      inserted.length === 0 &&
      errors.length === 0
    ) {
      skipped.push(r.profileLabel);
    }
  }

  printComplete("Profile application");
  printSummary(
    buildResultSummary(applied, skipped, failed, [...changedFiles])
  );

  // Per-profile details for failed
  let hasWarnings = false;

  for (const r of results) {
    const errors = r.files.filter((f) => f.status === "marker_not_found");

    if (errors.length > 0) {
      if (!hasWarnings) {
        printWarning("Details:");
        hasWarnings = true;
      }

      for (const f of errors) {
        console.log(
          `     ${r.profileLabel} → ${f.agent}.md: profile marker not found`
        );
      }
    }
  }

  if (hasWarnings) {
    console.log(
      "     The marker line may have been removed from the agent file.\n"
    );
  }

  printRestartWarning();
}
