# Tasks: Flexible Handoff Modes

## Status legend
- pending: not started
- in_progress: actively being implemented
- done: completed and verified for the stated task
- blocked: cannot proceed without input or prerequisite
- cancelled: intentionally no longer needed

## Task table
| ID | Status | Owner | Task | Covers | Verification | Notes |
|---|---|---|---|---|---|---|
| T-001 | done | Developer | Update Architect template from mandatory worktree handoffs to user-chosen flexible handoff modes. | AC-01, AC-02, AC-03, AC-04, AC-05, AC-06 | Inspect `templates/architect.md` diff: no mandatory "every persistent handoff gets a worktree" rule remains; three modes are documented; current-checkout and worktree creation flows both have confirmation/collision handling. | Keep prompt compact and in English. Preserve artifact-only write permissions. |
| T-002 | done | Developer | Generalize Developer workflow and close procedure for direct-chat, current-checkout work-folder, and sibling-worktree modes. | AC-07, AC-08, AC-09, AC-10 | Inspect `templates/developer.md` diff: workflow accepts all modes; worktree verification is conditional; close/finish does not recommend worktree cleanup outside worktree mode; `git push*` remains denied. | Do not loosen dangerous Git permissions. |
| T-003 | done | Developer | Update Auditor scope rules to support product-only/direct-chat audits while preserving strict single-slug behavior for work-folder audits. | AC-11, AC-12, AC-13, AC-14 | Inspect `templates/auditor.md` diff: slug is required only for work-folder artifact audits; product-only audits can proceed without slug; `.path/work/**` exclusion remains for product scope when a work-folder audit is active. | Auditor remains read-only except narrow note appends for the selected work folder. |
| T-004 | done | Developer | Perform final self-review for consistency across Architect, Developer, and Auditor. | AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-09, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15 | Inspect full diff for contradictions; confirm changed files are limited to `templates/architect.md`, `templates/developer.md`, `templates/auditor.md`, and `.path/work/flexible-handoff-modes/` progress/task updates. | Specifically check there is no lingering assumption that all persistent handoffs or all audits require worktrees. |
| T-005 | done | Developer | Run or document project validation appropriate for template/config changes. | AC-15 | Inspect README/package/build/CI config to identify documented validation commands; run them if available and permitted, or document why validation is not applicable/was not run. | Remind user that OpenCode must be restarted for template changes to take effect. |

## Coverage notes
- AC-01 is covered by T-001 and T-004.
- AC-02 is covered by T-001 and T-004.
- AC-03 is covered by T-001.
- AC-04 is covered by T-001.
- AC-05 is covered by T-001.
- AC-06 is covered by T-001 and T-004.
- AC-07 is covered by T-002.
- AC-08 is covered by T-002.
- AC-09 is covered by T-002.
- AC-10 is covered by T-002 and T-004.
- AC-11 is covered by T-003.
- AC-12 is covered by T-003.
- AC-13 is covered by T-003.
- AC-14 is covered by T-003.
- AC-15 is covered by T-004 and T-005.

## Auditor notes
| Date | Related task | Severity | Status | Finding / resolution note | Suggested follow-up |
|---|---|---|---|---|---|
| 2026-06-18 | T-005 | minor | resolved | Independent audit found no content/scope/frontmatter defects in the three-template implementation, but `npm test` could not run because `vitest` is unavailable (`node_modules/` absent). | Either install dependencies and run `npm test`/`npm run typecheck`, or explicitly accept validation deferral before treating T-005 as done. |
| 2026-06-18 | T-005 | minor | resolved | After explicit user authorization, ran `npm install` (120 packages, 0 vulnerabilities), then `npm test` (187/187 tests passing across 7 files including `templates.test.ts`) and `npm run typecheck` (`tsc --noEmit`, clean). Validation gap that produced the original `NEEDS VALIDATION` verdict is now closed. | none |
| 2026-06-18 | T-005 | none | resolved | Re-audit reproduced the validation: `npm test` passed 187/187 tests across 7 files and `npm run typecheck` completed cleanly. Scoped status still shows only the 3 intended templates outside `.path/work/**`; no new findings. | none |
