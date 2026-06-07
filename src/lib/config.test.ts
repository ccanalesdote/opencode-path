import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  readConfig,
  writeConfig,
  ensureConfigStructure,
  createOrMergeConfig,
  getExploreModel,
  setExploreModel,
} from "./config.js";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";

const FIXTURE_DIR = join(import.meta.dirname, "__fixtures__", "config");

beforeEach(() => {
  mkdirSync(FIXTURE_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(FIXTURE_DIR, { recursive: true, force: true });
});

function fixturePath(...segments: string[]) {
  return join(FIXTURE_DIR, ...segments);
}

describe("readConfig / writeConfig", () => {
  it("reads a valid config file", () => {
    const filePath = fixturePath("config.json");
    const config = { $schema: "https://opencode.ai/config.json", agent: {} };
    writeFileSync(filePath, JSON.stringify(config, null, 2), "utf-8");

    const result = readConfig(filePath);
    expect(result).toEqual(config);
  });

  it("returns undefined for a non-existent file", () => {
    expect(readConfig("/nonexistent/config.json")).toBeUndefined();
  });

  it("writes a config file with 2-space formatting", () => {
    const filePath = fixturePath("output.json");
    const config = { $schema: "https://opencode.ai/config.json" };
    writeConfig(filePath, config);

    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain('  "$schema"');
    expect(content.endsWith("\n")).toBe(true);
  });

  it("creates parent directories when writing", () => {
    const filePath = fixturePath("nested", "dir", "config.json");
    writeConfig(filePath, {});
    expect(existsSync(filePath)).toBe(true);
  });
});

describe("ensureConfigStructure", () => {
  it("adds $schema if missing", () => {
    const result = ensureConfigStructure({});
    expect(result.$schema).toBe("https://opencode.ai/config.json");
  });

  it("adds agent object if missing", () => {
    const result = ensureConfigStructure({});
    expect(result.agent).toBeDefined();
    expect(typeof result.agent).toBe("object");
  });

  it("adds agent.explore with description if missing", () => {
    const result = ensureConfigStructure({});
    const agent = result.agent as Record<string, unknown>;
    expect(agent.explore).toBeDefined();
    const explore = agent.explore as Record<string, unknown>;
    expect(explore.description).toBeDefined();
    expect(typeof explore.description).toBe("string");
  });

  it("preserves existing $schema if present", () => {
    const result = ensureConfigStructure({
      $schema: "custom-schema",
    });
    expect(result.$schema).toBe("custom-schema");
  });

  it("preserves existing agent.explore.description", () => {
    const result = ensureConfigStructure({
      agent: {
        explore: {
          description: "Custom description",
          model: "openai/gpt-5.5",
        },
      },
    });
    const agent = result.agent as Record<string, unknown>;
    const explore = agent.explore as Record<string, unknown>;
    expect(explore.description).toBe("Custom description");
    expect(explore.model).toBe("openai/gpt-5.5");
  });

  it("preserves unrelated config fields", () => {
    const result = ensureConfigStructure({
      customField: "preserved",
      anotherField: 42,
      agent: {
        customAgent: {
          description: "My custom agent",
        },
      },
    });
    expect(result.customField).toBe("preserved");
    expect(result.anotherField).toBe(42);
    const agent = result.agent as Record<string, unknown>;
    expect(agent.customAgent).toEqual({ description: "My custom agent" });
  });

  it("replaces agent if it is not an object", () => {
    const result = ensureConfigStructure({ agent: "not an object" });
    expect(typeof result.agent).toBe("object");
  });
});

describe("createOrMergeConfig", () => {
  it("creates a new config file if it does not exist", () => {
    const filePath = fixturePath("new-config.json");
    const result = createOrMergeConfig(filePath);

    expect(result.$schema).toBe("https://opencode.ai/config.json");
    expect(result.agent).toBeDefined();
    expect(existsSync(filePath)).toBe(true);
  });

  it("merges into an existing config without removing fields", () => {
    const filePath = fixturePath("existing-config.json");
    const existingConfig = {
      $schema: "https://opencode.ai/config.json",
      myCustomField: "should be preserved",
      agent: {
        myAgent: {
          description: "Custom agent",
        },
      },
    };
    writeFileSync(filePath, JSON.stringify(existingConfig, null, 2), "utf-8");

    const result = createOrMergeConfig(filePath);
    expect(result.myCustomField).toBe("should be preserved");
    const agent = result.agent as Record<string, unknown>;
    expect(agent.myAgent).toEqual({ description: "Custom agent" });
    expect(agent.explore).toBeDefined();
  });
});

describe("getExploreModel / setExploreModel", () => {
  it("returns undefined if no model is set", () => {
    const filePath = fixturePath("no-model.json");
    const config = {
      $schema: "https://opencode.ai/config.json",
      agent: { explore: { description: "test" } },
    };
    writeFileSync(filePath, JSON.stringify(config, null, 2), "utf-8");

    expect(getExploreModel(filePath)).toBeUndefined();
  });

  it("gets the explore model from a config", () => {
    const filePath = fixturePath("with-model.json");
    const config = {
      $schema: "https://opencode.ai/config.json",
      agent: {
        explore: {
          description: "test",
          model: "anthropic/claude-haiku-4-5",
        },
      },
    };
    writeFileSync(filePath, JSON.stringify(config, null, 2), "utf-8");

    expect(getExploreModel(filePath)).toBe("anthropic/claude-haiku-4-5");
  });

  it("sets the explore model in a config", () => {
    const filePath = fixturePath("set-model.json");
    const config = {
      $schema: "https://opencode.ai/config.json",
      agent: { explore: { description: "test" } },
    };
    writeFileSync(filePath, JSON.stringify(config, null, 2), "utf-8");

    setExploreModel(filePath, "openai/gpt-5.5");

    const model = getExploreModel(filePath);
    expect(model).toBe("openai/gpt-5.5");

    // Verify description is preserved
    const written = JSON.parse(readFileSync(filePath, "utf-8"));
    expect(written.agent.explore.description).toBe("test");
  });

  it("creates config with minimum structure if it does not exist", () => {
    const filePath = fixturePath("new-config.json");
    setExploreModel(filePath, "anthropic/claude-sonnet-4-6");

    expect(existsSync(filePath)).toBe(true);
    const config = JSON.parse(readFileSync(filePath, "utf-8"));
    expect(config.agent.explore.model).toBe("anthropic/claude-sonnet-4-6");
    expect(config.$schema).toBe("https://opencode.ai/config.json");
  });

  it("replaces existing explore model", () => {
    const filePath = fixturePath("replace-model.json");
    const config = {
      $schema: "https://opencode.ai/config.json",
      agent: {
        explore: {
          description: "test",
          model: "old-model",
        },
      },
    };
    writeFileSync(filePath, JSON.stringify(config, null, 2), "utf-8");

    setExploreModel(filePath, "new-model");

    const model = getExploreModel(filePath);
    expect(model).toBe("new-model");
  });

  it("preserves unrelated fields when setting explore model", () => {
    const filePath = fixturePath("preserve-fields.json");
    const config = {
      $schema: "https://opencode.ai/config.json",
      customTopLevel: "preserved",
      agent: {
        explore: {
          description: "test",
        },
        customAgent: {
          description: "my agent",
        },
      },
    };
    writeFileSync(filePath, JSON.stringify(config, null, 2), "utf-8");

    setExploreModel(filePath, "openai/gpt-5.5");

    const written = JSON.parse(readFileSync(filePath, "utf-8"));
    expect(written.customTopLevel).toBe("preserved");
    expect(written.agent.customAgent).toEqual({ description: "my agent" });
  });
});
