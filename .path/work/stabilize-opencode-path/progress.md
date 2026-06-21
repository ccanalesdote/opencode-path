# Progress: Stabilize OpenCode Path

## Log

### 2026-06-19 00:00 — Architect — Initial handoff

#### Current Task
- none

#### Current Status
- Persistent handoff created for comparative implementation worktree.

#### What Was Attempted
- Clarified scope with user and narrowed the plan to concrete robustness issues only.

#### What Changed
- Created initial handoff artifacts.

#### Files Touched
- `.path/work/stabilize-opencode-path/brief.md`
- `.path/work/stabilize-opencode-path/tasks.md`
- `.path/work/stabilize-opencode-path/progress.md`

#### What Remains
- Developer should implement T-001 through T-010.

#### Validation Run
- none

#### Validation Missing
- `npm test`
- `npm run typecheck`
- `npm run build`
- package smoke test
- CI run

#### Decisions Made
- Include `research`.
- Remove obsolete `write:` permissions only; do not refactor global permission delivery.
- Do not add README-dependency prompt tests.
- Add one README Overview workflow diagram.

#### Notes for Next Session
- This is one of four parallel comparison worktrees. Keep implementation local to this branch and record evidence.

#### Do Not Touch
- Do not add agents/orchestration.
- Do not change user/global OpenCode permissions automatically.
- Do not redesign work folders or init architecture.

---

### 2026-06-20 — Developer — T-001: Remove write: from all 6 templates

#### Current Task
- T-001 (done)

#### Current Status
- All 6 custom agent templates have `write:` removed; `edit:` preserved.

#### What Was Attempted
- Removed `write: deny` single-line from spec.md, research.md, reviewer.md.
- Removed `write: allow` single-line from developer.md.
- Removed full `write:` blocks from architect.md and auditor.md.

#### What Changed
- `templates/spec.md`: removed `write: deny`
- `templates/research.md`: removed `write: deny`
- `templates/reviewer.md`: removed `write: deny`
- `templates/developer.md`: removed `write: allow`
- `templates/architect.md`: removed 7-line `write:` block
- `templates/auditor.md`: removed 4-line `write:` block

#### Files Touched
- `templates/spec.md`
- `templates/research.md`
- `templates/reviewer.md`
- `templates/developer.md`
- `templates/architect.md`
- `templates/auditor.md`
- `.path/work/stabilize-opencode-path/tasks.md`

#### What Remains
- T-002 through T-010 pending.

#### Validation Run
- `grep -n "write:" templates/*.md` → no output (clean)
- `grep -n "tools:" templates/*.md` → no output (clean)
- `grep -n "edit:" templates/*.md` → 6 results, all expected

#### Validation Missing
- `npm test` (not run — template-only change, no test covers write: key presence)
- `npm run typecheck`
- `npm run build`

#### Decisions Made
- Template-only change; source code not touched.
- Test fixtures in frontmatter.test.ts use `write: deny` — these are independent fixtures and do not need updating.

#### Reviewer Verdict
- PASS WITH NITS: nits are minor (work artifacts not committed, no automated test run). No blockers.

#### Notes for Next Session
- Proceed with T-002: Reviewer exclusivity enforcement.

#### Do Not Touch
- Do not touch test fixture constants in frontmatter.test.ts (they are independent of templates).

---

### 2026-06-20 — Developer — T-002: Enforce Reviewer exclusivity

#### Current Task
- T-002 (done)

#### Current Status
- Only developer.md contains positive instructions to invoke Reviewer. All other templates either have Reviewer in "must NOT invoke" or neutral role descriptions.

#### What Was Attempted
- architect.md: removed reviewer from "may invoke", added to "must NOT invoke"
- auditor.md: removed reviewer from "may invoke", added to "must NOT invoke"; removed "NEEDS REVIEWER" verdict; removed "hand to Reviewer" from Follow-ups; removed "invoke Reviewer" from "When NOT to use me"
- reviewer.md: removed "When to invoke me" invocation guidance; changed description to neutral role description; frontmatter description updated to remove "Use after implementation work"
- spec.md: changed "Hand it to Reviewer" to "Reviewer handles code reviews."
- research.md: same change

#### What Changed
- `templates/architect.md`: reviewer moved to "must NOT invoke"
- `templates/auditor.md`: reviewer moved to "must NOT invoke"; output format verdicts and follow-ups updated to remove Reviewer references
- `templates/reviewer.md`: frontmatter description and body "When to invoke me" narrowed to role description only
- `templates/spec.md`: neutral language in "When NOT to use me"
- `templates/research.md`: neutral language in "When NOT to use me"

#### Files Touched
- `templates/architect.md`
- `templates/auditor.md`
- `templates/reviewer.md`
- `templates/spec.md`
- `templates/research.md`
- `.path/work/stabilize-opencode-path/tasks.md`

#### What Remains
- T-003 through T-010 pending.

#### Validation Run
- Static grep for "reviewer" in all templates to verify exclusivity
- Multiple Reviewer iterations to confirm AC-06 satisfied

#### Validation Missing
- `npm test` — deferred to T-010
- `npm run typecheck` — deferred to T-010
- `npm run build` — deferred to T-010

#### Reviewer Verdict
- PASS WITH NITS (5th iteration). AC-06 verified: only developer.md positively instructs Reviewer invocation. reviewer.md task: deny preserved. No auto-Auditor triggers introduced.

#### Notes for Next Session
- Proceed with T-003: Developer escalation criteria.

---

### 2026-06-20 — Developer — T-003: Add Developer escalation criteria

#### Current Task
- T-003 (done)

#### What Changed
- `templates/developer.md`: added "## Escalation to Architect" section after Workflow step 10, before "## Bash usage rules"
  - Forward escalation: 6 trigger conditions (module boundaries, public contracts, schema/migrations, new dependencies, cross-cutting changes, compatibility risk/unresolved brief decisions)
  - Retroactive escalation: pause mid-task, produce mini-handoff with 4 fields: What was done, Why missing, What Architect must decide, Developer proposal (optional)

#### Validation Run
- Static grep confirmed all AC-04 trigger conditions and all AC-05 mini-handoff fields present

#### Reviewer Verdict
- PASS WITH NITS (AC-04, AC-05 verified)

---

### 2026-06-20 — Developer — T-004: Confirm Auditor/Reviewer separation

#### Current Task
- T-004 (done)

#### What Changed
- Verification only — no code changes

#### Validation Run
- grep for "auditor" in src/**/*.ts: only registration and profile variant (no trigger paths)
- Template inspection: developer.md:95 says "architect and auditor are user-orchestrated"
- No automatic Auditor trigger found anywhere

#### Reviewer Verdict
- PASS (AC-07 verified)

---

### 2026-06-20 — Developer — T-005: Add GitHub Actions CI

#### Current Task
- T-005 (done)

#### What Changed
- `.github/workflows/ci.yml` (new): 4 jobs: test, typecheck, build, smoke — triggers on push and pull_request to all branches

#### Reviewer Verdict
- PASS WITH NITS (AC-08 verified)

---

### 2026-06-20 — Developer — T-006: Add package smoke test

#### Current Task
- T-006 (done)

#### What Changed
- `scripts/smoke-test.sh` (new): packs tarball, installs to temp prefix, tests binary at node_modules/.bin, asserts --help output, cleans up
- `package.json`: added "smoke": "npm run build && bash scripts/smoke-test.sh"
- `.github/workflows/ci.yml`: smoke job updated to use `npm run smoke`

#### Reviewer Verdict
- PASS (after fixing binary path to node_modules/.bin; AC-09 verified)

---

### 2026-06-20 — Developer — T-007: README diagram and alignment

#### Current Task
- T-007 (done)

#### What Changed
- `README.md`: added Mermaid flowchart diagram to Overview section; added legend; no other README sections rewritten

#### Reviewer Verdict
- PASS WITH NITS (AC-10, AC-13 verified)

---

### 2026-06-20 — Developer — T-008: CLI error messages

#### Current Task
- T-008 (done)

#### What Changed
- `src/lib/messages.ts`: USAGE_SCOPE_EXCLUSIVE now ends with "Pass only one at a time."
- `src/lib/ui.ts:93`: "No manageable installation found." now ends with "Run 'opencode-path init --project' or 'opencode-path init --global' to create one."

#### Reviewer Verdict
- PASS WITH NITS (AC-11 verified)

---

### 2026-06-20 — Developer — T-009: Verify init scope safety

#### Current Task
- T-009 (done)

#### What Changed
- Verification only — no code changes; AC-12 already satisfied

#### Reviewer Verdict
- PASS (AC-12 verified by code inspection)

---

### 2026-06-20 — Developer — T-010: Final validation

#### Current Task
- T-010 (in_progress → completing)

#### Validation Run
- `npm run typecheck` → exit 0, no TypeScript errors
- `npm test` → 256 tests passed, 0 failures, 13 test files
- `npm run build` → dist/cli.js 74.11 KB, exit 0
- `bash scripts/smoke-test.sh` → all 6 assertions pass (opencode-path, init, agents, models, profiles, uninstall), exit 0
- CI run: deferred to first push (workflow file is present and correct)

#### README fix (T-010 finding)
- `README.md` permissions row for Developer: changed "edit/write" to "`edit: allow`"

#### package-lock.json note
- package-lock.json version was 0.3.0 while package.json was 0.3.1 (pre-existing discrepancy); `npm install` sync'd them to 0.3.1. No version bump was made intentionally.

#### Files Touched
- `.path/work/stabilize-opencode-path/tasks.md`
- `.path/work/stabilize-opencode-path/progress.md`
- `README.md` (stale edit/write wording)

#### Decisions Made
- package-lock.json version sync is an artifact of npm install, not a feature change

#### Notes for Next Session
- All 13 ACs are implemented and verified by Reviewer pass verdicts
- CI hosted execution remains unproven — workflow file is correct but no GitHub Actions run has been observed. First push/PR will provide that evidence.

---

### 2026-06-20 — Developer — T-011: Regression tests (Auditor follow-up)

#### Current Task
- T-011 (done)

#### Current Status
- 9 new focused regression tests added; all 265 tests pass. Auditor findings resolved.

#### What Was Attempted
- Added 7 template invariant tests in `src/lib/templates.test.ts`:
  1. No template frontmatter contains `write:` permission key
  2. No template uses legacy boolean `tools:` syntax
  3. Every template uses `permission:` block
  4. `reviewer.md` has `task: deny`
  5. Pattern-level regression: 7 regex patterns verified against 13 sample phrases
  6. Only `developer.md` contains positive Reviewer invocation patterns (with context checking)
  7. `developer.md` positively instructs Reviewer invocation
- Added 2 CLI error message tests in `src/lib/ui.test.ts`:
  1. `USAGE_SCOPE_EXCLUSIVE` message ends with concrete action "Pass only one at a time."
  2. "No manageable installation found" error includes action text "opencode-path init --project"

#### What Changed
- `src/lib/templates.test.ts`: added `parseFrontmatter` import; 7 new tests in `describe("template permission invariants")`
- `src/lib/ui.test.ts`: 2 new tests in `describe("resolveScope")` — message assertion for dual-flag error and edge case for no-viable-scope

#### Files Touched
- `src/lib/templates.test.ts`
- `src/lib/ui.test.ts`
- `.path/work/stabilize-opencode-path/tasks.md`

#### Validation Run
- `npm test` → 265 tests passed (13 files), 0 failures
- `npm run typecheck` → exit 0, no errors
- `npm run build` → dist/cli.js 74.11 KB, exit 0
- `npm run smoke` → 6/6 assertions passed, exit 0

#### Validation Missing
- Hosted GitHub Actions run — pending first push/PR (workflow file is present and correct)

#### Decisions Made
- No dependencies added
- No prompts or permissions changed
- Test pattern: small, localized assertions + direct pattern regression test
- CI hosted execution remains unproven, clearly marked pending in tasks.md Auditor notes

#### Reviewer Verdict
- PASS (4th iteration). All findings resolved: matchAll exhaustive, hand+directly/hand+to regex variants covered, lastIndex reset for g-flagged patterns, pattern-level regression test added.

#### Notes for Next Session
- CI hosted execution evidence pending push to `feature/stabilize-opencode-path-Kimi`

---

### 2026-06-20 — Auditor — Quality audit

#### Current Task
- Quality audit of current implementation for `stabilize-opencode-path`.

#### Current Status
- Assigned quality score: 90/100.
- No blocker or major product defects found in audited evidence.
- Two minor evidence/coverage gaps recorded in `tasks.md` Auditor notes.

#### Evidence Reviewed
- Scoped product status/diff excluding `.path/work/**`.
- `.path/work/stabilize-opencode-path/brief.md`, `tasks.md`, `progress.md`.
- Changed files: `README.md`, `package.json`, `package-lock.json`, `src/lib/messages.ts`, `src/lib/ui.ts`, all six `templates/*.md`, `.github/workflows/ci.yml`, `scripts/smoke-test.sh`.
- Static searches for legacy `write:`/`tools:` in templates and Reviewer/Auditor references.

#### Validation Run
- `npm test` → 13 files / 256 tests passed.
- `npm run typecheck` → exit 0.
- `npm run build` → exit 0.
- `npm run smoke` → package build/pack/install and packaged `opencode-path --help` assertions passed.

#### Validation Missing
- Observable hosted GitHub Actions run output for the new workflow; expected only after push/PR.

#### Findings Recorded
- Minor: CI configuration is present and local commands pass, but CI run execution is not yet observable.
- Minor: important prompt/error invariants are primarily covered by static inspection, not dedicated regression tests.

---

### 2026-06-20 — Auditor — Follow-up audit after T-011

#### Current Task
- Audit Developer follow-up fixes for prior Auditor findings.

#### Current Status
- Prior regression-test coverage gap is resolved in product code/tests.
- Hosted GitHub Actions execution remains pending first push/PR, as already recorded.
- One nit found in workflow handoff wording: T-011 progress text says 8/6 tests, while the observable test delta is 9/7+2.

#### Evidence Reviewed
- Scoped product status/diff excluding `.path/work/**`.
- `.path/work/stabilize-opencode-path/brief.md`, `tasks.md`, `progress.md`.
- `src/lib/templates.test.ts` new template invariant tests.
- `src/lib/ui.test.ts` new CLI error tests.
- `.github/workflows/ci.yml` and `scripts/smoke-test.sh`.
- Static search for `write:` / `tools:` in `templates/*.md`.

#### Validation Run
- `npm test` → 13 files / 265 tests passed.
- `npm run typecheck` → exit 0.
- `npm run build` → exit 0.
- `npm run smoke` → package build/pack/install and packaged `opencode-path --help` assertions passed.
- `grep` via code search for `write:` / `tools:` in templates → no matches.

#### Validation Missing
- Observable hosted GitHub Actions run output for the new workflow; expected only after push/PR.

#### Findings Recorded
- Nit: T-011 progress wording undercounts the added tests; product behavior/tests are otherwise acceptable.

---

### 2026-06-20 — Auditor — Targeted re-audit of prior points

#### Current Task
- Re-check only the two prior points: T-011 test-count wording and hosted CI evidence status.

#### Current Status
- T-011 wording issue is resolved: `progress.md` now says 9 total tests, 7 template invariant tests, and 2 UI tests.
- Hosted CI evidence remains pending; `progress.md` continues to state that GitHub Actions execution is pending first push/PR.

#### Evidence Reviewed
- `.path/work/stabilize-opencode-path/tasks.md` Auditor notes.
- `.path/work/stabilize-opencode-path/progress.md` T-011 and CI pending lines.
- `.github/workflows/ci.yml` presence and trigger/job definitions.

#### Validation Run
- No test/build commands run for this targeted re-audit; inspected points were documentation/evidence status only.

#### Validation Missing
- Hosted GitHub Actions run output remains missing until push/PR.

#### Findings Recorded
- No new product findings.
- Remaining evidence gap: hosted CI run URL/status/jobs still needed to fully close AC-08 validation evidence.
