# Tasks: Improve Auditor Scoped Diff Behavior

## Status legend
- pending: not started
- in_progress: actively being implemented
- done: completed and verified for the stated task
- blocked: cannot proceed without input or prerequisite
- cancelled: intentionally no longer needed

## Task table
| ID | Status | Owner | Task | Covers | Verification | Notes |
|---|---|---|---|---|---|---|
| T-001 | done | Developer | Inspect the current Auditor template and any README sections that describe auditing or `.path/work` usage. | AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-09 | Identify the project's validation commands from README/package/build configuration before making changes. | Done: inspected `templates/auditor.md`, `README.md`, `package.json`. Validation commands: `npm run typecheck`, `npm test`. No README conflicts found; Auditor README sections already align with scoped behavior. |
| T-002 | done | Developer | Update `templates/auditor.md` so Auditor establishes a target `feature-slug`, falls back to asking when missing, and reads only `.path/work/{feature-slug}/` for plan context. | AC-01, AC-02, AC-03, AC-04 | Review `templates/auditor.md` and confirm the prompt explicitly describes slug selection and scoped plan reads. | Done (after reopen): Reviewer re-pass confirmed AC-02 contradiction at line 142 is resolved. Final template allows no silent single-slug auto-selection; "Audit scope" fallback at :107-108 is the single source of truth for missing-slug handling. |
| T-003 | done | Developer | Update Auditor diff/status instructions to separate product scope from plan scope: product changes exclude `.path/work/**`; plan evidence is limited to `.path/work/{feature-slug}/`. | AC-04, AC-05, AC-06, AC-07 | Confirm `templates/auditor.md` includes scoped examples for product diff/status and plan diff/status, and prohibits unscoped `git diff`/`git status` as audit evidence. | Done: added product/plan scope bullets with suggested forms (`git diff -- . ':(exclude).path/work/**'`, `git status --short -- . ':(exclude).path/work/**'`, plan-scope pathspec forms). Audit protocol first bullet rewrote to use scoped forms and explicitly says "Do not rely on unscoped git diff/git status as evidence." Output format Scope section now shows plan and product summaries. |
| T-004 | done | Developer | Update README only if it currently documents Auditor behavior in a way that conflicts with the new scoped-diff rule. | AC-01, AC-05, AC-08, AC-09 | If README changes are made, verify they describe `.path/work` as versioned workflow metadata and do not suggest ignoring it. If no README change is needed, note why in `progress.md`. | Done: no README change needed. Existing Auditor README sections (`Auditor` key features at lines 462-484, Audit Phase example at lines 276-291) already align with single-slug scope behavior and do not contradict the new rules; README just does not state the scoped-diff rule explicitly. Per task wording ("only if conflicts"), the README template is sufficient. Decision recorded in `progress.md`. |
| T-005 | done | Developer | Run the confirmed project validation commands and inspect the final diff for scope creep. | AC-08, AC-09 | Run the validation commands discovered in T-001, then inspect `git diff` to ensure no `.gitignore`, worktree cleanup, plugin, or external-directory changes were introduced. | Done: `npm run typecheck` clean; `npm test` 187/187 passing (same as baseline). `git diff --stat` shows only `templates/auditor.md` modified (+19/-4). No `.gitignore`, no worktree code, no plugin, no external-directory allow rules. |

## Coverage notes
- AC-01 is covered by T-002.
- AC-02 is covered by T-002.
- AC-03 is covered by T-002.
- AC-04 is covered by T-002 and T-003.
- AC-05 is covered by T-003 and T-004.
- AC-06 is covered by T-003.
- AC-07 is covered by T-003.
- AC-08 is covered by T-004 and T-005.
- AC-09 is covered by T-001 and T-005.

## Auditor notes
| Date | Related task | Severity | Status | Finding / resolution note | Suggested follow-up |
|---|---|---|---|---|---|
| 2026-06-18 | T-002, T-003, T-005 | none | closed | Auditor pass found no blocker/major/minor findings. Scoped product diff contains only `templates/auditor.md` (+19/-4); plan artifacts are present; `npm run typecheck` and `npm test` passed. | Optional manual opencode smoke test remains the only unverified behavior check. |
