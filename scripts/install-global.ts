/**
 * One-off script: install all pack agents globally with managed marker.
 * Run with: npx tsx scripts/install-global.ts
 */
import { installCustomAgent } from "../src/lib/agents.js";
import { resolveTarget, PACK_AGENTS } from "../src/lib/paths.js";

const target = resolveTarget("global");

console.log(`Installing pack agents to ${target.agentDir}...\n`);

for (const name of PACK_AGENTS) {
  const result = installCustomAgent(name, target);
  const icon =
    result === "created"
      ? "✓"
      : result === "already_active"
        ? "●"
        : "✕";
  console.log(`  ${icon} ${name} — ${result}`);
}

console.log("\nDone.");
