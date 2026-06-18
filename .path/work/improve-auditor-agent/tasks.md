# Tasks: Improve Auditor Agent Prompt B-lite

## Status legend
- pending: not started
- in_progress: actively being implemented
- done: completed and verified for the stated task
- blocked: cannot proceed without input or prerequisite
- cancelled: intentionally no longer needed

## Task table
| ID | Status | Owner | Task | Covers | Verification | Notes |
|---|---|---|---|---|---|---|
| T-001 | done | Developer | Snapshot the current `templates/auditor.md` frontmatter/body boundary and confirm the frontmatter will not be edited. | AC-10 | Compare the frontmatter before and after the change; it must be unchanged. | Preserve the profile insertion marker exactly. |
| T-002 | done | Developer | Compact the Auditor body with minimal edits: merge `Tools and hard rules`, `Audit protocol`, and `How to think` into `## How I work`; collapse the original protocol steps 1-3 into `Establish scope and restate claims`; preserve worktree-scope behavior. | AC-01, AC-02, AC-03, AC-04, AC-07, AC-13 | Inspect `templates/auditor.md` and confirm the old section headings are gone, `## How I work` exists, no bash command allow/deny lists appear in the body, and the body is shorter than before. | Do not rewrite the role from scratch. Keep the forensic tone and the read-only + work-folder note exception. |
| T-003 | done | Developer | Keep `Traceability Audit` and `Anti-bloat Audit` as short standalone sections and remove long duplicated checklist prose from the output format while preserving output headings and obligations. | AC-05, AC-08, AC-09 | Inspect the output format and confirm headings remain: `Scope`, `Evidence reviewed`, `Claims vs verification`, `Traceability Audit`, `Anti-bloat Audit`, `Findings`, `Verdict`, `Follow-ups`, `Not checked`; confirm verdicts and severities are unchanged. | If preserving output text literally is safer, prioritize AC-08/AC-09 over aggressive compaction. |
| T-004 | done | Developer | Convert `When NOT to use me` from three bullets into one paragraph and place subagent policy near routing. | AC-06, AC-13 | Inspect the top of the prompt and confirm routing/subagent sections are clear and non-repetitive. | Reviewer delegation rule should appear once only. |
| T-005 | done | Developer | Verify `README.md` Auditor references for contradictions with the compact prompt; update only if needed. | AC-11 | Search `README.md` for Auditor, Traceability, Anti-bloat, verdicts, permissions, and Auditor notes references; confirm no conflict remains. | Do not update README just for wording preference. |
| T-006 | done | Developer | Run required validation commands. | AC-12 | `npm run typecheck`; `npm test`; `npm run build` all pass. | If a command fails for an unrelated pre-existing reason, capture exact output and classify honestly. |
| T-007 | done | Reviewer | Perform a focused review for prompt contract drift and internal contradictions after Developer finishes. | AC-02, AC-05, AC-08, AC-09, AC-10, AC-13 | Review diff; search for repeated/conflicting instances of key rules such as read-only, bash permissions, Reviewer delegation, validation claims, no SHIP language, per-file PASS stamps, and suspected findings. | This is a review task, not implementation. |

## Auditor notes
| Date | Related task | Severity | Status | Finding / resolution note | Suggested follow-up |
|---|---|---|---|---|---|
| 2026-06-18 | T-001–T-007 | minor | open | `tasks.md` still marks every task `pending` even though `progress.md` records implementation complete, validations passed, and Reviewer PASS. This creates a traceability/status mismatch for future agents. | Update task statuses to reflect the completed work, or append a resolution note explaining why the task table intentionally remains pending. |
| 2026-06-18 | T-001–T-007 | minor | resolved | Updated task statuses from `pending` to `done` for T-001 through T-007 to match the completed implementation recorded in `progress.md`. No source code or templates were modified. | none |
| 2026-06-18 | T-001–T-007 | minor | verified resolved | Auditor re-check confirmed T-001 through T-007 are now `done`, the original Auditor note was preserved, a resolution row was appended, and `progress.md` records a documentary-only correction. | none |
