# OpenCode Workflow

A structured multi-agent workflow for [opencode](https://opencode.ai) that separates concerns, minimizes blast radius, and optimizes model usage by role.

## Overview

This workflow defines 5 specialized agents with clear responsibilities:

| Agent | Role | Mode | Permissions |
|-------|------|------|-------------|
| **Architect** | Designs system architecture, produces structured design decisions | Primary | Read-only + write `*plan*.md` |
| **Developer** | Implements code changes end-to-end | Primary | Full edit/write/bash |
| **Auditor** | Audits existing work for failures, risks, and gaps | Primary | Read-only + validation tools |
| **Reviewer** | Reviews code changes, returns PASS/FAIL verdict | Subagent | Read-only + validation tools |
| **Explore** | Fast codebase exploration | Subagent (built-in) | Read-only |

### Key Design Principles

1. **Blast Radius Minimization**: Only Developer can modify files. All other agents are read-only.
2. **Separation of Concerns**: Design (Architect) → Implement (Developer) → Review (Reviewer) → Audit (Auditor).
3. **Cross-Session Planning**: Architect produces self-contained briefs for implementation in new sessions.
4. **Granular Permissions**: Scoped bash allowlists for validation tools (tests, linters, type checkers) without mutation capabilities.

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
   # - Self-verify (run tests, linters)
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
   # - Run tests, linters, type checks
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
- Step-by-step plan with verification commands
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

**Permissions**:
- Read-only on codebase
- Can write files matching `*plan*.md`
- Cannot run bash commands
- Can invoke subagents: `explore`, `reviewer`

### Developer

**Purpose**: Execution agent. The only agent that modifies files.

**Key Features**:
- Implements well-defined tasks with clear acceptance criteria
- Self-verifies (runs tests, linters, type checks)
- Invokes Reviewer before declaring done
- Reports changes, verification, and Reviewer verdict

**Permissions**:
- Full edit/write/bash
- Can invoke subagents: `explore`, `reviewer`

### Auditor

**Purpose**: Fault-finding agent for existing work.

**Key Features**:
- 5-phase fault diagnosis protocol
- Runs validation tools (tests, linters, type checks)
- Returns verdict: SHIP | SHIP WITH CAVEATS | DO NOT SHIP
- Suggests handoffs to Developer/Architect/Reviewer

**Permissions**:
- Read-only on codebase
- Can run validation tools (scoped bash allowlist)
- Cannot run mutating commands
- Can invoke subagents: `explore`, `reviewer`

### Reviewer

**Purpose**: Strict QA gate for implementation work.

**Key Features**:
- Returns structured PASS/FAIL verdict
- Runs validation tools to verify claims
- Severity scale: blocker | major | minor | nit
- Specific findings with file:line locations

**Permissions**:
- Read-only on codebase
- Can run validation tools (scoped bash allowlist)
- Cannot run mutating commands
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

## Customization

### Adding New Validation Tools

Edit the `bash` permission in `auditor.md` and `reviewer.md`:

```yaml
bash:
  "npm test*": "allow"
  "npx playwright test*": "allow"  # <-- Add new tool
  "rm *": "deny"
  "*": "ask"
```

### Adjusting Scope

- **Stricter**: Change `*: ask` to `*: deny` in bash permissions
- **Looser**: Add more patterns to the allowlist
- **Project-specific**: Add patterns for your build tools (e.g., `make test*`, `cargo test*`)

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
- Use `*: ask` as a safe catch-all

### Agent behavior issues

- Review the agent's prompt for clarity
- Test with simple tasks first
- Check opencode logs for errors

## Contributing

Contributions welcome! Areas for improvement:

- Additional validation tool patterns
- Language-agnostic bash allowlists (Python, Go, Rust, etc.)
- More detailed cross-session planning examples
- Performance benchmarks with different model combinations

## License

MIT

## Credits

Designed for [opencode](https://opencode.ai), an open-source AI coding assistant.
