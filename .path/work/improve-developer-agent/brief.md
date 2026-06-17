# Brief: Improve Developer Agent Prompt

## Objective
Apply a conservative B-lite prompt diet to the Developer agent so it removes legacy behavior and internal duplication while preserving its core execution guardrails.

## Problem
`templates/developer.md` currently repeats the same operational constraints across Workflow, Hard rules, Bash usage rules, and Minimal implementation policy. It also still supports legacy `plan-*.md` inputs, which conflicts with the newer work-folder-only direction agreed for Architect handoffs.

## Scope
- Update `templates/developer.md` prompt body.
- Remove active legacy `plan-*.md` support and fallback behavior from Developer.
- Merge `Minimal implementation policy` into `Hard rules` instead of keeping it as a separate section.
- Compact `Bash usage rules` by removing long examples while retaining permission-boundary behavior.
- Keep the 10-step Workflow and Completion report structure.
- Preserve Developer's core safety model: bounded scope, self-verification, Reviewer before done, and work-folder status/progress updates.

## Non-goals
- Do not redesign Developer's role.
- Do not change the frontmatter permission policy unless a direct inconsistency is discovered and clearly justified.
- Do not make Developer own design decisions that belong to Architect.
- Do not remove Reviewer from the done path.
- Do not add new agents, dependencies, workflows, or runtime config files.
- Do not aggressively compress the prompt at the expense of clarity.

## Constraints
- `Developer` is the only workflow agent intended to modify application code broadly, so prompt guardrails must remain explicit.
- `templates/developer.md` frontmatter currently allows broad `edit` and `write`; prompt text must explicitly prevent accidental edits to Architect-owned `brief.md` unless the user asks.
- The project is technology-agnostic by default; validation commands may be profile-dependent in installed agent files.
- Known repository validation commands from `package.json`: `npm run typecheck`, `npm test`, and `npm run build`.
- opencode agent template changes require restarting opencode after installation or template updates are applied in an active environment.

## Decisions
- Use B-lite, not full B: reduce duplication moderately while keeping safety-critical rules visible.
- Keep the 10-step Workflow but shorten prose where it duplicates Hard rules.
- Remove all active `plan-*.md` handling from Developer. Developer should work from direct user instructions or `.path/work/{feature-slug}/` artifacts.
- Keep `Scope = Covers` explicit and prominent.
- Keep explicit no-scope-creep language: no opportunistic refactors, no adjacent features, no "while I'm here" changes.
- Keep explicit no-new-dependencies language unless the user instructs it or the selected task requires it and the user approves.
- Keep explicit instruction that `brief.md` is context and should not be edited unless the user asks.
- Keep Reviewer mandatory before declaring a task done.
- Keep separate Completion report fields for verification and Reviewer verdict.

## Relevant files and areas
- `templates/developer.md`: primary file to modify.
- `README.md`: read only if implementation discovers documentation still advertising Developer legacy plan behavior; update only if needed for consistency.
- `package.json`: validation commands.
- Search terms: `legacy`, `plan-*.md`, `Minimal implementation policy`, `Bash usage rules`, `Hard rules`, `Covers`, `brief.md`.

## Acceptance Criteria
- AC-01: `templates/developer.md` contains no active support for legacy `plan-*.md` inputs or legacy fallback task handling.
- AC-02: `templates/developer.md` keeps the 10-step Workflow and preserves work-folder task selection behavior: read `brief.md`, `tasks.md`, `progress.md`; continue exactly one `in_progress`; ask on multiple/no selected tasks.
- AC-03: `templates/developer.md` merges the useful content of `Minimal implementation policy` into Hard rules and removes the separate `Minimal implementation policy` section.
- AC-04: Hard rules explicitly preserve scope discipline: selected task only, `Covers` is literal, no opportunistic refactors, no adjacent features, no unnecessary abstractions, and no new dependencies unless explicitly instructed/required and approved.
- AC-05: Hard rules explicitly state that in work-folder mode `brief.md` is context and must not be edited unless the user explicitly asks.
- AC-06: Bash usage rules are compacted but still require respecting permissions, explaining confirmation requests, never bypassing denied/ask prompts, and treating git state changes, dependency installation, PR creation, publishing/deployment, and external-impact commands as requiring explicit user direction and permission.
- AC-07: Developer still self-verifies before Reviewer, invokes Reviewer before declaring done, records FAIL verdicts in `progress.md` when using a work folder, fixes findings, and does not declare done on FAIL.
- AC-08: Developer still does not mark a work-folder task `done` unless covered ACs are implemented and stated verification is satisfied, or the user explicitly accepts deferred verification.
- AC-09: Completion report keeps separate fields for changed files, verification done, Reviewer verdict, manual test suggestions, out-of-scope observations, and work folder when applicable.
- AC-10: The prompt body is shorter and less duplicative without becoming an aggressive rewrite; expected target is roughly 75–85 body lines, but behavior preservation matters more than exact line count.
- AC-11: Project validation passes using `npm run typecheck`, `npm test`, and `npm run build`, or any unrelated failure is documented with exact output and suspected cause.

## Edge cases
- User gives Developer a legacy `plan-*.md`: Developer should not follow a legacy flow. It should ask for direct task selection or a `.path/work/{feature-slug}/` handoff.
- Work folder is missing one of `brief.md`, `tasks.md`, or `progress.md`: Developer should ask whether to proceed from available context or wait for repair.
- `tasks.md` has multiple `in_progress` tasks: Developer must ask which to continue.
- `tasks.md` has no `in_progress` task and user did not select one: Developer must ask which task/subset to implement.
- Selected task has empty/missing `Covers`: Developer should ask for AC mapping or explicit permission to proceed from available context; do not silently guess.
- Reviewer returns FAIL: Developer records the verdict, keeps or returns the task to `in_progress`/`blocked`, fixes findings, and re-invokes Reviewer.
- Validation cannot be run because command requires confirmation or fails unrelatedly: Developer records what was not run or failed and does not overclaim verification.

## Open questions
- None.
