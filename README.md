# OpenCode Path

A structured multi-agent workflow for [opencode](https://opencode.ai) that separates concerns, minimizes blast radius, and optimizes model usage by role.

## Overview

This workflow defines 6 specialized agents with clear responsibilities:

| Agent | Role | Mode | Permissions |
|-------|------|------|-------------|
| **Spec** | Clarifies vague stories into testable specs before design | Primary | Read-only, no bash |
| **Architect** | Designs system architecture, produces structured design decisions | Primary | Read-only + write `*plan*.md` |
| **Developer** | Implements code changes end-to-end | Primary | Edit/write + risk-based bash policy |
| **Auditor** | Audits existing work for failures, risks, and gaps | Primary | Read-only + inspection commands + confirmation for project-specific validation |
| **Research** | Researches documentation, APIs, SDK behavior, and best practices | Primary | Read-only, no bash |
| **Reviewer** | Reviews code changes, returns PASS/FAIL verdict | Subagent | Read-only + inspection commands + confirmation for project-specific validation |
| **Explore** | Fast codebase exploration | Subagent (built-in) | Read-only |

### Key Design Principles

1. **Blast Radius Minimization**: Only Developer can modify files. All other agents are read-only.
2. **Separation of Concerns**: Clarify (Spec) → Research (Research) → Design (Architect) → Implement (Developer) → Review (Reviewer) → Audit (Auditor).
3. **Cross-Session Planning**: Architect produces self-contained briefs for implementation in new sessions.
4. **Granular Permissions**: Risk-based bash policy for Developer; scoped read-only inspection for Auditor and Reviewer.
5. **Model-Agnostic by Default**: No models are hardcoded. Use `opencode-path models` to configure models explicitly for each agent.
6. **Stack Profiles via Opt-In Command**: The CLI installs agnostic agent templates by default. Stack-specific permission profiles (test runners, linters, type checkers) are added separately via `opencode-path profiles`, keeping the base install clean and technology-agnostic.

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

Installed files:
- `agent/spec.md` — Spec agent
- `agent/architect.md` — Architect agent
- `agent/developer.md` — Developer agent
- `agent/auditor.md` — Auditor agent
- `agent/reviewer.md` — Reviewer agent
- `agent/research.md` — Research agent
- `opencode.json` — OpenCode config with Explore override

If any agent file already exists, `init` will ask whether to overwrite it on a per-file basis. If you decline, the existing file is kept and the rest continue installing.

The `init` command installs technology-agnostic agent templates without any model configured. To set up models, run `opencode-path models` after init. To add stack-specific validation commands (test runners, linters, type checkers), run `opencode-path profiles` after init.

**Restart opencode** after installation.

### Configure models

```bash
opencode-path models
```

The `models` command lets you select an agent and choose from the models exposed by OpenCode:

```bash
opencode models
```

If OpenCode cannot provide a model list, or if you need a model that is not listed, choose `Custom model...` and enter the model ID manually. It supports all seven agents:

| Agent | Where the model is stored | Example model |
|-------|--------------------------|----------------|
| spec | `agent/spec.md` frontmatter `model:` field | `anthropic/claude-haiku-4-5` |
| architect | `agent/architect.md` frontmatter `model:` field | `anthropic/claude-sonnet-4-6` |
| developer | `agent/developer.md` frontmatter `model:` field | `anthropic/claude-sonnet-4-6` |
| auditor | `agent/auditor.md` frontmatter `model:` field | `anthropic/claude-sonnet-4-6` |
| reviewer | `agent/reviewer.md` frontmatter `model:` field | `anthropic/claude-haiku-4-5` |
| research | `agent/research.md` frontmatter `model:` field | `anthropic/claude-haiku-4-5` |
| explore | `opencode.json` `agent.explore.model` field | `anthropic/claude-haiku-4-5` |

Pack agent models (spec, architect, developer, auditor, reviewer, research) are written into the agent file's YAML frontmatter. The `explore` model is written into the OpenCode config file because `explore` is a built-in opencode agent, not a template file.

Model IDs should use the `provider/model-id` format (e.g., `anthropic/claude-sonnet-4-6`, `openai/gpt-5.5`).

The `models` command runs in a loop — after setting a model for one agent, it asks if you want to configure another.

**Restart opencode** after changing models.

### Apply stack profiles

```bash
opencode-path profiles
```

The `profiles` command shows a list of available stack profiles and lets you select one or more to apply. Profiles are inserted into the agent files at a designated marker line using idempotency markers, so re-running the command does not duplicate blocks. See [Stack Profiles](#stack-profiles) below.

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

opencode-path models
# Select: architect → anthropic/claude-sonnet-4-6
# Select: developer → anthropic/claude-sonnet-4-6
# Select: auditor → anthropic/claude-sonnet-4-6
# Select: reviewer → anthropic/claude-haiku-4-5
# Select: spec → anthropic/claude-haiku-4-5
# Select: research → anthropic/claude-haiku-4-5
# Select: explore → anthropic/claude-haiku-4-5

opencode-path profiles
# Select: Python, JavaScript / TypeScript, etc.

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
   # - Optionally write a plan file if you say "save" or "nueva sesión"
   ```

3. **Implementation Phase** (Developer)
   ```bash
   # Switch to Developer
   > Implement the authentication plan from plan-001-auth.md
   
   # Developer will:
   # - Read the plan
   # - Implement in small steps
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
   # - Ask before running project-specific validation commands
   #   (or run them automatically if an install profile was applied)
   # - Look for failures, risks, gaps
   # - Return verdict: ACCEPTABLE | NEEDS VALIDATION | NEEDS REVIEWER | FAIL
   ```

### Cross-Session Planning

When Architect writes a plan file, it's self-contained for a new session:

```bash
# Session 1: Design
> Architect, design the authentication system
> Save this to plan-001-auth.md

# Session 2: Implementation (new session, no context)
> Developer, implement plan-001-auth.md
```

The plan file includes:
- Context the implementer needs
- Step-by-step plan with verification steps
- Edge cases to handle explicitly
- Acceptance criteria (testable)
- Codebase warnings
- Out of scope items

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
- Produces a Research Summary with Question, Findings, Relevant Constraints, Recommendation, Risks/Unknowns, and Sources
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
- Can write `*plan*.md` files for cross-session handoff
- Invokes `explore` for codebase reconnaissance
- Invokes `reviewer` to stress-test designs
- Technology-agnostic planning: does not assume a stack in acceptance criteria

**Permissions**:
- Read-only on codebase
- Can write files matching `*plan*.md`
- Cannot run bash commands
- Can invoke subagents: `explore`, `reviewer`

### Developer

**Purpose**: Execution agent. The only agent that modifies files.

**Key Features**:
- Implements well-defined tasks with clear acceptance criteria
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
- 5-phase fault diagnosis protocol
- Runs read-only inspection commands freely; asks before project-specific validation
- Returns verdict: ACCEPTABLE | NEEDS VALIDATION | NEEDS REVIEWER | FAIL
- Honest about what was and was not verified

**Permissions**:
- Read-only on codebase
- Universal inspection and git read commands are always allowed
- Project-specific validation (tests, linters, type checks) requires confirmation unless an install profile was applied
- Mutating commands, git state changes, deployment, and external-impact commands are forbidden
- Can invoke subagents: `explore`, `reviewer`

### Reviewer

**Purpose**: Strict QA gate for implementation work.

**Key Features**:
- Returns structured PASS/FAIL verdict
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
- Built-in opencode agent (overridden in `opencode.json`)
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
- **Auditor and Reviewer** receive only the read-only validation subset. Commands that write files — formatters, build commands producing artifacts, or anything that mutates state — are intentionally excluded from their variant.

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

This ensures Auditor and Reviewer remain strictly read-only regardless of which profile is selected.

### What profiles add and do not add

**Profiles add**:
- Stack-specific test runners, linters, type checkers, and format-check commands.

**Profiles do not enable**:
- Dependency installation (`npm install`, `pip install`, etc.)
- Publishing or deployment
- Destructive git operations
- Write access for Auditor or Reviewer
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

`opencode-path init` asks per file whether to overwrite. If you decline, the existing file with its model configuration is preserved.

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
