# Brief: Improve Auditor Scoped Diff Behavior

## Objective
Update the Auditor workflow so it audits one explicit work plan at a time while still reviewing all product/code changes outside `.path/work`. The Auditor must be able to read and validate the current plan artifacts, but must not audit unrelated `.path/work/*` plans even if they have uncommitted or committed diff.

## Problem
The project keeps persistent planning artifacts under `.path/work/{slug}/`, and these plans are intentionally versioned in Git. Multiple plans may be created or updated while another plan is being implemented. Today, an Auditor that runs broad `git diff` or `git status` can see unrelated plan artifacts mixed with product changes, which makes the audit noisy and potentially incorrect.

## Scope
- Update the Auditor agent instructions so every audit is scoped to a specific feature/work slug.
- Define fallback behavior when the initial prompt does not identify the plan: inspect available `.path/work/*` folders and ask the user which one to audit.
- Instruct Auditor to review product/code changes with `.path/work/**` excluded.
- Instruct Auditor to review workflow artifacts only for `.path/work/{slug}/`.
- Preserve `.path/work` as versioned project content; do not add it to `.gitignore`.
- Keep this change focused on Auditor behavior only.

## Non-goals
- Do not remove worktree-related implementation or documentation in this plan; that is a separate cleanup plan.
- Do not introduce Git worktree automation, clone automation, plugins, dynamic permissions, or external-directory rules.
- Do not make `.path/work` ignored by Git.
- Do not change Architect or Developer workflows unless a minimal wording adjustment is strictly necessary to support Auditor handoff clarity.
- Do not require commits before audit; the Auditor should be able to audit the current working tree using scoped diffs.

## Constraints
- `.path/work` must remain versioned and visible to Git.
- The normal path is that the user prompt tells Auditor which plan to audit.
- Auditor should not fail immediately if no slug is provided. It should list or inspect available `.path/work/*` plans and ask the user to choose one.
- Auditor must not use unscoped `git diff` or unscoped `git status` as audit evidence.
- Auditor must treat `.path/work/*` as workflow metadata, not product/code changes.
- Auditor may audit the current plan's artifacts as evidence, especially `brief.md`, `tasks.md`, and `progress.md`.

## Decisions
- The audit unit is identified by a `feature-slug` matching `.path/work/{feature-slug}/`.
- Auditor has two separate review scopes:
  1. Plan scope: `.path/work/{feature-slug}/` only.
  2. Product scope: repository changes excluding `.path/work/**`.
- Auditor should ignore unrelated plan folders such as `.path/work/{other-slug}/` even if they appear in Git status or diff.
- If the slug is missing or ambiguous, Auditor asks the user to select a plan instead of guessing silently.
- The implementation should be instruction-level first, likely in `templates/auditor.md`.

## Relevant files and areas
- `templates/auditor.md` — primary target; update Auditor prompt and workflow rules.
- `README.md` — update only if it documents Auditor usage or audit workflow.
- `.path/work/*` — examples of current plan folders; do not globally ignore or delete them in this plan.
- `templates/architect.md` and `templates/developer.md` — avoid changes unless needed to ensure they pass a slug clearly to Auditor.

## Acceptance Criteria
- AC-01: Auditor instructions require or establish a single current `feature-slug` before audit review begins.
- AC-02: If no slug is provided in the prompt, Auditor inspects available `.path/work/*` folders and asks the user which plan to audit.
- AC-03: Auditor reads and considers only `.path/work/{feature-slug}/brief.md`, `tasks.md`, and `progress.md` for workflow-plan context.
- AC-04: Auditor does not audit unrelated `.path/work/{other-slug}/` folders, even when they contain Git changes.
- AC-05: Auditor reviews product/code changes using a scoped diff/status that excludes `.path/work/**`.
- AC-06: Auditor may separately review changes to `.path/work/{feature-slug}/` as plan/progress evidence.
- AC-07: Auditor instructions prohibit unscoped `git diff` and unscoped `git status` as audit evidence.
- AC-08: `.path/work` remains versioned; no `.gitignore` rule is added for `.path/work`.
- AC-09: The change does not introduce or depend on worktrees, plugins, dynamic permissions, or external-directory allow rules.

## Edge cases
- Multiple `.path/work/*` folders exist and several have diffs: Auditor must ask for or use only the target slug.
- The requested slug does not exist: Auditor should report that `.path/work/{slug}/` is missing and ask whether to proceed with product diff only or choose another plan.
- The current plan folder exists but one of `brief.md`, `tasks.md`, or `progress.md` is missing: Auditor should call this out as missing evidence rather than reading other plan folders.
- Product changes include files under `.path/work` only: Auditor should report that there are no product/code changes outside workflow artifacts.
- User explicitly asks Auditor to audit planning artifacts themselves: Auditor should still scope that audit to the requested `{slug}` unless the user explicitly asks for a multi-plan audit.

## Open questions
- Should Auditor mention the exact Git pathspec commands in its response, or only use them internally?
- Should README include a short section documenting the new audit-scope rule, or is the Auditor template sufficient?
