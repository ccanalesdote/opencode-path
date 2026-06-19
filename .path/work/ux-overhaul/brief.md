# Brief: opencode-path UX overhaul

## Objective
Turn `opencode-path` into a guided, consistent, cancelable CLI experience. `init` becomes the first-run journey from scope selection through agents, profiles, and models; standalone commands keep their existing behavior while sharing presentation, cancellation, flags, and exit-code conventions.

## Problem
The current CLI has four isolated commands with inconsistent headers, summaries, footer messages, cancellation behavior, and no unified first-run setup. `init` only installs agents, so a new user must remember to run `profiles` and `models`. Ctrl+C inside `@inquirer/prompts` can print an unmanaged stack trace. `opencode models` blocks with no feedback. The README is more rationale than manual.

## Scope
- Implement the overhaul in two phases:
  - Phase 1: shared UX foundation plus standalone `agents`, `profiles`, and `models` compatibility updates.
  - Phase 2: guided `init`, `uninstall`, README manual rewrite, and final integration tests.
- Add `src/lib/ui.ts` for reusable CLI rendering helpers, prompt cancel option helpers, and spinner support.
- Add `src/lib/messages.ts` for user-facing shared strings.
- Normalize cancellation, usage errors, generic errors, stdout/stderr separation, and exit codes in `src/cli.ts`.
- Add common flags: `--global`, `--project`, `--yes`, and `--dry-run` where applicable.
- Add `init --dry-run` explicitly.
- Add a conservative `uninstall` command.
- Preserve existing on-disk layout, template contents, managed marker behavior, frontmatter format, and command mutation semantics unless explicitly listed here.

## Non-goals
- Do not migrate from `@inquirer/prompts`.
- Do not introduce a new CLI argument parser.
- Do not add a TUI/dashboard or persistent UI.
- Do not change agent template contents, profile snippet format, or disk layout.
- Do not add async/parallel persistence layers.
- Do not translate CLI output or README to Spanish; user-facing output remains English.
- Do not implement `init --quick`.
- Do not delete `opencode.json` during uninstall, even if it only contains managed entries.

## Constraints
- Current stack: TypeScript ESM, `commander`, `@inquirer/prompts@7`, `picocolors`, `yaml`, `vitest`, `tsup`.
- Existing tests are primarily under `src/lib/*.test.ts`; command-layer tests are mostly greenfield.
- `opencode models` is currently invoked synchronously via `execFileSync` in `src/lib/opencode-models.ts`.
- Spinner must use existing dependencies only; no `ora`, `nanospinner`, or similar dependency.
- `--yes` only skips confirmations. It must not choose sensitive values such as scope.
- Non-interactive execution without an explicit viable scope must fail with exit code `2`.

## Decisions
- Use a two-phase implementation to reduce regression risk while avoiding excessive PR overhead.
- Centralize SIGINT and exit-code normalization in `src/cli.ts`, with prompt-level wrappers/helpers that translate `ExitPromptError` into controlled cancellation.
- Design `init` as plan-first and write-after-final-confirm. If canceled before confirmation, no writes should occur.
- Do not implement complex rollback for `init`; prevent partial state by delaying writes. If cancellation or failure occurs during writes, print a clear partial-state warning and exit non-zero.
- `uninstall` is conservative: remove only managed custom agent `.md` files containing `MANAGED_MARKER`, and clean only opencode-path-created `agent.*` config entries. Never delete `opencode.json` entirely.
- Treat Inquirer theming as best-effort within `@inquirer/prompts@7`; prefer thin helpers over a broad theme system if exact color mapping is not supported.
- Use `vitest`, already configured, for new unit tests.
- In non-TTY output, spinner degrades to a static message and must not emit control characters.

## Relevant files and areas
- `src/cli.ts`: command registration, global error handling, exit-code normalization, new `uninstall` registration, flags wiring.
- `src/commands/init.ts`: guided journey and plan/apply orchestration.
- `src/commands/agents.ts`: reuse UI/messages, scope flags, dry-run, yes, cancel option.
- `src/commands/profiles.ts`: reuse UI/messages, scope flags, dry-run, yes, cancel option.
- `src/commands/models.ts`: reuse UI/messages, scope flags, cancel option, spinner, bulk model assignment.
- `src/commands/uninstall.ts`: new conservative uninstall command.
- `src/lib/ui.ts`: new rendering helpers, spinner, cancel option, prompt row rendering, summary formatting.
- `src/lib/messages.ts`: new central strings.
- `src/lib/opencode-models.ts`: spinner integration around `opencode models` discovery.
- `src/lib/config.ts`: config entry updates/removals; preserve unknown fields.
- `src/lib/agents.ts`, `src/lib/paths.ts`: managed agent state, built-in/custom distinctions.
- `src/lib/templates.ts`, `src/lib/frontmatter.ts`: template validation and model/profile edits.
- `templates/*.md`: validate frontmatter at `init` start; do not change content unless separately required.
- `README.md`: rewrite as user manual.
- `package.json`: ensure validation scripts already cover tests/build/typecheck; add no new test runner.

## Acceptance Criteria
- AC-01: `init` executes steps in this order in one guided flow: scope → agents → profiles → models.
- AC-02: After scope selection, `init` scans state and displays conflict warnings before the first non-scope prompt.
- AC-03: `init` agents step uses a checkbox multi-select over managed agents with the same unified row rendering as standalone `agents`.
- AC-04: `init` profiles step uses a checkbox multi-select over `PROFILES` plus synthetic `All stacks`, and applies only to patchable agents: `developer`, `reviewer`, `auditor`.
- AC-05: `init` models step iterates active agents, prompting once per agent using available `opencode models` output and preserving `Custom model...`; prompt header format is `Choose a model for: <agent>`.
- AC-06: Each non-scope `init` step exposes visible `Skip for now` and advances without planning changes for that step.
- AC-07: Each prompt exposes visible `← Cancel`, visually distinct from real options, aborting with standard cancellation behavior.
- AC-08: After all `init` steps, a consolidated summary lists planned created/restored/skipped agents, profiles, and model assignments, followed by one `confirm("Apply these changes?")`; writes occur only after confirmation unless `--dry-run` is used.
- AC-09: Re-running `init` is idempotent. If no changes are planned, it prints `No changes needed.` and exits `0` without asking for confirmation.
- AC-10: Ctrl+C inside any Inquirer prompt in any command exits `130`, prints `Cancelled.` in yellow, and prints no stack trace.
- AC-11: A second Ctrl+C forces immediate exit without hanging.
- AC-12: Every select and checkbox prompt in `init`, `agents`, `profiles`, and `models` exposes synthetic `← Cancel` with the same behavior as Ctrl+C.
- AC-13: If `init` is canceled before final confirmation, no writes occur. If interrupted during writes, it prints a partial-state warning and exits non-zero.
- AC-14: `src/lib/ui.ts` exports reusable helpers equivalent to `printHeader`, `printResult`, `printPaths`, `printWarning`, `printCancelled`, `printNoChanges`, `printComplete`, `printNextStep`, `printSpinner`, prompt cancel helpers, and unified agent row rendering. Command files consume these helpers and do not import `picocolors` directly.
- AC-15: `src/lib/messages.ts` centralizes shared user-facing strings including cancel, no-op, restart warning, conflict messages, usage errors, and partial-state warnings. Command files consume these constants/helpers instead of hardcoding those concepts.
- AC-16: The four existing commands print the same header format: blank line, emoji + bold title, blank line. Emojis remain fixed: 🔧 init, 🤖 agents, 🎯 models, 🧩 profiles.
- AC-17: Result summaries use one aligned label column, consistent indentation, and consistent colors: green for created/installed/applied, yellow for skipped/unchanged, red for conflict/failed.
- AC-18: Commands that touch files print `Agent dir:` and `Config:` path lines with the same bold style, alignment, and wording.
- AC-19: Commands that change configuration print `⚠️  Restart opencode to apply changes.` with consistent spacing, position, and yellow color when applicable.
- AC-20: Commands completing a set of changes print `✅ <name> complete!` before the summary; `models` gains this header.
- AC-21: Agent rows in `init`, `agents`, and `models` prompts use the same convention: status glyph `●/○/◌/✕` + name + `[custom]/[built-in]` badge + status suffix when applicable.
- AC-22: Cancel and no-op messages use exactly `Cancelled.` and `No changes needed.` from `messages.ts`.
- AC-23: While invoking `opencode models`, a no-new-dependency spinner is shown in TTY and stops cleanly on success, error, or cancellation; in non-TTY it degrades without control-character artifacts.
- AC-24: `agents` and `profiles` accept `--dry-run`, print planned changes in the standard summary format, exit `0`, and perform no writes.
- AC-25: `agents`, `profiles`, and `init` accept `--yes`/`-y`, which skips only final confirmation prompts and does not infer scope or other sensitive choices.
- AC-26: The four existing commands accept `--global` and `--project`. Passing either skips interactive scope selection. Passing both prints a clear usage error and exits `2`. In non-interactive mode, omitting both when scope is required prints `Non-interactive mode requires --global or --project` and exits `2`.
- AC-27: `uninstall` removes only managed custom agent `.md` files with `MANAGED_MARKER` and cleans only opencode-path-created `agent.*` entries in `opencode.json`; it honors `--global`, `--project`, and `--yes`; it never deletes `opencode.json` and never deletes unmarked files.
- AC-28: Exit codes follow and document: `0` success or no-op, `1` generic error, `2` usage error, `130` canceled. `src/cli.ts` normalizes these.
- AC-29: Errors are printed via `console.error(...)`; informational and success output remains on stdout.
- AC-30: Standalone `models` adds a menu option `Set all active agents to the same model`, then uses one model selection and applies it to every active agent.
- AC-31: `init` validates YAML frontmatter for `templates/*.md` before the first prompt; malformed templates produce a clear error listing the file(s), make no changes, and exit `1`.
- AC-32: `@inquirer/prompts` is configured or wrapped with best-effort theme/color alignment to the `picocolors` palette used by summaries and headers.
- AC-33: README top-level order becomes: title + one-paragraph intro → Quick start → Commands → Concepts → Troubleshooting / FAQ → Contributing pointer.
- AC-34: Each command subsection documents purpose, usage example `opencode-path <cmd> [options]`, step-by-step behavior, and options/flags including new flags.
- AC-35: The `Why not an orchestrator` / `deliberately user-driven` essay is removed from README. If rationale is preserved later, README only points to a future `ARCHITECTURE.md`; creating that file is out of scope.
- AC-36: Troubleshooting covers at least: `opencode` not in PATH, `opencode models` returns empty list, restart reminder, managed marker conflicts, and complete uninstall, each with concrete resolution commands.
- AC-37: Standalone `agents`, `profiles`, and `models` preserve their existing question sequence, options, mutation logic, and existing success/failure semantics except for the explicitly added UX, cancellation, flags, and bulk option.
- AC-38: Unit tests are added for `ui.ts` helpers and SIGINT/cancel handling using `vitest`; the existing `npm test` pipeline runs them.
- AC-39: `init` accepts `--dry-run`: it runs the selection flow, shows the consolidated planned summary, exits `0`, and performs no writes. If combined with `--yes`, it does not ask the final confirmation.

## Edge cases
- `init` reaches models step with zero active managed agents: skip automatically or show `No active managed agents to configure models for`; summary reflects no model changes.
- All `init` steps skipped: summary shows zero planned changes; final confirmation may be shown unless `--yes` or `--dry-run` applies; after confirmation print `No changes needed.` and exit `0`.
- Non-interactive execution without `--global` or `--project`: fail with `Non-interactive mode requires --global or --project` and exit `2`.
- `--global` and `--project` together: clear usage error and exit `2`.
- Ctrl+C during write after confirmation: file may be partially written; print partial-state warning with verification/cleanup guidance and exit non-zero.
- Parallel invocations against same scope: commands re-read state before apply where practical; idempotent changes should remain safe; write races fail clearly.
- `opencode models` returns empty or fails: spinner stops, command falls back to existing custom model path.
- Spinner in non-TTY: no spinner control characters are printed.
- `uninstall` encounters unmarked custom files: skip them, do not delete them, and print a warning listing skipped files.
- Malformed template frontmatter detected by `init`: abort before prompts, make no changes, exit `1`.

## Open questions
- None blocking. Implementation may adjust the exact names/signatures of `ui.ts` helpers if all acceptance criteria remain covered.
