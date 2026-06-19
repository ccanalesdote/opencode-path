import {
  execFileSync,
  execFile,
  type ExecFileException,
} from "node:child_process";

export const CUSTOM_MODEL_VALUE = "__custom_model__";

/**
 * Parse `opencode models` output. OpenCode currently prints one model ID per line.
 */
export function parseOpenCodeModelsOutput(output: string): string[] {
  const seen = new Set<string>();
  const models: string[] = [];

  for (const line of output.split(/\r?\n/)) {
    const model = line.trim();
    if (!model || seen.has(model)) continue;
    seen.add(model);
    models.push(model);
  }

  return models;
}

/**
 * Return the model IDs exposed by the installed OpenCode CLI.
 * Falls back to an empty list if OpenCode is unavailable or the command fails.
 */
export function listOpenCodeModels(): string[] {
  try {
    const output = execFileSync("opencode", ["models"], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return parseOpenCodeModelsOutput(output);
  } catch {
    return [];
  }
}

/**
 * Put the current model first if it is not already in OpenCode's model list.
 */
export function buildModelOptions(
  availableModels: string[],
  currentModel?: string
): string[] {
  const options: string[] = [];
  const seen = new Set<string>();

  if (currentModel) {
    options.push(currentModel);
    seen.add(currentModel);
  }

  for (const model of availableModels) {
    if (seen.has(model)) continue;
    seen.add(model);
    options.push(model);
  }

  return options;
}

/**
 * Return the model IDs exposed by the installed OpenCode CLI, asynchronously.
 *
 * This variant is safe to use with a spinner because it does not block the
 * event loop. If `signal` is aborted, the child process is killed and the
 * returned promise rejects. On any other OpenCode failure, it falls back to
 * an empty list.
 */
export function listOpenCodeModelsAsync(options?: {
  signal?: AbortSignal;
}): Promise<string[]> {
  return new Promise((resolve, reject) => {
    if (options?.signal?.aborted) {
      reject(new Error("Cancelled"));
      return;
    }

    const child = execFile(
      "opencode",
      ["models"],
      {
        encoding: "utf-8",
      },
      (err: ExecFileException | null, stdout: string, _stderr: string) => {
        if (options?.signal?.aborted) {
          reject(new Error("Cancelled"));
          return;
        }

        if (err) {
          resolve([]);
          return;
        }

        resolve(parseOpenCodeModelsOutput(stdout));
      }
    );

    options?.signal?.addEventListener("abort", () => {
      child.kill();
    });
  });
}
