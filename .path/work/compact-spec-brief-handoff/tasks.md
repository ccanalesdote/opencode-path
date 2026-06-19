# Tasks: Compact Spec Brief Handoff

## Status legend
- pending: not started
- in_progress: actively being implemented
- done: completed and verified for the stated task
- blocked: cannot proceed without input or prerequisite
- cancelled: intentionally no longer needed

## Task table
| ID | Status | Owner | Task | Covers | Verification | Notes |
|---|---|---|---|---|---|---|
| T-001 | done | Developer | Update `templates/spec.md` final Spec Brief handoff format to the compact structure while preserving Interview Mode behavior. | AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-18 | Inspect `templates/spec.md` and confirm final Spec Brief sections match AC-01; confirm removed sections/REQ IDs are absent from final handoff format; confirm Interview Mode section remains functionally intact. | Do not change Spec frontmatter, model, permissions, or allowed subagents. |
| T-002 | done | Developer | Update `templates/architect.md` to describe how Architect consumes a Spec Brief as structured input while retaining critical design authority. | AC-09, AC-10, AC-11, AC-12 | Inspect `templates/architect.md` and confirm it states Spec Brief is input, not final `brief.md`; Architect still applies design protocol and Minimal Implementation Check; Architect may challenge/refuse weak briefs; `brief.md` remains Developer source of truth. | Do not add a heavyweight new stop checklist; keep Architect's existing flow intact. |
| T-003 | done | Developer | Update `README.md` to document the compact Spec Brief and the user-driven Spec → Architect → Developer workflow. | AC-13, AC-14, AC-15 | Inspect README Spec, Architect, and workflow sections and confirm they describe the compact Spec Brief and source-of-truth boundary. | Keep README consistent with template wording where practical; avoid documenting removed sections as current behavior. |
| T-004 | done | Developer | Verify untouched-agent scope and run project validation. | AC-16, AC-17, AC-18 | Confirm no Developer, Auditor, Reviewer, or Research template changes are included; run `npm run typecheck`, `npm test`, and `npm run build`. | If validation fails for unrelated baseline reasons, document exact failure in `progress.md`. |

## Coverage notes
- AC-01 is covered by T-001.
- AC-02 is covered by T-001.
- AC-03 is covered by T-001.
- AC-04 is covered by T-001.
- AC-05 is covered by T-001.
- AC-06 is covered by T-001.
- AC-07 is covered by T-001.
- AC-08 is covered by T-001.
- AC-09 is covered by T-002.
- AC-10 is covered by T-002.
- AC-11 is covered by T-002.
- AC-12 is covered by T-002.
- AC-13 is covered by T-003.
- AC-14 is covered by T-003.
- AC-15 is covered by T-003.
- AC-16 is covered by T-004.
- AC-17 is covered by T-004.
- AC-18 is covered by T-001 and T-004.

## Auditor notes
| Date | Related task | Severity | Status | Finding / resolution note | Suggested follow-up |
|---|---|---|---|---|---|
| 2026-06-18 | T-004 / progress traceability | minor | open | `progress.md` contains stale state in the Developer log: it says `T-004 in_progress`, validation pending user permission, and reviewer/validation still remaining, while the same entry later records validation PASS, Reviewer PASS, `Validation Missing: none`, and `tasks.md` marks T-004 done. | Append a Developer resolution note clarifying final T-004 state; avoid editing prior history, but make the latest status unambiguous for the next session. |
| 2026-06-18 | T-004 / progress traceability | minor | resolved | Developer appended a resolution entry to `progress.md` (2026-06-18 23:50) clarifying that T-004 is completed; final `npm run typecheck`, `npm test`, `npm run build`, and Reviewer verdict all PASS; and the earlier `in_progress` / "validation pending" / "AC-17 blocked on npm install" wording in the 02:15 entry was stale intermediate state superseded by that same entry's `Validation Run` / `Validation Missing: none` / `Reviewer Verdict: PASS` fields. No prior history was rewritten. | none — traceability gap closed. |
| 2026-06-18 | T-004 / progress traceability | minor | verified resolved | Auditor re-audited the correction and confirmed the 23:50 Developer entry clearly supersedes the stale 02:15 intermediate wording, keeps prior history append-only, and leaves `Validation Missing: none` for AC-17. | none. |
