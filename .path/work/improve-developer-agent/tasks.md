# Tasks: Improve Developer Agent Prompt

## Status legend
- pending: not started
- in_progress: actively being implemented
- done: completed and verified for the stated task
- blocked: cannot proceed without input or prerequisite
- cancelled: intentionally no longer needed

## Task table
| ID | Status | Owner | Task | Covers | Verification | Notes |
|---|---|---|---|---|---|---|
| T-001 | done | Developer | Remove active legacy `plan-*.md` behavior from `templates/developer.md`. | AC-01 | Search `templates/developer.md` for `legacy`, `plan-*.md`, and `Legacy`; no active support/fallback remains. | If a compatibility note remains, it must redirect to direct instructions or work-folder mode, not implement a legacy flow. |
| T-002 | done | Developer | Compact the Workflow while preserving the 10 steps and work-folder task selection logic. | AC-02, AC-07, AC-08 | Read the updated Workflow and confirm steps 1–10 remain, including work-folder file reads, task selection rules, self-verification, Reviewer, FAIL handling, and done criteria. | Do not turn this into a new workflow. This is a conservative edit. |
| T-003 | done | Developer | Merge `Minimal implementation policy` into `Hard rules` and remove the separate section. | AC-03, AC-04, AC-05 | Search confirms no `## Minimal implementation policy` section remains; Hard rules include scope/Covers, no scope creep, existing patterns, no unnecessary abstractions/deps, and `brief.md` ownership. | Keep Hard rules around 6–8 bullets; do not compress to the point of ambiguity. |
| T-004 | done | Developer | Compact `Bash usage rules` without weakening operational safety. | AC-06 | Read Bash section and confirm it covers permission boundary, confirmation explanation fields, no bypassing prompts, and explicit treatment of git/deps/PR/publish/deploy/external-impact actions. | Do not rely solely on frontmatter for behavioral intent. |
| T-005 | done | Developer | Preserve Completion report structure and core Developer role boundaries after edits. | AC-09, AC-10 | Read final prompt body and confirm completion report fields remain separate and prompt body is shorter/less duplicative without an aggressive rewrite. | Approximate target: 75–85 body lines, but no exact line count requirement. |
| T-006 | done | Developer | Check README only for Developer-specific legacy inconsistency and update if necessary. | AC-01 | Search `README.md` for Developer-specific `plan-*.md` or legacy Developer flow; update only if it conflicts with the new prompt. | Avoid broad documentation rewrites. Architect legacy docs may be handled by separate Architect handoff. |
| T-007 | done | Developer | Run project validation. | AC-11 | Run `npm run typecheck`, `npm test`, and `npm run build`. | All three validation commands passed; Reviewer re-run returned PASS. |

## Coverage notes
- AC-01 is covered by T-001 and T-006.
- AC-02 is covered by T-002.
- AC-03 is covered by T-003.
- AC-04 is covered by T-003.
- AC-05 is covered by T-003.
- AC-06 is covered by T-004.
- AC-07 is covered by T-002.
- AC-08 is covered by T-002.
- AC-09 is covered by T-005.
- AC-10 is covered by T-005.
- AC-11 is covered by T-007.

## Auditor notes
| Date | Related task | Severity | Status | Finding / resolution note | Suggested follow-up |
|---|---|---|---|---|---|
| 2026-06-17 | T-001–T-007 | none | accepted | Auditor found no active findings in the Developer prompt change. Scope audited in depth: `templates/developer.md` plus work-folder traceability. Repository-level diff also contains `README.md` and `templates/architect.md`, treated as parallel Architect work per user instruction rather than Developer findings. | No Developer follow-up required. Restart opencode after applying updated agent templates. |
