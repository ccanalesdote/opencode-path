# Tasks: Improve Architect Agent

## Status legend
- pending: not started
- in_progress: actively being implemented
- done: completed and verified for the stated task
- blocked: cannot proceed without input or prerequisite
- cancelled: intentionally no longer needed

## Task table
| ID | Status | Owner | Task | Covers | Verification | Notes |
|---|---|---|---|---|---|---|
| T-001 | done | Developer | Update `templates/architect.md` frontmatter permissions to remove legacy `*plan*.md` write/edit allowances while preserving work-folder artifact writes and `mkdir -p .path/work/*`. | AC-01, AC-02 | Inspect `templates/architect.md` frontmatter and confirm only `.path/work/*/{brief,tasks,progress}.md` artifact writes/edits remain for Architect. | Preserve `task: allow`; do not broaden Architect permissions. |
| T-002 | done | Developer | Refactor `templates/architect.md` prompt body to remove legacy plan sections and replace long artifact/write sections with compact work-folder-only rules. | AC-01, AC-02, AC-04, AC-05 | Search `templates/architect.md` for `Legacy Plan`, `plan-*.md`, `*plan*.md`, and legacy fallback wording; none should remain except a rule explaining that requested legacy plans should be redirected to `.path/work/{feature-slug}/`. | Keep mini-schema inline; do not move required structure to README-only docs. |
| T-003 | done | Developer | Add explicit handoff trigger semantics for phrases like "genera el plan", "generate the plan", "create the plan", "save the plan", "handoff this", "ready for implementation", and "estamos ok con esta feature". | AC-03, AC-04 | Read the updated Architect prompt and confirm these phrases map to persistent work-folder handoff and still require path confirmation before writing. | "Plan" must mean work-folder handoff, not chat-only or legacy file. |
| T-004 | done | Developer | Compress debate, hard rules, minimal implementation check, AC mapping, cross-session considerations, and in-chat output format without removing core guardrails. | AC-05, AC-06 | Read the updated prompt and confirm it still covers no application code, design protocol, minimalism, existing-project reconnaissance, migration/compatibility/operational/testing risks, and technology-agnostic validation. | Optimize for low ambiguity, not smallest possible token count. |
| T-005 | done | Developer | Update `README.md` to remove or revise references to legacy plans and Architect legacy permissions. | AC-07 | Search `README.md` for `legacy`, `plan-*.md`, `*plan*.md`, and "Legacy plan"; remaining references, if any, must not describe active Architect behavior. | Keep README aligned with installed template behavior. |
| T-006 | done | Developer | Run project validation commands and fix any issues caused by documentation/template changes. | AC-08 | Run `npm run typecheck`, `npm test`, and `npm run build`. | If validation is unrelatedly failing, document exact failure and suspected cause in progress. |

## Coverage notes
- AC-01 is covered by T-001 and T-002.
- AC-02 is covered by T-001 and T-002.
- AC-03 is covered by T-003.
- AC-04 is covered by T-002 and T-003.
- AC-05 is covered by T-002 and T-004.
- AC-06 is covered by T-004.
- AC-07 is covered by T-005.
- AC-08 is covered by T-006.

## Auditor notes
| Date | Related task | Severity | Status | Finding / resolution note | Suggested follow-up |
|---|---|---|---|---|---|
| 2026-06-17 | T-005 / full diff | major | open | Full working tree for this audit includes unrelated `templates/developer.md` changes and an untracked `.path/work/improve-developer-agent/` work folder, while this brief scopes implementation to `templates/architect.md` and README Architect references. This makes the architect feature diff non-isolated and contradicts progress line 210 saying Developer was not modified. | Split/revert the Developer-agent changes before merging this work, or explicitly audit and merge them under their own work folder/feature. |
| 2026-06-17 | T-005 / full diff | major | discarded | User clarified that `templates/developer.md` and `.path/work/improve-developer-agent/` belong to a separate concurrent implementation, not to this Architect feature. Finding is discarded for the Architect audit scope, but remains relevant if preparing a single combined merge. | When committing/PRing, keep the Architect and Developer changes separated or document that the merge intentionally contains both features. |
