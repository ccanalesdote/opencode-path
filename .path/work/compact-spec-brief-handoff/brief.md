# Brief: Compact Spec Brief Handoff

## Objective
Simplify the Spec Brief produced by `templates/spec.md` so it is concise, scannable, and useful as structured input for Architect without pretending to be Architect's final `brief.md`.

## Problem
The current Spec Brief can become too large to read fully. That weakens the user's ability to quickly confirm whether the discussion with Spec was captured correctly. It also blurs the boundary between Spec and Architect by including sections that either duplicate each other, are not consumed downstream, or invite Spec to do technical design.

Spec should remain strong at clarifying vague HDUs and ideas through interview/debate, while Architect remains the final design defense before implementation. Architect should know what a Spec Brief contains and how to consume it, but must treat it as input to challenge and refine, not as a direct translation into `brief.md`.

## Scope
- Update `templates/spec.md` so the final `Spec Brief` handoff format is compact and scannable.
- Preserve Spec's existing Interview Mode behavior unless a small documentation note is necessary to distinguish interview output from final handoff output.
- Remove `REQ-001` / `## Requirements` from the final Spec Brief handoff format.
- Keep the current acceptance-criteria rule as-is: stable `AC-01`, `AC-02`, etc.; every AC must be verifiable or observable; vague wording must be reformulated or surfaced as an assumption/open question.
- Make `## User / context` optional in the Spec Brief and instruct Spec to include it only when it changes expected behavior, scope, or acceptance criteria.
- Integrate current behavior into `## Problem` when relevant instead of keeping a separate `## Current behavior` section.
- Remove `## Suggested Validation` and instruct Spec to include validation hints inside relevant acceptance criteria when useful.
- Remove `## Notes for technical design` from the Spec Brief handoff format.
- Merge `## Out of scope` into `## Non-goals`.
- Update `templates/architect.md` so Architect treats a Spec Brief as structured input, not the final design or a direct copy source for `brief.md`.
- Update `README.md` to document the compact Spec Brief, the Spec → Architect relationship, and the fact that `brief.md` remains the source of truth for Developer.

## Non-goals
- Do not change the roles of Spec or Architect.
- Do not change Developer, Auditor, Reviewer, or Research prompts/templates.
- Do not change frontmatter, models, or permissions for Spec or Architect.
- Do not make Spec create `.path/work/{feature-slug}/` or write files.
- Do not add a new shared schema file, validator, dependency, or CLI command.
- Do not change the `brief.md`, `tasks.md`, or `progress.md` mini-schema.
- Do not add a new Architect stop-condition checklist beyond clarifying how Architect should treat Spec Briefs.
- Do not force users to use Spec before Architect; Architect must still work without a prior Spec Brief.

## Constraints
- Spec is read-only by default in the current template and should remain so for this feature.
- Architect is the only agent that creates persistent work-folder artifacts in the current flow.
- The Spec Brief is a chat artifact by default; the Architect-created `brief.md` is the implementation source of truth.
- The project publishes `templates` as part of the package, so template text changes are product changes.
- README duplicates important agent behavior and must stay consistent with the templates.
- Validation commands confirmed from `package.json`: `npm run typecheck`, `npm test`, `npm run build`.

## Decisions
- Use the name `Spec Brief`; do not rename it to `Architect Input Brief`.
- Treat the Spec Brief as structured input for Architect, not a 1:1 mapping into Architect's `brief.md`.
- Preserve Interview Mode as-is because it works well for clarifying vague ideas.
- Simplify only the final Spec Brief handoff output.
- Remove `REQ-001` and the separate `## Requirements` section from the final Spec Brief.
- Keep `AC-01`, `AC-02`, etc. as the only numbered contract IDs in the Spec Brief handoff.
- Keep the existing AC quality rule; do not add a new hard limit such as “5-10 ACs maximum.”
- `## Current behavior` is not a standalone final handoff section; relevant current behavior belongs in `## Problem`.
- `## User / context` is optional and should be omitted when it does not affect behavior, scope, or ACs.
- `## Suggested Validation` is not a standalone final handoff section; validation hints can be embedded in ACs.
- `## Notes for technical design` is removed to avoid Spec invading Architect's design role.
- `## Out of scope` is folded into `## Non-goals`.
- Architect should explicitly preserve its critical role: challenge the Spec Brief, resolve or surface gaps, and run its normal design protocol before writing `brief.md`.

## Relevant files and areas
- `templates/spec.md`: final Spec Brief format, hard rules around AC IDs, handoff behavior.
- `templates/architect.md`: rules for consuming a Spec Brief as structured input while preserving Architect's design authority.
- `README.md`: Typical Workflow, Spec section, Architect section, Spec Interview/Brief documentation.
- `package.json`: validation commands.

## Acceptance Criteria
- AC-01: `templates/spec.md` defines a compact final `Spec Brief` handoff format with these sections: `Objective`, `Problem`, optional `User / context`, `Expected behavior`, `Acceptance criteria`, `Non-goals`, `Edge cases`, `Assumptions`, and `Open questions for Architect`.
- AC-02: Spec's Interview Mode output remains functionally intact; the change targets the final Spec Brief handoff format, not the clarification conversation format.
- AC-03: The final Spec Brief format in `templates/spec.md` no longer includes `## Requirements` or `REQ-001` examples/instructions.
- AC-04: The final Spec Brief format no longer includes standalone sections for `## Current behavior`, `## Suggested Validation`, `## Notes for technical design`, or `## Out of scope`.
- AC-05: `templates/spec.md` instructs Spec to include current behavior inside `## Problem` when relevant.
- AC-06: `templates/spec.md` instructs Spec that `## User / context` is optional and should only be included when it affects expected behavior, scope, or acceptance criteria.
- AC-07: `templates/spec.md` preserves the existing AC quality rule: stable `AC-01`, `AC-02`, etc.; every AC must be verifiable or observable; vague terms must be reformulated or moved to assumptions/open questions.
- AC-08: `templates/spec.md` instructs Spec to place validation hints inside relevant acceptance criteria when useful instead of using a standalone validation section.
- AC-09: `templates/architect.md` explicitly states that a Spec Brief is structured input for Architect, not Architect's final `brief.md` and not a direct copy/mapping obligation.
- AC-10: `templates/architect.md` states that Architect must still apply its normal design protocol and Minimal Implementation Check when given a Spec Brief.
- AC-11: `templates/architect.md` states that Architect may challenge, refine, or decline to persist a handoff if the Spec Brief is vague, contradictory, too broad, technically premature, or has unverifiable ACs.
- AC-12: `templates/architect.md` states that the Architect-created `brief.md` remains the source of truth for Developer.
- AC-13: `README.md` documents the compact Spec Brief as the official final Spec handoff format.
- AC-14: `README.md` documents the relationship: HDU/idea → Spec clarifies and emits Spec Brief → Architect reviews/challenges/designs → Architect writes `brief.md`/`tasks.md`/`progress.md` when requested → Developer implements from those artifacts.
- AC-15: `README.md` clarifies that Developer should consume Architect's `brief.md` and `tasks.md`, not the Spec Brief directly.
- AC-16: The implementation does not modify Developer, Auditor, Reviewer, or Research templates.
- AC-17: `npm run typecheck`, `npm test`, and `npm run build` pass after the changes.
- AC-18: A manual review of the updated templates confirms that the Spec Brief can be read quickly and does not contain duplicate handoff sections removed by this brief.

## Edge cases
- Existing old Spec Briefs may contain `REQ-001` or removed sections. Architect should treat them as legacy input and use judgment rather than blindly translating them.
- A Spec Brief may be very short. Architect can ask for clarification or proceed with explicit assumptions depending on risk.
- A Spec Brief may still be long because the feature is large. Spec should consolidate and surface scope concerns, but this feature does not impose a numeric AC limit.
- A user may skip Spec and go directly to Architect. Architect's existing behavior should remain unchanged.
- A user may ask Architect not to use a Spec Brief. The Spec Brief is optional input, not a mandatory pipeline artifact.
- A Spec Brief may contain technical suggestions from user discussion. Architect should evaluate them as assumptions or constraints, not automatically adopt them as design decisions.
- If a persistent `brief.md` already exists, Architect's existing collision handling still applies; the Spec Brief does not overwrite it.

## Open questions
- None blocking. Developer should preserve the design intent above and avoid expanding scope into permissions, new files, or agent role changes.
