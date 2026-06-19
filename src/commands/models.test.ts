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

import { select, confirm } from "@inquirer/prompts";
import { modelsCommand } from "./models.js";
import {
  CancellationError,
  UsageError,
  CANCEL_VALUE,
  _resetSigintStateForTest,
} from "../lib/ui.js";
import { addManagedMarker } from "../lib/agents.js";
import { readTemplate } from "../lib/templates.js";
import { getAgentModel } from "../lib/frontmatter.js";
import { getConfigAgentModel } from "../lib/config.js";
import * as opencodeModels from "../lib/opencode-models.js";

const EXIT_PROMPT_ERROR = { name: "ExitPromptError" };
const ALL_AGENTS_VALUE = "__all_active_agents__";

/**
 * Build a project fixture with the given active custom agents installed and
 * optional built-in agent config.
 */
function setupProjectFixture(opts?: {
  activeCustom?: string[];
  builtinModels?: Record<string, string>;
}): string {
  const tmp = mkdtempSync(join(tmpdir(), "models-cmd-"));
  const agentDir = join(tmp, ".opencode", "agent");
  mkdirSync(agentDir, { recursive: true });

  const configPath = join(tmp, ".opencode", "opencode.json");
  let config: Record<string, unknown> = {
    $schema: "https://opencode.ai/config.json",
    agent: {},
  };
  if (opts?.builtinModels) {
    const agentObj: Record<string, unknown> = {};
    for (const [name, model] of Object.entries(opts.builtinModels)) {
      agentObj[name] = { model };
    }
    config.agent = agentObj;
  }
  writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");

  for (const name of opts?.activeCustom ?? []) {
    const templateContent = readTemplate(name as any);
    const contentWithMarker = addManagedMarker(templateContent);
    writeFileSync(join(agentDir, `${name}.md`), contentWithMarker, "utf-8");
  }
  return tmp;
}

describe("modelsCommand", () => {
  let originalCwd: string;
  let tmpRoot: string;
  let modelsSpy: ReturnType<typeof vi.spyOn>;
  let stderrWriteSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    originalCwd = process.cwd();
    _resetSigintStateForTest();
    vi.clearAllMocks();
    // Stub the async model lister so we never spawn a real `opencode` process.
    modelsSpy = (vi
      .spyOn(opencodeModels, "listOpenCodeModelsAsync")
      .mockResolvedValue(["model-a", "model-b"]) as unknown) as ReturnType<
      typeof vi.spyOn
    >;
    // Suppress spinner output to keep test output clean.
    stderrWriteSpy = (vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true) as unknown) as ReturnType<
      typeof vi.spyOn
    >;
  });

  afterEach(() => {
    process.chdir(originalCwd);
    _resetSigintStateForTest();
    modelsSpy.mockRestore();
    stderrWriteSpy.mockRestore();
    if (tmpRoot) rmSync(tmpRoot, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  function chdirToFixture(opts?: {
    activeCustom?: string[];
    builtinModels?: Record<string, string>;
  }): string {
    tmpRoot = setupProjectFixture(opts);
    process.chdir(tmpRoot);
    return tmpRoot;
  }

  // ---------------------------------------------------------------------------

  it("rejects with UsageError when both --global and --project are passed", async () => {
    chdirToFixture({ activeCustom: ["developer"] });
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      modelsCommand({ global: true, project: true })
    ).rejects.toBeInstanceOf(UsageError);

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("bulk 'Set all active agents to the same model' writes model to all active agents", async () => {
    const root = chdirToFixture({
      activeCustom: ["developer", "reviewer"],
    });
    const agentDir = join(root, ".opencode", "agent");
    const configPath = join(root, ".opencode", "opencode.json");

    // First uiSelect call: choose the bulk option.
    // Second uiSelect call: choose a model from the available list.
    vi.mocked(select)
      .mockResolvedValueOnce(ALL_AGENTS_VALUE as any)
      .mockResolvedValueOnce("model-a" as any);

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await modelsCommand({ project: true });

    // Custom agents: model should be written in frontmatter.
    const devModel = getAgentModel(join(agentDir, "developer.md"));
    expect(devModel).toBe("model-a");
    const revModel = getAgentModel(join(agentDir, "reviewer.md"));
    expect(revModel).toBe("model-a");

    // Built-in agents: model should be written in opencode.json.
    const planModel = getConfigAgentModel(configPath, "plan");
    expect(planModel).toBe("model-a");
    const buildModel = getConfigAgentModel(configPath, "build");
    expect(buildModel).toBe("model-a");
    const exploreModel = getConfigAgentModel(configPath, "explore");
    expect(exploreModel).toBe("model-a");

    // The completion message should include model-a.
    const output = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(output).toContain("model-a");
    expect(output).toContain("complete!");

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("single-agent model selection updates only that agent", async () => {
    const root = chdirToFixture({
      activeCustom: ["developer", "reviewer"],
    });
    const agentDir = join(root, ".opencode", "agent");

    // First select: choose developer (not bulk).
    // Second select: choose model-b.
    // confirm returns undefined by default → "Configure another?" is answered no.
    vi.mocked(select)
      .mockResolvedValueOnce("developer" as any)
      .mockResolvedValueOnce("model-b" as any);

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await modelsCommand({ project: true });

    // developer should have model-b.
    expect(getAgentModel(join(agentDir, "developer.md"))).toBe("model-b");

    // reviewer should NOT have been touched (no model in frontmatter).
    const revContent = readFileSync(join(agentDir, "reviewer.md"), "utf-8");
    expect(revContent).not.toContain("model-b");

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("throws CancellationError when <- Cancel is selected during agent selection", async () => {
    chdirToFixture({ activeCustom: ["developer"] });

    // The first select call (agent selection) returns the cancel sentinel.
    vi.mocked(select).mockResolvedValueOnce(CANCEL_VALUE as any);

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      modelsCommand({ project: true })
    ).rejects.toBeInstanceOf(CancellationError);

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("throws CancellationError when ExitPromptError bubbles up (Ctrl+C inside prompt)", async () => {
    chdirToFixture({ activeCustom: ["developer"] });

    vi.mocked(select).mockRejectedValueOnce(EXIT_PROMPT_ERROR);

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      modelsCommand({ project: true })
    ).rejects.toBeInstanceOf(CancellationError);

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("spinner in non-TTY mode writes no control characters to stderr", async () => {
    // Create a fixture with active agents to guarantee the spinner path runs.
    chdirToFixture({ activeCustom: ["developer"] });

    // Force non-TTY on stderr so the Spinner degrades to a static line.
    const originalIsTTY = process.stderr.isTTY;
    Object.defineProperty(process.stderr, "isTTY", {
      value: false,
      configurable: true,
    });

    try {
      // select → bulk option, then model-a.
      vi.mocked(select)
        .mockResolvedValueOnce(ALL_AGENTS_VALUE as any)
        .mockResolvedValueOnce("model-a" as any);

      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await modelsCommand({ project: true });

      // In non-TTY the spinner should write a static line with no carriage-return
      // control characters.
      const allStderr = stderrWriteSpy.mock.calls
        .map((c) => String(c[0]))
        .join("");
      expect(allStderr).not.toContain("\r");
      // Should contain the spinner message
      expect(allStderr).toContain("Loading models");

      logSpy.mockRestore();
      errorSpy.mockRestore();
    } finally {
      // Restore original isTTY even if the test fails.
      Object.defineProperty(process.stderr, "isTTY", {
        value: originalIsTTY,
        configurable: true,
      });
    }
  });
});
