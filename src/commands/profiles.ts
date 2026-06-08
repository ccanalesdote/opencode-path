import { existsSync } from "node:fs";
import { join } from "node:path";
import pc from "picocolors";
import { select, checkbox, confirm } from "@inquirer/prompts";
import {
  resolveTarget,
  detectDefaultScope,
  type InstallScope,
  type InstallTarget,
} from "../lib/paths.js";
import {
  PROFILES,
  getProfile,
  applyProfileToAgents,
  type ProfileName,
  type ProfileApplyResult,
  type PerFileStatus,
} from "../lib/profiles.js";
import {
  listActiveManagedAgents,
  listManagedAgentStatuses,
  type ManagedAgentStatus,
} from "../lib/agents.js";

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
 */
function getActivePatchableAgents(
  target: InstallTarget
): { name: string; variant: "dev" | "readonly" }[] {
  const activeAgents = listActiveManagedAgents(target);
  const activeCustomNames = new Set(
    activeAgents.filter((a) => a.kind === "custom").map((a) => a.name)
  );

  // Also check for conflict agents among patchable names
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

  // Warn about conflict agents
  if (conflictPatchable.length > 0) {
    console.log(
      pc.yellow(
        `   ⚠ These patchable agents have manual files (conflict): ${conflictPatchable.join(", ")}`
      )
    );
    console.log(
      pc.dim(
        "     They will not be modified. Resolve conflicts manually or add the managed marker.\n"
      )
    );
  }

  return result;
}

/**
 * Run the `opencode-path profiles` command.
 *
 * Only applies to active managed custom agents that are in the patchable set
 * (developer, reviewer, auditor).
 */
export async function profilesCommand(): Promise<void> {
  console.log(pc.bold("\n🧩 OpenCode Path Stack Profiles\n"));

  // Step 1: Detect/select install target
  const defaultScope = detectDefaultScope();
  const projectTarget = resolveTarget("project");
  const globalTarget = resolveTarget("global");

  const projectPatchable = getActivePatchableAgents(projectTarget);
  const globalPatchable = getActivePatchableAgents(globalTarget);

  let scope: InstallScope;

  if (projectPatchable.length === 0 && globalPatchable.length === 0) {
    console.log(
      pc.yellow(
        `\n   No active patchable agents found. Use ${pc.cyan("opencode-path agents")} to activate developer, reviewer, and/or auditor.\n`
      )
    );
    return;
  }

  if (projectPatchable.length === 0) {
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

  // Get active patchable agents for this target
  const patchableAgents = getActivePatchableAgents(target);

  if (patchableAgents.length === 0) {
    console.log(
      pc.yellow(
        `\n   No active patchable agents at this target. Activate developer, reviewer, or auditor with ${pc.cyan("opencode-path agents")}.\n`
      )
    );
    return;
  }

  // Show resolved target
  console.log(pc.bold(`\n   Agent directory: ${target.agentDir}`));
  console.log(pc.dim(`   Active patchable agents: ${patchableAgents.map((a) => a.name).join(", ")}\n`));

  // Step 2: Show available profiles and let user select
  const selectedProfileNames = await checkbox<ProfileName>({
    message: "Select stack profiles to apply (space to toggle, enter to confirm):",
    choices: [
      ...PROFILES.map((p) => ({
        value: p.name as ProfileName,
        name: p.label,
      })),
      {
        value: "__all__" as ProfileName,
        name: "All stacks (apply every profile above)",
      },
    ],
    required: true,
  });

  if (selectedProfileNames.length === 0) {
    console.log(pc.yellow("\nNo profiles selected. Exiting without changes.\n"));
    return;
  }

  // Handle "all" selection
  let profilesToApply: string[];
  if (selectedProfileNames.includes("__all__")) {
    profilesToApply = PROFILES.map((p) => p.name);
  } else {
    profilesToApply = selectedProfileNames;
  }

  // Step 3: Confirm before applying
  const profileLabels = profilesToApply
    .map((name) => getProfile(name)?.label ?? name)
    .join(", ");

  console.log(
    pc.bold(`\n📋 Applying profiles: ${profileLabels}`)
  );
  console.log(`   Target: ${target.agentDir}`);
  console.log(`   Agents: ${patchableAgents.map((a) => `${a.name} (${a.variant})`).join(", ")}\n`);

  const proceed = await confirm({
    message: "Apply selected profiles?",
    default: true,
  });

  if (!proceed) {
    console.log(pc.yellow("\nCancelled. No files were modified.\n"));
    return;
  }

  // Step 4: Apply profiles
  const results: ProfileApplyResult[] = [];

  for (const profileName of profilesToApply) {
    const profile = getProfile(profileName);
    if (!profile) continue;

    const result = applyProfileToAgents(target.agentDir, profile, patchableAgents);
    results.push(result);
  }

  // Step 5: Print results
  // Classify profiles by primary outcome
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

  console.log(pc.bold("\n✅ Profile application complete!\n"));
  console.log(`   Target:   ${target.agentDir}`);

  if (applied.length > 0) {
    console.log(pc.green(`   Applied:  ${applied.join(", ")}`));
  }

  if (skipped.length > 0) {
    console.log(pc.dim(`   Skipped:  ${skipped.join(", ")} (already installed)`));
  }

  if (failed.length > 0) {
    console.log(pc.red(`   Failed:   ${failed.join(", ")}`));
  }

  if (changedFiles.size > 0) {
    console.log(`   Changed:  ${[...changedFiles].join(", ")}`);
  }

  // Per-profile details for failed
  let hasWarnings = false;

  for (const r of results) {
    const errors = r.files.filter((f) => f.status === "marker_not_found");

    if (errors.length > 0) {
      if (!hasWarnings) {
        console.log(pc.yellow("\n   ⚠ Details:"));
        hasWarnings = true;
      }

      for (const f of errors) {
        console.log(
          pc.yellow(`     ${r.profileLabel} → ${f.agent}.md: profile marker not found`)
        );
      }
    }
  }

  if (hasWarnings) {
    console.log(
      pc.dim(
        "     The marker line may have been removed from the agent file."
      )
    );
  }

  console.log(
    pc.yellow(
      "\n⚠️  Restart opencode to apply changes.\n"
    )
  );
}
