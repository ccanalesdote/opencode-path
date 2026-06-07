import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import type { PackAgentName } from "./paths.js";

/**
 * Resolve the templates directory path.
 * Works both in development (from src/) and after installation (from dist/).
 */
export function getTemplatesDir(): string {
  // When running from dist/cli.js, __dirname equivalent is dist/
  // Templates are at ../templates relative to dist/
  // When running with tsx from src/cli.ts, the import.meta.url is src/lib/templates.ts
  // and templates are at ../../templates

  const thisFile = fileURLToPath(import.meta.url);
  const thisDir = dirname(thisFile);

  // Try from dist/ first (production build)
  const fromDist = resolve(thisDir, "..", "templates");
  if (existsSync(fromDist)) {
    return fromDist;
  }

  // Try from src/lib/ (development with tsx)
  const fromSrc = resolve(thisDir, "..", "..", "templates");
  if (existsSync(fromSrc)) {
    return fromSrc;
  }

  throw new Error(
    "Could not locate templates directory. Ensure the templates/ folder exists in the package."
  );
}

/**
 * Get the full path to a specific agent template file.
 */
export function getTemplatePath(agentName: PackAgentName): string {
  return join(getTemplatesDir(), `${agentName}.md`);
}

/**
 * Read a template file as a string.
 */
export function readTemplate(agentName: PackAgentName): string {
  const templatePath = getTemplatePath(agentName);
  if (!existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  return readFileSync(templatePath, "utf-8");
}

/**
 * Get the list of available template agent names.
 */
export function listTemplates(): PackAgentName[] {
  const templatesDir = getTemplatesDir();
  const found: PackAgentName[] = [];

  const expectedNames: PackAgentName[] = [
    "spec",
    "architect",
    "developer",
    "reviewer",
    "auditor",
    "research",
  ];

  for (const name of expectedNames) {
    const templatePath = join(templatesDir, `${name}.md`);
    if (existsSync(templatePath)) {
      found.push(name);
    }
  }

  return found;
}
