# Tasks: Worktree Isolation for Parallel Features

## Status legend
- pending: not started
- in_progress: actively being implemented
- done: completed and verified for the stated task
- blocked: cannot proceed without input or prerequisite
- cancelled: intentionally no longer needed

## Task table
| ID | Status | Owner | Task | Covers | Verification | Notes |
|---|---|---|---|---|---|---|
| T-001 | done | Developer | Update Architect template permissions and handoff rules so every persistent work-folder handoff is created inside a confirmed sibling Git worktree on `feature/{slug}`. | AC-01, AC-02, AC-03, AC-04, AC-05, AC-06 | Inspect `templates/architect.md` diff and verify it includes permission support for worktree creation/collision checks and prompt rules for confirming worktree path, work folder path, branch, and current-HEAD base. | Keep the section compact. Do not re-expand the prompt beyond the focused worktree behavior. |
| T-002 | done | Developer | Update Developer template permissions and workflow for worktree-aware implementation and explicit close procedure. | AC-07, AC-08, AC-09, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15 | Inspect `templates/developer.md` diff and verify it keeps `git push*` denied, allows/readies required inspection commands, and documents close procedure triggers, verification, commits, reports, and manual push/cleanup recommendations. | Mutating Git operations other than push may remain `ask`; do not hard-deny merge/cleanup beyond existing user-approved behavior unless required by current permissions. |
| T-003 | done | Developer | Update Auditor template so full-diff auditing is explicitly scoped to the current working tree/worktree and permissions remain read-only. | AC-16, AC-17, AC-18 | Inspect `templates/auditor.md` diff and verify no mutating Git permissions were added; audit protocol step 1 refers to the current working tree's diff and work-folder scope detection/ambiguity behavior. | Auditor may use read-only context to identify scope, but must ask when scope is ambiguous. |
| T-004 | done | Developer | Perform final self-review of the focused template-only diff for consistency, permission ordering, and no out-of-scope files. | AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-09, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16, AC-17, AC-18 | Run or inspect the project's documented validation path if available; at minimum inspect `git diff -- templates/architect.md templates/developer.md templates/auditor.md` and confirm no other files are changed except work-folder progress/task updates. | If no project validation command is known, first inspect README/config/CI to identify one rather than inventing a stack-specific command. |

## Coverage notes
- AC-01 is covered by T-001 and T-004.
- AC-02 is covered by T-001 and T-004.
- AC-03 is covered by T-001 and T-004.
- AC-04 is covered by T-001 and T-004.
- AC-05 is covered by T-001 and T-004.
- AC-06 is covered by T-001 and T-004.
- AC-07 is covered by T-002 and T-004.
- AC-08 is covered by T-002 and T-004.
- AC-09 is covered by T-002 and T-004.
- AC-10 is covered by T-002 and T-004.
- AC-11 is covered by T-002 and T-004.
- AC-12 is covered by T-002 and T-004.
- AC-13 is covered by T-002 and T-004.
- AC-14 is covered by T-002 and T-004.
- AC-15 is covered by T-002 and T-004.
- AC-16 is covered by T-003 and T-004.
- AC-17 is covered by T-003 and T-004.
- AC-18 is covered by T-003 and T-004.

## Auditor notes
| Date | Related task | Severity | Status | Finding / resolution note | Suggested follow-up |
|---|---|---|---|---|---|
| 2026-06-17 | T-001 | major | resolved | `templates/architect.md:119-125` still instructs Architect to confirm/create `.path/work/{feature-slug}/` in the current checkout before the new worktree flow, which can contradict AC-01/AC-04 and lead to old-flow artifact creation. | Developer: revise the old Path confirmation section so persistent handoffs confirm the sibling worktree path/work folder/branch/base together and do not create current-checkout `.path/work/{slug}/` for new handoffs. |
| 2026-06-17 | T-001 | minor | resolved | `templates/architect.md:142-145` only checks `git worktree list` and `git branch --list`; a pre-existing sibling directory that is not a registered worktree is not detected before `git worktree add`, despite the edge case in `brief.md:84`. | Developer/Architect: either add an allowed non-mutating directory existence check and prompt rule, or narrow the documented edge case/AC to registered worktrees only. |
| 2026-06-17 | T-001 | blocker | resolved | Re-audit: the directory-collision fix now instructs Architect to run `ls -d ../{repo-name}-{slug}` at `templates/architect.md:143-145`, but Architect bash permissions at `templates/architect.md:21-34` do not allow `ls*`; with `*`: `deny`, the required collision check cannot run. | Developer: added narrow Architect bash allow rule `"ls -d ../*": "allow"` to frontmatter so the directory existence check is executable while keeping compound operators and command substitution denied. |
| 2026-06-17 | T-001 | minor | resolved | Re-audit: the `ls -d` permission blocker is resolved, but the worktree commands in `templates/architect.md:144-158` remain unquoted even though `brief.md` lists repo names with spaces/special characters as an edge case requiring quoted paths. The added permission also only covers the unquoted `ls -d ../*` form. | Developer/Architect: either update the prompt and permissions to support quoted sibling paths for space-containing repo names, or explicitly narrow/remove that edge-case claim from the brief before treating it as covered. |
| 2026-06-17 | T-001 | none | verified | Focused re-audit: quoted-path edge case is resolved for the mentioned commands. `templates/architect.md` now documents quoted `ls -d`, `git worktree add`, and `mkdir -p` forms, and bash permissions include quoted `ls -d` and quoted `mkdir -p` patterns while keeping compound/evaluation denies. | No follow-up for the quoted-path edge case. |
