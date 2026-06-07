import { existsSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { basename, join } from "node:path";
import pc from "picocolors";
import { select, confirm, input } from "@inquirer/prompts";
import { resolveTarget, detectDefaultScope, PACK_AGENTS, type InstallScope } from "../lib/paths.js";
import { readTemplate, listTemplates } from "../lib/templates.js";
import { createOrMergeConfig } from "../lib/config.js";

interface InstallResult {
  created: string[];
  overwritten: string[];
  skipped: string[];
}

/**
 * Run the `opencode-path init` command.
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

  // Step 2: Show summary before writing
  const availableTemplates = listTemplates();

  console.log(pc.bold("\n📋 Installation summary:"));
  console.log(`   Scope:        ${scope === "project" ? "Project" : "Global"}`);
  console.log(`   Agent dir:    ${target.agentDir}`);
  console.log(`   Config file:  ${target.configPath}`);
  console.log(`   Agents:       ${availableTemplates.join(", ")}`);

  const proceed = await confirm({
    message: "Proceed with installation?",
    default: true,
  });

  if (!proceed) {
    console.log(pc.yellow("\nInstallation cancelled. No files were written."));
    return;
  }

  // Step 3: Create agent directory
  if (!existsSync(target.agentDir)) {
    mkdirSync(target.agentDir, { recursive: true });
  }

  // Step 4: Install agent files
  const result: InstallResult = {
    created: [],
    overwritten: [],
    skipped: [],
  };

  for (const agentName of availableTemplates) {
    const destPath = join(target.agentDir, `${agentName}.md`);

    if (existsSync(destPath)) {
      const shouldOverwrite = await confirm({
        message: `${agentName}.md already exists. Overwrite?`,
        default: false,
      });

      if (shouldOverwrite) {
        const templateContent = readTemplate(agentName);
        writeFileSync(destPath, templateContent, "utf-8");
        result.overwritten.push(agentName);
      } else {
        result.skipped.push(agentName);
      }
    } else {
      const templateContent = readTemplate(agentName);
      writeFileSync(destPath, templateContent, "utf-8");
      result.created.push(agentName);
    }
  }

  // Step 5: Create or merge config
  createOrMergeConfig(target.configPath);

  // Step 6: Print results
  console.log(pc.bold("\n✅ Installation complete!\n"));

  if (result.created.length > 0) {
    console.log(pc.green(`   Created:     ${result.created.join(", ")}`));
  }
  if (result.overwritten.length > 0) {
    console.log(pc.yellow(`   Overwritten: ${result.overwritten.join(", ")}`));
  }
  if (result.skipped.length > 0) {
    console.log(pc.dim(`   Skipped:     ${result.skipped.join(", ")}`));
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
