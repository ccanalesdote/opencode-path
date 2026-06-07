#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { modelsCommand } from "./commands/models.js";
import { profilesCommand } from "./commands/profiles.js";

const program = new Command();

program
  .name("oc-workflow")
  .description("Structured multi-agent workflow CLI for opencode")
  .version("0.1.0");

program
  .command("init")
  .description("Install the workflow pack into a project or global OpenCode config")
  .action(async () => {
    await initCommand();
  });

program
  .command("models")
  .description("Configure model IDs for each agent")
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
