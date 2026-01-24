#!/bin/bash

# Global Skills Installation Script for Antigravity Awesome Skills
# This script makes the 233 skills available globally for all AI assistants

set -e

echo "🌌 Installing Antigravity Awesome Skills globally..."

# Detect AI assistant and set global skills directory
if command -v gemini &> /dev/null; then
    GLOBAL_SKILLS_DIR="$HOME/.gemini/skills"
    echo "✓ Detected Gemini CLI"
elif command -v claude &> /dev/null; then
    GLOBAL_SKILLS_DIR="$HOME/.claude/skills"
    echo "✓ Detected Claude Code"
elif command -v codex &> /dev/null; then
    GLOBAL_SKILLS_DIR="$HOME/.codex/skills"
    echo "✓ Detected Codex CLI"
else
    # Default to universal .agent directory
    GLOBAL_SKILLS_DIR="$HOME/.agent/skills"
    echo "ℹ Using universal .agent/skills directory"
fi

# Create global skills directory if it doesn't exist
mkdir -p "$GLOBAL_SKILLS_DIR"

# Copy all skills from local installation
echo "📦 Copying 233 skills to $GLOBAL_SKILLS_DIR..."
cp -r "$(dirname "$0")/skills/skills/"* "$GLOBAL_SKILLS_DIR/"

# Verify installation
SKILL_COUNT=$(find "$GLOBAL_SKILLS_DIR" -name "SKILL.md" | wc -l)
echo "✅ Installation complete! Installed $SKILL_COUNT skills globally."
echo ""
echo "Skills are now available in all your projects!"
echo "Global location: $GLOBAL_SKILLS_DIR"
echo ""
echo "Available skill categories:"
echo "  🛸 Autonomous & Agentic (8 skills)"
echo "  🔌 Integrations & APIs (25 skills)"
echo "  🛡️ Cybersecurity (51 skills)"
echo "  🎨 Creative & Design (10 skills)"
echo "  🛠️ Development (33 skills)"
echo "  🏗️ Infrastructure & Git (8 skills)"
echo "  🤖 AI Agents & LLM (30 skills)"
echo "  🔄 Workflow & Planning (6 skills)"
echo "  📄 Document Processing (4 skills)"
echo "  🧪 Testing & QA (4 skills)"
echo "  📈 Product & Strategy (8 skills)"
echo "  📣 Marketing & Growth (23 skills)"
echo "  🚀 Maker Tools (11 skills)"
echo "  + Many more!"
