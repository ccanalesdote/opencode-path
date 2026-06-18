# Brief: Improve Auditor Agent Prompt B-lite

## Objective
Apply a minimal B-lite compaction pass to `templates/auditor.md` so the Auditor prompt is shorter, less repetitive, and easier for GPT-5.5 to follow, while preserving the security model, audit behavior, forensic tone, and completed-audit output contract.

## Problem
The current Auditor prompt repeats the same rules in multiple places: read-only behavior, no mutation, specificity, honest scope limits, traceability checks, anti-bloat checks, and audit thinking principles. This dilutes the signal and creates risk that near-duplicate wording diverges over time.

The desired change is not a full rewrite. It is a minimal consolidation that removes duplicate instruction surfaces while keeping the Auditor role and consumer-facing contracts stable.

## Scope
- Modify only the body of `templates/auditor.md` after the frontmatter delimiter.
- Keep the frontmatter of `templates/auditor.md` unchanged.
- Verify `README.md` for Auditor references that conflict with the compact prompt; update only if a real inconsistency is introduced or discovered.
- Preserve the existing Auditor role, routing behavior, subagent policy, work-folder note behavior, traceability audit, anti-bloat audit, severity scale, verdict enum, and completed-audit output structure.
- Run the requested project validations after changes.

## Non-goals
- Do not change `templates/architect.md`, `templates/developer.md`, `templates/spec.md`, `templates/reviewer.md`, or `templates/research.md`.
- Do not change `opencode.json`.
- Do not change the Auditor permission frontmatter.
- Do not add new subagents.
- Do not change the work-folder flow defined by Architect.
- Do not change Developer's behavior when invoking Auditor.
- Do not add fields to the Auditor verdict or the `## Auditor notes` table.
- Do not optimize for minimum token count at the expense of clarity.

## Constraints
- Prompt language must remain English.
- Tone must remain forensic, skeptical, evidence-first, and non-optimistic.
- Body target is roughly 100-120 lines, but this is a guide, not a hard acceptance rule.
- Each behavioral rule should appear once, in the most logical section.
- The prompt body must not list allowed or denied bash commands. Frontmatter remains the source of truth for bash permissions.
- The prompt may say the Auditor is read-only with one narrow work-folder note exception, and may reference frontmatter for exact permissions.
- The completed-audit output format must keep the same headings, fields, order, severity classification, and verdict enum.
- Preserve existing worktree-scope behavior: the full diff in the current working tree is the default in-scope feature diff; do not treat other worktrees as out-of-scope merely because they exist elsewhere.

## Decisions
- Use a minimal B-lite compaction, not a full rewrite.
- Move `Subagents you may invoke` near `When to use me` / `When NOT to use me` so routing and delegation rules are front-loaded.
- Merge `Tools and hard rules`, `Audit protocol`, and `How to think` into one `## How I work` section.
- Collapse the original protocol steps 1-3 into one first bullet named `Establish scope and restate claims`, while preserving three separate concepts inside it: real scope, claimed work, and code/docs actually reviewed.
- Keep `## Traceability Audit` as its own short checklist section.
- Keep `## Anti-bloat Audit` as its own short checklist section.
- Treat the 100-120 line target as directional. The real success criterion is reduced duplication without contract drift.
- Preserve the `Output format for a completed audit` headings and fields. If text is compacted inside that section, do not change the structure or obligations.
- Keep the rules: no `SHIP` language, no per-file PASS stamps, uncertain findings must be marked `suspected, needs verification`.

## Relevant files and areas
- `templates/auditor.md`
  - Frontmatter lines 1-77 in the current file must remain unchanged, including the profile insertion marker.
  - Body starts after the second `---` delimiter.
  - Current sections to consolidate: `## Tools and hard rules`, `## Audit protocol (required order)`, and `How to think`.
  - Current sections to preserve as short sections: `## Traceability Audit`, `## Anti-bloat Audit`, and `Output format for a completed audit`.
- `README.md`
  - Check Auditor references around the agent overview, workflow audit phase, work-folder `Auditor notes` table, Auditor details, permission/profile notes, and external-impact denylist discussion.
  - Update only if the compact prompt contradicts README behavior.

## Acceptance Criteria
- AC-01: `templates/auditor.md` body is shorter than the current body. The target is roughly 100-120 lines, but exact line count is not a hard rule.
- AC-02: The prompt body does not list allowed or denied bash commands; frontmatter remains the source of truth for bash permissions.
- AC-03: `## How I work` replaces `## Tools and hard rules`, `## Audit protocol (required order)`, and `How to think`, consolidating the audit protocol into bullets.
- AC-04: The original protocol steps 1-3 are collapsed into one `Establish scope and restate claims` bullet without losing the distinction between real scope, claimed work, and code/docs actually reviewed.
- AC-05: `## Traceability Audit` and `## Anti-bloat Audit` exist as short sections with bullets. The output format references them by name/heading and does not duplicate long checklist prose.
- AC-06: `When NOT to use me` is a single paragraph, not three repetitive bullets.
- AC-07: The forensic tone is preserved: useful paranoia, falsification over confirmation, evidence-first claims, boundary checks, and second-order effects.
- AC-08: `Output format for a completed audit` keeps the same structure and fields: `Scope`, `Evidence reviewed`, `Claims vs verification`, `Traceability Audit`, `Anti-bloat Audit`, `Findings`, `Verdict`, `Follow-ups`, `Not checked`.
- AC-09: Severity classification remains exactly `blocker / major / minor / nit`, and verdicts remain exactly `ACCEPTABLE / NEEDS VALIDATION / NEEDS REVIEWER / FAIL`.
- AC-10: The frontmatter of `templates/auditor.md` is unchanged.
- AC-11: `README.md` contains no Auditor references that contradict the compact prompt. If contradictions exist, they are updated narrowly.
- AC-12: `npm run typecheck`, `npm test`, and `npm run build` pass after the change.
- AC-13: The compact prompt has no internal contradictions from the same rule appearing in multiple places with different wording.

## Edge cases
- Auditor invoked without an explicit work folder: prompt should state once that Auditor remains read-only and reports in chat only.
- Auditor invoked with an inconsistent work folder, such as missing `brief.md` or `tasks.md`: prompt should instruct Auditor to ask for clarification or report in chat rather than inventing state. This rule should appear once.
- Auditor needs Reviewer: prompt should state once that Reviewer is only for focused suspicions or claims, not for delegating the whole audit.
- Auditor finds an issue requiring Developer: prompt should state once that Auditor reports the follow-up; the user decides when to invoke Developer.
- Auditor sees dirty git state or worktree changes: preserve the current behavior that the full diff in the current working tree is the default scope.
- Prior agent summaries or pasted test outputs exist: they are secondary evidence unless Auditor reruns validation or inspects primary artifacts directly.
- A green test file exists: it is not sufficient evidence unless assertions prove the intended behavior.

## Open questions
- None blocking. Design decisions are closed for this handoff:
  - Move subagent policy near the routing section.
  - Keep Anti-bloat Audit as its own short section.
  - Treat the 100-120 line target as a guide, not a hard rule.
