# Brief: Flexible Handoff Modes

## Objective
Replace the current "every persistent handoff gets a worktree" rule with a user-chosen, flexible handoff flow that supports direct chat handoffs, persistent handoffs in the current checkout, and persistent handoffs in a dedicated worktree.

## Problem
The current worktree isolation plan made every persistent `.path/work/{slug}/` handoff create a sibling Git worktree and `feature/{slug}` branch. That solved parallel diff isolation, but it is too rigid for short or non-parallel work. It also creates logical pressure in other agents: Developer's close procedure assumes worktree-oriented closure, and Auditor currently over-requires a `.path/work/{slug}` slug even when the user only wants a product/code audit of a direct-chat implementation.

The better model is to keep worktrees as an explicit option for parallel Developer work, while allowing lower-friction handoffs when parallelism and diff isolation are not needed.

## Scope
- Update `templates/architect.md` so Architect presents three handoff modes when the user asks to create/save/handoff a plan:
  1. direct chat handoff,
  2. persistent handoff in the current checkout,
  3. persistent handoff in a dedicated worktree.
- Architect may recommend one mode based on the situation, but must wait for the user's explicit choice before writing artifacts or creating a worktree.
- Preserve the existing worktree creation flow, collision checks, path/branch/base confirmation, and sibling worktree permissions for mode 3.
- Restore/support current-checkout `.path/work/{slug}/` creation for mode 2.
- Update `templates/developer.md` so Developer treats direct instructions, current-checkout work folders, and sibling-worktree work folders as valid modes, and generalizes the close/finish procedure accordingly.
- Update `templates/auditor.md` so Auditor supports product-only/direct-chat audits without requiring a slug, while still requiring a single slug when auditing work-folder artifacts.

## Non-goals
- Do not remove the worktree option.
- Do not delete `.path/work/worktree-isolation-parallel-features/` or rewrite its history.
- Do not add a CLI wrapper or automation command.
- Do not add dynamic OpenCode permissions for external worktrees.
- Do not modify source code outside agent templates unless a direct reference forces it.
- Do not change Reviewer, Spec, Research, or Explore templates.
- Do not make Architect auto-select the handoff mode without user confirmation.

## Constraints
- This project customizes OpenCode agents; prompt changes live primarily in `templates/*.md` and should remain in English.
- OpenCode agent/config changes require restarting OpenCode before they affect running sessions.
- Preserve permission safety: Auditor remains read-only except narrow work-folder audit-note writes; Developer still never pushes; Architect still only writes handoff artifacts.
- Current `templates/architect.md` has frontmatter permissions for both `.path/work/*` and `../*/.path/work/*`; keep both if both modes remain supported.
- Current `templates/architect.md` text explicitly says persistent handoffs use sibling worktree flow and must not create current-checkout `.path/work/{slug}/`; this must be replaced.
- Current `templates/developer.md` is already mostly compatible with direct instructions and current-checkout work folders, but its close procedure is titled and written around worktree features.
- Current `templates/auditor.md` currently says every audit is scoped to exactly one `feature-slug`; that must be narrowed to work-folder audits only.

## Decisions
- Use three user-facing handoff modes:
  - **Mode 1: Direct chat handoff** — for short, clear, low-risk implementation tasks. Architect responds in chat only; no files, branch, or worktree.
  - **Mode 2: Persistent handoff, current checkout** — for cross-session persistence when parallel Developer execution is not needed. Architect creates `.path/work/{slug}/` in the current checkout.
  - **Mode 3: Persistent handoff, dedicated worktree** — for parallel implementation, isolated diffs, or larger features. Architect creates `../{repo-name}-{slug}/`, branch `feature/{slug}`, and `.path/work/{slug}/` inside that worktree.
- Architect should provide a brief recommendation, but the user chooses the mode explicitly.
- Developer should infer mode from the user's input/path and verify only what is relevant to that mode.
- Auditor should distinguish product/code audit scope from work-folder artifact scope.

## Relevant files and areas
- `templates/architect.md`
  - `## Work-folder handoff rules`
  - `### Path confirmation`
  - `### Collision handling`
  - `### Worktree isolation for parallel features`
  - frontmatter permissions for `.path/work/*` and `../*/.path/work/*`
- `templates/developer.md`
  - `Workflow` step 2
  - `## Close procedure (worktree features)`
  - completion report format
- `templates/auditor.md`
  - `## How I work`
  - `Audit scope (single feature-slug)`
  - `Audit protocol`
  - `Work-folder notes`
  - output format

## Acceptance Criteria
- AC-01: Architect no longer states that every persistent handoff must use a dedicated worktree.
- AC-02: When a user asks to save/create/generate/handoff a plan without specifying a mode, Architect presents the three handoff modes, gives at most one recommendation, and waits for the user's explicit mode choice before writing files or creating a worktree.
- AC-03: Mode 1 direct chat handoff is documented as valid: Architect returns the implementation handoff in chat and does not create `.path/work`, a branch, or a worktree.
- AC-04: Mode 2 current-checkout persistent handoff is documented as valid: Architect confirms the slug, checks for `.path/work/{slug}/` collisions in the current checkout, creates `.path/work/{slug}/`, and writes exactly `brief.md`, `tasks.md`, and `progress.md` there.
- AC-05: Mode 3 dedicated-worktree persistent handoff preserves existing safety behavior: derive paths from `pwd`, check sibling directory/worktree/branch collisions, confirm worktree path, work folder path, branch, and base, then create the worktree and write artifacts inside it.
- AC-06: Architect permissions still allow writing handoff artifacts in both `.path/work/*` and `../*/.path/work/*`, and still do not allow broader source/config edits.
- AC-07: Developer workflow explicitly accepts all three modes: direct user instructions, current-checkout work folder, and sibling-worktree work folder.
- AC-08: Developer only verifies a sibling worktree root when the provided work folder or user instruction indicates a sibling-worktree mode; it does not require a worktree for current-checkout or direct-chat work.
- AC-09: Developer's close/finish procedure is generalized so commits may be handled for current checkout or worktree work, but worktree cleanup recommendations are only given for dedicated-worktree mode.
- AC-10: Developer still never runs `git push`, and does not automatically remove worktrees, delete branches, or delete `.path/work/{slug}/`.
- AC-11: Auditor no longer requires a `feature-slug` for every audit. Product-only/direct-chat audits without work-folder artifacts are valid and return findings in chat only.
- AC-12: When Auditor is asked to audit work-folder artifacts, it still establishes exactly one `.path/work/{feature-slug}/` scope and ignores unrelated `.path/work/*` folders.
- AC-13: Auditor product/code diff scope still excludes `.path/work/**` when a work-folder audit is in progress, so unrelated workflow artifacts are not mixed into product findings.
- AC-14: Auditor output format supports both cases: with a feature slug/work folder and without one.
- AC-15: The implementation changes only intended templates plus this new work folder's task/progress updates; it does not modify old plan folders or unrelated agents.

## Edge cases
- User says "generate the plan" but does not choose a mode: Architect must present options and stop, not silently create a worktree.
- User names a slug and also says "no worktree": use mode 2 if confirmed, not mode 3.
- User names a slug and explicitly says "parallel", "separate Developer", "isolate diff", or "worktree": recommend mode 3, but still confirm before creation.
- User wants chat-only handoff but also asks to "save" it: ask which requirement wins; do not both avoid files and create files silently.
- Current-checkout `.path/work/{slug}/` exists: ask whether to reuse, append, replace, stop, or choose a different slug.
- Sibling worktree path or branch exists for mode 3: ask how to proceed; do not auto-increment.
- Auditor receives a vague "audit this" after direct-chat implementation: audit product/code diff in the current working tree and state that no work-folder traceability was available.
- Auditor receives a vague "audit the plan" with multiple `.path/work/*` folders: list available slugs and ask which one to audit.
- Developer receives a work-folder path from a sibling worktree while running in the main checkout: stop and tell the user to open/switch to an OpenCode session rooted in that worktree, or provide explicit permission/path context; do not edit the wrong checkout.

## Open questions
- None blocking. User agreed that Architect should present options, provide a recommendation, and leave the final handoff mode decision to the user.
