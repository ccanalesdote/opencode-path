# Brief: Init Worktree Permission

## Objective
Add a minimal `init`-time configuration step that pre-approves opencode access to sibling worktrees created with the existing `../{repo-name}-{slug}/` convention.

## Problem
After introducing sibling worktrees, agents launched from the parent repository are repeatedly prompted with `Access external directory` when reading, editing, globbing, grepping, or running bash against files under `../opencode-path-{slug}/`. This affects Developer, Auditor, Architect, and subagents such as explore. The user wants the low-friction workflow restored for worktrees without broadening access to unrelated sibling directories.

## Scope
- Update the `init` flow so it writes or merges `permission.external_directory["../opencode-path-*/**"] = "allow"` into the project `opencode.json`.
- Preserve existing config fields and existing permission rules.
- If the exact `../opencode-path-*/**` rule already exists with another action, overwrite only that specific rule to `"allow"`.
- Keep the behavior limited to `init` for now.

## Non-goals
- Do not change the `agents` command in this feature.
- Do not change agent templates.
- Do not change the sibling worktree convention.
- Do not add `.path/worktrees/` or similar entries to `.gitignore`.
- Do not configure global opencode permissions under `~/.config/opencode/`.
- Do not introduce scripts, plugins, or an automated orchestrator.

## Constraints
- `opencode.json` is currently written by `writeConfig` in `src/lib/config.ts` using strict JSON via `JSON.stringify`; avoid adding JSONC comments unless the writer strategy is intentionally changed.
- `createOrMergeConfig` in `src/lib/config.ts` is called by `init` at `src/commands/init.ts:223`.
- Config handling is intentionally loose (`OpenCodeConfig = Record<string, unknown>`) to preserve unknown fields.
- The permission pattern must remain specific to this repository name: `../opencode-path-*/**`, not `../*`.
- opencode config is loaded at startup; users must restart opencode after running init for permission changes to affect the current runtime.

## Decisions
- Implement the default in the config layer used by `init`, preferably by extending the `createOrMergeConfig` path rather than adding ad hoc JSON manipulation inside `src/commands/init.ts`.
- Do not modify `agents` in this pass; that can be revisited when `init` becomes the complete setup flow.
- Preserve all existing permissions and overwrite only the exact worktree rule if it already exists with `ask` or `deny`.
- Keep output JSON valid under the existing `writeConfig` behavior.

## Relevant files and areas
- `src/lib/config.ts`: config read/write/merge helpers; likely location for the permission merge helper.
- `src/commands/init.ts`: calls `createOrMergeConfig(target.configPath)` as the final config step.
- `src/lib/config.test.ts`: add focused coverage for creating, preserving, and overwriting the worktree permission rule.
- `opencode.json`: example/project config may be useful for manual verification, but implementation should not hardcode changes only in the root file.

## Acceptance Criteria
- AC-01: Running `init` on a project without `opencode.json` creates config containing `$schema`, `agent`, and `permission.external_directory["../opencode-path-*/**"] = "allow"`.
- AC-02: Running `init` on a project with existing unrelated config fields preserves those fields.
- AC-03: Running `init` on a project with existing `permission` rules preserves all unrelated permission keys and patterns.
- AC-04: If `permission.external_directory["../opencode-path-*/**"]` already exists as `"ask"` or `"deny"`, running `init` changes only that exact rule to `"allow"`.
- AC-05: The implementation does not modify `agents` command behavior, agent templates, `.gitignore`, or the worktree path convention.
- AC-06: The resulting `opencode.json` remains valid JSON as written by the current config writer.
- AC-07: After restarting opencode, agents operating from the parent repo can access files inside `../opencode-path-{slug}/` without the `Access external directory` prompt.
- AC-08: Paths outside the pattern, such as `~/Downloads/` or `../otro-proyecto/`, are not newly allowed by this feature.

## Edge cases
- Existing `permission` is missing, non-object, or the string shorthand `"allow"`/`"ask"`/`"deny"`. Developer must choose a safe merge behavior that does not silently destroy meaningful user intent; if ambiguous, preserve top-level permissions and document the limitation.
- Existing `permission.external_directory` is a string shorthand instead of an object. Convert only if doing so preserves intent clearly; otherwise add tests for the chosen behavior.
- Existing `external_directory` object contains broad or deny rules. Preserve insertion order as much as possible and ensure the exact worktree rule is present with `"allow"`.
- The repo is cloned under a different basename. This hardcoded pattern will not match; users must adjust config manually in that clone.
- If opencode runtime glob semantics differ for `**`, manual validation may reveal that the pattern needs adjustment. Do not broaden to `../*` without a new design decision.

## Open questions
- Should the CLI print a specific message during `init` that the worktree permission was added? Optional; not required for this feature.
- How should non-object `permission` or `external_directory` shorthand be handled exactly? Developer should implement the least destructive behavior and cover it with tests.
