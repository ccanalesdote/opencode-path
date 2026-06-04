#!/bin/bash

# OpenCode Workflow Installer
# This script installs the custom agent workflow to ~/.config/opencode/

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$HOME/.config/opencode"

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

echo ""
echo "✅ Installation complete!"
echo ""
echo "⚠️  IMPORTANT: You need to configure models for each agent."
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
