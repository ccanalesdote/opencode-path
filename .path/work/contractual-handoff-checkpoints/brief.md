# Brief: Contractual Handoff with Risk-Based Checkpoints

## Objective
Harden the Architect → Developer handoff process so Developer executes closed implementation contracts with minimal design discretion, Reviewer validates implementation at risk-based checkpoints, and Auditor remains the final traceability gate.

## Problem
Current handoffs can leave material decisions open. Developer may then infer architecture, behavior, scope, or validation details inconsistently, which causes scope drift, weak Reviewer signal, and premium-model rework. The process needs stricter contractual artifacts without adding new agents, automation, or extra handoff files.

## Scope
- Update existing agent templates/prompts in this repository to encode a contractual handoff process.
- Add `## Implementation Contract` and optional `## Assumptions and residual risks` requirements to Architect's work-folder `brief.md` schema.
- Strengthen Architect's `tasks.md` schema so tasks are atomic and checkpoints are defined explicitly.
- Update Developer instructions so Developer executes selected tasks/checkpoints, performs only bounded local reconnaissance, and escalates contradictions/gaps instead of redesigning.
- Update Reviewer instructions so Reviewer operates at checkpoint closure and final review, not after every isolated mechanical task.
- Update Auditor instructions so Auditor remains the final closure gate for traceability across spec/brief/contract/tasks/ACs/changes/evidence.

## Non-goals
- Do not add new agents or roles.
- Do not introduce automated enforcement, linters, hooks, validators, or generated checkers for handoff structure.
- Do not create `self-review.md` or any new persistent artifact beyond the existing `.path/work/{slug}/brief.md`, `tasks.md`, and `progress.md` pattern.
- Do not require dedicated worktrees or change the existing handoff mode system.
- Do not redesign Spec → Architect or redefine Spec's AC format.
- Do not make Reviewer run after every individual mechanical task.

## Constraints
- This is a process/template change, not application behavior.
- Preserve existing managed template files and current `.path/work/{slug}/` convention.
- `brief.md` and `tasks.md` are the only contractual handoff artifacts; `progress.md` is operational evidence and escalation log only.
- Any contractual decision made after Developer escalates must be persisted back into `brief.md` and/or `tasks.md`; it must not live only in `progress.md`.
- Project validation commands are documented in `package.json` and CI: `npm test`, `npm run typecheck`, `npm run build`, and `npm run smoke`.
- Keep changes localized to templates unless implementation discovers a necessary supporting test or fixture update.

## Decisions
- Recommended process name: **Contractual handoff with risk-based checkpoints**.
- Checkpoints are mandatory in `tasks.md`, but their granularity is risk-based:
  - small/local feature: one final checkpoint is acceptable;
  - medium feature: usually 2–3 checkpoints;
  - sensitive/transversal changes: shorter checkpoints;
  - consecutive mechanical tasks may be grouped.
- Each checkpoint must declare included tasks, intended ACs closed, Reviewer focus, and expected evidence.
- If `## Implementation Contract` contradicts any material part of the brief, the handoff is invalid until Architect corrects the contradiction. The contract is not allowed to silently override Objective, Scope, Non-goals, Constraints, or Acceptance Criteria.
- Architect must name exact target file paths when known. If exact paths are not yet known, Architect may name a concrete area or pattern, but never vague directions such as "related modules".
- Developer may perform local reconnaissance inside assigned files/areas to follow existing conventions, but may not explore broadly to discover the design or make architectural/product decisions.
- `## Assumptions and residual risks` is optional and limited to minor reversible defaults and known risks for Developer/Reviewer to watch. It must not contain unresolved material product, UX, scope, security, compatibility, or behavior decisions.
- Unknown validation-command discovery is allowed only as an exceptional, bounded task when the project does not document commands. It is not permission for broad investigation or deferred design.

## Implementation Contract

### Target files and areas
- `templates/architect.md`
  - Add handoff-contract rules to Architect's design/persistence workflow.
  - Extend the work-folder mini-schema for `brief.md` with `## Implementation Contract` and optional `## Assumptions and residual risks`.
  - Extend the work-folder mini-schema for `tasks.md` with task fields for files/areas, objective, dependencies, and a checkpoints section/table.
  - Add explicit implementation-ready exit gate rules.
- `templates/developer.md`
  - Update workflow and escalation rules so Developer follows the contract, executes checkpoint-bound work, records escalations in `progress.md`, and does not redesign or close ambiguous requirements.
  - Replace the current "invoke Reviewer before declaring a task done" behavior with checkpoint/final review behavior.
- `templates/reviewer.md`
  - Update review scope from selected task-only review to checkpoint/final review when a work folder defines checkpoints.
  - Preserve read-only behavior and PASS/FAIL verdict format.
- `templates/auditor.md`
  - Clarify Auditor as final closure gate that verifies traceability from spec/brief/implementation contract/tasks/ACs/progress/evidence/code changes.
  - Preserve Auditor's existing scoped work-folder audit behavior and narrow write permissions.
- Tests or snapshots, if present and affected by template text expectations, should be updated only as needed after inspecting existing test coverage.

### Expected changes by area
- Architect must produce implementation-ready handoffs that contain no material `NEEDS CLARIFICATION` items.
- Architect must resolve technical decisions via repo patterns, existing conventions, or Research before handoff; product/UX/scope/behavior decisions require user conversation before implementation-ready.
- Architect may assume only minor reversible defaults and must label them in `## Implementation Contract` or `## Assumptions and residual risks`.
- `tasks.md` must be executable by Developer without inventing architecture, contracts, or behavior.
- Checkpoints must be represented in `tasks.md`, not only described in prose elsewhere.
- Developer must update `progress.md` for execution evidence and escalations, but must not treat `progress.md` as the source of contractual decisions.
- Reviewer must review at checkpoint closure and final feature review, using the contract, tasks, ACs, diff, and evidence.
- Auditor must audit final traceability and accumulated correctness; Auditor must not become a pre-plan gate.

### Contracts / invariants / compatibility to preserve
- Keep the existing three handoff modes in Architect unchanged except where schema details improve generated artifacts.
- Keep `.path/work/{feature-slug}/brief.md`, `tasks.md`, and `progress.md` as exactly the persistent handoff file set.
- Keep Architect unable to write application code.
- Keep Reviewer read-only.
- Keep Auditor read-only for source code and only able to append/note within allowed work-folder artifacts.
- Keep Developer as the only broad implementation-writing agent.
- Preserve the managed template style and existing marker behavior.

### Normal flow to encode
`Spec → Architect (designs + internal self-critique) → Developer → Reviewer per checkpoint → Reviewer final → Auditor final`

Each role must stop when it encounters something outside its authority:
- Architect stops before handoff if decisions are material and unresolved.
- Developer stops and escalates if the contract is contradictory, impossible, or materially incomplete.
- Reviewer fails or blocks a checkpoint/final review when implementation violates the contract, ACs, or evidence requirements.
- Auditor fails or requests follow-up when traceability, scope, accumulated quality, or evidence is insufficient.

### Escalation contract
When Developer finds a contradiction or gap:
- Developer records the block in `progress.md` with Task/checkpoint, Problem, Evidence, Impact, Proposed options, and Status `blocked awaiting Architect decision`.
- Developer stops implementation for the affected area.
- Architect decides. If the decision changes contract or execution structure, Architect updates `brief.md` and/or `tasks.md`.
- No material decision is considered accepted if it exists only in `progress.md`.

### Do not touch / do not introduce
- Do not add enforcement automation.
- Do not add new agent files.
- Do not add `self-review.md` or other handoff artifacts.
- Do not require worktrees.
- Do not rewrite the entire agent system if targeted edits to existing templates satisfy the criteria.
- Do not loosen Developer authority to make architectural, product, UX, compatibility, security, or scope decisions.

## Relevant files and areas
- `templates/architect.md` — primary source of work-folder schema, handoff modes, Architect responsibilities, implementation-ready gate.
- `templates/developer.md` — execution workflow, work-folder handling, escalation rules, Reviewer invocation behavior.
- `templates/reviewer.md` — checkpoint/final review responsibilities and read-only verdict behavior.
- `templates/auditor.md` — final traceability audit and work-folder audit rules.
- `src/lib/templates.ts` — template loading/validation; inspect only if tests indicate template constraints.
- `src/lib/agents.ts` — managed marker behavior; inspect only if marker/template tests fail.
- `package.json` and `.github/workflows/ci.yml` — validation command source.

## Acceptance Criteria
- AC-01: Architect's template requires `brief.md` to include `## Implementation Contract` for persistent implementation-ready handoffs.
- AC-02: Architect's `## Implementation Contract` requirements include target files/areas, expected change per area, contracts/invariants/compatibility, normal and edge/error behavior, decisions already made, and explicit do-not-touch/do-not-introduce limits.
- AC-03: Architect's template states that any material contradiction between `## Implementation Contract` and Objective, Scope, Non-goals, Constraints, or Acceptance Criteria makes the handoff invalid until Architect corrects it.
- AC-04: Architect's template allows optional `## Assumptions and residual risks` only for minor reversible defaults and known risks to watch, and forbids using it for unresolved material product, UX, scope, security, compatibility, or behavior decisions.
- AC-05: Architect's `tasks.md` schema requires atomic tasks with files/areas, technical objective, covered ACs, dependencies, and observable verification.
- AC-06: Architect's `tasks.md` schema requires a checkpoints section where each checkpoint declares included tasks, intended ACs closed, Reviewer focus, and expected evidence.
- AC-07: Architect's template defines risk-based checkpoint granularity: one final checkpoint is acceptable for small/local work, medium work usually has 2–3 checkpoints, sensitive/transversal work uses shorter checkpoints, and consecutive mechanical tasks may be grouped.
- AC-08: Architect's implementation-ready exit gate requires a present contract, no material `NEEDS CLARIFICATION`, executable tasks without open design decisions, defined checkpoints, and internal self-critique applied without creating a separate artifact.
- AC-09: Developer's template limits Developer reconnaissance to local files/areas and conventions needed to execute assigned tasks; it forbids broad exploration to discover design or make architectural/product decisions.
- AC-10: Developer's template requires escalation instead of redesign when the contract is contradictory, technically impossible, materially incomplete, or outside Developer authority.
- AC-11: Developer's escalation instructions require `progress.md` entries with Task/checkpoint, Problem, Evidence, Impact, Proposed options, and Status `blocked awaiting Architect decision`.
- AC-12: Developer's template states that material decisions from escalations must be persisted by Architect into `brief.md` and/or `tasks.md`; decisions must not live only in `progress.md`.
- AC-13: Reviewer's template requires review at each checkpoint closure and at final feature review when checkpoints exist, and avoids mandatory review after every isolated mechanical task.
- AC-14: Reviewer's scope is to detect implementation defects, regressions, and violations of the Implementation Contract or materialized ACs; Reviewer must not respecify the contract.
- AC-15: Auditor's template defines Auditor as the final closure gate, distinct from Reviewer, verifying traceability spec → brief → Implementation Contract → tasks/checkpoints → ACs → changes → evidence plus scope and accumulated quality.
- AC-16: The change does not add new agents, new persistent handoff artifacts, automated enforcement, mandatory worktrees, or an Auditor pre-plan gate.
- AC-17: Repository validation succeeds with the documented commands or any failures are reported with evidence: `npm test`, `npm run typecheck`, `npm run build`, and `npm run smoke`.

## Edge cases
- A feature is tiny/local: Architect may define a single final checkpoint, but it must still declare tasks, ACs, Reviewer focus, and expected evidence.
- A feature is medium-sized: Architect should normally define 2–3 checkpoints unless a specific risk-based reason is documented.
- A feature touches security, auth, permissions, persistence, migrations, external integrations, public APIs, or broad cross-cutting behavior: Architect should define shorter checkpoints.
- Several consecutive tasks are mechanical: Architect may group them into one checkpoint if the review focus and expected evidence remain clear.
- Exact paths are known: Architect must name them. Exact paths are unknown but bounded: Architect may name a concrete folder, glob, or pattern plus the reason local recognition is needed. Vague discovery instructions are invalid.
- Validation commands are unknown in another project: Architect may include a bounded discovery task, but not as a substitute for unresolved design decisions.
- Developer discovers the contract contradicts another brief section: Developer blocks and escalates; Architect updates the contract/brief before implementation continues.
- Developer discovers a task is impossible as written: Developer records evidence in `progress.md` and blocks; Architect adjusts `brief.md` and/or `tasks.md` if needed.
- Reviewer rejects a checkpoint: Developer fixes and Reviewer re-reviews; Architect is only reopened if the correction would change the contract.
- Auditor finds accumulated scope or traceability failure after Reviewer passed checkpoints: final closure is blocked and the appropriate role reopens the relevant stage.

## Open questions
- None blocking. Developer should inspect existing tests/snapshots before editing to determine whether template text changes require test updates.

## Assumptions and residual risks
- Assumption: The existing template files are the only prompt sources that need process changes for this feature. If tests reveal generated fixtures or snapshots, update only those required by the changed templates.
- Risk: Tightening Developer/Reviewer workflow could make very small features feel heavier. Mitigation: explicitly allow a single final checkpoint for small/local work.
- Risk: Longer Architect handoffs may be more verbose. Mitigation: require specific contract sections but keep checkpoints risk-based rather than per-task.
