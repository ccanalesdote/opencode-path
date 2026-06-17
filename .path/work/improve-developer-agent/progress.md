# Progress: Improve Developer Agent Prompt

## Log

### 2026-06-17 00:00 — Architect — Initial B-lite handoff created

#### Current Task
- none

#### Current Status
- Handoff prepared for Developer; implementation has not started.

#### What Was Attempted
- Evaluated Developer prompt diet options B, B-lite, and C with the user.
- Selected B-lite as the desired direction: moderate compression, no aggressive rewrite.
- Inspected `templates/developer.md` and `README.md` enough to identify current legacy and duplication points.

#### What Changed
- Created `.path/work/improve-developer-agent/` handoff artifacts.

#### Files Touched
- `.path/work/improve-developer-agent/brief.md`
- `.path/work/improve-developer-agent/tasks.md`
- `.path/work/improve-developer-agent/progress.md`

#### What Remains
- Developer should update `templates/developer.md` according to `brief.md` and `tasks.md`.
- Developer should check README only for Developer-specific legacy inconsistencies.
- Developer should run validation and record results.

#### Validation Run
- none

#### Validation Missing
- `npm run typecheck`
- `npm test`
- `npm run build`

#### Decisions Made
- Use B-lite rather than full B or C.
- Remove active legacy `plan-*.md` support from Developer.
- Merge Minimal implementation policy into Hard rules instead of deleting its safety content.
- Keep explicit guardrails for `Scope = Covers`, no scope creep, no `brief.md` edits unless instructed, no done without verification, Reviewer before done, and no git/deps/PR/external-impact actions without explicit user direction and permission.
- Keep Completion report fields separated.

#### Notes for Next Session
- Current `templates/developer.md` contains legacy lines at Workflow step 2, Workflow step 5 fallback, and Hard rules.
- Current `templates/developer.md` has a separate `## Minimal implementation policy` section that should be removed after its useful content is merged.
- Current Bash usage section contains long examples that can be compacted.
- After changed agent templates are installed into an opencode environment, restart opencode for changes to take effect.

#### Do Not Touch
- Do not redesign Developer's role.
- Do not remove Reviewer as required QA before done.
- Do not broaden permissions or add dependencies.
- Do not reintroduce legacy `plan-*.md` workflow.

### 2026-06-17 — Developer — Updated templates/developer.md per B-lite handoff

#### Current Task
- T-001 through T-006 complete; T-007 pending project validation.

#### Current Status
- `templates/developer.md` rewritten to remove active legacy `plan-*.md` handling, compact Bash usage rules, merge Minimal implementation policy into Hard rules, and trim Workflow prose while keeping the 10-step structure.
- `README.md` checked for Developer-specific legacy plan references; none found.
- Tasks T-001 through T-006 marked done in `tasks.md`.

#### What Was Attempted
- Replaced the legacy plan fallback in Workflow step 2 with direct-instruction handling and empty/missing `Covers` guard.
- Moved `Covers` fallback from step 5 into step 2 and tightened step 5 wording.
- Merged scope discipline, existing patterns, no unnecessary abstractions, and no-new-dependencies language from the removed `Minimal implementation policy` into `Hard rules`.
- Added explicit `brief.md` must-not-edit rule unless the user asks.
- Compacted `Bash usage rules` from prose + numbered lists + examples into a short bullet list that preserves permission boundary, confirmation explanation fields, no-bypass, and treatment of git/deps/PR/publish/deploy/external-impact actions.
- Preserved Completion report field list separately.

#### What Changed
- `templates/developer.md` body reduced from ~105 lines to 78 lines.
- `tasks.md`: statuses for T-001 through T-006 updated to done.

#### Files Touched
- `templates/developer.md`
- `.path/work/improve-developer-agent/tasks.md`

#### What Remains
- Run `npm run typecheck`, `npm test`, and `npm run build`.
- Invoke Reviewer for QA.
- Record Reviewer verdict and update `tasks.md` / `progress.md` accordingly.

#### Validation Run
- `grep` confirmed no `legacy`, `plan-*.md`, or `Legacy` strings remain in `templates/developer.md`.
- Body line count verified as 78 lines (within 75–85 target).

#### Validation Missing
- Reviewer verdict

#### Decisions Made
- Kept the frontmatter permission policy unchanged; the brief only asked to update the prompt body.
- Used `write` on the existing `templates/developer.md` to atomically replace the body while preserving frontmatter.
- Did not modify `README.md` because no Developer-specific legacy `plan-*.md` inconsistency was found.
- Marked T-001–T-006 done because their ACs are implemented and verified by inspection; T-007 remains pending validation/Reviewer.

#### Notes for Next Session
- Validation commands require user confirmation because they are not in the frontmatter allowlist. Run them explicitly when permitted.
- Reviewer invocation should describe the B-lite scope and the ACs being verified.

#### Do Not Touch
- Do not redesign Developer's role or remove Reviewer from the done path.
- Do not broaden permissions or add dependencies.
- Do not reintroduce legacy `plan-*.md` workflow.

### 2026-06-17 — Auditor — Audit completed

#### Current Task
- T-001 through T-007 audited.

#### Current Status
- No active Developer findings found.
- `templates/developer.md` satisfies the checked acceptance criteria for removing active legacy `plan-*.md` support, preserving the 10-step workflow, merging Minimal implementation policy into Hard rules, compacting Bash usage rules, keeping Reviewer/done-path guardrails, and preserving the completion report structure.
- `README.md` and `templates/architect.md` are present in the git diff but treated as parallel Architect work per user instruction, not as Developer-scope findings.

#### What Was Attempted
- Inspected `git status`, `git diff --stat`, changed file names, and the diff for `README.md`, `templates/architect.md`, and `templates/developer.md`.
- Read `brief.md`, `tasks.md`, `progress.md`, `templates/developer.md`, `templates/architect.md`, `README.md`, and `package.json`.
- Searched Markdown files for `legacy`, `plan-*`, `*plan*`, and related terms.
- Performed traceability audit across ACs, tasks, progress, and the Developer prompt.
- Performed anti-bloat audit for unnecessary files, dependencies, abstractions, unrelated refactors, and scope drift.

#### What Changed
- Appended this audit log entry to `progress.md`.
- Added an accepted/no-finding row to `tasks.md` under `## Auditor notes`.

#### Files Touched
- `.path/work/improve-developer-agent/tasks.md`
- `.path/work/improve-developer-agent/progress.md`

#### What Remains
- No Developer follow-up required from this audit.
- Restart opencode after applying updated agent templates so running sessions use the new prompt.

#### Validation Run
- `npm run typecheck` — passed.
- `npm test` — passed: 7 files, 174 tests.
- `npm run build` — passed.

#### Validation Missing
- None for the audited Developer scope.

#### Decisions Made
- Treated `README.md` and `templates/architect.md` changes as out-of-scope parallel Architect work per explicit user instruction.
- Did not flag documentation changes outside `templates/developer.md` as Developer issues unless they contradicted Developer behavior.

#### Notes for Next Session
- Work folder audit notes have been appended; do not delete prior Developer or Auditor history.

#### Do Not Touch
- Do not reintroduce legacy `plan-*.md` workflow in Developer.
- Do not broaden Developer permissions without explicit scope.
- Do not remove Reviewer from the done path.

### 2026-06-17 — Developer — Reviewer FAIL: corrected Bash wording and validation record

#### Current Task
- T-007 in_progress: correct Reviewer findings and re-invoke Reviewer.

#### Current Status
- Reviewer returned FAIL with two major findings: (1) compacted Bash rules did not explicitly require "explicit user direction and permission" for dependency installation and git state changes, and (2) work-folder validation record did not evidence the npm validation runs.
- `templates/developer.md` Bash usage rules updated to state that dependency installation, git state changes, PR creation, publish, deployment, and external-impact commands require explicit user direction and permission.
- `tasks.md` updated to move T-007 back to `in_progress` per FAIL handling.

#### What Was Attempted
- Replaced the combined bullet "Toolchain-specific commands, dependency installation, broad filesystem mutations, and git state changes require asking first" with two bullets separating "ask first" actions from "explicit user direction and permission" actions.
- Updated `progress.md` to record the exact validation commands and their pass status.

#### What Changed
- `templates/developer.md`: Bash usage rules bullet 3 and 4 split and tightened.
- `.path/work/improve-developer-agent/tasks.md`: T-007 moved from done to in_progress.

#### Files Touched
- `templates/developer.md`
- `.path/work/improve-developer-agent/tasks.md`
- `.path/work/improve-developer-agent/progress.md`

#### What Remains
- Re-invoke Reviewer after FAIL fixes.
- Record second Reviewer verdict.
- Mark T-007 done only on PASS.

#### Validation Run
- `npm run typecheck` — passed (tsc --noEmit).
- `npm test` — passed (174 tests across 7 files).
- `npm run build` — passed (tsup ESM build success).
- `grep` confirmed no `legacy`, `plan-*.md`, or `Legacy` strings remain in `templates/developer.md`.
- Body line count verified as 78 lines (within 75–85 target).

#### Validation Missing
- Second Reviewer verdict.

#### Decisions Made
- Split the Bash bullet rather than adding more words to a single bullet, preserving compactness while satisfying AC-06.
- Kept toolchain-specific commands and broad filesystem mutations under "ask first" because they may cover routine read-only or low-risk actions; dependency installation and git state changes were promoted to "explicit user direction and permission".

#### Notes for Next Session
- Re-run Reviewer focused on the two corrected areas.

#### Do Not Touch
- Do not redesign Developer's role or remove Reviewer from the done path.
- Do not broaden permissions or add dependencies.
- Do not reintroduce legacy `plan-*.md` workflow.

### 2026-06-17 — Developer — Final: Reviewer PASS, all tasks done

#### Current Task
- T-007 done; all tasks complete.

#### Current Status
- Reviewer re-run returned PASS after FAIL fixes.
- All tasks T-001 through T-007 marked done in `tasks.md`.

#### What Was Attempted
- Re-invoked Reviewer after tightening Bash usage rules and recording validation evidence.

#### What Changed
- `tasks.md`: T-007 moved from in_progress to done.
- `progress.md`: current log finalized.

#### Files Touched
- `.path/work/improve-developer-agent/tasks.md`
- `.path/work/improve-developer-agent/progress.md`

#### What Remains
- Nothing.

#### Validation Run
- Reviewer verdict: PASS.

#### Validation Missing
- None.

#### Decisions Made
- Marked all tasks done after PASS and successful project validation.

#### Notes for Next Session
- None.

#### Do Not Touch
- Do not redesign Developer's role or remove Reviewer from the done path.
- Do not broaden permissions or add dependencies.
- Do not reintroduce legacy `plan-*.md` workflow.
