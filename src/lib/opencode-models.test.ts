import { describe, expect, it } from "vitest";
import {
  buildModelOptions,
  parseOpenCodeModelsOutput,
} from "./opencode-models.js";

describe("parseOpenCodeModelsOutput", () => {
  it("parses one model id per line", () => {
    const output = `openai/gpt-5.5
anthropic/claude-sonnet-4-6
neuralwatt/zai-org/GLM-5.1-FP8
`;

    expect(parseOpenCodeModelsOutput(output)).toEqual([
      "openai/gpt-5.5",
      "anthropic/claude-sonnet-4-6",
      "neuralwatt/zai-org/GLM-5.1-FP8",
    ]);
  });

  it("trims empty lines and removes duplicates", () => {
    const output = `
openai/gpt-5.5

openai/gpt-5.5
  github-copilot/gpt-5-mini  
`;

    expect(parseOpenCodeModelsOutput(output)).toEqual([
      "openai/gpt-5.5",
      "github-copilot/gpt-5-mini",
    ]);
  });
});

describe("buildModelOptions", () => {
  it("returns available models when there is no current model", () => {
    expect(buildModelOptions(["a/model", "b/model"])).toEqual([
      "a/model",
      "b/model",
    ]);
  });

  it("keeps current model first when it is not in available models", () => {
    expect(buildModelOptions(["a/model", "b/model"], "current/model")).toEqual([
      "current/model",
      "a/model",
      "b/model",
    ]);
  });

  it("does not duplicate current model when already available", () => {
    expect(buildModelOptions(["a/model", "b/model"], "a/model")).toEqual([
      "a/model",
      "b/model",
    ]);
  });
});
