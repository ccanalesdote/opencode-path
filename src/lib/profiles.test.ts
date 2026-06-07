import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  PROFILES,
  getProfile,
  PROFILE_NAMES,
  generateSnippet,
  profileExistsInContent,
  insertProfileIntoFile,
  applyProfileToAgents,
  PROFILE_MARKER,
  type ProfileEntry,
  type PerFileStatus,
} from "./profiles.js";
import {
  writeFileSync,
  mkdirSync,
  rmSync,
  readFileSync,
} from "node:fs";
import { join } from "node:path";

const FIXTURE_DIR = join(import.meta.dirname, "__fixtures__", "profiles");

beforeEach(() => {
  mkdirSync(FIXTURE_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(FIXTURE_DIR, { recursive: true, force: true });
});

function fixturePath(...segments: string[]) {
  return join(FIXTURE_DIR, ...segments);
}

// A minimal agent file with the marker line
const AGENT_WITH_MARKER = `---
description: Test agent
mode: primary
permission:
  edit: allow
  write: allow
  bash:
    "*": "ask"
    "pwd": "allow"
    "ls*": "allow"
    # Optional stack-specific profiles are inserted here by opencode-path profiles

    "git status*": "allow"
  task: allow
---

You are Test agent.
`;

// Agent file with legacy oc-workflow marker (backward compatibility)
const AGENT_WITH_LEGACY_MARKER = `---
description: Test agent
mode: primary
permission:
  edit: allow
  write: allow
  bash:
    "*": "ask"
    "pwd": "allow"
    "ls*": "allow"
    # Optional stack-specific profiles are inserted here by oc-workflow profiles

    "git status*": "allow"
  task: allow
---

You are Test agent.
`;

// Agent file without the marker line
const AGENT_WITHOUT_MARKER = `---
description: Test agent
mode: primary
permission:
  edit: allow
  write: allow
  bash:
    "*": "ask"
    "pwd": "allow"
    "ls*": "allow"
    "git status*": "allow"
  task: allow
---

You are Test agent.
`;

describe("PROFILES", () => {
  it("has 8 profiles defined", () => {
    expect(PROFILES).toHaveLength(8);
  });

  it("has stable profile names", () => {
    expect(PROFILE_NAMES).toEqual([
      "javascript-typescript",
      "python",
      "go",
      "rust",
      "swift",
      "java-kotlin",
      "ruby",
      "php",
    ]);
  });

  it("each profile has name, label, dev, and readonly entries", () => {
    for (const profile of PROFILES) {
      expect(profile.name).toBeTruthy();
      expect(profile.label).toBeTruthy();
      expect(Array.isArray(profile.dev)).toBe(true);
      expect(profile.dev.length).toBeGreaterThan(0);
      expect(Array.isArray(profile.readonly)).toBe(true);
      expect(profile.readonly.length).toBeGreaterThan(0);
    }
  });

  it("readonly variant is always a subset of dev variant", () => {
    for (const profile of PROFILES) {
      const devPatterns = new Set(profile.dev.map((e) => e.pattern));
      for (const entry of profile.readonly) {
        expect(devPatterns.has(entry.pattern)).toBe(true);
      }
    }
  });

  it("dev variant may contain 'ask' permissions but readonly never does", () => {
    for (const profile of PROFILES) {
      // readonly entries should never have "ask" permission
      for (const entry of profile.readonly) {
        expect(entry.permission).not.toBe("ask");
      }
    }
  });
});

describe("getProfile", () => {
  it("returns a profile by name", () => {
    const p = getProfile("python");
    expect(p).toBeDefined();
    expect(p!.name).toBe("python");
    expect(p!.label).toBe("Python");
  });

  it("returns undefined for unknown profile", () => {
    expect(getProfile("unknown-stack")).toBeUndefined();
  });
});

describe("generateSnippet", () => {
  it("generates a snippet with BEGIN/END markers", () => {
    const entries: ProfileEntry[] = [
      { pattern: "pytest*", permission: "allow" },
      { pattern: "mypy*", permission: "allow" },
    ];
    const snippet = generateSnippet(entries, "python");

    expect(snippet).toContain("# BEGIN optional profile: python");
    expect(snippet).toContain("# END optional profile: python");
    expect(snippet).toContain('"pytest*": "allow"');
    expect(snippet).toContain('"mypy*": "allow"');
  });

  it("includes ask permissions for dev variants", () => {
    const entries: ProfileEntry[] = [
      { pattern: "go test*", permission: "allow" },
      { pattern: "go fmt*", permission: "ask" },
    ];
    const snippet = generateSnippet(entries, "go");

    expect(snippet).toContain('"go test*": "allow"');
    expect(snippet).toContain('"go fmt*": "ask"');
  });

  it("uses 4-space indentation for entries", () => {
    const entries: ProfileEntry[] = [
      { pattern: "pytest*", permission: "allow" },
    ];
    const snippet = generateSnippet(entries, "python");

    const lines = snippet.split("\n");
    for (const line of lines) {
      expect(line.startsWith("    ")).toBe(true);
    }
  });
});

describe("profileExistsInContent", () => {
  it("returns true if the profile BEGIN marker exists", () => {
    const content = `
    # BEGIN optional profile: python
    "pytest*": "allow"
    # END optional profile: python
`;
    expect(profileExistsInContent(content, "python")).toBe(true);
  });

  it("returns false if the profile does not exist", () => {
    const content = `
    # BEGIN optional profile: go
    "go test*": "allow"
    # END optional profile: go
`;
    expect(profileExistsInContent(content, "python")).toBe(false);
  });

  it("returns false for empty content", () => {
    expect(profileExistsInContent("", "python")).toBe(false);
  });
});

describe("insertProfileIntoFile", () => {
  it("inserts a profile into a file with the marker", () => {
    const filePath = fixturePath("with-marker.md");
    writeFileSync(filePath, AGENT_WITH_MARKER, "utf-8");

    const profile = getProfile("python")!;
    const result = insertProfileIntoFile(filePath, profile, "dev");

    expect(result.inserted).toBe(true);

    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("# BEGIN optional profile: python");
    expect(content).toContain('"pytest*": "allow"');
    expect(content).toContain("# END optional profile: python");
    // Original content preserved
    expect(content).toContain("You are Test agent.");
    expect(content).toContain('"git status*": "allow"');
  });

  it("marks insertion as dev variant when variant is dev", () => {
    const filePath = fixturePath("dev-variant.md");
    writeFileSync(filePath, AGENT_WITH_MARKER, "utf-8");

    const profile = getProfile("go")!;
    const result = insertProfileIntoFile(filePath, profile, "dev");

    expect(result.inserted).toBe(true);

    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain('"go fmt*": "ask"');
  });

  it("marks insertion as readonly variant when variant is readonly", () => {
    const filePath = fixturePath("readonly-variant.md");
    writeFileSync(filePath, AGENT_WITH_MARKER, "utf-8");

    const profile = getProfile("go")!;
    const result = insertProfileIntoFile(filePath, profile, "readonly");

    expect(result.inserted).toBe(true);

    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toContain('"go fmt*"');
    expect(content).toContain('"go test*": "allow"');
  });

  it("does not duplicate an already-installed profile", () => {
    const filePath = fixturePath("already-installed.md");
    writeFileSync(filePath, AGENT_WITH_MARKER, "utf-8");

    const profile = getProfile("python")!;

    // First insertion
    const result1 = insertProfileIntoFile(filePath, profile, "dev");
    expect(result1.inserted).toBe(true);

    // Second insertion — should be skipped
    const result2 = insertProfileIntoFile(filePath, profile, "dev");
    expect(result2.inserted).toBe(false);
    expect(result2.reason).toBe("already_exists");

    // Content should only contain one profile block
    const content = readFileSync(filePath, "utf-8");
    const matches = content.match(/# BEGIN optional profile: python/g);
    expect(matches).toHaveLength(1);
  });

  it("returns marker_not_found if the marker line is missing", () => {
    const filePath = fixturePath("no-marker.md");
    writeFileSync(filePath, AGENT_WITHOUT_MARKER, "utf-8");

    const profile = getProfile("python")!;
    const result = insertProfileIntoFile(filePath, profile, "dev");

    expect(result.inserted).toBe(false);
    expect(result.reason).toBe("marker_not_found");

    // File should be unchanged
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toContain("# BEGIN optional profile: python");
  });

  it("can insert multiple different profiles into the same file", () => {
    const filePath = fixturePath("multi-profile.md");
    writeFileSync(filePath, AGENT_WITH_MARKER, "utf-8");

    const python = getProfile("python")!;
    const rust = getProfile("rust")!;

    insertProfileIntoFile(filePath, python, "dev");
    insertProfileIntoFile(filePath, rust, "dev");

    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("# BEGIN optional profile: python");
    expect(content).toContain("# BEGIN optional profile: rust");
    expect(content).toContain("# END optional profile: python");
    expect(content).toContain("# END optional profile: rust");
  });

  it("preserves existing unrelated profile blocks", () => {
    const filePath = fixturePath("with-existing.md");
    // Pre-add a python profile
    const profile = getProfile("python")!;
    writeFileSync(filePath, AGENT_WITH_MARKER, "utf-8");
    insertProfileIntoFile(filePath, profile, "dev");

    // Now add a rust profile
    const rust = getProfile("rust")!;
    insertProfileIntoFile(filePath, rust, "dev");

    const content = readFileSync(filePath, "utf-8");
    // Both profiles should exist
    expect(content).toContain("# BEGIN optional profile: python");
    expect(content).toContain("# BEGIN optional profile: rust");
  });

  it("inserts profile after the marker line, not before", () => {
    const filePath = fixturePath("after-marker.md");
    writeFileSync(filePath, AGENT_WITH_MARKER, "utf-8");

    const profile = getProfile("python")!;
    insertProfileIntoFile(filePath, profile, "dev");

    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const markerIdx = lines.findIndex((l) =>
      l.includes(PROFILE_MARKER)
    );
    const beginIdx = lines.findIndex((l) =>
      l.includes("# BEGIN optional profile: python")
    );

    // Profile should be inserted right after the marker
    expect(beginIdx).toBeGreaterThan(markerIdx);
    // And before the git section
    const gitIdx = lines.findIndex((l) =>
      l.includes('"git status*"')
    );
    expect(beginIdx).toBeLessThan(gitIdx);
  });
});

describe("applyProfileToAgents", () => {
  const PATCHABLE_AGENTS = [
    { name: "developer", variant: "dev" as const },
    { name: "reviewer", variant: "readonly" as const },
    { name: "auditor", variant: "readonly" as const },
  ];

  it("applies a profile to all patchable agents", () => {
    const dir = fixturePath("full-apply");
    mkdirSync(dir, { recursive: true });
    for (const agent of PATCHABLE_AGENTS) {
      writeFileSync(join(dir, `${agent.name}.md`), AGENT_WITH_MARKER, "utf-8");
    }

    const profile = getProfile("python")!;
    const result = applyProfileToAgents(dir, profile, PATCHABLE_AGENTS);

    expect(result.profileName).toBe("python");
    expect(result.profileLabel).toBe("Python");
    expect(result.files).toHaveLength(3);
    for (const f of result.files) {
      expect(f.status).toBe("inserted");
    }

    // Verify files were actually modified
    for (const agent of PATCHABLE_AGENTS) {
      const content = readFileSync(join(dir, `${agent.name}.md`), "utf-8");
      expect(content).toContain("# BEGIN optional profile: python");
    }
  });

  it("reports partial application when marker is missing in one file", () => {
    const dir = fixturePath("partial-apply");
    mkdirSync(dir, { recursive: true });
    // developer.md has marker
    writeFileSync(join(dir, "developer.md"), AGENT_WITH_MARKER, "utf-8");
    // reviewer.md is missing marker
    writeFileSync(join(dir, "reviewer.md"), AGENT_WITHOUT_MARKER, "utf-8");
    // auditor.md has marker
    writeFileSync(join(dir, "auditor.md"), AGENT_WITH_MARKER, "utf-8");

    const profile = getProfile("python")!;
    const result = applyProfileToAgents(dir, profile, PATCHABLE_AGENTS);

    expect(result.files).toHaveLength(3);

    const developer = result.files.find((f) => f.agent === "developer")!;
    expect(developer.status).toBe("inserted");

    const reviewer = result.files.find((f) => f.agent === "reviewer")!;
    expect(reviewer.status).toBe("marker_not_found");

    const auditor = result.files.find((f) => f.agent === "auditor")!;
    expect(auditor.status).toBe("inserted");
  });

  it("reports already_exists when profile is already installed in all files", () => {
    const dir = fixturePath("all-exist");
    mkdirSync(dir, { recursive: true });
    // Pre-install python profile in all files
    const profile = getProfile("python")!;
    for (const agent of PATCHABLE_AGENTS) {
      writeFileSync(join(dir, `${agent.name}.md`), AGENT_WITH_MARKER, "utf-8");
      insertProfileIntoFile(join(dir, `${agent.name}.md`), profile, agent.variant);
    }

    // Apply again — should be already_exists everywhere
    const result = applyProfileToAgents(dir, profile, PATCHABLE_AGENTS);

    expect(result.files).toHaveLength(3);
    for (const f of result.files) {
      expect(f.status).toBe("already_exists");
    }
  });

  it("reports file_missing when a patchable agent file does not exist", () => {
    const dir = fixturePath("missing-agent");
    mkdirSync(dir, { recursive: true });
    // Only developer.md exists
    writeFileSync(join(dir, "developer.md"), AGENT_WITH_MARKER, "utf-8");
    // reviewer.md and auditor.md are missing

    const profile = getProfile("python")!;
    const result = applyProfileToAgents(dir, profile, PATCHABLE_AGENTS);

    expect(result.files).toHaveLength(3);

    const developer = result.files.find((f) => f.agent === "developer")!;
    expect(developer.status).toBe("inserted");

    const reviewer = result.files.find((f) => f.agent === "reviewer")!;
    expect(reviewer.status).toBe("file_missing");

    const auditor = result.files.find((f) => f.agent === "auditor")!;
    expect(auditor.status).toBe("file_missing");
  });

  it("reports already_exists plus file_missing as incomplete, not fully skipped", () => {
    const dir = fixturePath("already-exists-plus-missing");
    mkdirSync(dir, { recursive: true });
    const profile = getProfile("python")!;

    // developer.md exists and already has the profile
    writeFileSync(join(dir, "developer.md"), AGENT_WITH_MARKER, "utf-8");
    insertProfileIntoFile(join(dir, "developer.md"), profile, "dev");
    // reviewer.md and auditor.md are missing

    const result = applyProfileToAgents(dir, profile, PATCHABLE_AGENTS);

    const developer = result.files.find((f) => f.agent === "developer")!;
    expect(developer.status).toBe("already_exists");

    const reviewer = result.files.find((f) => f.agent === "reviewer")!;
    expect(reviewer.status).toBe("file_missing");

    const auditor = result.files.find((f) => f.agent === "auditor")!;
    expect(auditor.status).toBe("file_missing");

    const allAlreadyExists = result.files.every(
      (f) => f.status === "already_exists"
    );
    expect(allAlreadyExists).toBe(false);
  });

  it("handles mixed states: inserted + already_exists + marker_not_found", () => {
    const dir = fixturePath("mixed-states");
    mkdirSync(dir, { recursive: true });
    const profile = getProfile("python")!;

    // developer.md: profile already installed
    writeFileSync(join(dir, "developer.md"), AGENT_WITH_MARKER, "utf-8");
    insertProfileIntoFile(join(dir, "developer.md"), profile, "dev");

    // reviewer.md: marker missing
    writeFileSync(join(dir, "reviewer.md"), AGENT_WITHOUT_MARKER, "utf-8");

    // auditor.md: fresh, has marker
    writeFileSync(join(dir, "auditor.md"), AGENT_WITH_MARKER, "utf-8");

    const result = applyProfileToAgents(dir, profile, PATCHABLE_AGENTS);

    const developer = result.files.find((f) => f.agent === "developer")!;
    expect(developer.status).toBe("already_exists");

    const reviewer = result.files.find((f) => f.agent === "reviewer")!;
    expect(reviewer.status).toBe("marker_not_found");

    const auditor = result.files.find((f) => f.agent === "auditor")!;
    expect(auditor.status).toBe("inserted");
  });

  it("inserts a profile into a file with the legacy oc-workflow marker", () => {
    const filePath = fixturePath("legacy-marker.md");
    writeFileSync(filePath, AGENT_WITH_LEGACY_MARKER, "utf-8");

    const profile = getProfile("python")!;
    const result = insertProfileIntoFile(filePath, profile, "dev");

    expect(result.inserted).toBe(true);

    const content = readFileSync(filePath, "utf-8");
    // Profile should be inserted
    expect(content).toContain("# BEGIN optional profile: python");
    expect(content).toContain('"pytest*": "allow"');
    expect(content).toContain("# END optional profile: python");
    // Legacy marker should be migrated to current marker
    expect(content).toContain(PROFILE_MARKER);
    expect(content).not.toContain("oc-workflow profiles");
    // Original content preserved
    expect(content).toContain("You are Test agent.");
    expect(content).toContain('"git status*": "allow"');
  });
});
