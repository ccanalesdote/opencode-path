# Progress: Improve Auditor Scoped Diff Behavior

## Log

### 2026-06-18 00:00 — Architect — Initial handoff created

#### Current Task
- none

#### Current Status
- Handoff prepared for Developer; implementation has not started.

#### What Was Attempted
- Clarified that `.path/work` must remain versioned but Auditor must avoid mixing unrelated plan folders into product audits.
- Chose a scoped Auditor workflow instead of worktrees, plugins, dynamic permissions, or `.gitignore` changes.

#### What Changed
- Created initial `brief.md`, `tasks.md`, and `progress.md` for `.path/work/auditor-scoped-work-diff/`.

#### Files Touched
- `.path/work/auditor-scoped-work-diff/brief.md`
- `.path/work/auditor-scoped-work-diff/tasks.md`
- `.path/work/auditor-scoped-work-diff/progress.md`

#### What Remains
- Developer should update `templates/auditor.md` according to the acceptance criteria.
- Developer should update README only if existing documentation conflicts with the new Auditor scoped-diff behavior.
- Developer should run discovered project validation commands and inspect for scope creep.

#### Validation Run
- none

#### Validation Missing
- Project validation commands were not run during handoff creation.
- Runtime/manual validation of Auditor behavior has not been performed.

#### Decisions Made
- Auditor must audit a single `feature-slug` at a time.
- Auditor reads only `.path/work/{feature-slug}/` for plan context.
- Auditor reviews product/code changes with `.path/work/**` excluded.
- Auditor may separately review `.path/work/{feature-slug}/` as plan/progress evidence.
- `.path/work` remains versioned and must not be added to `.gitignore`.
- Worktree cleanup is explicitly out of scope for this plan.

#### Notes for Next Session
- The normal user prompt should identify the plan to audit. If it does not, Auditor should inspect available `.path/work/*` folders and ask which one to audit.
- Do not let unrelated `.path/work/*` changes influence an audit finding for the current plan.
- Suggested product-scope commands for Auditor instructions: `git diff -- . ':(exclude).path/work/**'` and `git status --short -- . ':(exclude).path/work/**'`.

#### Do Not Touch
- Do not remove worktree-related code, docs, tests, or prompts in this plan.
- Do not add `.path/work` to `.gitignore`.
- Do not add dynamic permission plugins or external-directory allow rules.
- Do not redesign Architect or Developer workflows beyond minimal handoff wording if absolutely necessary.

### 2026-06-18 21:36 — Developer — Implemented scoped-diff rules in `templates/auditor.md`

#### Current Task
- T-002, T-003, T-004, T-005 (all done; T-001 was already done in inspection).

#### Current Status
- All five tasks `done`. Auditor template now mandates a single `feature-slug` audit unit, separates plan vs product scope, and prohibits using unscoped `git diff`/`git status` as audit evidence. Frontmatter `permission.bash` allows scoped and unscoped `git status`/`git diff` at the permission layer (so the agent may run any `git status`/`git diff`), but the prompt body now restricts *evidence use* to scoped forms.

#### What Was Attempted
- Read `templates/auditor.md`, `README.md`, `package.json`, `src/lib/templates.test.ts`, and grep'd test files for assertions on auditor.md content to confirm only structural markers (`<!-- managed-by: opencode-path -->` and `# Optional stack-specific profiles are inserted here by opencode-path profiles`) needed to be preserved, not prompt-text assertions.
- Per the brief, evaluated whether README conflicts with the new rule; concluded it does not.
- Ran baseline + post-change `npm run typecheck` and `npm test` to confirm no regressions.

#### What Changed
- `templates/auditor.md` (+19/-4):
  1. New "Audit scope (single feature-slug)" subsection in `## How I work`: establishes slug, fallback when missing, missing-folder flow, prohibition on touching unrelated `.path/work/{other-slug}/`, plan scope (only `brief.md`/`tasks.md`/`progress.md` for the slug), product scope (exclude `.path/work/**`), prohibition on unscoped `git diff`/`git status` as evidence, suggested scoped forms for both scopes, missing-product-changes edge case, and "worktree is not a substitute for a slug" + "don't suggest ignoring `.path/work`" rules.
  2. Audit protocol first bullet rewritten: removed "Derive the real scope from the current working tree using `git status` and `git diff`; when running inside a worktree..." (which contradicted AC-07 and AC-09). New text uses scoped forms and explicitly says "Do not rely on unscoped `git diff`/`git status` as evidence."
  3. Work-folder notes first bullet rewritten: must read only `.path/work/{feature-slug}/{brief,tasks,progress}.md`; do not read other `.path/work/*/` folders as evidence even when they have Git changes; fallback asks when zero/multiple slugs are detectable and the user did not name one.
  4. Output format Scope section: now explicitly includes "Feature slug audited", "Plan scope summary", "Product scope summary", and notes unrelated `.path/work/*` folders as explicitly out of scope.
- `README.md`: no change (see decision below).
- No source code changes; no `.gitignore` change; no plugin/worktree/external-directory changes.

#### Files Touched
- `templates/auditor.md` (modified)
- `.path/work/auditor-scoped-work-diff/brief.md` (read only)
- `.path/work/auditor-scoped-work-diff/tasks.md` (updated task statuses/notes)
- `.path/work/auditor-scoped-work-diff/progress.md` (this entry)

#### What Remains
- Reviewer pass on the `templates/auditor.md` diff against AC-01..AC-09.
- Optional user manual review before commit/close.

#### Validation Run
- `npm install` (per user instruction): added 120 packages; 0 vulnerabilities.
- Baseline `npm run typecheck`: clean.
- Baseline `npm test`: 187/187 passing across 7 files.
- Post-change `npm run typecheck`: clean (unchanged).
- Post-change `npm test`: 187/187 passing (unchanged).
- `git status --short`: only `M templates/auditor.md` and `?? .path/work/auditor-scoped-work-diff/` (intended work folder).
- `git diff --stat -- . ':(exclude).path/work/**'`: `templates/auditor.md | 23 ++++---` (+19/-4) — no scope creep.

#### Validation Missing
- No runtime opencode smoke test of the Auditor agent with a real slug prompt was performed (would require running opencode itself). The change is instruction-level; behavior verification is by diff inspection only.

#### Decisions Made
- Did NOT change the frontmatter `permission.bash` block. The `git status*`/`git diff*` allow rules remain, because they are the *permission* layer (controls whether the agent may run the command at all) and the AC-07 prohibition is about *using* the output as audit evidence (a behavioral rule enforced by the prompt body). Restricting the permission rules would also block scoped invocations like `git diff -- . ':(exclude).path/work/**'` because the glob `git diff*` matches both. The brief/task list explicitly framed AC-07 as an instruction-level rule, not a permission rule.
- Did NOT modify `README.md`. The pre-existing Auditor README sections (Auditor key features at lines 462-484, "Audit Phase" example at lines 276-291) already describe `.path/work/{feature-slug}/` scoping and the append-only exception; they do not contradict the new scoped-diff rule. T-004 was intentionally scoped to "only if conflicts". The Auditor template is sufficient per the open question — "Should README include a short section documenting the new audit-scope rule, or is the Auditor template sufficient?" — resolution: sufficiency chosen, documented here per task verification wording.

#### Notes for Next Session
- If the user later wants README documentation of the rule (the open question's other branch), that is a small follow-up not in this plan's scope.
- Auditor template still references worktree behavior ("Running inside a Git worktree or a branch checkout does not substitute for an explicit slug") but does not introduce or depend on worktree automation — this is the existing behavior preserved per AC-09 and the brief's non-goals.

#### Do Not Touch
- (Carried forward) Do not remove worktree-related code, docs, tests, or prompts in this plan.
- (Carried forward) Do not add `.path/work` to `.gitignore`.
- (Carried forward) Do not add dynamic permission plugins or external-directory allow rules.
- (Carried forward) Do not redesign Architect or Developer workflows.

### 2026-06-18 21:53 — Auditor — Scoped work-diff audit completed

#### Current Task
- Audit of `.path/work/auditor-scoped-work-diff/` after Developer and Reviewer completion.

#### Current Status
- Verdict: ACCEPTABLE for the inspected instruction-level change.
- No blocker, major, minor, or nit findings were identified.

#### What Was Attempted
- Read scoped plan artifacts: `brief.md`, `tasks.md`, and `progress.md` under `.path/work/auditor-scoped-work-diff/`.
- Inspected scoped product diff excluding `.path/work/**`: only `templates/auditor.md` changed (+19/-4).
- Inspected the modified Auditor template in depth and checked README Auditor/work-folder sections for conflicting instructions.
- Performed traceability and anti-bloat audit against AC-01..AC-09.

#### What Changed
- Appended this audit entry to `progress.md`.
- Added one closed no-finding row under `tasks.md` `## Auditor notes`.

#### Files Touched
- `.path/work/auditor-scoped-work-diff/tasks.md`
- `.path/work/auditor-scoped-work-diff/progress.md`

#### What Remains
- Optional manual opencode smoke test: prompt Auditor without a slug and confirm it asks which `.path/work/*` plan to audit; prompt with a slug and confirm scoped behavior.

#### Validation Run
- `npm run typecheck`: passed.
- `npm test`: passed, 187/187 tests across 7 files.

#### Validation Missing
- No live opencode runtime smoke test was performed.

#### Decisions Made
- Treated the absence of a runtime smoke test as acceptable for this prompt-only/template change because the acceptance criteria are directly verifiable in `templates/auditor.md` and project validation passed.

#### Notes for Next Session
- If stricter assurance is desired, perform the optional manual smoke test before closing the work folder.

### 2026-06-18 21:42 — Developer — Reviewer FAIL: AC-02 contradiction at line 142 (reopened T-002)

#### Current Task
- T-002 reopened after Reviewer FAIL.

#### Current Status
- Reviewer returned FAIL with one major finding: `templates/auditor.md:142` still said "If exactly one slug is detectable, use it as the scope reference", which contradicted the line 107 rule "if the prompt does not name a slug ... ask which plan to audit. Proceed only after the user picks one." The original auditor.md wording (line 129 pre-change) carried this auto-selection clause over, and I preserved it inadvertently. AC-02 requires asking the user whenever the prompt does not name a slug, even if exactly one `.path/work/*` folder is detectable.

#### What Was Attempted
- Applied targeted edit to `templates/auditor.md:142`: removed the "if exactly one slug is detectable, use it as the scope reference" clause. New wording: "If the user did not name a slug in the prompt, ask before proceeding — even if exactly one `.path/work/*` folder is detectable; see 'Audit scope' above for the fallback protocol." This is now consistent with line 107.

#### What Changed
- `templates/auditor.md` line 142: replaced the auto-selection fallback with an explicit "ask before proceeding" rule that references the "Audit scope" subsection.
- `tasks.md`: moved T-002 back to `in_progress` with a reopening note.
- `progress.md`: added this entry.

#### Files Touched
- `templates/auditor.md` (1-line edit)
- `.path/work/auditor-scoped-work-diff/tasks.md` (status + note)
- `.path/work/auditor-scoped-work-diff/progress.md` (this entry)

#### What Remains
- Re-invoke Reviewer to confirm the contradiction is resolved.
- Once Reviewer returns PASS, mark T-002 done.

#### Validation Run
- none yet after the fix (will re-run typecheck/test and inspect diff before re-review).

#### Validation Missing
- Post-fix typecheck/test not yet re-run; was clean on prior run and the change is single-line prompt text in a `.md` file, so structural validation is unaffected.

#### Decisions Made
- Treated the FAIL as a real AC-02 contradiction, not a nit, because AC-02 explicitly requires the user to pick the slug; the "exactly one is detectable" exception would have allowed silent slug selection that AC-02 and the brief Constraints forbid.

#### Notes for Next Session
- If Reviewer still objects, ensure no other sentence in `templates/auditor.md` retains the "exactly one is detectable" auto-selection pattern. Grep for "exactly one" and "detectable" before re-submitting.

#### Do Not Touch
- (Carried forward) Do not remove worktree-related code, docs, tests, or prompts in this plan.
- (Carried forward) Do not add `.path/work` to `.gitignore`.
- (Carried forward) Do not add dynamic permission plugins or external-directory allow rules.
- (Carried forward) Do not redesign Architect or Developer workflows.

### 2026-06-18 21:44 — Developer — Reviewer PASS, all five tasks done

#### Current Task
- All tasks (T-001..T-005) `done`.

#### Current Status
- Reviewer returned PASS with line citations for all nine ACs. The Auditor template now consistently requires an explicit `feature-slug` (named by user OR chosen by the user when prompted), separates plan/product scope, prohibits unscoped `git diff`/`git status` as audit evidence, and preserves `.path/work` as versioned content. No worktree/plugin/dynamic-permission/external-directory changes were introduced.

#### What Was Attempted
- Re-ran Reviewer after the AC-02 fix at line 142 (removed "if exactly one slug is detectable, use it as the scope reference" auto-selection; replaced with an "ask before proceeding — even if exactly one `.path/work/*` folder is detectable" rule that defers to the "Audit scope" subsection).

#### What Changed
- `templates/auditor.md` line 142 (1-line edit, same diff-stat as before the fix — net +19/-4).
- `tasks.md` T-002 marked `done` with resolution note.

#### Files Touched
- `templates/auditor.md`
- `.path/work/auditor-scoped-work-diff/tasks.md`
- `.path/work/auditor-scoped-work-diff/progress.md`

#### What Remains
- Optional user manual verification: switch to Auditor in opencode, prompt without a slug, confirm Auditor asks which `.path/work/*` to audit; prompt with a slug, confirm the scopes are enforced.

#### Validation Run
- `npm run typecheck`: clean.
- `npm test`: 187/187 passing.
- `git diff --stat -- . ':(exclude).path/work/**'`: `templates/auditor.md | 23 ++++---` (+19/-4) — no scope creep.
- Reviewer PASS verdict recorded.

#### Validation Missing
- No live opencode runtime smoke test of the Auditor behavior (would require launching opencode). The change is instruction/template-level; behavior is verified by diff/inspection and Reviewer evaluation.

#### Decisions Made
- (Recorded earlier) Frontmatter `permission.bash` was left unchanged; the AC-07 prohibition is at the audit-evidence/prompt layer.
- (Recorded earlier) README.md was left unchanged; no conflict with the new behavior.

#### Reviewer AC verification line citations (PASS)
- AC-01: `templates/auditor.md:106` — "Every audit is scoped to exactly one `feature-slug`… Establish this slug before any other audit work."
- AC-02: `templates/auditor.md:107` + `:142` — "If the prompt does not name a slug, do not guess… ask which plan to audit. Proceed only after the user picks one." / "If the user did not name a slug in the prompt, ask before proceeding — even if exactly one `.path/work/*` folder is detectable…"
- AC-03: `templates/auditor.md:110` + `:142` — scope limited to `.path/work/{feature-slug}/brief.md`, `tasks.md`, and `progress.md`.
- AC-04: `templates/auditor.md:109`, `:111`, `:142` — never read/diff/audit unrelated `.path/work/{other-slug}/` folders; product scope excludes `.path/work/**`.
- AC-05: `templates/auditor.md:111` + `:113` — product scope `git diff -- . ':(exclude).path/work/**'` and `git status --short -- . ':(exclude).path/work/**'`.
- AC-06: `templates/auditor.md:110`, `:114`, `:126` — plan scope: `git status --short -- .path/work/{feature-slug}/` and `git diff -- .path/work/{feature-slug}/`.
- AC-07: `templates/auditor.md:112` + `:126` — "Do not use unscoped `git diff` or unscoped `git status` as audit evidence."
- AC-08: `templates/auditor.md:116` — "`.path/work` remains versioned project content; do not suggest ignoring it."
- AC-09: `templates/auditor.md:116` — worktree is not a substitute for an explicit slug; diff inspection confirmed no plugin/dynamic-permission/external-directory changes.

#### Notes for Next Session
- Work is ready for commit/close whenever the user requests it. Brief/task/progress artifacts are owned by the user; the work tree is clean for review.

#### Do Not Touch
- (Carried forward) Do not remove worktree-related code, docs, tests, or prompts in this plan.
- (Carried forward) Do not add `.path/work` to `.gitignore`.
- (Carried forward) Do not add dynamic permission plugins or external-directory allow rules.
- (Carried forward) Do not redesign Architect or Developer workflows.
