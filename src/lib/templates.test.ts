import { describe, it, expect } from "vitest";
import { getTemplatesDir, getTemplatePath, readTemplate, listTemplates } from "./templates.js";
import { parseFrontmatter } from "./frontmatter.js";
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

// ---------------------------------------------------------------------------
// Template permission / prompt invariants (AC-01, AC-02, AC-06, AC-07)
// ---------------------------------------------------------------------------

const PACK_AGENT_NAMES = [
  "architect",
  "auditor",
  "developer",
  "research",
  "reviewer",
  "spec",
] as const;

describe("template permission invariants", () => {
  it("no template frontmatter contains write: permission key (AC-02)", () => {
    for (const name of PACK_AGENT_NAMES) {
      const content = readTemplate(name);
      const { frontmatter } = parseFrontmatter(content);
      const perm = frontmatter.permission as Record<string, unknown> | undefined;
      if (perm) {
        const keys = Object.keys(perm);
        const hasWrite = keys.some((k) => k === "write");
        expect(hasWrite).toBe(false);
      }
    }
  });

  it("no template uses legacy boolean tools: syntax (AC-01)", () => {
    for (const name of PACK_AGENT_NAMES) {
      const content = readTemplate(name);
      // Legacy syntax would be a top-level key like `tools: true` or `tools: false`
      const { frontmatter } = parseFrontmatter(content);
      expect(frontmatter).not.toHaveProperty("tools");
    }
  });

  it("every template uses permission: block (AC-01)", () => {
    for (const name of PACK_AGENT_NAMES) {
      const content = readTemplate(name);
      const { frontmatter } = parseFrontmatter(content);
      expect(frontmatter).toHaveProperty("permission");
    }
  });

  it("reviewer.md has task: deny (AC-07)", () => {
    const content = readTemplate("reviewer");
    const { frontmatter } = parseFrontmatter(content);
    const perm = frontmatter.permission as Record<string, unknown>;
    expect(perm.task).toBe("deny");
  });

  it("positive Reviewer-invocation patterns match known instruction phrasings", () => {
    // Regression test: verify each pattern against the exact phrasings
    // it is designed to catch. No template content involved — direct
    // pattern-level assertion.
    const testCases: { phrase: string; matches: boolean }[] = [
      // Positive (should match at least one pattern):
      { phrase: "hand it directly to Reviewer", matches: true },
      { phrase: "hand it to reviewer", matches: true },
      { phrase: "hand this to the Reviewer", matches: true },
      { phrase: "NEEDS REVIEWER", matches: true },
      { phrase: "invoke Reviewer", matches: true },
      { phrase: "invoke `reviewer`", matches: true },
      { phrase: "ask reviewer to review this", matches: true },
      { phrase: "use reviewer for a quick check", matches: true },
      { phrase: "send this to the reviewer", matches: true },
      { phrase: "bring in Reviewer", matches: true },
      { phrase: "items to hand to Reviewer for a focused re-check", matches: true },
      // True negative (no invocation verb touches "reviewer"):
      { phrase: "Reviewer handles code reviews.", matches: false },
      { phrase: "Reviewer is the implementation quality gate", matches: false },
    ];

    const instructionPatterns: RegExp[] = [
      /\binvoke\s+(?:`?reviewer`?)\b/gi,
      /\bask\s+(?:`?reviewer`?)\b/gi,
      /\buse\s+(?:`?reviewer`?)\b/gi,
      /\bhand\s+(?:to|(?:it|this|them)\s+(?:directly\s+)?to)\s+(?:the\s+)?reviewer\b/gi,
      /\bsend\s+(?:it|this|them)\s+to\s+(?:the\s+)?reviewer\b/gi,
      /\bneeds\s+reviewer\b/gi,
      /\bbring\s+in\s+(?:the\s+)?reviewer\b/gi,
    ];

    for (const { phrase, matches } of testCases) {
      const anyMatch = instructionPatterns.some((p) => {
        p.lastIndex = 0;
        return p.test(phrase);
      });
      expect(anyMatch).toBe(matches);
    }
  });

  it("only developer.md contains positive Reviewer invocation instructions (AC-06)", () => {
    // Instruction patterns (g flag for exhaustive matching). Cover both
    // historical T-002 patterns and likely future positive-invocation verbs.
    const instructionPatterns: RegExp[] = [
      /\binvoke\s+(?:`?reviewer`?)\b/gi,
      /\bask\s+(?:`?reviewer`?)\b/gi,
      /\buse\s+(?:`?reviewer`?)\b/gi,
      /\bhand\s+(?:to|(?:it|this|them)\s+(?:directly\s+)?to)\s+(?:the\s+)?reviewer\b/gi,
      /\bsend\s+(?:it|this|them)\s+to\s+(?:the\s+)?reviewer\b/gi,
      /\bneeds\s+reviewer\b/gi,
      /\bbring\s+in\s+(?:the\s+)?reviewer\b/gi,
    ];

    for (const name of PACK_AGENT_NAMES) {
      if (name === "developer") continue;

      const content = readTemplate(name);
      for (const pattern of instructionPatterns) {
        // Iterate every match, not just the first one.
        for (const match of content.matchAll(pattern)) {
          const matchStart = match.index!;
          const contextBefore = content.substring(
            Math.max(0, matchStart - 40),
            matchStart
          );

          // Negative: "does NOT invoke", "must NOT invoke", "not … bring in"
          const isNegative =
            /\b(?:not|never|cannot|don't)\b.*\breviewer\b/i.test(
              contextBefore + match[0]
            );

          // Descriptive / meta: "instructions to invoke", "user decides when
          // to bring in Reviewer", "the expected path"
          const isDescriptive =
            /\b(?:instructions|expected|only|decides)\s+.*\b(invoke|bring|to)\b/i.test(
              contextBefore
            );

          if (!isNegative && !isDescriptive) {
            throw new Error(
              `${name}.md contains positive Reviewer invocation ` +
              `instruction matching "${pattern.source}" at offset ${matchStart}`
            );
          }
        }
      }
    }
  });

  it("developer.md positively instructs Reviewer invocation (AC-06)", () => {
    const content = readTemplate("developer");
    // Must contain at least one positive instruction to invoke Reviewer
    expect(content).toMatch(/invoke\s+(`?reviewer`?)/i);
    expect(content).toMatch(/invoke reviewer before declaring a task done/i);
  });
});
