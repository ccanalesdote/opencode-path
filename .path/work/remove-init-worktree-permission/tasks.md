# Tasks: Remove Init Worktree Permission

## Status legend
- pending: not started
- in_progress: actively being implemented
- done: completed and verified for the stated task
- blocked: cannot proceed without input or prerequisite
- cancelled: intentionally no longer needed

## Task table
| ID | Status | Owner | Task | Covers | Verification | Notes |
|---|---|---|---|---|---|---|
| T-001 | done | Developer | Inspect current `src/lib/config.ts`, `src/lib/config.test.ts`, and `.path/work/init-worktree-permission/` state to confirm the obsolete implementation and historical plan folder are present. | AC-01, AC-02, AC-03, AC-05 | Use file reads/search; confirm exact locations of `ensureWorktreePermission`, `WORKTREE_EXTERNAL_DIRECTORY_PATTERN`, and `../opencode-path-*/**`. | Do not edit the historical plan folder. |
| T-002 | done | Developer | Remove the worktree-permission implementation from `src/lib/config.ts`. | AC-01, AC-02, AC-06 | Search shows no `ensureWorktreePermission`, `WORKTREE_EXTERNAL_DIRECTORY_PATTERN`, or `../opencode-path-*/**` in `src/lib/config.ts`; inspect `createOrMergeConfig` to confirm it only ensures config structure before writing. | Keep `ensureConfigStructure`, read/write config helpers, and model helpers intact. |
| T-003 | done | Developer | Remove or update obsolete worktree-permission tests from `src/lib/config.test.ts` while preserving tests for normal config creation/merge behavior. | AC-03, AC-04 | Search shows no `ensureWorktreePermission` import/describe/calls and no `../opencode-path-*/**` assertions in `src/lib/config.test.ts`; remaining config tests pass. | If fresh-config test expected `permission`, change it to assert the minimal config contract instead. |
| T-004 | done | Developer | Confirm no out-of-scope files were changed and the historical plan folder remains untouched. | AC-05, AC-06 | `git diff --name-only` shows only intended source/test files plus this new handoff folder; no diff under `.path/work/init-worktree-permission/`, `templates/`, `.gitignore`, or `src/commands/init.ts`. | If another file must change, record why in `progress.md` before proceeding. |
| T-005 | done | Developer | Run the project's documented validation commands. | AC-07 | Inspect project docs/config/CI for exact commands, then run the confirmed validation commands. | Known commands may exist in `package.json`, but confirm before running. Do not assume package manager if environment differs. |

## Coverage notes
- AC-01 is covered by T-001 and T-002.
- AC-02 is covered by T-002.
- AC-03 is covered by T-001 and T-003.
- AC-04 is covered by T-003 and T-005.
- AC-05 is covered by T-001 and T-004.
- AC-06 is covered by T-002 and T-004.
- AC-07 is covered by T-005.

## Auditor notes
| Date | Related task | Severity | Status | Finding / resolution note | Suggested follow-up |
|---|---|---|---|---|---|
| 2026-06-18 | T-003 | minor | resolved | Auditor validó que el código actual preserva `permission` existente porque `createOrMergeConfig` solo aplica `ensureConfigStructure`, pero faltaba cobertura directa: un config existente con `permission.external_directory["../opencode-path-*/**"]` no debía ser eliminado ni forzado a `"allow"` por el cleanup. | Agregado test en `describe("createOrMergeConfig")` que escribe un config existente con `permission.external_directory` (`../opencode-path-*/**` = ask + otra regla) y verifica tras `createOrMergeConfig` que ambos valores y el campo custom se preservan intactos. |
| 2026-06-18 | T-003 / AC-04 | minor | open | Auditor confirmed current code preserves existing top-level fields, including existing `permission`, because `createOrMergeConfig` only applies `ensureConfigStructure`; however tests only assert preservation with a custom field/agent and do not directly lock the edge case of preserving a pre-existing `permission.external_directory["../opencode-path-*/**"]`. | Optional: add a small `createOrMergeConfig` test asserting an existing `permission` object/rule remains unchanged, to prevent future regressions. |
| 2026-06-18 | T-001..T-005 | nit | accepted | Auditor re-ran `npm run typecheck` and `npm test`; both exit 0, with 175/175 tests passing. Scope check found no tracked diffs outside `src/lib/config.ts` and `src/lib/config.test.ts`; forbidden paths remained untouched. | No blocking follow-up. |
| 2026-06-18 | T-003 / AC-04 | minor | resolved | Auditor re-audit confirmed the previously open AC-04 test-hardening finding is now covered by `src/lib/config.test.ts:167-200`; the test preserves an existing `permission.external_directory["../opencode-path-*/**"] = "ask"` and another rule after `createOrMergeConfig`. | No further follow-up needed for this finding. |
| 2026-06-18 | T-001..T-005 | nit | accepted | Auditor re-ran `git diff --check`, `npm run typecheck`, and `npm test`; all exit 0, with 176/176 tests passing. Forbidden path diff check produced no output. | No blocking follow-up. |
