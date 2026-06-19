# Brief: Spec Agent Improvements

## Objective
Refine the `Spec` agent so it preserves the compact Spec Brief handoff now on `main`, while adding two guardrails from the previous `improve-spec-agent` exploration: avoid unnecessary clarification when a request is already clear, and keep the user in control of whether a final Spec Brief is produced.

## Problem
`Spec` currently clarifies vague or incomplete requests and can produce a compact Spec Brief for Architect. After merging the compact handoff format, there are still useful behavioral improvements from `opencode-path-improve-spec-agent`: Spec should not manufacture questions when there is nothing material to clarify, and it should not produce a final handoff unless the user explicitly asks. Without these guardrails, Spec may either over-interview users or appear to initiate the Architect handoff on its own.

## Scope
- Update `templates/spec.md` only.
- Preserve the compact Spec Brief format already present on `main`.
- Add explicit guidance that if there is nothing material to clarify, Spec should state that the request appears ready for Architect and ask whether the user wants a Spec Brief prepared.
- Add explicit guidance that Spec may suggest Architect as the next step, but must not invoke Architect, simulate a handoff, or emit the final Spec Brief without user confirmation.
- Keep the change small, localized, and textual.

## Non-goals
- Do not reintroduce the long handoff format from `opencode-path-improve-spec-agent`.
- Do not add standalone `REQ-*`, `Requirements`, `Current behavior`, `Suggested Validation`, `Notes for technical design`, `Out of scope`, or `Non-functional requirements` sections to the final Spec Brief.
- Do not change Architect, Developer, Auditor, Reviewer, Research, README, package metadata, installer scripts, or opencode configuration.
- Do not create new agents, tools, dependencies, or validation infrastructure.
- Do not modify runtime behavior beyond the template text.

## Constraints
- Base worktree: `../opencode-path-spec-agent-improvements/`.
- Branch: `feature/spec-agent-improvements`.
- Base commit: `b44559c91c5c06a66f67c7241095772496375d9e` on `main`.
- Existing reference worktree: `../opencode-path-improve-spec-agent/` can be used as read-only context, but should not be merged into this branch.
- The current compact Spec Brief format in `templates/spec.md` is the preferred baseline.
- The user explicitly decided that initiative for the final handoff should come from the user; Spec should suggest, not proceed automatically.

## Decisions
- Use the current `main` version of `templates/spec.md` as the source of truth.
- Implement this as a minimal template wording change, not a structural rewrite.
- Add the “ready for Architect” behavior as a suggestion-and-confirmation pattern, not as automatic Spec Brief generation.
- Keep validation hints embedded in acceptance criteria when useful; do not restore a standalone validation section in the final Spec Brief.

## Relevant files and areas
- `templates/spec.md` — only intended implementation target.
- `../opencode-path-improve-spec-agent/templates/spec.md` — read-only reference for wording ideas; do not merge wholesale.
- Current `main/templates/spec.md` around:
  - `## Interview Mode`
  - `## Core protocol`
  - `## Hard rules`
  - `## Output format during clarification`
  - `## Output format for the Spec Brief handoff`

## Acceptance Criteria
- AC-01: `templates/spec.md` tells Spec not to ask unnecessary clarification questions when there is nothing material to clarify.
- AC-02: `templates/spec.md` tells Spec to say the request appears ready for Architect and ask whether the user wants a Spec Brief prepared, instead of emitting the final Spec Brief automatically.
- AC-03: `templates/spec.md` explicitly says Spec may suggest Architect as the next step but must not invoke Architect, simulate the handoff, or produce the final Spec Brief without user confirmation.
- AC-04: The compact final Spec Brief format remains intact and does not reintroduce standalone `Requirements`, `REQ-*`, `Current behavior`, `Suggested Validation`, `Notes for technical design`, `Out of scope`, or `Non-functional requirements` sections.
- AC-05: The change is limited to `templates/spec.md` plus this `.path/work/spec-agent-improvements/` handoff folder.

## Edge cases
- A user asks a clear request and says “ready for Architect” explicitly: Spec may produce the final Spec Brief because the user initiated the handoff.
- A user asks a clear request but does not ask for a brief: Spec should suggest that it appears ready for Architect and ask whether to prepare the Spec Brief.
- A user asks for technical implications: Spec may frame implications as considerations for Architect, but must not design the architecture.
- A vague request still requires clarification; the new “ready” rule should not suppress necessary questions.
- Avoid wording that implies Spec can call, delegate to, or switch to Architect automatically.

## Open questions
- None. The user decided that Spec should suggest handoff readiness and wait for explicit confirmation before producing the final Spec Brief.
