import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  existsSync,
  readFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

vi.mock("@inquirer/prompts", () => ({
  select: vi.fn(),
  checkbox: vi.fn(),
  confirm: vi.fn(),
  input: vi.fn(),
  Separator: class Separator {},
}));

import { checkbox, confirm } from "@inquirer/prompts";
import { profilesCommand } from "./profiles.js";
import {
  CancellationError,
  UsageError,
  CANCEL_VALUE,
  _resetSigintStateForTest,
} from "../lib/ui.js";
import { readTemplate } from "../lib/templates.js";
import { addManagedMarker, MANAGED_MARKER } from "../lib/agents.js";

const EXIT_PROMPT_ERROR = { name: "ExitPromptError" };

/**
 * Build a project fixture with the given active custom agents installed.
 * Uses real template content so the profile marker is present.
 */
function setupProjectFixture(activeCustom: string[] = []): string {
  const tmp = mkdtempSync(join(tmpdir(), "profiles-cmd-"));
  const agentDir = join(tmp, ".opencode", "agent");
  mkdirSync(agentDir, { recursive: true });
  const configPath = join(tmp, ".opencode", "opencode.json");
  writeFileSync(
    configPath,
    JSON.stringify(
      { $schema: "https://opencode.ai/config.json", agent: {} },
      null,
      2
    ),
    "utf-8"
  );
  for (const name of activeCustom) {
    const templateContent = readTemplate(name as any);
    const contentWithMarker = addManagedMarker(templateContent);
    writeFileSync(
      join(agentDir, `${name}.md`),
      contentWithMarker,
      "utf-8"
    );
  }
  return tmp;
}

describe("profilesCommand", () => {
  let originalCwd: string;
  let tmpRoot: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    _resetSigintStateForTest();
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    _resetSigintStateForTest();
    if (tmpRoot) rmSync(tmpRoot, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  function chdirToFixture(activeCustom: string[] = ["developer"]): string {
    tmpRoot = setupProjectFixture(activeCustom);
    process.chdir(tmpRoot);
    return tmpRoot;
  }

  // ---------------------------------------------------------------------------

  it("rejects with UsageError when both --global and --project are passed", async () => {
    chdirToFixture();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      profilesCommand({ global: true, project: true })
    ).rejects.toBeInstanceOf(UsageError);

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("--dry-run prints the plan and writes no profile snippet", async () => {
    const root = chdirToFixture(["developer"]);
    const developerPath = join(root, ".opencode", "agent", "developer.md");
    const contentBefore = readFileSync(developerPath, "utf-8");

    // User selects the JavaScript / TypeScript profile.
    vi.mocked(checkbox).mockResolvedValueOnce(["javascript-typescript"]);

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await profilesCommand({ project: true, dryRun: true });

    // The file content must be unchanged.
    expect(readFileSync(developerPath, "utf-8")).toBe(contentBefore);
    // The dry-run label was printed.
    expect(
      logSpy.mock.calls.some((c) =>
        String(c[0]).includes("No files were modified")
      )
    ).toBe(true);

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("--yes skips the final confirmation prompt", async () => {
    const root = chdirToFixture(["developer"]);
    const developerPath = join(root, ".opencode", "agent", "developer.md");

    vi.mocked(checkbox).mockResolvedValueOnce(["javascript-typescript"]);

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await profilesCommand({ project: true, yes: true });

    // confirm() should NOT have been called when --yes is set.
    expect(confirm).not.toHaveBeenCalled();

    // The profile snippet was actually applied.
    const contentAfter = readFileSync(developerPath, "utf-8");
    expect(contentAfter).toContain("BEGIN optional profile: javascript-typescript");

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("throws CancellationError when <- Cancel is selected", async () => {
    chdirToFixture(["developer"]);
    vi.mocked(checkbox).mockResolvedValueOnce([CANCEL_VALUE]);

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      profilesCommand({ project: true })
    ).rejects.toBeInstanceOf(CancellationError);

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("throws CancellationError when ExitPromptError bubbles up (Ctrl+C inside prompt)", async () => {
    chdirToFixture(["developer"]);
    vi.mocked(checkbox).mockRejectedValueOnce(EXIT_PROMPT_ERROR);

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      profilesCommand({ project: true })
    ).rejects.toBeInstanceOf(CancellationError);

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("prints a warning when no patchable agents are active", async () => {
    // No developer/reviewer/auditor installed, only built-ins.
    chdirToFixture([]);
    // Scope resolution must succeed with --project.
    // But the command returns early after printing a warning.
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await profilesCommand({ project: true });

    // No checkbox should have been shown.
    expect(checkbox).not.toHaveBeenCalled();
    const output = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(output).toContain("No active patchable agents");

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
