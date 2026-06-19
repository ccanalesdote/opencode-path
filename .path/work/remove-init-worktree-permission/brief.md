# Brief: Remove Init Worktree Permission

## Objective
Remove the `init-worktree-permission` implementation from the product code while keeping the historical `.path/work/init-worktree-permission` plan untouched for the user to delete manually.

## Problem
The previous feature added an `init`-time OpenCode permission rule intended to pre-approve access from the main checkout to sibling worktrees. After testing and reviewing OpenCode's session model, this is no longer the desired design. The rule did not reliably eliminate `Access external directory` prompts, hardcodes the `opencode-path` repository basename, and pushes a worktree orchestration concern into the generic `init` config path.

The preferred workflow is now: open one OpenCode session per worktree/directory, e.g. `opencode ../opencode-path-feature-x`, rather than having a parent checkout session operate across sibling worktrees.

## Scope
- Remove the worktree external-directory permission behavior from `src/lib/config.ts`.
- Remove tests that assert `init` creates or merges `permission.external_directory["../opencode-path-*/**"] = "allow"`.
- Preserve the normal `init` config behavior: create/merge `$schema` and `agent` without deleting unrelated existing config fields.
- Leave `.path/work/init-worktree-permission/` untouched; the user will delete it manually.
- Keep this as a cleanup/revert-style change only.

## Non-goals
- Do not delete `.path/work/init-worktree-permission/`.
- Do not add a replacement permission rule using an absolute path, broader glob, plugin, or dynamic config.
- Do not change OpenCode session/worktree behavior.
- Do not change agent templates, Auditor behavior, `.gitignore`, or the sibling worktree naming convention.
- Do not introduce new dependencies, scripts, or orchestration layers.
- Do not remove unrelated permission/profile/frontmatter functionality.

## Constraints
- Current code includes `WORKTREE_EXTERNAL_DIRECTORY_PATTERN`, `ensureWorktreePermission`, and a call to that helper from `createOrMergeConfig` in `src/lib/config.ts`.
- Current tests include imports and assertions for `ensureWorktreePermission` in `src/lib/config.test.ts`.
- Existing config tests unrelated to worktree permissions should continue to pass.
- `OpenCodeConfig` is intentionally loose (`Record<string, unknown>`) and unknown config fields must still be preserved.
- This handoff was created from the feature branch base available at worktree creation time; verify the exact diff before editing because the implementation may already be committed on the branch base.

## Decisions
- Fully remove the worktree-permission feature rather than partially disabling it.
- Restore `createOrMergeConfig` to only ensuring the minimal config structure and writing the result.
- Remove `ensureWorktreePermission` instead of leaving dead exported code.
- Remove tests whose only purpose was validating the obsolete worktree permission behavior.
- Treat the old plan folder as historical artifact outside this implementation's scope.

## Relevant files and areas
- `src/lib/config.ts`: remove the worktree permission constant, helper, comments, and call from `createOrMergeConfig`.
- `src/lib/config.test.ts`: remove `ensureWorktreePermission` import and the worktree-permission test block/cases; keep existing config structure and agent model tests.
- `.path/work/init-worktree-permission/`: do not edit or delete.
- `templates/`, `.gitignore`, `src/commands/init.ts`: should not require changes for this cleanup.

## Acceptance Criteria
- AC-01: `src/lib/config.ts` no longer defines `WORKTREE_EXTERNAL_DIRECTORY_PATTERN` or `ensureWorktreePermission`.
- AC-02: `createOrMergeConfig` no longer adds or overwrites `permission.external_directory["../opencode-path-*/**"]`.
- AC-03: `src/lib/config.test.ts` no longer imports, describes, or asserts `ensureWorktreePermission` behavior or the `../opencode-path-*/**` rule.
- AC-04: Existing non-worktree config behavior is preserved: creating/merging config still ensures `$schema` and `agent`, and preserves unrelated fields.
- AC-05: `.path/work/init-worktree-permission/` is not modified or deleted by this implementation.
- AC-06: No replacement external-directory permission mechanism is introduced.
- AC-07: Project validation commands documented by the project pass after the cleanup.

## Edge cases
- Existing user configs that already contain `permission.external_directory["../opencode-path-*/**"]` should not be actively removed from disk by `init`; this cleanup only stops adding/updating the rule going forward.
- If tests currently expect the fresh config to contain `permission`, update those tests to match the restored minimal config contract instead of deleting broader config coverage.
- If `ensureWorktreePermission` is referenced anywhere besides `src/lib/config.test.ts`, remove or update those references; do not leave an exported dead helper.
- Do not accidentally remove unrelated permission handling in frontmatter/profile tests; those are different concepts.

## Open questions
- None blocking. If validation reveals the worktree permission code is already absent on the implementation branch, Developer should record that no source change was required and only update task/progress evidence.
