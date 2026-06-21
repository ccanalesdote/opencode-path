# Tasks: Contractual Handoff with Risk-Based Checkpoints

## Status legend
- pending: not started
- in_progress: actively being implemented
- done: completed and verified for the stated task
- blocked: cannot proceed without input or prerequisite
- cancelled: intentionally no longer needed

## Task table
| ID | Status | Owner | Files / areas | Technical objective | Covers | Dependencies | Verification | Notes |
|---|---|---|---|---|---|---|---|---|
| T-001 | done | Developer | `templates/architect.md` | Update Architect's persistent handoff rules and `brief.md` mini-schema to require `## Implementation Contract`, optional constrained `## Assumptions and residual risks`, contradiction invalidation, exact path/area specificity, no material `NEEDS CLARIFICATION`, and implementation-ready exit gate. | AC-01, AC-02, AC-03, AC-04, AC-08 | none | Inspect `templates/architect.md` and confirm all listed sections/rules are present and no `self-review.md` artifact is introduced. | Preserve handoff modes and Architect write limitations. |
| T-002 | done | Developer | `templates/architect.md` | Update Architect's `tasks.md` mini-schema and mapping guidance to require atomic task fields and a checkpoints section/table with risk-based granularity guidance. | AC-05, AC-06, AC-07 | T-001 | Inspect `templates/architect.md` and confirm task schema includes files/areas, objective, ACs, dependencies, verification, and checkpoint fields. | Checkpoints are mandatory, not per-task by default. |
| T-003 | done | Developer | `templates/developer.md` | Update Developer workflow so Developer executes contract-bound tasks/checkpoints, performs only local reconnaissance in assigned files/areas, escalates contradictions/gaps/impossibility, and records escalation entries in `progress.md` with required fields/status. | AC-09, AC-10, AC-11, AC-12 | T-001, T-002 | Inspect `templates/developer.md` and confirm broad design discovery/redesign is prohibited and escalation format includes Task/checkpoint, Problem, Evidence, Impact, Proposed options, and Status `blocked awaiting Architect decision`. | Must state decisions from escalation are persisted by Architect in `brief.md`/`tasks.md`, not only `progress.md`. |
| T-004 | done | Developer | `templates/developer.md`, `templates/reviewer.md` | Change review orchestration from mandatory review after every selected task to mandatory Reviewer at each checkpoint closure and final feature review when checkpoints exist. | AC-13, AC-14 | T-002, T-003 | Inspect both templates and confirm Reviewer is checkpoint/final oriented and not required after every isolated mechanical task. | Direct-chat/simple tasks without checkpoints may still use final Reviewer as quality gate. |
| T-005 | done | Developer | `templates/auditor.md` | Clarify Auditor as final closure gate distinct from Reviewer, focused on traceability from spec/brief/Implementation Contract/tasks/checkpoints/ACs/changes/evidence plus scope and accumulated quality. | AC-15 | T-001, T-002, T-004 | Inspect `templates/auditor.md` and confirm final-gate language exists without adding Auditor pre-plan responsibilities. | Preserve existing scoped audit behavior and narrow write permissions. |
| T-006 | done | Developer | `templates/*.md`, relevant tests/snapshots if discovered | Perform consistency pass across agent templates: no new agents, no extra persistent artifacts, no automated enforcement, no mandatory worktrees, no Auditor pre-plan gate; update tests/snapshots only if existing coverage requires it. | AC-16 | T-001, T-002, T-003, T-004, T-005 | Inspect changed templates and run/document relevant repository validation. | Keep changes localized; do not rewrite unrelated prompt sections. |
| T-007 | done | Developer | Repository validation (`package.json`, CI commands) | Run or request documented validation commands and report evidence: `npm test`, `npm run typecheck`, `npm run build`, `npm run smoke`. | AC-17 | T-006 | Commands complete successfully, or failures are reported with command output and impact. | Run commands one at a time. |

## Checkpoints
| ID | Included tasks | Intended ACs closed | Reviewer focus | Expected evidence | Reviewer required |
|---|---|---|---|---|---|
| CP-01 | T-001, T-002 | AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08 | Architect handoff schema is contractual, contradiction-safe, task/checkpoint-ready, and does not add new artifacts. | Diff of `templates/architect.md`; Developer progress entry summarizing schema changes and self-verification. | yes |
| CP-02 | T-003, T-004 | AC-09, AC-10, AC-11, AC-12, AC-13, AC-14 | Developer authority/escalation boundaries and Reviewer checkpoint/final review behavior are consistent and non-contradictory. | Diff of `templates/developer.md` and `templates/reviewer.md`; progress entry with escalation/review workflow evidence. | yes |
| CP-03 | T-005, T-006, T-007 | AC-15, AC-16, AC-17 | Auditor final-gate scope, no prohibited additions, cross-template consistency, and validation evidence. | Diff of `templates/auditor.md` plus consistency check notes and validation command results. | yes; this is also the final feature review checkpoint |

## Coverage notes
- AC-01 is covered by T-001 and CP-01.
- AC-02 is covered by T-001 and CP-01.
- AC-03 is covered by T-001 and CP-01.
- AC-04 is covered by T-001 and CP-01.
- AC-05 is covered by T-002 and CP-01.
- AC-06 is covered by T-002 and CP-01.
- AC-07 is covered by T-002 and CP-01.
- AC-08 is covered by T-001 and CP-01.
- AC-09 is covered by T-003 and CP-02.
- AC-10 is covered by T-003 and CP-02.
- AC-11 is covered by T-003 and CP-02.
- AC-12 is covered by T-003 and CP-02.
- AC-13 is covered by T-004 and CP-02.
- AC-14 is covered by T-004 and CP-02.
- AC-15 is covered by T-005 and CP-03.
- AC-16 is covered by T-006 and CP-03.
- AC-17 is covered by T-007 and CP-03.

## Auditor notes
| Date | Related task | Severity | Status | Finding / resolution note | Suggested follow-up |
|---|---|---|---|---|---|
| 2026-06-21 | CP-01, CP-02, CP-03 / T-007 | major | resolved | Reviewer verdict traceability was incomplete. Added structured Reviewer verdict entries in `progress.md` for CP-01 (PASS, 5 rounds), CP-02 (PASS WITH NITS, 3 rounds), and CP-03/final (PASS, 3 rounds). Each entry includes: checkpoint ID, review type, round history with findings and resolutions, final verdict, and evidence. The chain Developer → Reviewer → Auditor is now traceable. | Rerun Auditor to verify closure. |
| 2026-06-21 | CP-01, CP-02, CP-03 / T-007 | major | verified resolved | Auditor re-check confirmed `progress.md` now contains structured Reviewer evidence for CP-01, CP-02, and CP-03/final with final verdicts, round histories, resolutions, and evidence. Original traceability blocker is resolved. | No further action for this finding. |
