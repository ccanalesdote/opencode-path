import { describe, it, expect } from "vitest";
import { getTemplatesDir, getTemplatePath, readTemplate, listTemplates } from "./templates.js";
import { existsSync } from "node:fs";
import { join } from "node:path";

describe("getTemplatesDir", () => {
  it("returns a directory that exists", () => {
    const dir = getTemplatesDir();
    expect(existsSync(dir)).toBe(true);
  });

  it("directory contains .md template files", () => {
    const dir = getTemplatesDir();
    const specPath = join(dir, "spec.md");
    expect(existsSync(specPath)).toBe(true);
  });
});

describe("getTemplatePath", () => {
  it("returns the path to a specific agent template", () => {
    const path = getTemplatePath("spec");
    expect(path).toContain("spec.md");
    expect(existsSync(path)).toBe(true);
  });

  it("returns path for each pack agent", () => {
    const agents = ["spec", "architect", "developer", "reviewer", "auditor", "research"] as const;
    for (const agent of agents) {
      const path = getTemplatePath(agent);
      expect(existsSync(path)).toBe(true);
    }
  });
});

describe("readTemplate", () => {
  it("reads a template file as a string", () => {
    const content = readTemplate("spec");
    expect(content).toContain("description:");
    expect(content).toContain("mode:");
    expect(content).toContain("You are Spec");
  });

  it("reads the research template", () => {
    const content = readTemplate("research");
    expect(content).toContain("You are Research");
    expect(content).toContain("Documentation tools");
  });

  it("throws for a non-existent template", () => {
    expect(() => readTemplate("nonexistent" as any)).toThrow("Template not found");
  });
});

describe("listTemplates", () => {
  it("lists exactly the six pack agent templates", () => {
    const templates = listTemplates();
    expect(templates.sort()).toEqual([
      "architect",
      "auditor",
      "developer",
      "research",
      "reviewer",
      "spec",
    ]);
  });
});
