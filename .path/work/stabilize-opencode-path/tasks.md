# Tasks: Stabilize OpenCode Path

## Status legend
- pending: not started
- in_progress: actively being implemented
- done: completed and verified for the stated task
- blocked: cannot proceed without input or prerequisite
- cancelled: intentionally no longer needed

## Task table
| ID | Status | Owner | Task | Covers | Verification | Notes |
|---|---|---|---|---|---|---|
| T-001 | done | Developer | Remove obsolete `write:` permission keys from all six agent templates; preserve existing `edit:` intent. | AC-01, AC-02, AC-03 | Search templates for `tools:` and permission `write:`; run relevant tests. | No global permission refactor. |
| T-002 | done | Developer | Enforce Reviewer exclusivity with prompt changes and `permission.task` where supported. | AC-03, AC-06, AC-07 | Search templates for `reviewer`; inspect frontmatter; run tests. | Only Developer should positively invoke Reviewer. |
| T-003 | done | Developer | Add Developer forward/retroactive escalation criteria and mini-handoff format. | AC-04, AC-05 | Inspect `templates/developer.md`; verify all trigger and handoff fields. | Developer pauses on unresolved design decisions. |
| T-004 | done | Developer | Confirm Auditor/Reviewer separation and no automatic Auditor triggers. | AC-07 | Search prompts/source for Auditor auto-invocation. | Auditor is user-invoked. |
| T-005 | done | Developer | Add GitHub Actions CI for push and pull request. | AC-08 | Workflow runs required commands successfully. | Include smoke test job/step. |
| T-006 | done | Developer | Add package smoke test for packaged CLI `--help`. | AC-09 | Pack/stage package, run `opencode-path --help`, assert exit 0 and expected output. | Test package shape, not only source. |
| T-007 | done | Developer | Align README/help/CLI and add approved Overview diagram. | AC-10, AC-13 | Compare README docs with CLI help and implementation; run validation. | Avoid broad rewrite. |
| T-008 | done | Developer | Improve CLI errors that lack concrete next action. | AC-11 | Run/update command tests. | Preserve existing UX tone. |
| T-009 | done | Developer | Verify and, if needed, adjust `init` scope safety/confirmation. | AC-12 | Inspect `src/commands/init.ts`; run init tests. | No init redesign. |
| T-010 | done | Developer | Run final validation and record evidence. | AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-09, AC-10, AC-11, AC-12, AC-13 | `npm test`, `npm run typecheck`, `npm run build`, smoke test, CI. | Invoke Reviewer before done. |
| T-011 | done | Developer | Add regression tests for template invariants and CLI error messages (Auditor follow-up). | AC-01, AC-02, AC-06, AC-07, AC-11 | `npm test` must pass all new tests; grep for invariants. | Lightweight, no new deps. |

## Coverage notes
- AC-01: T-001
- AC-02: T-001
- AC-03: T-001, T-002
- AC-04: T-003
- AC-05: T-003
- AC-06: T-002
- AC-07: T-002, T-004
- AC-08: T-005, T-010
- AC-09: T-006, T-010
- AC-10: T-007
- AC-11: T-008
- AC-12: T-009
- AC-13: T-007

## Auditor notes
| Date | Related task | Severity | Status | Finding / resolution note | Suggested follow-up |
|---|---|---|---|---|---|
| 2026-06-20 | T-005, T-010 / AC-08 | minor | open | Quality audit verified `.github/workflows/ci.yml` statically and local commands pass, but no observable GitHub Actions run output is present yet; CI execution on push/PR remains unproven. | After pushing/opening PR, attach or record CI run result. |
| 2026-06-20 | T-001, T-002, T-007, T-008 | minor | resolved | Tests added: 7 template invariant tests + 2 CLI error message tests. 265 tests pass. | N/A — resolved by T-011. |
| 2026-06-20 | T-011 | nit | resolved | Follow-up audit confirmed the product regression tests pass and cover the prior gap, but `progress.md` said "8 new focused regression tests" / "6 template invariant tests" while observable test delta is 9 total tests: 7 template tests + 2 UI tests. | Corrected in progress.md: "9 new focused regression tests" and "7 template invariant tests". |
| 2026-06-20 | T-011 / AC-08 | minor | partially resolved | Targeted re-audit verified the T-011 count wording is corrected and CI hosted execution is still accurately marked pending; no hosted CI run evidence was present in the inspected files. | Once push/PR CI runs, record URL/status/jobs to close AC-08 validation evidence. |
