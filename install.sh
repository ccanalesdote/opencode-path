#!/bin/bash

# OpenCode Workflow Installer
# This script installs the custom agent workflow to ~/.config/opencode/

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$HOME/.config/opencode"

# ---------------------------------------------------------------------------
# Profile snippets
# Each snippet is inserted before the final "*": "ask" line in the agent's
# bash permission block. Markers prevent duplicate inserts on re-runs.
# Snippets apply only to developer.md, auditor.md, and reviewer.md.
# architect.md has bash: deny and is not patched.
# ---------------------------------------------------------------------------

PROFILE_JAVASCRIPT_TYPESCRIPT='  # BEGIN optional profile: javascript-typescript
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

PROFILE_PYTHON='  # BEGIN optional profile: python
  "pytest*": "allow"
  "python -m pytest*": "allow"
  "python3 -m pytest*": "allow"
  "ruff check*": "allow"
  "mypy*": "allow"
  "pyright*": "allow"
  "python -m unittest*": "allow"
  "python3 -m unittest*": "allow"
  # END optional profile: python'

PROFILE_GO='  # BEGIN optional profile: go
  "go test*": "allow"
  "go vet*": "allow"
  "go fmt*": "ask"
  "gofmt*": "ask"
  # END optional profile: go'

PROFILE_RUST='  # BEGIN optional profile: rust
  "cargo test*": "allow"
  "cargo check*": "allow"
  "cargo clippy*": "allow"
  "cargo fmt --check*": "allow"
  "cargo fmt*": "ask"
  # END optional profile: rust'

PROFILE_SWIFT='  # BEGIN optional profile: swift
  "swift test*": "allow"
  "swift build*": "ask"
  "swift format lint*": "allow"
  "swift format*": "ask"
  "xcodebuild test*": "ask"
  # END optional profile: swift'

PROFILE_JAVA_KOTLIN='  # BEGIN optional profile: java-kotlin
  "./gradlew test*": "allow"
  "./gradlew check*": "allow"
  "./gradlew ktlintCheck*": "allow"
  "./gradlew detekt*": "allow"
  "gradle test*": "allow"
  "gradle check*": "allow"
  "mvn test*": "allow"
  "mvn verify*": "allow"
  # END optional profile: java-kotlin'

PROFILE_RUBY='  # BEGIN optional profile: ruby
  "bundle exec rspec*": "allow"
  "bundle exec rubocop*": "allow"
  "ruby -c*": "allow"
  "rails test*": "allow"
  # END optional profile: ruby'

PROFILE_PHP='  # BEGIN optional profile: php
  "composer test*": "allow"
  "vendor/bin/phpunit*": "allow"
  "vendor/bin/phpstan*": "allow"
  "vendor/bin/psalm*": "allow"
  "vendor/bin/phpcs*": "allow"
  # END optional profile: php'

# ---------------------------------------------------------------------------
# Helper: insert a profile snippet into a single agent file
# Skips insertion if the BEGIN marker already exists in the file.
# Inserts the snippet immediately before the line matching `"*": "ask"`.
# ---------------------------------------------------------------------------
insert_profile() {
  local file="$1"
  local snippet="$2"
  local marker_begin
  # Extract the marker name from the first line of the snippet
  marker_begin=$(echo "$snippet" | head -1 | sed 's/^[[:space:]]*//')

  # Skip if already inserted
  if grep -qF "$marker_begin" "$file" 2>/dev/null; then
    return 0
  fi

  # Insert snippet before the catch-all "*": "ask" line
  # Use a temp file to avoid in-place issues across platforms
  local tmpfile
  tmpfile=$(mktemp)
  awk -v snippet="$snippet" '
    /^[[:space:]]*"\*": "ask"/ && !inserted {
      print snippet
      inserted=1
    }
    { print }
  ' "$file" > "$tmpfile"
  mv "$tmpfile" "$file"
}

# Apply a named profile to the three patchable agent files
apply_profile() {
  local snippet="$1"
  local label="$2"
  for agent in developer.md auditor.md reviewer.md; do
    local target="$TARGET_DIR/agent/$agent"
    if [ -f "$target" ]; then
      insert_profile "$target" "$snippet"
      echo "   ✓ $agent — applied $label"
    fi
  done
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
  echo " 10) All common validation profiles"
  echo ""
  printf "Select a profile [1-10, default 1]: "
  read -r choice
  choice="${choice:-1}"

  case "$choice" in
    1)
      PROFILE_CHOICE="none"
      PROFILE_LABEL="None (technology-agnostic default)"
      ;;
    2)
      PROFILE_CHOICE="javascript-typescript"
      PROFILE_LABEL="JavaScript / TypeScript"
      ;;
    3)
      PROFILE_CHOICE="python"
      PROFILE_LABEL="Python"
      ;;
    4)
      PROFILE_CHOICE="go"
      PROFILE_LABEL="Go"
      ;;
    5)
      PROFILE_CHOICE="rust"
      PROFILE_LABEL="Rust"
      ;;
    6)
      PROFILE_CHOICE="swift"
      PROFILE_LABEL="Swift"
      ;;
    7)
      PROFILE_CHOICE="java-kotlin"
      PROFILE_LABEL="Java / Kotlin"
      ;;
    8)
      PROFILE_CHOICE="ruby"
      PROFILE_LABEL="Ruby"
      ;;
    9)
      PROFILE_CHOICE="php"
      PROFILE_LABEL="PHP"
      ;;
    10)
      PROFILE_CHOICE="all"
      PROFILE_LABEL="All common validation profiles"
      ;;
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

# Copy opencode.json
echo "📄 Copying opencode.json..."
cp "$SCRIPT_DIR/opencode.json" "$TARGET_DIR/opencode.json"

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
    javascript-typescript) apply_profile "$PROFILE_JAVASCRIPT_TYPESCRIPT" "JavaScript / TypeScript" ;;
    python)                apply_profile "$PROFILE_PYTHON"                 "Python" ;;
    go)                    apply_profile "$PROFILE_GO"                     "Go" ;;
    rust)                  apply_profile "$PROFILE_RUST"                   "Rust" ;;
    swift)                 apply_profile "$PROFILE_SWIFT"                  "Swift" ;;
    java-kotlin)           apply_profile "$PROFILE_JAVA_KOTLIN"            "Java / Kotlin" ;;
    ruby)                  apply_profile "$PROFILE_RUBY"                   "Ruby" ;;
    php)                   apply_profile "$PROFILE_PHP"                    "PHP" ;;
    all)
      apply_profile "$PROFILE_JAVASCRIPT_TYPESCRIPT" "JavaScript / TypeScript"
      apply_profile "$PROFILE_PYTHON"                "Python"
      apply_profile "$PROFILE_GO"                    "Go"
      apply_profile "$PROFILE_RUST"                  "Rust"
      apply_profile "$PROFILE_SWIFT"                 "Swift"
      apply_profile "$PROFILE_JAVA_KOTLIN"           "Java / Kotlin"
      apply_profile "$PROFILE_RUBY"                  "Ruby"
      apply_profile "$PROFILE_PHP"                   "PHP"
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
echo "   commands. They do not enable publishing, deployment, dependency"
echo "   installation, destructive git operations, or write access for"
echo "   Auditor or Reviewer."
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
