# OpenCode Path

A structured multi-agent workflow for [opencode](https://opencode.ai) that separates concerns, minimizes blast radius, and optimizes model usage by role.

## Overview

This workflow defines 6 specialized agents with clear responsibilities:

| Agent | Role | Mode | Permissions |
|-------|------|------|-------------|
| **Spec** | Clarifies vague stories into testable specs before design | Primary | Read-only, no bash |
| **Architect** | Designs system architecture, produces structured design decisions | Primary | Legacy plan/work-folder artifact writes + `mkdir -p .path/work/*` |
| **Developer** | Implements code changes end-to-end | Primary | Broad application edit/write + risk-based bash policy |
| **Auditor** | Audits existing work for failures, risks, and gaps | Primary | Read-only + narrow proactive append-only audit notes for explicit work folders |
| **Research** | Researches documentation, APIs, SDK behavior, and best practices | Primary | Read-only, no bash |
| **Reviewer** | Reviews code changes, returns PASS/FAIL verdict | Subagent | Read-only + inspection commands + confirmation for project-specific validation |
| **Explore** | Fast codebase exploration | Subagent (built-in) | Read-only |

### Key Design Principles

1. **Blast Radius Minimization**: Only Developer modifies application code broadly. Architect can create/write handoff artifacts, Reviewer is strictly read-only, and Auditor may only append narrow audit notes when auditing an explicit or clearly detectable work folder.
2. **Separation of Concerns**: Clarify (Spec) → Research (Research) → Design (Architect) → Implement (Developer) → Review (Reviewer) → Audit (Auditor).
3. **Cross-Session Planning**: Architect produces self-contained cross-session artifacts, preferably under `.path/work/<kebab-feature>/`.
4. **Granular Permissions**: Risk-based bash policy for Developer; Reviewer is strictly read-only; Auditor is read-only for code with a narrow work-folder audit-note exception; Architect can only create work-folder directories under `.path/work/`.
5. **Model-Agnostic by Default**: No models are hardcoded. Use `opencode-path models` to configure models explicitly for each agent.
6. **Stack Profiles via Opt-In Command**: The CLI installs agnostic agent templates by default. Stack-specific permission profiles (test runners, linters, type checkers) are added separately via `opencode-path profiles`, keeping the base install clean and technology-agnostic.

## Why not an orchestrator?

Many opencode plugins solve multi-agent workflows with an orchestrator — a router that reads your prompt and picks the agent automatically. That model works well when you want to stay hands-off and let the system decide the next step.

This pack takes the opposite stance. The flow is **user-driven**: you choose which agent to talk to, in what order, and when to switch. The Clarify → Research → Design → Implement → Review → Audit sequence is a guide you follow, not a pipeline that runs on its own. Each agent is a specialist with its own permissions, model, and personality.

The whole pack is designed as a **lightweight SDD**: specs, work folders, legacy plans, and audits stay as readable artifacts you own. The trade-off is explicit — you give up automation in exchange for control, visibility, and predictability. If you want the system to make those decisions for you, an orchestrator plugin is a better fit, and that's a perfectly valid choice.

## Installation

### Install the CLI

```bash
# Install globally
npm install -g opencode-path

# Or run directly with npx
npx opencode-path init

# Or install from source
git clone <your-repo-url>
cd opencode-path
npm install
npm run build
node dist/cli.js init
```

### Install the workflow pack

```bash
# Initialize the pack into your project or global config
opencode-path init
```

The `init` command prompts you to choose between:

- **Project install**: writes to `./.opencode/agent/` and `./.opencode/opencode.json`
- **Global install**: writes to `~/.config/opencode/agent/` and `~/.config/opencode/opencode.json`

`init` presents a checkbox list of all managed agents (custom workflow agents plus built-in `plan`, `build`, and `explore`). You can:

- Install missing custom agents (by checking them)
- Restore hidden built-in agents (by checking them)
- Already-active agents are shown as selected and cannot be removed via `init`

Managed agents installed by `init`:

- `agent/spec.md` — Spec agent (custom)
- `agent/architect.md` — Architect agent (custom)
- `agent/developer.md` — Developer agent (custom)
- `agent/auditor.md` — Auditor agent (custom)
- `agent/reviewer.md` — Reviewer agent (custom)
- `agent/research.md` — Research agent (custom)
- `plan` — Plan agent (built-in, managed in opencode config)
- `build` — Build agent (built-in, managed in opencode config)
- `explore` — Explore agent (built-in, managed in opencode config)
- `opencode.json` — OpenCode config

Installed custom agent files include a hidden marker (`<!-- managed-by: opencode-path -->`) so the CLI can distinguish workflow-managed files from manual files.

If a manual file exists at a managed agent path without the managed marker, `init` will report a **conflict** and will not overwrite or modify it. Resolve conflicts manually.

The `init` command installs technology-agnostic agent templates without any model configured. Built-in agents (`plan`, `build`, `explore`) are active by default even without running `init` — they are native to opencode and don't require installation. To set up models, run `opencode-path models` (works without init for built-ins). To add stack-specific validation commands (test runners, linters, type checkers), run `opencode-path profiles` after init.

**Restart opencode** after installation.

### Manage agents

```bash
opencode-path agents
```

The `agents` command provides full management of the workflow agent lifecycle. Unlike `init` (which is add/restore only), `agents` can also deactivate agents:

- **Checked agents** → active (custom agents are installed, hidden built-ins are restored)
- **Unchecked custom agents** → their `.md` files are deleted (with confirmation)
- **Unchecked built-ins** (`plan`, `build`, `explore`) → hidden via `agent.<name>.disable: true` in `opencode.json` (not physically deleted)
- **Conflict agents** (manual files without the managed marker) → displayed but not modifiable

Key behaviors:

| Operation | Custom agent | Built-in agent (plan, build, explore) |
|-----------|-------------|------------------------------|
| Activate | Install `.md` file from template | Remove `disable: true` from config |
| Deactivate | Delete `.md` file | Set `disable: true` in config |
| Preserve model/config | File is deleted (model is in the file) | All config fields (model, permissions, description) are preserved when hidden/restored |

**Restart opencode** after changing agents.

### Configure models

```bash
opencode-path models
```

The `models` command only shows **active managed agents** — agents that are currently installed and not hidden. If you deactivate an agent via `opencode-path agents`, it will no longer appear in the model selection.

The command lets you select an agent and choose from the models exposed by OpenCode:

```bash
opencode models
```

If OpenCode cannot provide a model list, or if you need a model that is not listed, choose `Custom model...` and enter the model ID manually.

| Agent | Where the model is stored | Example model |
|-------|--------------------------|----------------|
| spec | `agent/spec.md` frontmatter `model:` field | `anthropic/claude-haiku-4-5` |
| architect | `agent/architect.md` frontmatter `model:` field | `anthropic/claude-sonnet-4-6` |
| developer | `agent/developer.md` frontmatter `model:` field | `anthropic/claude-sonnet-4-6` |
| auditor | `agent/auditor.md` frontmatter `model:` field | `anthropic/claude-sonnet-4-6` |
| reviewer | `agent/reviewer.md` frontmatter `model:` field | `anthropic/claude-haiku-4-5` |
| research | `agent/research.md` frontmatter `model:` field | `anthropic/claude-haiku-4-5` |
| plan | `opencode.json` `agent.plan.model` field | `anthropic/claude-sonnet-4-6` |
| build | `opencode.json` `agent.build.model` field | `anthropic/claude-sonnet-4-6` |
| explore | `opencode.json` `agent.explore.model` field | `anthropic/claude-haiku-4-5` |

Custom agent models (spec, architect, developer, auditor, reviewer, research) are written into the agent file's YAML frontmatter. Built-in agent models (plan, build, explore) are written into the OpenCode config file because they are built-in opencode agents, not template files.

Built-in agents are active by default even without running `init`. The `models` command works without init for configuring built-in agent models.

If no active managed agents are found, `models` shows a clear message and exits. Since built-ins (`plan`, `build`, `explore`) are active by default, `models` will always have agents to configure unless all built-ins have been hidden.

Model IDs should use the `provider/model-id` format (e.g., `anthropic/claude-sonnet-4-6`, `openai/gpt-5.5`).

The `models` command runs in a loop — after setting a model for one agent, it asks if you want to configure another.

**Restart opencode** after changing models.

### Apply stack profiles

```bash
opencode-path profiles
```

The `profiles` command shows a list of available stack profiles and lets you select one or more to apply. Profiles are inserted into the agent files at a designated marker line using idempotency markers, so re-running the command does not duplicate blocks.

**Note**: Profiles only apply to **active managed custom agents** — specifically `developer`, `reviewer`, and `auditor`. If these agents are missing, deleted, or in conflict, they are skipped. If no active patchable agents exist, `profiles` shows a clear message and exits.

See [Stack Profiles](#stack-profiles) below.

**Restart opencode** after applying profiles.

### Recommended Model Strategy

| Agent | Recommended Model Tier | Rationale |
|-------|----------------------|-----------|
| **Spec** | Mid-tier (e.g., Claude Haiku, GPT-4-mini) | Structured clarification, not deep reasoning |
| **Architect** | High-capability (e.g., Claude Sonnet, GPT-4) | Complex reasoning, tradeoff analysis |
| **Developer** | High-capability (e.g., Claude Sonnet, GPT-4) | Code generation, multi-step implementation |
| **Auditor** | High-capability (e.g., Claude Sonnet, GPT-4) | Fault diagnosis, pattern recognition |
| **Research** | Mid-tier (e.g., Claude Haiku, GPT-4-mini) | Documentation lookup, summarization |
| **Reviewer** | Mid-tier (e.g., Claude Haiku, GPT-4-mini) | Structured verification, lower token cost |
| **Explore** | Mid-tier (e.g., Claude Haiku, GPT-4-mini) | Fast codebase scanning |

### Example full configuration

```bash
opencode-path init
# Choose: Project .opencode/
# Select which agents to install/restore

opencode-path models
# Configure models for active agents:
# Select: architect → anthropic/claude-sonnet-4-6
# Select: developer → anthropic/claude-sonnet-4-6
# Select: auditor → anthropic/claude-sonnet-4-6
# Select: reviewer → anthropic/claude-haiku-4-5
# Select: spec → anthropic/claude-haiku-4-5
# Select: research → anthropic/claude-haiku-4-5
# Select: plan → anthropic/claude-sonnet-4-6

opencode-path profiles
# Select: Python, JavaScript / TypeScript, etc.

# Later, if you want to deactivate some agents:
opencode-path agents
# Uncheck agents you don't need

# Restart opencode to apply all changes
```

## Usage

### Typical Workflow

0. **Spec Phase** (Spec) — when the request is vague or missing acceptance criteria
   ```
   # In opencode, switch to Spec (Tab key)
   > As a user I want to see my pending payments so I know what I owe.

   # Spec will:
   # - Use Interview Mode for vague requests: ask 3-5 targeted questions
   # - Make reasonable assumptions and list them
   # - Produce a lightweight spec with Objective, Acceptance Criteria, etc.
   # - Or produce a full handoff brief if the request is well-defined
   ```

1. **Research Phase** (Research) — when you need verified, current information
   ```
   # Switch to Research
   > Does Next.js 15 support this middleware pattern? What changed from v14?

   # Research will:
   # - Use available documentation tools (Context7, MCP docs) if present
   # - If no docs tools are available, proceed with best effort
   # - Summarize only what applies to your task
   # - Flag version-specific caveats and unverified claims
   ```

2. **Design Phase** (Architect)
   ```bash
   # In opencode, switch to Architect (Tab key)
   > I need to add user authentication to the API
   
   # Architect will:
   # - Clarify goals and constraints
   # - Enumerate options with tradeoffs
   # - Recommend an approach
   # - Optionally create and write a work folder if you say "save" or "nueva sesión"
   ```

3. **Implementation Phase** (Developer)
   ```bash
   # Switch to Developer
   > Implement the authentication work folder at .path/work/authentication/
   
   # Developer will:
   # - Read brief.md, tasks.md, and progress.md first
   # - Continue the single in_progress task if there is exactly one
   # - Otherwise ask which task/subset to implement before editing
   # - Or read a legacy plan if you handed off plan-001-auth.md
   # - Implement in small steps
   # - Update tasks.md and append progress.md during work
   # - Inspect own diff; ask before running project-specific validation
   #   unless commands are allowlisted by the installed profile
   # - Invoke Reviewer for QA
   # - Report back with changes and verdict
   ```

4. **Review Phase** (Reviewer, invoked by Developer)
   ```
   # Reviewer runs automatically when Developer invokes it
   # Returns: PASS | FAIL | PASS WITH NITS
   # If FAIL, Developer fixes and re-invokes Reviewer
   ```

5. **Audit Phase** (Auditor)
   ```bash
   # Switch to Auditor
   > Audit the authentication implementation
   
   # Auditor will:
   # - Inspect files and git history
   # - If a specific work folder is being audited, append findings to
   #   tasks.md and progress.md and also report them in chat
   # - Ask before running project-specific validation commands
   #   (or run them automatically if an install profile was applied)
   # - Look for failures, risks, gaps
   # - Return verdict: ACCEPTABLE | NEEDS VALIDATION | NEEDS REVIEWER | FAIL
   ```

### Cross-Session Planning

Preferred v1 cross-session handoff uses a work folder:

```bash
# Session 1: Design
> Architect, design the authentication system
> Save this under .path/work/authentication/

# Session 2: Implementation (new session, no context)
> Developer, implement .path/work/authentication/
```

That work folder contains:
- `brief.md` — stable design context and acceptance criteria
- `tasks.md` — current bounded task state, verification, and auditor notes
- `progress.md` — append-only execution and audit history

`tasks.md` uses this Auditor notes table so active, resolved, discarded, or cancelled findings can be tracked without deleting history:

```md
## Auditor notes
| Date | Related task | Severity | Status | Finding / resolution note | Suggested follow-up |
|---|---|---|---|---|---|
```

Architect can create `.path/work/<kebab-feature>/` directly as part of the handoff flow. The user does not need to create that folder manually.

Legacy `plan-*.md` handoff remains supported as a backward-compatible fallback:

```bash
> Architect, design the authentication system
> Save this to plan-001-auth.md

> Developer, implement plan-001-auth.md
```

V1 intentionally stops at prompt/docs/permissions only: there is no CLI scaffolding command yet for creating `.path/work/...` folders automatically. Directory creation is handled by Architect's narrow `mkdir -p .path/work/<kebab-feature>/` permission, not by a CLI command and not by manual user setup.

### Spec Interview Mode

When the request is vague, incomplete, or not-yet-shaped, Spec uses **Interview Mode**:

- Ask at most 3–5 questions — only those that affect scope, behavior, or acceptance criteria
- If a reasonable assumption can be made, list it under **Assumptions** rather than asking
- Produce a lightweight spec rather than a long document

Interview Mode output structure:

```
### Objective
One sentence: what this feature/change must achieve.

### Problem
Why does this need to exist?

### Non-goals
What this explicitly does not cover.

### Acceptance Criteria
- [ ] Each item must be testable or observable.

### Edge Cases
- What could go wrong or be misunderstood?

### Assumptions
- What you assume instead of asking. The user can correct these.

### Open Questions
- Only if genuine ambiguity remains after reasonable assumptions.

### Suggested Validation
- How to confirm it works.
```

## Agent Details

### Spec

**Purpose**: Requirements clarification partner. Turns vague stories, tickets, and HDUs into clear, testable, implementation-ready specifications.

**Key Features**:
- Interview Mode for vague or exploratory requests (3–5 targeted questions)
- Core clarification protocol (restate → identify user/goal → extract requirements → surface ambiguities → propose AC → edge cases → questions)
- Challenges vague language ("properly", "fast", "valid", "etc.")
- Produces a structured handoff brief ready for Architect
- Never invents business rules silently — all inferences are labeled as assumptions

**Permissions**:
- Read-only on codebase
- Cannot run bash commands
- Cannot write files
- Can invoke subagents: `explore`

### Research

**Purpose**: Documentation and knowledge verification agent. Finds, verifies, and summarizes current documentation, API behavior, SDK specifics, breaking changes, and best practices.

**Key Features**:
- Uses available documentation tools (Context7, MCP docs servers) when present in the OpenCode session
- If no docs tools are available, continues with best effort and marks uncertainty
- Prefers official documentation and primary sources over secondary references
- Calls out version-specific caveats
- Produces a Research Summary with Question, Findings, Relevant Constraints, Practical Takeaway, Risks/Unknowns, and Sources
- Does not require Context7 — works with or without it

**Permissions**:
- Read-only on codebase
- Cannot run bash commands
- Cannot write files
- Can invoke subagents: `explore`

### Architect

**Purpose**: Strategic design partner. Shapes ideas into concrete design decisions before code is written.

**Key Features**:
- 5-step design protocol (goal → constraints → options → tradeoffs → recommendation)
- Preferred handoff writes `.path/work/<kebab-feature>/brief.md`, `tasks.md`, and `progress.md`
- Can create `.path/work/<kebab-feature>/` with `mkdir -p` before writing those artifacts
- Legacy `*plan*.md` files remain supported as a fallback
- Invokes `explore` for codebase reconnaissance
- Invokes `reviewer` to stress-test designs
- Technology-agnostic planning: does not assume a stack in acceptance criteria

**Permissions**:
- Read-only on codebase
- Can write legacy `*plan*.md` files and preferred `.path/work/*/{brief,tasks,progress}.md` artifacts
- Can run only `mkdir -p .path/work/*` to create the work-folder directory; other bash commands remain denied
- Can invoke subagents: `explore`, `reviewer`

### Developer

**Purpose**: Execution agent. The only agent that broadly modifies application files.

**Key Features**:
- Implements well-defined tasks with clear acceptance criteria
- Supports both preferred work-folder handoff and legacy `plan-*.md` handoff
- Reads `brief.md`, `tasks.md`, and `progress.md` before work-folder implementation
- Continues the single `in_progress` task if there is exactly one; otherwise asks the user which task/subset to take next
- Updates `tasks.md` and appends `progress.md` during execution; records Reviewer verdicts there
- Self-verifies by inspecting diffs; asks before running project-specific validation commands unless they are allowlisted
- Invokes Reviewer before declaring done
- Reports changes, verification, and Reviewer verdict

**Permissions**:
- Full edit/write
- Risk-based bash policy: read-only inspection and simple creation are always allowed; toolchain-specific commands ask first; destructive, publishing, deployment, and external-impact operations are denied
- Can invoke subagents: `explore`, `reviewer`

### Auditor

**Purpose**: Fault-finding agent for existing work.

**Key Features**:
- Evidence-first audit protocol
- Understands `.path/work/<kebab-feature>/` state and compares declared progress against actual code state
- If auditing an explicit or clearly detectable work folder, proactively appends structured audit notes to `tasks.md` and `progress.md` and also reports findings in chat
- Uses `Status` plus `Finding / resolution note` in `tasks.md` Auditor notes so findings can be resolved or discarded without deleting history
- Never rewrites prior audit/developer history; disputed findings are resolved with appended dated notes
- Runs read-only inspection commands freely; asks before project-specific validation
- Returns verdict: ACCEPTABLE | NEEDS VALIDATION | NEEDS REVIEWER | FAIL
- Honest about what was and was not verified

**Permissions**:
- Read-only on codebase
- Narrow proactive append-only exception only for `.path/work/*/tasks.md` and `.path/work/*/progress.md` when auditing an explicit or clearly detectable work folder
- Universal inspection and git read commands are always allowed
- Project-specific validation (tests, linters, type checks) requires confirmation unless an install profile was applied
- Mutating commands, git state changes, deployment, and external-impact commands are forbidden
- Can invoke subagents: `explore`, `reviewer`

### Reviewer

**Purpose**: Strict QA gate for implementation work.

**Key Features**:
- Returns structured PASS/FAIL verdict
- Remains read-only even when a work folder is present; Developer records the verdict in `progress.md`
- Runs read-only inspection commands freely; asks before project-specific validation
- Severity scale: blocker | major | minor | nit
- Specific findings with file:line locations
- Clearly states what was not checked

**Permissions**:
- Read-only on codebase
- Universal inspection and git read commands are always allowed
- Project-specific validation requires confirmation unless an install profile was applied
- Mutating commands, git state changes, deployment, and external-impact commands are forbidden
- Cannot invoke subagents (leaf node)

### Explore

**Purpose**: Fast codebase exploration.

**Key Features**:
- Built-in opencode agent, managed by opencode-path alongside `plan` and `build`
- Finds files, searches code, answers questions
- Thoroughness levels: quick | medium | very thorough

**Permissions**:
- Read-only on codebase
- No bash
- No file editing

## Stack Profiles

After running `opencode-path init`, you can add stack-specific permission profiles to the installed agent files:

```bash
opencode-path profiles
```

The `profiles` command shows a list of available stack profiles and lets you select one or more to apply. Profiles are inserted into the agent files at a designated marker line using idempotency markers, so re-running the command does not duplicate blocks.

### Available profiles

| Profile | Validation commands added |
|---------|--------------------------|
| **JavaScript / TypeScript** | npm test, pnpm lint, yarn typecheck, npx jest, npx vitest, npx eslint, npx prettier --check, etc. |
| **Python** | pytest, ruff check, mypy, pyright, python -m unittest |
| **Go** | go test, go vet (+ go fmt as "ask" for Developer only) |
| **Rust** | cargo test, cargo check, cargo clippy, cargo fmt --check (+ cargo fmt as "ask" for Developer only) |
| **Swift** | swift test, swift format lint (+ swift build, swift format as "ask" for Developer only) |
| **Java / Kotlin** | ./gradlew test, ./gradlew check, ./gradlew ktlintCheck, gradle test, mvn test, mvn verify |
| **Ruby** | bundle exec rspec, bundle exec rubocop, ruby -c, rails test |
| **PHP** | composer test, vendor/bin/phpunit, vendor/bin/phpstan, vendor/bin/psalm, vendor/bin/phpcs |
| **All stacks** | Applies every profile above at once |

### Role-specific profile behavior

Profiles are not applied uniformly across agents. Each profile has two variants:

- **Developer** receives the full profile, including controlled mutating commands (such as formatters or builds that write artifacts) listed as `ask` so the user confirms before they run.
- **Auditor and Reviewer** receive only the read-only validation subset. Commands that write files — formatters, build commands producing artifacts, or anything that mutates state — are intentionally excluded from their variant. This does not change the base prompt-level exception that lets Auditor append narrow audit notes to `.path/work/*/tasks.md` and `.path/work/*/progress.md`.

Examples of commands that differ by role:

| Command | Developer | Auditor / Reviewer |
|---|---|---|
| `go test*`, `go vet*` | `allow` | `allow` |
| `go fmt*`, `gofmt*` | `ask` | not included |
| `cargo fmt --check*` | `allow` | `allow` |
| `cargo fmt*` | `ask` | not included |
| `swift test*` | `allow` | `allow` |
| `swift format lint*` | `allow` | `allow` |
| `swift build*`, `swift format*` | `ask` | not included |

This ensures Reviewer remains strictly read-only regardless of which profile is selected, while Auditor keeps only its narrow work-folder audit-note exception.

### What profiles add and do not add

**Profiles add**:
- Stack-specific test runners, linters, type checkers, and format-check commands.

**Profiles do not enable**:
- Dependency installation (`npm install`, `pip install`, etc.)
- Publishing or deployment
- Destructive git operations
- Broad write access for Auditor or Reviewer (Auditor keeps only the narrow work-folder audit-note exception)
- Broad filesystem mutations

Example — Python profile adds to the `bash` block:

```yaml
    # BEGIN optional profile: python
    "pytest*": "allow"
    "python -m pytest*": "allow"
    "python3 -m pytest*": "allow"
    "ruff check*": "allow"
    "mypy*": "allow"
    "pyright*": "allow"
    "python -m unittest*": "allow"
    "python3 -m unittest*": "allow"
    # END optional profile: python
```

### Idempotency

Profile markers prevent duplicate inserts on re-runs. If a profile block with the same name already exists in an agent file, it will be skipped without changes. To remove a profile, edit the installed agent files and delete the lines between the `BEGIN` and `END` markers.

If the marker line (`# Optional stack-specific profiles are inserted here by opencode-path profiles`) has been removed from an agent file, the `profiles` command will report an error for that file rather than guessing where to insert.

### External-impact command denylist

In addition to the risk-based `ask` catch-all, all three agents (Developer, Auditor, Reviewer) explicitly deny a short list of commands known to affect external systems:

- **Deployment**: `vercel deploy*`, `netlify deploy*`, `firebase deploy*`
- **Release**: `gh release*`
- **Container registry**: `docker push*`
- **Infrastructure**: `kubectl apply*`, `terraform apply*`, `pulumi up*`

These are denied unconditionally in the base agent templates. They require the user to run them manually outside of opencode.

## Customization

### Adding project-specific validation commands

Edit the installed agent files and add patterns after the profile blocks (or after the marker line if no profiles are installed), but before the deny rules. opencode uses **last matching rule wins**, so broad defaults must appear before specific allow/deny rules:

```yaml
bash:
  "*": "ask"
  # ... read-only inspection patterns ...
  # Optional stack-specific profiles are inserted here by opencode-path profiles
  # (profile blocks appear here after running opencode-path profiles)
  
  # Add your project-specific patterns here:
  "make test*": "allow"        # project-specific make target
  "npm run e2e*": "allow"      # specific e2e test command
  
  # ... deny rules at the end ...
```

### Adjusting scope

- **Stricter**: Change the initial catch-all default from `"*": "ask"` to `"*": "deny"`. More specific allow rules listed after it will still override the default because opencode uses last-match-wins.
- **Looser**: Add more patterns to the allowlist
- **Per-agent**: Edit only the agent file you want to change

### Extending the Workflow

Add new agents by creating `.md` files in the agent directory:

```yaml
---
description: Your agent description
mode: primary  # or subagent
model: your/model
permission:
  edit: deny
  write: deny
  bash: deny
  task: allow
---

Your agent prompt here...
```

## Development

```bash
# Install dependencies
npm install

# Run the CLI in development mode
npx tsx src/cli.ts --help
npx tsx src/cli.ts init
npx tsx src/cli.ts agents
npx tsx src/cli.ts models
npx tsx src/cli.ts profiles

# Build for production
npm run build

# Run the built CLI
node dist/cli.js --help

# Run tests
npm test

# Type check
npx tsc --noEmit
```

## Troubleshooting

### Agent not appearing in opencode

- Restart opencode after installation
- Check that files are in the correct `agent/` directory
- Verify frontmatter syntax (no missing `---` delimiters)

### Model not loading

- Ensure the model ID is correct (format: `provider/model`)
- Check that the provider is enabled in your opencode config
- Verify API keys are set for the provider

### Permission errors

- Check that bash patterns are quoted in YAML
- Remember: insertion order matters. opencode uses last-match-wins, so put broad rules first and narrow rules last.
- Use `"*": "ask"` as the first bash rule for a safe default catch-all.

### Project-specific command asks for confirmation

Run `opencode-path profiles` to add stack-specific validation commands. If a command still asks for confirmation after applying the relevant profile, you can add it to the agent file's bash section.

### I lost my model configuration after re-running init

Active managed agents (files with the `<!-- managed-by: opencode-path -->` marker) are never overwritten by `init`. If you previously installed agents without the marker, they will be reported as conflicts and left untouched.

### Conflict: manual file at a managed agent path

If you see a **conflict** in `init` or `agents`, it means a file exists at the agent path (e.g., `.opencode/agent/developer.md`) but does not contain the managed marker (`<!-- managed-by: opencode-path -->`). The CLI will not overwrite, delete, or modify conflict files.

To resolve a conflict:
1. If the file was installed by a previous version of opencode-path: you can safely add the managed marker to the end of the file, then re-run the command.
2. If the file is your own custom agent and you want to keep it: leave it as-is. The CLI will ignore it.
3. If you want to replace it with the workflow template: delete the file manually and re-run `opencode-path init` or `opencode-path agents`.

### Hidden vs deleted agents

- Built-in agents (`plan`, `build`, `explore`) are **hidden** by setting `agent.<name>.disable: true` in `opencode.json`. Their model and other config fields are preserved. Restoring them simply removes the `disable` flag.
- Custom workflow agents are **deleted** by removing their `.md` file. The model (stored in the file's frontmatter) is lost. To reinstall, use `opencode-path init` or `opencode-path agents`.

### External/manual agents are not managed

Agents created manually outside the managed catalog (e.g., `general`, `task`, or any custom name not in the workflow) are never shown or modified by opencode-path commands. The managed catalog includes custom workflow agents (`spec`, `architect`, `developer`, `reviewer`, `auditor`, `research`) and built-in opencode agents (`plan`, `build`, `explore`).

### Agent behavior issues

- Review the agent's prompt for clarity
- Test with simple tasks first
- Check opencode logs for errors

## Contributing

Contributions welcome! Areas for improvement:

- More detailed cross-session planning examples
- Performance benchmarks with different model combinations

## License

MIT

## Credits

Designed for [opencode](https://opencode.ai), an open-source AI coding assistant.
