#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { modelsCommand } from "./commands/models.js";
import { profilesCommand } from "./commands/profiles.js";
import { agentsCommand } from "./commands/agents.js";

const program = new Command();

program
  .name("opencode-path")
  .description("Structured multi-agent workflow CLI for opencode")
  .version("0.2.1");

program
  .command("init")
  .description("Install the workflow pack into a project or global OpenCode config")
  .action(async () => {
    await initCommand();
  });

program
  .command("agents")
  .description("Manage which workflow agents are active (install, delete, hide, restore)")
  .action(async () => {
    await agentsCommand();
  });

program
  .command("models")
  .description("Configure model IDs for active agents")
  .action(async () => {
    await modelsCommand();
  });

program
  .command("profiles")
  .description("Apply stack-specific permission profiles to installed agents")
  .action(async () => {
    await profilesCommand();
  });

program.parse();
