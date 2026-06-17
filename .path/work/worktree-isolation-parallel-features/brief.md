# Brief: Worktree Isolation for Parallel Features

## Objective
Make opencode-path safe for parallel feature implementation by giving every new work-folder handoff its own dedicated Git worktree and feature branch.

## Problem
Today, concurrent features can be implemented in the same working tree and branch. Their changes appear in one shared `git diff`, so Auditor's full-diff protocol can report legitimate changes from another in-progress feature as out-of-scope or unrelated. Parallel work with two or three features is a normal workflow and must not degrade audit quality.

## Scope
- Update `templates/architect.md` so persistent work-folder handoffs are created inside a dedicated sibling worktree.
- Update `templates/developer.md` so Developer works and closes features from the correct worktree, commits only on explicit close/commit requests, and never pushes.
- Update `templates/auditor.md` so Auditor treats the current working tree's full diff as the in-scope feature diff and keeps read-only permissions.
- Add only focused prompt and permission changes needed for worktree isolation.

## Non-goals
- No CLI wrapper such as `opencode-path start` or `opencode-path finish`.
- No automatic push by any agent.
- No automatic merge to main by any agent.
- No automatic worktree removal, branch deletion, or `.path/work/{slug}/` deletion.
- No cross-worktree coordination or dashboard.
- No README update.
- No tests for this prompt-and-permission-only change unless the user later asks.
- No changes to Reviewer, Spec, Research, or Explore templates.

## Constraints
- Prompts must remain in English.
- The change should be expressible as edits to `templates/architect.md`, `templates/developer.md`, and `templates/auditor.md` only.
- Preserve the Prompt Diet: add compact, bounded sections rather than large repeated policy blocks.
- Architect must confirm all derived paths and branch name before creating a handoff.
- Architect must use a sibling worktree path of `../{repo-name}-{slug}/`, where `{repo-name}` is the basename of the current path from `pwd`.
- Architect must avoid shell command substitution such as `basename $(pwd)` because current permission rules deny command substitution.
- The work folder must live inside the new worktree at `.path/work/{slug}/`, not inside the original main checkout.
- Developer may keep mutating Git operations as `ask` except `git push`, which must remain denied unconditionally.
- Auditor permissions must remain read-only for Git and source files, with only the existing narrow work-folder note-append exception.

## Decisions
- Use one slug per work folder. Do not add a special naming convention for large features split across multiple plans.
- Always create a worktree for every new persistent work-folder handoff, including small features. The uniform rule is more valuable than optimizing away small overhead.
- Use branch `feature/{slug}` for each worktree.
- Architect's confirmation message must include: worktree path, work folder path, branch name, and that the worktree will be created from the current `HEAD`.
- Use option A for cross-worktree artifacts: Architect may create and write the `.path/work/{slug}/` files inside the sibling worktree after user confirmation.
- Developer close procedure is only triggered by explicit user intent such as “close the worktree”, “finish the feature”, or “commit and close”.
- Developer close procedure should verify the current worktree, commit pending changes in logical units, report commits created, and recommend exact push and cleanup commands without running push or cleanup.
- If the worktree is clean, Developer reports that there is nothing to commit and does not invent commits.
- If the user asks to push, Developer refuses and tells the user to run the recommended push manually.
- Auditor may use read-only worktree/context evidence. If exactly one work folder is clearly detectable, it may use it as scope reference; if zero or multiple are detectable and the user did not name one, it must ask.

## Relevant files and areas
- `templates/architect.md`
  - Frontmatter permissions for `bash`, `edit`, and `write`.
  - `## Work-folder handoff rules`, especially path confirmation and creation.
  - Work-folder mini-schema path examples.
- `templates/developer.md`
  - Frontmatter `bash` permissions for Git inspection, commits, worktree inspection, push denial, and optional cleanup commands remaining ask-level.
  - `Workflow` and `Hard rules` sections.
  - Completion report format, if close-procedure reporting needs a compact addition.
- `templates/auditor.md`
  - Frontmatter `bash` permissions must remain read-only.
  - `## Tools and hard rules` full-diff wording.
  - `## Audit protocol` step 1 scope establishment.

## Acceptance Criteria
- AC-01: When the user triggers persistent work-folder handoff creation, Architect confirms the worktree path, work folder path, branch name, and current-HEAD base before creating anything.
- AC-02: After confirmation, Architect creates the worktree with `git worktree add ../{repo-name}-{slug} -b feature/{slug}` or an equivalent explicitly approved command that preserves the same path and branch.
- AC-03: After worktree creation, branch `feature/{slug}` exists locally and is checked out in `../{repo-name}-{slug}/`.
- AC-04: The work folder `.path/work/{slug}/` exists inside the new worktree, not inside the original main checkout.
- AC-05: Architect detects an existing sibling worktree path or existing `feature/{slug}` branch and asks the user how to proceed instead of overwriting, reusing, or auto-incrementing silently.
- AC-06: Two or more worktrees for different slugs can coexist, each on its own `feature/{slug}` branch.
- AC-07: When Developer implements a task from a work folder, it works in the worktree associated with that work folder and keeps the diff isolated to that worktree.
- AC-08: Developer performs close-procedure steps only after explicit close/finish/commit-and-close user intent, not during ordinary implementation.
- AC-09: During close procedure, Developer verifies the current worktree with `git status`, `git worktree list`, and/or `git rev-parse --show-toplevel` before committing or recommending cleanup.
- AC-10: During close procedure, Developer commits pending changes in logical units, one commit per task or coherent change, with messages referencing the task ID or AC where applicable.
- AC-11: During close procedure, Developer reports commits created and recommends the exact manual push command, normally `git push -u origin feature/{slug}`, while noting that the user should adjust the remote if it is not `origin`.
- AC-12: Developer never runs `git push`, even if the user asks during close procedure.
- AC-13: Developer does not automatically run worktree removal, branch deletion, or `.path/work/{slug}/` deletion. It only recommends exact cleanup commands for the user to run manually.
- AC-14: If close is requested and the worktree is clean, Developer reports that there is nothing to commit and skips commit creation.
- AC-15: If close is requested from the wrong working tree, Developer stops with a clear message and does not commit or recommend destructive cleanup for the wrong path.
- AC-16: Auditor audits the working tree it is running in; the full diff in that working tree is the default in-scope feature diff.
- AC-17: Auditor does not assume unrelated features are present in the same diff and does not report other worktrees as out-of-scope changes merely because they exist elsewhere.
- AC-18: Auditor permissions remain read-only; no mutating Git permission is granted to Auditor.

## Edge cases
- Repo name has spaces or special characters: derive it from the current `pwd` basename and quote paths in commands where needed.
- Sibling path `../{repo-name}-{slug}/` already exists: Architect must ask the user how to proceed.
- Branch `feature/{slug}` already exists: Architect must ask the user how to proceed.
- Existing `.path/work/{slug}/` is found in the original main checkout from the old flow: Architect must ask whether to leave it, copy/move manually, or choose a different slug; it must not move it silently.
- User starts two plans for one large feature: each plan still gets its own slug, worktree, and branch. Integration between branches is the user's responsibility.
- User starts from `main` or another branch: Architect must state the worktree will be created from current `HEAD`; the user's confirmation accepts that base.
- Developer is asked to close with uncommitted changes: Developer commits them in logical units or asks the user how to handle ambiguous changes; it must not discard them silently.
- Developer is asked to close with no changes: report clean state and recommend optional cleanup only if the feature branch/worktree relationship is verified.
- User asks Developer to push: Developer refuses and provides the manual command.
- User asks Developer to merge: Developer does not perform project integration as part of this close flow; merging remains user-owned outside the agent workflow.
- Auditor is asked to audit but cannot identify a work folder and the user did not name one: Auditor asks for scope before proceeding with work-folder traceability notes.

## Open questions
- None for implementation. The user accepted the proposed design decisions: one slug, always worktree, Architect confirms branch/path/base in one message, and Architect may write artifacts into sibling worktrees.
