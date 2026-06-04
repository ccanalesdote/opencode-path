#!/bin/bash

# OpenCode Workflow Installer
# This script installs the custom agent workflow to ~/.config/opencode/

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$HOME/.config/opencode"

# ---------------------------------------------------------------------------
# Profile snippets
#
# Each profile has two variants:
#   *_DEV      — applied to developer.md
#                May include controlled mutating commands (formatters, builds)
#                listed as "ask" so the user confirms before they run.
#   *_READONLY — applied to auditor.md and reviewer.md
#                Contains only validation/inspection commands that do not
#                modify files. Formatter commands that write to disk are
#                intentionally excluded from this variant.
#
# Snippets are inserted after `"* 2>/dev/null*": "allow"` (the last pipe/redirection
# pattern) in the bash permission block. Markers prevent duplicate inserts on re-runs.
# architect.md and spec.md have bash: deny and are never patched.
# ---------------------------------------------------------------------------

# --- JavaScript / TypeScript ------------------------------------------------
# All commands here are read-only validation; both variants are identical.
PROFILE_JAVASCRIPT_TYPESCRIPT_DEV='  # BEGIN optional profile: javascript-typescript
  "npm test*": "allow"
  "npm run test*": "allow"
  "npm run lint*": "allow"
  "npm run typecheck*": "allow"
  "npm run check*": "allow"
  "pnpm test*": "allow"
  "pnpm lint*": "allow"
  "pnpm typecheck*": "allow"
  "pnpm check*": "allow"
  "yarn test*": "allow"
  "yarn lint*": "allow"
  "yarn typecheck*": "allow"
  "yarn check*": "allow"
  "npx jest*": "allow"
  "npx vitest*": "allow"
  "npx tsc*": "allow"
  "npx eslint*": "allow"
  "npx prettier --check*": "allow"
  # END optional profile: javascript-typescript'
PROFILE_JAVASCRIPT_TYPESCRIPT_READONLY="$PROFILE_JAVASCRIPT_TYPESCRIPT_DEV"

# --- Python -----------------------------------------------------------------
# All commands here are read-only validation; both variants are identical.
PROFILE_PYTHON_DEV='  # BEGIN optional profile: python
  "pytest*": "allow"
  "python -m pytest*": "allow"
  "python3 -m pytest*": "allow"
  "ruff check*": "allow"
  "mypy*": "allow"
  "pyright*": "allow"
  "python -m unittest*": "allow"
  "python3 -m unittest*": "allow"
  # END optional profile: python'
PROFILE_PYTHON_READONLY="$PROFILE_PYTHON_DEV"

# --- Go ---------------------------------------------------------------------
# Developer variant includes go fmt (mutates files) listed as ask.
# Read-only variant omits go fmt / gofmt to preserve Auditor/Reviewer safety.
PROFILE_GO_DEV='  # BEGIN optional profile: go
  "go test*": "allow"
  "go vet*": "allow"
  "go fmt*": "ask"
  "gofmt*": "ask"
  # END optional profile: go'
PROFILE_GO_READONLY='  # BEGIN optional profile: go
  "go test*": "allow"
  "go vet*": "allow"
  # END optional profile: go'

# --- Rust -------------------------------------------------------------------
# Developer variant includes cargo fmt (mutates files) listed as ask.
# cargo fmt --check is safe for both roles; cargo fmt (without --check) is dev-only.
PROFILE_RUST_DEV='  # BEGIN optional profile: rust
  "cargo test*": "allow"
  "cargo check*": "allow"
  "cargo clippy*": "allow"
  "cargo fmt --check*": "allow"
  "cargo fmt*": "ask"
  # END optional profile: rust'
PROFILE_RUST_READONLY='  # BEGIN optional profile: rust
  "cargo test*": "allow"
  "cargo check*": "allow"
  "cargo clippy*": "allow"
  "cargo fmt --check*": "allow"
  # END optional profile: rust'

# --- Swift ------------------------------------------------------------------
# Developer variant includes swift build and swift format (both may write
# artifacts or reformat files) listed as ask.
# Read-only variant includes only swift test and swift format lint (check mode).
PROFILE_SWIFT_DEV='  # BEGIN optional profile: swift
  "swift test*": "allow"
  "swift build*": "ask"
  "swift format lint*": "allow"
  "swift format*": "ask"
  "xcodebuild test*": "ask"
  # END optional profile: swift'
PROFILE_SWIFT_READONLY='  # BEGIN optional profile: swift
  "swift test*": "allow"
  "swift format lint*": "allow"
  # END optional profile: swift'

# --- Java / Kotlin ----------------------------------------------------------
# All commands here are read-only validation; both variants are identical.
PROFILE_JAVA_KOTLIN_DEV='  # BEGIN optional profile: java-kotlin
  "./gradlew test*": "allow"
  "./gradlew check*": "allow"
  "./gradlew ktlintCheck*": "allow"
  "./gradlew detekt*": "allow"
  "gradle test*": "allow"
  "gradle check*": "allow"
  "mvn test*": "allow"
  "mvn verify*": "allow"
  # END optional profile: java-kotlin'
PROFILE_JAVA_KOTLIN_READONLY="$PROFILE_JAVA_KOTLIN_DEV"

# --- Ruby -------------------------------------------------------------------
# All commands here are read-only validation; both variants are identical.
PROFILE_RUBY_DEV='  # BEGIN optional profile: ruby
  "bundle exec rspec*": "allow"
  "bundle exec rubocop*": "allow"
  "ruby -c*": "allow"
  "rails test*": "allow"
  # END optional profile: ruby'
PROFILE_RUBY_READONLY="$PROFILE_RUBY_DEV"

# --- PHP --------------------------------------------------------------------
# All commands here are read-only validation; both variants are identical.
PROFILE_PHP_DEV='  # BEGIN optional profile: php
  "composer test*": "allow"
  "vendor/bin/phpunit*": "allow"
  "vendor/bin/phpstan*": "allow"
  "vendor/bin/psalm*": "allow"
  "vendor/bin/phpcs*": "allow"
  # END optional profile: php'
PROFILE_PHP_READONLY="$PROFILE_PHP_DEV"

# ---------------------------------------------------------------------------
# Helper: insert a profile snippet into a single agent file.
# Skips insertion if the BEGIN marker already exists (idempotent).
# Inserts the snippet immediately after the line matching `"* 2>/dev/null*": "allow"`.
# ---------------------------------------------------------------------------
insert_profile() {
  local file="$1"
  local snippet="$2"
  local marker_begin
  marker_begin=$(printf '%s' "$snippet" | head -1 | sed 's/^[[:space:]]*//')

  # Already inserted — skip
  if grep -qF "$marker_begin" "$file" 2>/dev/null; then
    return 0
  fi

  # Write snippet to temp file (avoids awk multi-line variable issues on macOS/BWK awk)
  local snippet_file
  snippet_file=$(mktemp)
  printf '%s\n' "$snippet" > "$snippet_file"

  local tmpfile
  tmpfile=$(mktemp)
  awk -v snippet_file="$snippet_file" '
    /^[[:space:]]*"\* 2>\/dev\/null\*": "allow"/ && !inserted {
      print
      while ((getline line < snippet_file) > 0) {
        print line
      }
      close(snippet_file)
      inserted=1
      next
    }
    { print }
  ' "$file" > "$tmpfile"
  mv "$tmpfile" "$file"
  rm -f "$snippet_file"
}

# Apply a profile to all three patchable agent files using role-appropriate
# snippet variants.
#   $1 — Developer snippet
#   $2 — Read-only snippet (Auditor + Reviewer)
#   $3 — Human-readable profile label
apply_profile() {
  local dev_snippet="$1"
  local readonly_snippet="$2"
  local label="$3"

  local dev="$TARGET_DIR/agent/developer.md"
  local auditor="$TARGET_DIR/agent/auditor.md"
  local reviewer="$TARGET_DIR/agent/reviewer.md"

  [ -f "$dev" ]      && insert_profile "$dev"      "$dev_snippet"      && echo "   ✓ developer.md — $label"
  [ -f "$auditor" ]  && insert_profile "$auditor"  "$readonly_snippet" && echo "   ✓ auditor.md — $label (read-only subset)"
  [ -f "$reviewer" ] && insert_profile "$reviewer" "$readonly_snippet" && echo "   ✓ reviewer.md — $label (read-only subset)"
}

# ---------------------------------------------------------------------------
# Profile menu
# ---------------------------------------------------------------------------
choose_profile() {
  echo ""
  echo "Optional command profile:"
  echo "  1) None — technology-agnostic default (recommended)"
  echo "  2) JavaScript / TypeScript"
  echo "  3) Python"
  echo "  4) Go"
  echo "  5) Rust"
  echo "  6) Swift"
  echo "  7) Java / Kotlin"
  echo "  8) Ruby"
  echo "  9) PHP"
  echo " 10) All stacks — broad convenience mode"
  echo "     (enables all validation profiles; useful for multi-stack projects)"
  echo ""
  printf "Select a profile [1-10, default 1]: "
  read -r choice
  choice="${choice:-1}"

  case "$choice" in
    1)  PROFILE_CHOICE="none";                  PROFILE_LABEL="None (technology-agnostic default)" ;;
    2)  PROFILE_CHOICE="javascript-typescript"; PROFILE_LABEL="JavaScript / TypeScript" ;;
    3)  PROFILE_CHOICE="python";                PROFILE_LABEL="Python" ;;
    4)  PROFILE_CHOICE="go";                    PROFILE_LABEL="Go" ;;
    5)  PROFILE_CHOICE="rust";                  PROFILE_LABEL="Rust" ;;
    6)  PROFILE_CHOICE="swift";                 PROFILE_LABEL="Swift" ;;
    7)  PROFILE_CHOICE="java-kotlin";           PROFILE_LABEL="Java / Kotlin" ;;
    8)  PROFILE_CHOICE="ruby";                  PROFILE_LABEL="Ruby" ;;
    9)  PROFILE_CHOICE="php";                   PROFILE_LABEL="PHP" ;;
    10) PROFILE_CHOICE="all";                   PROFILE_LABEL="All stacks (broad convenience mode)" ;;
    *)
      echo "Invalid selection. Defaulting to None."
      PROFILE_CHOICE="none"
      PROFILE_LABEL="None (technology-agnostic default)"
      ;;
  esac
}

# ---------------------------------------------------------------------------
# Main installation
# ---------------------------------------------------------------------------
echo "🔧 Installing OpenCode Workflow..."
echo ""

# Create target directories if they don't exist
mkdir -p "$TARGET_DIR/agent"

# Backup existing agent files before overwriting
BACKUP_DIR="$TARGET_DIR/agent_backup_$(date +%Y%m%d_%H%M%S)"
backup_needed=false
for agent_file in "$SCRIPT_DIR/agent"/*.md; do
  agent_name=$(basename "$agent_file")
  if [ -f "$TARGET_DIR/agent/$agent_name" ]; then
    backup_needed=true
    break
  fi
done
if [ "$backup_needed" = true ]; then
  mkdir -p "$BACKUP_DIR"
  cp "$TARGET_DIR/agent/"*.md "$BACKUP_DIR/" 2>/dev/null || true
  echo "💾 Existing agent files backed up to:"
  echo "   $BACKUP_DIR"
  echo ""
fi

# Copy opencode.json
echo "📄 Copying opencode.json..."
cp "$SCRIPT_DIR/opencode.json" "$TARGET_DIR/opencode.json"

# Note: spec.md has bash: deny and is never patched by profile insertion.

# Copy agent files
echo "🤖 Copying agent files..."
for agent_file in "$SCRIPT_DIR/agent"/*.md; do
  if [ -f "$agent_file" ]; then
    agent_name=$(basename "$agent_file")
    cp "$agent_file" "$TARGET_DIR/agent/$agent_name"
    echo "   ✓ $agent_name"
  fi
done

# Choose and apply optional profile
choose_profile

echo ""
if [ "$PROFILE_CHOICE" != "none" ]; then
  echo "🧩 Applying profile: $PROFILE_LABEL"
  case "$PROFILE_CHOICE" in
    javascript-typescript)
      apply_profile "$PROFILE_JAVASCRIPT_TYPESCRIPT_DEV" "$PROFILE_JAVASCRIPT_TYPESCRIPT_READONLY" "JavaScript / TypeScript"
      ;;
    python)
      apply_profile "$PROFILE_PYTHON_DEV" "$PROFILE_PYTHON_READONLY" "Python"
      ;;
    go)
      apply_profile "$PROFILE_GO_DEV" "$PROFILE_GO_READONLY" "Go"
      ;;
    rust)
      apply_profile "$PROFILE_RUST_DEV" "$PROFILE_RUST_READONLY" "Rust"
      ;;
    swift)
      apply_profile "$PROFILE_SWIFT_DEV" "$PROFILE_SWIFT_READONLY" "Swift"
      ;;
    java-kotlin)
      apply_profile "$PROFILE_JAVA_KOTLIN_DEV" "$PROFILE_JAVA_KOTLIN_READONLY" "Java / Kotlin"
      ;;
    ruby)
      apply_profile "$PROFILE_RUBY_DEV" "$PROFILE_RUBY_READONLY" "Ruby"
      ;;
    php)
      apply_profile "$PROFILE_PHP_DEV" "$PROFILE_PHP_READONLY" "PHP"
      ;;
    all)
      apply_profile "$PROFILE_JAVASCRIPT_TYPESCRIPT_DEV" "$PROFILE_JAVASCRIPT_TYPESCRIPT_READONLY" "JavaScript / TypeScript"
      apply_profile "$PROFILE_PYTHON_DEV"                "$PROFILE_PYTHON_READONLY"                "Python"
      apply_profile "$PROFILE_GO_DEV"                    "$PROFILE_GO_READONLY"                    "Go"
      apply_profile "$PROFILE_RUST_DEV"                  "$PROFILE_RUST_READONLY"                  "Rust"
      apply_profile "$PROFILE_SWIFT_DEV"                 "$PROFILE_SWIFT_READONLY"                 "Swift"
      apply_profile "$PROFILE_JAVA_KOTLIN_DEV"           "$PROFILE_JAVA_KOTLIN_READONLY"           "Java / Kotlin"
      apply_profile "$PROFILE_RUBY_DEV"                  "$PROFILE_RUBY_READONLY"                  "Ruby"
      apply_profile "$PROFILE_PHP_DEV"                   "$PROFILE_PHP_READONLY"                   "PHP"
      ;;
  esac
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "🔒 Default permissions are technology-agnostic and conservative."
echo "🧩 Applied command profile: $PROFILE_LABEL"
echo ""
echo "   Profiles add convenience allowlists for project-specific validation"
echo "   commands. Developer receives the full profile including controlled"
echo "   mutating commands (listed as ask). Auditor and Reviewer receive only"
echo "   the read-only validation subset."
echo ""
echo "   Profiles do not enable publishing, deployment, dependency installation,"
echo "   destructive git operations, or write access for Auditor or Reviewer."
echo ""
echo "   You can manually edit installed agent files to add or remove commands:"
echo "   $TARGET_DIR/agent/"
echo ""
echo "⚠️  IMPORTANT: You still need to configure models for each agent."
echo "   Edit the agent files in $TARGET_DIR/agent/ and add a 'model:' field"
echo "   to each frontmatter section."
echo ""
echo "   Example for architect.md:"
echo "   ---"
echo "   description: Designs system architecture..."
echo "   mode: primary"
echo "   model: anthropic/claude-sonnet-4-6  # <-- Add this line"
echo "   permission:"
echo "   ---"
echo ""
echo "🔄 Restart opencode to apply changes."
echo ""
echo "📖 See README.md for more details on model selection and usage."
