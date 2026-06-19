# Tasks: Init Worktree Permission

## Status legend
- pending: not started
- in_progress: actively being implemented
- done: completed and verified for the stated task
- blocked: cannot proceed without input or prerequisite
- cancelled: intentionally no longer needed

## Task table
| ID | Status | Owner | Task | Covers | Verification | Notes |
|---|---|---|---|---|---|---|
| T-001 | done | Developer | Inspect `src/lib/config.ts`, `src/commands/init.ts`, and current tests to confirm the exact init config path and existing merge behavior. | AC-01, AC-02, AC-03 | Read the named files and identify the helper called by `init`. | `createOrMergeConfig` is currently called by `init`; preserved this central path. |
| T-002 | done | Developer | Add a config-layer merge helper used by `init` that ensures `permission.external_directory["../opencode-path-*/**"] = "allow"`. | AC-01, AC-02, AC-03, AC-04, AC-06 | Project validation commands from `package.json`: `npm test` and `npm run typecheck`. | Verified: `npm run typecheck` (exit 0, no errors); `npm test` (187/187 passed, including 42 in `config.test.ts`). Reviewer Round 3 PASS with real evidence. |
| T-003 | done | Developer | Add or update tests in `src/lib/config.test.ts` covering new config creation, preserving existing fields, preserving unrelated permission rules, and overwriting only the exact worktree rule. | AC-01, AC-02, AC-03, AC-04, AC-06 | `npm test` | Verified: 13 new tests added (1 in `createOrMergeConfig` + 12 in `ensureWorktreePermission`); all 42 `config.test.ts` tests pass. Reviewer Round 3 PASS. |
| T-004 | done | Developer | Confirm no out-of-scope files or flows changed. | AC-05 | `git diff --name-only` shows only intended source/test files for this feature. | Verified via `git diff --name-only` (only `src/lib/config.ts`, `src/lib/config.test.ts`) and `git diff --name-only -- src/commands/init.ts src/lib/agents.ts templates/ .gitignore` (empty). Only untracked item is the work folder `.path/work/init-worktree-permission/` (not a source change). |
| T-005 | pending | Developer | Perform manual runtime validation after build/install as appropriate: run init, restart opencode, and check worktree access behavior. | AC-07, AC-08 | From parent repo after restart, read a file under `../opencode-path-{slug}/` without prompt; verify unrelated external paths still prompt. | Manual because the prompt behavior belongs to opencode runtime, not this repo's unit tests. |

## Coverage notes
- AC-01 is covered by T-002 and T-003.
- AC-02 is covered by T-002 and T-003.
- AC-03 is covered by T-002 and T-003.
- AC-04 is covered by T-002 and T-003.
- AC-05 is covered by T-004.
- AC-06 is covered by T-002 and T-003.
- AC-07 is covered by T-005.
- AC-08 is covered by T-005.

## Auditor notes
| Date | Related task | Severity | Status | Finding / resolution note | Suggested follow-up |
|---|---|---|---|---|---|
