import { existsSync } from "node:fs";
import { join } from "node:path";
import pc from "picocolors";
import { select, checkbox, confirm } from "@inquirer/prompts";
import {
  resolveTarget,
  detectDefaultScope,
  type InstallScope,
} from "../lib/paths.js";
import {
  PROFILES,
  getProfile,
  applyProfileToAgents,
  type ProfileName,
  type ProfileApplyResult,
  type PerFileStatus,
} from "../lib/profiles.js";

/**
 * Agent files that receive stack profiles.
 * - developer.md: dev variant
 * - reviewer.md: read-only variant
 * - auditor.md: read-only variant
 *
 * spec.md, architect.md, and research.md are NOT modified.
 */
const PATCHABLE_AGENTS = [
  { name: "developer", variant: "dev" as const },
  { name: "reviewer", variant: "readonly" as const },
  { name: "auditor", variant: "readonly" as const },
];

/**
 * Check whether any patchable agent files exist at the given target.
 */
function hasPatchableAgents(target: { agentDir: string }): boolean {
  return PATCHABLE_AGENTS.some((agent) =>
    existsSync(join(target.agentDir, `${agent.name}.md`))
  );
}

/**
 * Run the `opencode-path profiles` command.
 */
export async function profilesCommand(): Promise<void> {
  console.log(pc.bold("\n🧩 OpenCode Path Stack Profiles\n"));

  // Step 1: Detect/select install target
  const defaultScope = detectDefaultScope();
  const projectTarget = resolveTarget("project");
  const globalTarget = resolveTarget("global");

  const hasProjectAgents = hasPatchableAgents(projectTarget);
  const hasGlobalAgents = hasPatchableAgents(globalTarget);

  let scope: InstallScope;

  if (!hasProjectAgents && !hasGlobalAgents) {
    console.log(
      pc.red(
        `\n   No installed agent files found. Run ${pc.cyan("opencode-path init")} first.\n`
      )
    );
    return;
  }

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
          description: globalTarget.agentDir,
        },
      ],
      default: defaultScope,
    });
  }

  const target = resolveTarget(scope);

  // Show resolved target
  console.log(pc.bold(`\n   Agent directory: ${target.agentDir}\n`));

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
  console.log(`   Target: ${target.agentDir}\n`);

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

    const result = applyProfileToAgents(target.agentDir, profile, PATCHABLE_AGENTS);
    results.push(result);
  }

  // Step 5: Print results
  // Classify profiles by primary outcome
  const applied: string[] = [];
  const skipped: string[] = [];
  const failed: string[] = [];
  const incomplete: string[] = [];
  const changedFiles: Set<string> = new Set();

  for (const r of results) {
    const inserted = r.files.filter((f) => f.status === "inserted");
    const alreadyExists = r.files.filter((f) => f.status === "already_exists");
    const errors = r.files.filter((f) => f.status === "marker_not_found");
    const missing = r.files.filter((f) => f.status === "file_missing");

    for (const f of inserted) {
      changedFiles.add(`${f.agent}.md`);
    }

    if (inserted.length > 0) {
      applied.push(r.profileLabel);
    }

    if (errors.length > 0) {
      failed.push(r.profileLabel);
    }

    if (missing.length > 0) {
      incomplete.push(r.profileLabel);
    }

    if (
      alreadyExists.length === r.files.length &&
      inserted.length === 0 &&
      errors.length === 0 &&
      missing.length === 0
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

  if (incomplete.length > 0) {
    console.log(pc.yellow(`   Incomplete: ${incomplete.join(", ")}`));
  }

  if (changedFiles.size > 0) {
    console.log(`   Changed:  ${[...changedFiles].join(", ")}`);
  }

  // Per-profile details
  let hasWarnings = false;

  for (const r of results) {
    const errors = r.files.filter((f) => f.status === "marker_not_found");
    const missing = r.files.filter((f) => f.status === "file_missing");

    if (errors.length > 0 || missing.length > 0) {
      if (!hasWarnings) {
        console.log(pc.yellow("\n   ⚠ Details:"));
        hasWarnings = true;
      }

      for (const f of errors) {
        console.log(
          pc.yellow(`     ${r.profileLabel} → ${f.agent}.md: profile marker not found`)
        );
      }
      for (const f of missing) {
        console.log(
          pc.dim(`     ${r.profileLabel} → ${f.agent}.md: file not installed`)
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
