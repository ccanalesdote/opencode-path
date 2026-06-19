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

// Mock @inquirer/prompts so we never block on a real terminal.
vi.mock("@inquirer/prompts", () => ({
  select: vi.fn(),
  checkbox: vi.fn(),
  confirm: vi.fn(),
  input: vi.fn(),
  Separator: class Separator {},
}));

import { checkbox, confirm } from "@inquirer/prompts";
import { agentsCommand } from "./agents.js";
import {
  CancellationError,
  UsageError,
  CANCEL_VALUE,
  _resetSigintStateForTest,
} from "../lib/ui.js";
import { MANAGED_MARKER } from "../lib/agents.js";

const EXIT_PROMPT_ERROR = { name: "ExitPromptError" };

/**
 * Build a project fixture root at the current cwd with a fresh .opencode/agent
 * directory and an empty opencode.json. By default no custom agents are
 * installed (all 6 are `missing`) and built-ins (plan/build/explore) are
 * `active`.
 */
function setupProjectFixture(opts?: { activeCustom?: string[] }): string {
  const tmp = mkdtempSync(join(tmpdir(), "agents-cmd-"));
  const agentDir = join(tmp, ".opencode", "agent");
  mkdirSync(agentDir, { recursive: true });
  const configPath = join(tmp, ".opencode", "opencode.json");
  writeFileSync(
    configPath,
    JSON.stringify({ $schema: "https://opencode.ai/config.json", agent: {} }, null, 2),
    "utf-8"
  );
  for (const name of opts?.activeCustom ?? []) {
    writeFileSync(
      join(agentDir, `${name}.md`),
      `---\ndescription: ${name}\nmode: primary\n---\n\nbody\n${MANAGED_MARKER}\n`,
      "utf-8"
    );
  }
  return tmp;
}

describe("agentsCommand", () => {
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

  function chdirToFixture(opts?: { activeCustom?: string[] }): string {
    tmpRoot = setupProjectFixture(opts);
    process.chdir(tmpRoot);
    return tmpRoot;
  }

  // ---------------------------------------------------------------------------

  it("rejects with UsageError when both --global and --project are passed", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      agentsCommand({ global: true, project: true })
    ).rejects.toBeInstanceOf(UsageError);

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("--dry-run prints the plan and writes no agent files", async () => {
    const root = chdirToFixture(); // no custom installed; builtins active

    // User selects the "developer" custom agent (currently missing) to install.
    vi.mocked(checkbox).mockResolvedValueOnce(["developer"]);

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await agentsCommand({ project: true, dryRun: true });

    // No file should have been created on disk.
    expect(existsSync(join(root, ".opencode", "agent", "developer.md"))).toBe(
      false
    );
    // No disable flag was written for any active agent.
    const configAfter = JSON.parse(
      readFileSync(join(root, ".opencode", "opencode.json"), "utf-8")
    );
    expect(JSON.stringify(configAfter)).not.toContain("disable");
    // The dry-run plan was printed.
    expect(
      logSpy.mock.calls.some((c) => /Planned changes/.test(String(c[0])))
    ).toBe(true);

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("--yes skips the final confirmation prompt", async () => {
    const root = chdirToFixture();

    // Select developer (missing) for install.
    vi.mocked(checkbox).mockResolvedValueOnce(["developer"]);

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await agentsCommand({ project: true, yes: true });

    // confirm() should NOT have been called when --yes is set.
    expect(confirm).not.toHaveBeenCalled();

    // The change was actually applied (file written) since --yes applies the plan.
    expect(
      existsSync(join(root, ".opencode", "agent", "developer.md"))
    ).toBe(true);

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("throws CancellationError when the synthetic <- Cancel option is selected", async () => {
    chdirToFixture();

    // uiCheckbox returns the cancel sentinel when the user selects the cancel row.
    vi.mocked(checkbox).mockResolvedValueOnce([CANCEL_VALUE]);

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      agentsCommand({ project: true })
    ).rejects.toBeInstanceOf(CancellationError);

    expect(checkbox).toHaveBeenCalledTimes(1);

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("throws CancellationError when an ExitPromptError bubbles up (Ctrl+C inside prompt)", async () => {
    chdirToFixture();

    vi.mocked(checkbox).mockRejectedValueOnce(EXIT_PROMPT_ERROR);

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      agentsCommand({ project: true })
    ).rejects.toBeInstanceOf(CancellationError);

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("prints 'No changes needed.' when the selection matches the current state", async () => {
    // All 6 custom agents already active + 3 builtins active = all 9 active.
    // Checkbox selects all 9 → no changes planned.
    chdirToFixture({
      activeCustom: [
        "spec",
        "architect",
        "developer",
        "reviewer",
        "auditor",
        "research",
      ],
    });

    vi.mocked(checkbox).mockResolvedValueOnce([
      "spec",
      "architect",
      "developer",
      "reviewer",
      "auditor",
      "research",
      "plan",
      "build",
      "explore",
    ]);

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await agentsCommand({ project: true });

    const output = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(output).toContain("No changes needed.");

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
