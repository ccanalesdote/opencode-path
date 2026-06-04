# OpenCode Workflow

A structured multi-agent workflow for [opencode](https://opencode.ai) that separates concerns, minimizes blast radius, and optimizes model usage by role.

## Overview

This workflow defines 5 specialized agents with clear responsibilities:

| Agent | Role | Mode | Permissions |
|-------|------|------|-------------|
| **Architect** | Designs system architecture, produces structured design decisions | Primary | Read-only + write `*plan*.md` |
| **Developer** | Implements code changes end-to-end | Primary | Edit/write + risk-based bash policy |
| **Auditor** | Audits existing work for failures, risks, and gaps | Primary | Read-only + inspection commands + confirmation for project-specific validation |
| **Reviewer** | Reviews code changes, returns PASS/FAIL verdict | Subagent | Read-only + inspection commands + confirmation for project-specific validation |
| **Explore** | Fast codebase exploration | Subagent (built-in) | Read-only |

### Key Design Principles

1. **Blast Radius Minimization**: Only Developer can modify files. All other agents are read-only.
2. **Separation of Concerns**: Design (Architect) → Implement (Developer) → Review (Reviewer) → Audit (Auditor).
3. **Cross-Session Planning**: Architect produces self-contained briefs for implementation in new sessions.
4. **Granular Permissions**: Risk-based bash policy for Developer; scoped read-only inspection for Auditor and Reviewer.
5. **Technology Agnosticism**: The base workflow does not assume a language, package manager, test runner, formatter, linter, or build system. Project-specific commands are opt-in through confirmation, local customization, or optional install-time profiles.

## Installation

```bash
# Clone this repository
git clone <your-repo-url>
cd opencode-workflow

# Run the installer
chmod +x install.sh
./install.sh
```

The installer copies files to `~/.config/opencode/`:
- `opencode.json` — global config with Explore override
- `agent/architect.md` — Architect agent
- `agent/auditor.md` — Auditor agent
- `agent/developer.md` — Developer agent
- `agent/reviewer.md` — Reviewer agent

Then it prompts you to optionally select a command profile for your stack:

```
Optional command profile:
  1) None — technology-agnostic default (recommended)
  2) JavaScript / TypeScript
  3) Python
  4) Go
  5) Rust
  6) Swift
  7) Java / Kotlin
  8) Ruby
  9) PHP
 10) All common validation profiles
```

Profiles are applied only to the installed files under `~/.config/opencode/agent/`. The repository source files remain technology-agnostic. If you select "None", the default conservative policy applies and project-specific commands will ask for confirmation.

**Restart opencode** after installation.

## Model Configuration

This workflow is **model-agnostic**. You must configure models for each agent based on your needs and budget.

### Recommended Strategy

| Agent | Recommended Model Tier | Rationale |
|-------|----------------------|-----------|
| **Architect** | High-capability (e.g., Claude Sonnet, GPT-4) | Complex reasoning, tradeoff analysis |
| **Developer** | High-capability (e.g., Claude Sonnet, GPT-4) | Code generation, multi-step implementation |
| **Auditor** | High-capability (e.g., Claude Sonnet, GPT-4) | Fault diagnosis, pattern recognition |
| **Reviewer** | Mid-tier (e.g., Claude Haiku, GPT-4-mini) | Structured verification, lower token cost |
| **Explore** | Mid-tier (e.g., Claude Haiku, GPT-4-mini) | Fast codebase scanning |

### How to Configure

Edit each agent file in `~/.config/opencode/agent/` and add a `model:` field to the frontmatter:

```yaml
---
description: Designs system architecture...
mode: primary
model: anthropic/claude-sonnet-4-6  # <-- Add this line
permission:
  edit:
    "*plan*.md": "allow"
    "*": "deny"
---
```

**Example configuration:**

```yaml
# architect.md
model: anthropic/claude-sonnet-4-6

# developer.md
model: anthropic/claude-sonnet-4-6

# auditor.md
model: anthropic/claude-sonnet-4-6

# reviewer.md
model: anthropic/claude-haiku-4-5

# opencode.json (for explore override)
{
  "agent": {
    "explore": {
      "model": "anthropic/claude-haiku-4-5"
    }
  }
}
```

## Usage

### Typical Workflow

1. **Design Phase** (Architect)
   ```bash
   # In opencode, switch to Architect (Tab key)
   > I need to add user authentication to the API
   
   # Architect will:
   # - Clarify goals and constraints
   # - Enumerate options with tradeoffs
   # - Recommend an approach
   # - Optionally write a plan file if you say "save" or "nueva sesión"
   ```

2. **Implementation Phase** (Developer)
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

3. **Review Phase** (Reviewer, invoked by Developer)
   ```
   # Reviewer runs automatically when Developer invokes it
   # Returns: PASS | FAIL | PASS WITH NITS
   # If FAIL, Developer fixes and re-invokes Reviewer
   ```

4. **Audit Phase** (Auditor)
   ```bash
   # Switch to Auditor
   > Audit the authentication implementation
   
   # Auditor will:
   # - Inspect files and git history
   # - Ask before running project-specific validation commands
   #   (or run them automatically if an install profile was applied)
   # - Look for failures, risks, gaps
   # - Return verdict: SHIP | SHIP WITH CAVEATS | DO NOT SHIP
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

## Agent Details

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
- Risk-based bash policy: read-only inspection and simple creation are always allowed; toolchain-specific commands ask first; destructive and publishing operations are denied
- Can invoke subagents: `explore`, `reviewer`

### Auditor

**Purpose**: Fault-finding agent for existing work.

**Key Features**:
- 5-phase fault diagnosis protocol
- Runs read-only inspection commands freely; asks before project-specific validation
- Returns verdict: SHIP | SHIP WITH CAVEATS | DO NOT SHIP
- Honest about what was and was not verified

**Permissions**:
- Read-only on codebase
- Universal inspection and git read commands are always allowed
- Project-specific validation (tests, linters, type checks) requires confirmation unless an install profile was applied
- Mutating commands and git state changes are forbidden
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
- Mutating commands and git state changes are forbidden
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

## Technology-agnostic default

The committed workflow is technology-agnostic. It allows universal inspection commands and asks before running project-specific commands.

This keeps the workflow usable across JavaScript, TypeScript, Python, Go, Rust, Swift, Java, Kotlin, Ruby, PHP, and other stacks without baking one ecosystem into the default config.

## Optional command profiles

The installer can apply optional command profiles to the installed agent files. These profiles are convenience allowlists for common validation commands. They are applied to Developer, Auditor, and Reviewer. Architect is not patched (it has `bash: deny`).

**Profiles add**:
- Stack-specific test runners, linters, type checkers, and format checkers.

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

Profile markers prevent duplicate inserts if the installer is re-run. To apply a different profile, re-run `./install.sh`. To remove a profile, edit the installed agent files under `~/.config/opencode/agent/` and delete the lines between the `BEGIN` and `END` markers.

## Customization

### Adding project-specific validation commands

Edit the installed agent files in `~/.config/opencode/agent/` and add patterns before the `"*": "ask"` catch-all:

```yaml
bash:
  # ... existing rules ...
  "make test*": "allow"        # project-specific make target
  "go test ./...": "allow"     # specific go test invocation
  "*": "ask"
```

### Adjusting scope

- **Stricter**: Change `"*": "ask"` to `"*": "deny"` in bash permissions
- **Looser**: Add more patterns to the allowlist
- **Per-agent**: Edit only the agent file you want to change

### Extending the Workflow

Add new agents by creating `.md` files in `~/.config/opencode/agent/`:

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

## Troubleshooting

### Agent not appearing in opencode

- Restart opencode after installation
- Check that files are in `~/.config/opencode/agent/`
- Verify frontmatter syntax (no missing `---` delimiters)

### Model not loading

- Ensure the model ID is correct (format: `provider/model`)
- Check that the provider is enabled in your opencode config
- Verify API keys are set for the provider

### Permission errors

- Check that bash patterns are quoted in YAML
- Remember: insertion order matters (broad rules first, narrow rules last)
- Use `"*": "ask"` as a safe catch-all

### Project-specific command asks for confirmation

This is expected with the technology-agnostic default. Either approve the command when prompted, or re-run `./install.sh` and select an optional profile to allowlist it permanently.

### Optional profile did not apply

Re-run `./install.sh` and select the desired profile. Or manually add the command patterns to the installed agent files under `~/.config/opencode/agent/`.

### Duplicate profile entries

The installer uses profile markers to avoid duplicate inserts. If you manually edited the markers, remove the duplicate block carefully. The markers look like:

```
# BEGIN optional profile: python
...
# END optional profile: python
```

### Agent behavior issues

- Review the agent's prompt for clarity
- Test with simple tasks first
- Check opencode logs for errors

## Contributing

Contributions welcome! Areas for improvement:

- Additional stack-specific profile snippets
- More detailed cross-session planning examples
- Performance benchmarks with different model combinations

## License

MIT

## Credits

Designed for [opencode](https://opencode.ai), an open-source AI coding assistant.
