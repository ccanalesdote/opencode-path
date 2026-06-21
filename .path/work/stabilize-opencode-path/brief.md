# Brief: Stabilize OpenCode Path

## Objective
Consolidate `opencode-path` so the existing agent pack, CLI, work-folder workflow, and package validation are more reliable, without adding agents, orchestration layers, or major architecture changes.

## Problem
The project works, but has concrete robustness gaps: agent frontmatter still uses obsolete `write` permission keys, Reviewer boundaries are not fully enforced, Developer escalation rules are not explicit enough, CI is missing, and the README Overview needs a simple visual workflow explanation.

## Scope
- Include all custom agent templates: `spec`, `architect`, `developer`, `auditor`, `research`, `reviewer`.
- Remove `write:` permission keys; keep existing `edit:` intent.
- Make Reviewer exclusive to Developer as implementation quality gate.
- Clarify Developer escalation to Architect before and during implementation.
- Keep Auditor user-invoked and separate from Reviewer.
- Add CI for tests, typecheck, build, and package smoke test.
- Add one README Overview workflow diagram.
- Improve CLI errors only where they lack a concrete next action.
- Confirm `init` scope safety without redesigning it.

## Non-goals
- No new agents, automatic orchestration, automatic Auditor triggers, work-folder redesign, global user permission rewrite, broad README rewrite, or prompt README-dependency tests.

## Constraints
- Use current OpenCode `permission:` syntax.
- Use `edit` as the only file-modification permission key; `write` is obsolete/redundant.
- Do not modify user/global OpenCode permissions automatically.
- Existing validation commands: `npm test`, `npm run typecheck`, `npm run build`.
- Keep changes small, local, and reversible.

## Decisions
- `research` is included as a first-class custom agent.
- AC-03 is narrowed to permission cleanup and role blast-radius verification, not a permission-system refactor.
- Reviewer exclusivity should be enforced by prompt language and `permission.task` where supported.
- Auditor remains user-invoked; Reviewer remains Developer-invoked.
- README diagram should use one drawing and mark optional/primary/subagent roles.

## Relevant files and areas
- `templates/spec.md`, `templates/architect.md`, `templates/developer.md`, `templates/auditor.md`, `templates/research.md`, `templates/reviewer.md`
- `src/lib/agents.ts`, `src/lib/paths.ts`, `src/lib/frontmatter.ts`, `src/lib/templates.ts`
- `src/cli.ts`, `src/commands/*.ts`, `src/lib/messages.ts`, `src/lib/ui.ts`
- `src/**/*.test.ts`, `package.json`, `tsup.config.ts`, `vitest.config.ts`, `README.md`
- Add `.github/workflows/ci.yml`

## Acceptance Criteria
- AC-01: All custom agent frontmatters use `permission:` and no custom agent uses legacy boolean `tools:` syntax.
- AC-02: No custom agent frontmatter references permission key `write`; file modification permissions use `edit` only.
- AC-03: Custom agent `edit` and `task` permissions match role blast radius; no global user permission defaults are changed automatically.
- AC-04: Developer prompt documents forward escalation to Architect for module boundaries, public contracts, schema/migrations, new dependencies, cross-cutting changes, compatibility risk, or unresolved brief decisions.
- AC-05: Developer prompt documents retroactive escalation and mini-handoff: what was done, why a decision is missing, what Architect must decide, and optional Developer proposal.
- AC-06: Only Developer contains positive instructions to invoke Reviewer.
- AC-07: Reviewer is Developer's quality gate; Auditor is a user-invoked skeptical review role; no automatic Auditor triggers are introduced.
- AC-08: CI runs on push and pull request and executes tests, typecheck, build, and package smoke test.
- AC-09: Package smoke test validates packaged/staged CLI `opencode-path --help` exits 0 and contains expected help text.
- AC-10: README, `--help`, and actual CLI commands/options are aligned.
- AC-11: In-scope CLI error messages end with a concrete user action where missing.
- AC-12: `init` does not modify files outside selected project/global scope without clear information and confirmation.
- AC-13: README Overview includes the approved single visual workflow diagram.

## Edge cases
- Verify `permission.task` syntax before changing frontmatter if uncertain.
- Update tests that expected obsolete `write:` keys.
- Do not rewrite errors or README text for style only.
- Target the primary CI platform for the smoke test.
- If Developer discovers missing design decisions, pause rather than approximate.

## Open questions
- None.
