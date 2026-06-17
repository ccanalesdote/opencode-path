# Plan: Work folder artifacts for cross-session continuity

## Context the implementer needs
- This project is `opencode-path`, a TypeScript CLI and template pack that installs specialized opencode agents for a manual, user-controlled workflow.
- Current cross-session planning is mostly a documentation/prompt convention centered on one `plan-*.md` file. That file mixes stable context, implementation tasks, validation, decisions, and progress, which makes multi-session Developer work harder to resume.
- The first version of this feature should introduce a per-feature work folder convention only. Do not add CLI commands or source-code scaffolding yet.
- Architect should be able to create `.path/work/<kebab-feature>/` directly as part of the handoff flow; the user should not need to create the folder manually.
- Target folder shape for the example feature is:
  ```text
  .path/work/nueva-feature/
    brief.md
    tasks.md
    progress.md
  ```
- Canonical future path shape is `.path/work/<kebab-feature>/`. Use kebab-case, no spaces, and no deeper nesting unless the user explicitly requests it.
- Key files to read/touch first:
  - `templates/architect.md` — current Architect prompt and permissions; currently allows writing only `*plan*.md`.
  - `templates/developer.md` — current Developer prompt; assumes a single plan file.
  - `templates/auditor.md` — should learn how to inspect work folders and append audit findings where permissions allow.
  - `templates/reviewer.md` — likely only needs a clarification that Reviewer does not edit work-folder files; Developer records Reviewer verdicts.
  - `README.md` — currently documents the single-plan flow in overview, typical workflow, cross-session planning, and agent details.
- `package.json` — validation commands include `npm test`, `npm run typecheck`, and `npm run build`; for this doc/prompt-only change, `npm test` and `npm run typecheck` are the required validation targets, and build should be skipped unless explicitly needed because it may write artifacts.
- Relevant conventions and constraints:
  - Agent templates live under `templates/` and are packaged with the npm package via `package.json` `files`.
  - Managed custom agents are listed in `src/lib/paths.ts`; do not add a new agent for this feature.
  - The project intentionally avoids an orchestrator. The user manually chooses when to use Spec, Architect, Developer, Auditor, and Reviewer.
  - Keep `plan-*.md` as a backward-compatible fallback.
  - Do not touch `templates/spec.md` in this first version. Spec continues to clarify requirements in chat; Architect converts ready context into the work-folder artifacts.
- Decisions already made:
  - Use `.path/` rather than `.opencode-path/` so the workflow artifact is not overly coupled to opencode.
  - This v1 is prompt/docs/permission only: no CLI command, no automated scaffold, no source-code work-folder library.
  - `brief.md` is stable design/context and is owned by Architect.
  - `tasks.md` is the structured current task state. Architect creates it; Developer updates task statuses; Auditor may add structured audit notes.
  - `progress.md` is an append-only session/history log. Developer is the primary writer; Auditor may append audit entries. Architect may only create an initial empty or bootstrap entry and should not update execution progress.
  - Reviewer should remain read-only and should not edit work-folder files. Developer records Reviewer verdicts in `progress.md`.
  - If Auditor audits an explicit work folder path such as `.path/work/<kebab-feature>/`, it must proactively append findings to `tasks.md` under `## Auditor notes`, append a dated audit entry to `progress.md`, and also report in chat.
  - If no work folder is explicit or clearly detectable, Auditor should respond only in chat and should not create or modify work-folder files.
  - Auditor only appends new notes. It must not rewrite history, delete findings, or touch `brief.md`.
  - If the user discards, resolves, or cancels a finding, Auditor should append a dated resolution/discard/cancellation note with the reason rather than deleting or rewriting the earlier finding.

## Step-by-step plan
1. Inspect current prompt and README assumptions about `plan-*.md` — verify with: search `README.md` and `templates/*.md` for `plan`, `brief`, `Cross-Session`, `progress`, and `tasks`; list every section that needs migration before editing.
2. Update `templates/architect.md` permissions to allow the new work-folder files while preserving legacy plan writes, and allow only `mkdir -p .path/work/*` for directory creation — verify with: inspect the YAML frontmatter and confirm `edit`/`write` still deny by default but allow `*plan*.md`, `.path/work/*/brief.md`, `.path/work/*/tasks.md`, and `.path/work/*/progress.md`, while `bash` allows only `mkdir -p .path/work/*`, denies everything else, and explicitly denies compound/evaluation patterns `*;*`, `*&&*`, `*||*`, ``*`*``, and `*$(*` if the permission shape supports pattern rules.
3. Update `templates/architect.md` instructions for the work-folder flow — verify with: confirm the prompt says Architect must confirm the folder path before writing, use `.path/work/<kebab-feature>/`, create that directory itself with `mkdir -p .path/work/<kebab-feature>/` when needed, tell the user they should not create the folder manually, handle existing files without silent overwrite, and treat `plan-*.md` as legacy fallback.
4. Define mandatory artifact structures inside `templates/architect.md` — verify with: confirm the prompt includes concrete required sections for `brief.md`, `tasks.md`, and `progress.md` as described below.
5. Update `templates/developer.md` for dual-mode handoff — verify with: confirm Developer instructions say that if given a work folder, it must read `brief.md`, `tasks.md`, and `progress.md` before editing; if given `plan-*.md`, it follows the legacy single-plan flow.
6. Update `templates/developer.md` task/progress ownership rules — verify with: confirm Developer implements only the selected bounded task or explicitly selected subset, continues the single `in_progress` task if there is exactly one, asks the user when there are multiple or zero `in_progress` tasks without an explicit selection, updates `tasks.md` statuses, appends `progress.md` at meaningful stopping points, records Reviewer verdicts, and does not silently expand scope.
7. Update `templates/auditor.md` to understand work folders — verify with: confirm Auditor can read the three files, compare declared progress against code state, proactively append audit entries to `progress.md` and structured findings to `tasks.md` when the user explicitly asks to audit `.path/work/<kebab-feature>/`, report the result in chat, and avoid rewriting Developer history; also confirm that without an explicit or clearly detectable work folder, Auditor responds only in chat.
8. Optionally update `templates/reviewer.md` with one clarification — verify with: confirm Reviewer remains read-only and returns a verdict to Developer; it does not edit `tasks.md` or `progress.md` directly.
9. Update `README.md` comprehensively — verify with: inspect overview table, key principles, typical workflow, cross-session planning, Architect details, Developer details, Auditor details, and examples; ensure they describe `.path/work/nueva-feature/` as the preferred v1 flow and `plan-*.md` as legacy-compatible.
10. Check for source-code changes accidentally introduced or required — verify with: `git diff -- src package.json package-lock.json`; there should be no source or dependency change unless a test reveals a packaging assumption that must be handled.
11. Run project validation — verify with: `npm test` and `npm run typecheck`; only run `npm run build` if a packaging/runtime concern makes it necessary and the user confirms the artifact-producing step.
12. Inspect final diff for consistency — verify with: `git diff` and ensure no contradictory single-plan-only language remains in touched sections.

Recommended mandatory structures to encode in the agent prompts:

`brief.md`:
```md
# Brief: <feature title>

## Objective
## Problem
## Scope
## Non-goals
## Constraints
## Decisions
## Relevant files and areas
## Acceptance criteria
## Edge cases
## Open questions
```

`tasks.md`:
```md
# Tasks: <feature title>

## Status legend
- pending: not started
- in_progress: actively being implemented
- done: completed and verified for the stated task
- blocked: cannot proceed without input or prerequisite
- cancelled: intentionally no longer needed

## Task table
| ID | Status | Owner | Task | Verification | Notes |
|---|---|---|---|---|---|
| T-001 | pending | Developer | <bounded task> | <command or observable check> | <constraints, links, caveats> |

## Auditor notes
| Date | Related task | Severity | Status | Finding / resolution note | Suggested follow-up |
|---|---|---|---|---|---|
```

`progress.md`:
```md
# Progress: <feature title>

## Log

### <YYYY-MM-DD HH:mm> — <Agent> — <short summary>
- Scope worked on:
- Files touched or inspected:
- Task status changes:
- Verification performed:
- Reviewer/Auditor result:
- Blockers or next handoff:
```

## Edge cases to handle explicitly
- Existing `.path/work/nueva-feature/` folder already exists — Architect must inspect or ask before writing; do not silently overwrite existing files.
- One or more of `brief.md`, `tasks.md`, or `progress.md` exists — ask whether to reuse, append, replace, or stop.
- User gives a legacy `plan-*.md` — Developer must continue to support the old flow unchanged.
- User gives a work folder path but one required file is missing — Developer must ask whether to proceed from available context or create/repair the missing artifact; do not guess silently.
- `tasks.md` has multiple `in_progress` tasks — Developer should ask which task to continue or normalize only with user confirmation.
- `tasks.md` has no `in_progress` tasks and the user did not explicitly pick one — Developer should ask which task or subset to implement; do not auto-select a pending task.
- Developer partially completes a task but validation is not run — mark task as `blocked` or keep `in_progress` with a note; do not mark `done` unless verification criteria are satisfied or explicitly deferred.
- Reviewer returns FAIL — Developer records the verdict in `progress.md`, keeps or returns relevant tasks to `in_progress`/`blocked`, fixes findings, and invokes Reviewer again before claiming done.
- User explicitly asks Auditor to audit `.path/work/<kebab-feature>/` — Auditor appends findings under `tasks.md` `## Auditor notes`, appends a dated entry to `progress.md`, and also reports in chat.
- Auditor finds mismatch between `tasks.md` and code state in an explicit/detectable work folder — Auditor appends an audit entry and adds a structured note; it should not rewrite Developer history, delete findings, or touch `brief.md`.
- User asks Auditor to audit code without naming or implying a work folder — Auditor responds only in chat and does not create or modify `.path/work/...` files.
- User discards, resolves, or cancels an Auditor finding — Auditor appends a dated resolution/discard/cancellation note with the reason; it does not delete the original finding.
- Architect wants to update execution progress — not allowed by convention; Architect should update `brief.md` or `tasks.md` design/task structure only, not progress history after implementation begins.
- Feature name contains spaces or uppercase characters — use kebab-case under `.path/work/<kebab-feature>/`, e.g. `.path/work/nueva-feature/`.

## Acceptance criteria
- [ ] `templates/architect.md` allows writing `.path/work/*/brief.md`, `.path/work/*/tasks.md`, and `.path/work/*/progress.md` while preserving `*plan*.md` compatibility.
- [ ] `templates/architect.md` allows only `mkdir -p .path/work/*` for directory creation, denies all other bash commands, and explicitly denies compound/evaluation operator patterns where applicable.
- [ ] `templates/architect.md` documents the preferred work-folder handoff, folder confirmation, Architect-owned directory creation, that the user should not create the folder manually, collision handling, and mandatory artifact structures.
- [ ] `templates/developer.md` supports both work-folder and legacy `plan-*.md` inputs.
- [ ] `templates/developer.md` requires reading all three work-folder files before implementation, continuing only a single existing `in_progress` task automatically, and otherwise asking which task/subset to implement.
- [ ] `templates/auditor.md` can inspect explicit work-folder state, proactively append audit findings to `tasks.md` and `progress.md`, avoid touching `brief.md`, and fall back to chat-only reporting when no work folder is explicit or detectable.
- [ ] `templates/spec.md` is unchanged unless the user explicitly expands scope; Spec remains a requirements clarification agent, not a work-folder writer.
- [ ] No files under `src/` are changed for this v1.
- [ ] `README.md` describes `.path/work/nueva-feature/` as the preferred cross-session artifact model, states that Architect can create the folder directly, and states that CLI scaffolding is not part of v1.
- [ ] Legacy `plan-*.md` examples are either updated or explicitly labeled as backward-compatible legacy flow.
- [ ] `npm test` passes.
- [ ] `npm run typecheck` passes.

## Codebase warnings
- `templates/architect.md` must preserve deny-by-default behavior while allowing only the narrow work-folder artifact paths plus `mkdir -p .path/work/*`; explicitly deny compound/evaluation operators if using bash pattern rules — broader bash or file permissions would exceed v1 scope.
- `templates/developer.md` must keep dual-mode behavior explicit — if task-selection rules are vague, Developer may choose pending work without confirmation or skip the legacy `plan-*.md` fallback.
- `README.md` has multiple cross-session and permission touchpoints, not just one section — update the overview, workflow examples, cross-session section, agent details, and profile notes to avoid contradictory docs.
- Do not add CLI scaffolding in `src/commands/` yet — that is intentionally out of scope for v1 and would require additional tests and UX decisions.
- Do not rename `.path` to `.opencode-path` — `.path` is an intentional abstraction for future compatibility beyond opencode.
- Be careful with opencode permissions in YAML frontmatter — preserve deny-by-default behavior for Architect and only add narrow allow patterns.
- The ability of opencode file-writing tools to create missing parent directories may vary — Architect should handle this via the narrow `mkdir -p .path/work/<kebab-feature>/` permission rather than requiring manual user folder creation or adding CLI scope.
- Installed agent files require opencode restart after template/config changes take effect for users — mention this in README or completion notes where relevant.

## Out of scope
- Adding `opencode-path work`, `opencode-path create-work`, or any other CLI command.
- Adding source-code helpers for work-folder creation.
- Any changes under `src/`.
- Adding new tests for CLI scaffolding.
- Changing `templates/spec.md` to write or own work-folder artifacts.
- Adding `.path/work/nueva-feature/` sample files to the repository unless the user explicitly asks for examples.
- Automating agent switching or introducing an orchestrator.
- Removing support for legacy `plan-*.md` files.
