# Brief: Improve Architect Agent

## Objective
Update the Architect agent prompt so it is more predictable, less ambiguous, and less likely to drift from its role while preserving enough inline structure to operate without external audits or examples.

## Problem
The current `templates/architect.md` prompt contains legacy `plan-*.md` support, long embedded artifact templates, repeated write/cross-session rules, and several overlapping guidance sections. This increases context noise and leaves ambiguous behavior around phrases like "genera el plan".

## Scope
- Modify the managed Architect template at `templates/architect.md`.
- Remove legacy `plan-*.md` workflow from Architect behavior and permissions.
- Make `.path/work/{feature-slug}/` the only persistent handoff format.
- Clarify that user phrases such as "genera el plan", "generate the plan", "create the plan", "save the plan", "handoff this", "ready for implementation", or "estamos ok con esta feature" mean: prepare a persistent implementation handoff in `.path/work/{feature-slug}/`.
- Preserve path confirmation and collision handling before writing artifacts.
- Replace long `brief.md`/`tasks.md`/`progress.md` templates with a compact, autosufficient mini-schema.
- Update README references that still mention legacy plans or Architect legacy permissions.

## Non-goals
- Do not change the role split between Architect, Developer, Auditor, Reviewer, Spec, Research, or Explore.
- Do not add new agents, plugins, commands, dependencies, or runtime shared prompt files.
- Do not make Architect implement application code.
- Do not introduce legacy fallback behavior under another name.
- Do not optimize solely for minimum token count; optimize for predictability and low hallucination risk.

## Constraints
- This project stores managed agent prompts under `templates/*.md` with YAML frontmatter permissions.
- `templates/architect.md` currently allows legacy `*plan*.md` writes/edits; those permissions should be removed if legacy support is removed.
- The README currently describes the workflow as including "legacy plans" and lists Architect as having "Legacy plan/work-folder artifact writes"; these references must be updated for consistency.
- opencode config/agent changes require restarting opencode after install or template changes are applied to a target environment.
- Validation commands known from `package.json`: `npm run typecheck`, `npm test`, and `npm run build`.

## Decisions
- Persistent Architect handoffs use only `.path/work/{feature-slug}/` with exactly `brief.md`, `tasks.md`, and `progress.md`.
- `.path/work/` is a literal path, not a placeholder for another project directory.
- Architect may create `.path/work/{feature-slug}/` after the user confirms the path; if `.path/work/` is missing, it is created as part of that path creation.
- Default conversation remains in chat while discussing, evaluating, or refining design.
- Any implementation handoff should go to the work folder, unless the user is explicitly only asking for conversational design and not a handoff.
- "Plan" means work-folder handoff, not `plan-*.md`.
- The prompt should retain compact required content for `brief.md`, `tasks.md`, and `progress.md` because there is no external auditor/eval to enforce artifact structure.

## Relevant files and areas
- `templates/architect.md`: primary prompt and frontmatter permissions to update.
- `README.md`: workflow, permissions, and usage documentation that may mention legacy plans.
- `package.json`: validation commands.
- Optional search targets: occurrences of `legacy`, `plan-*.md`, `*plan*.md`, `Legacy Plan`, `Write Rules`, `Work Folder Structures`, and `Cross-session`.

## Acceptance Criteria
- AC-01: `templates/architect.md` no longer documents or permits legacy `plan-*.md` artifact creation or editing.
- AC-02: `templates/architect.md` defines `.path/work/{feature-slug}/` as the only persistent handoff format with `brief.md`, `tasks.md`, and `progress.md`.
- AC-03: `templates/architect.md` explicitly treats "genera el plan" / "generate the plan" style phrases as triggers for a persistent work-folder implementation handoff.
- AC-04: `templates/architect.md` still requires path confirmation before writing, collision inspection, no auto-incrementing, and no silent overwrites.
- AC-05: `templates/architect.md` keeps a compact mini-schema for required content in `brief.md`, `tasks.md`, and `progress.md`, including AC IDs and `tasks.md` `Covers` mapping.
- AC-06: `templates/architect.md` preserves core Architect behavior: design before code, no application-code writing, no Developer/Auditor delegation, minimalism check, tradeoff comparison, and technology-agnostic validation guidance.
- AC-07: README references are consistent with the new Architect behavior and no longer advertise legacy plans as part of the workflow.
- AC-08: Project validation passes using the documented commands: `npm run typecheck`, `npm test`, and `npm run build`.

## Edge cases
- User asks for `plan-001-auth.md`: Architect should explain that persistent handoffs now use `.path/work/{feature-slug}/`, propose or ask for a folder path, and not write a legacy file.
- User says "genera el plan" without a slug: Architect should propose a kebab-case `.path/work/{feature-slug}/` and wait for confirmation before writing.
- User says "genera el plan en `.path/work/foo/`": Architect should inspect for collisions and write only if no existing files conflict, or ask reuse/append/replace/stop if they do.
- `.path/work/` does not exist: Architect may create `.path/work/{feature-slug}/` after path confirmation.
- Existing `brief.md`, `tasks.md`, or `progress.md` exists in the target folder: Architect must ask whether to reuse, append, replace, or stop.
- User only wants design discussion, not a handoff: Architect should respond in chat and not create files.

## Open questions
- None.
