# Tasks: Spec Agent Improvements

## Status legend
- pending: not started
- in_progress: actively being implemented
- done: completed and verified for the stated task
- blocked: cannot proceed without input or prerequisite
- cancelled: intentionally no longer needed

## Task table
| ID | Status | Owner | Task | Covers | Verification | Notes |
|---|---|---|---|---|---|---|
| T-001 | done | Developer | Inspect current `templates/spec.md` and the read-only reference `../opencode-path-improve-spec-agent/templates/spec.md`; identify exact insertion points for the new guardrails without changing files. | AC-01, AC-02, AC-03, AC-04 | Document selected insertion points in `progress.md`; no source diff yet except progress update. | Keep reference worktree read-only. Do not merge or copy wholesale. |
| T-002 | done | Developer | Update `templates/spec.md` with minimal wording so Spec suggests readiness for Architect and asks for user confirmation instead of auto-emitting the final Spec Brief. | AC-01, AC-02, AC-03 | `git diff -- templates/spec.md` shows only small textual changes related to the guardrails. | Preserve compact handoff format. |
| T-003 | done | Developer | Verify the compact final Spec Brief format remains intact and excluded standalone sections were not reintroduced. | AC-04 | Search/read `templates/spec.md` and confirm no final Spec Brief sections for `Requirements`, `REQ-*`, `Current behavior`, `Suggested Validation`, `Notes for technical design`, `Out of scope`, or `Non-functional requirements` were added back. | References to these names may remain only in the existing prohibition sentence. |
| T-004 | done | Developer | Final self-check and handoff update. | AC-05 | `git status --short` shows only `templates/spec.md` and `.path/work/spec-agent-improvements/` files changed. Append validation summary to `progress.md`. | Do not commit unless the user explicitly asks. |

## Coverage notes
- AC-01 is covered by T-002.
- AC-02 is covered by T-002.
- AC-03 is covered by T-002.
- AC-04 is covered by T-002 and T-003.
- AC-05 is covered by T-004.

## Auditor notes
| Date | Related task | Severity | Status | Finding / resolution note | Suggested follow-up |
|---|---|---|---|---|---|
| 2026-06-19 | T-001..T-004 (all ACs) | — | PASS | Auditor approved the implementation: scope limited to `templates/spec.md` + work folder; AC-01/02/03/04/05 satisfied; compact Spec Brief format intact; suggest-and-confirm pattern does not permit auto-emit or Architect invocation; no reintroduction of prohibited standalone sections. | None. Ready to close. |
| 2026-06-19 | T-001..T-004 | none | acceptable | Auditor independently checked the worktree diff, `brief.md` ACs, `tasks.md` coverage, `progress.md` evidence, and `templates/spec.md`. No blocker/major/minor findings found for the stated scope. | Optional: if desired, run a manual prompt-level smoke test after restarting/reloading the updated agent template; no source fix required. |
