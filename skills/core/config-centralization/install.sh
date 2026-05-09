#!/bin/bash
#
# Config Centralization Skill - Installation Script
#
# This script installs the config centralization skill into your TypeScript/Next.js project
#

set -e  # Exit on error

echo "🚀 Installing Config Centralization Skill..."

# Determine skill directory (where this script lives)
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "✓ Skill directory: $SKILL_DIR"

# Detect project root
# If run from skill directory, navigate to project root
# If run from project root, use current directory
PROJECT_ROOT=""

if [ -f "package.json" ]; then
  # Running from project root
  PROJECT_ROOT="$(pwd)"
elif [ -f "../../../package.json" ]; then
  # Running from skills/core/config-centralization/
  PROJECT_ROOT="$(cd ../../../ && pwd)"
elif [ -f "../../package.json" ]; then
  # Running from skills/core/
  PROJECT_ROOT="$(cd ../../ && pwd)"
else
  echo ""
  echo "❌ Error: Cannot find project root (package.json)"
  echo ""
  echo "   Please run this script either from:"
  echo "   1. Your project root directory (where package.json is)"
  echo "   2. The skill directory (skills/core/config-centralization/)"
  echo ""
  exit 1
fi

echo "✓ Found project root: $PROJECT_ROOT"

# Verify files directory exists
if [ ! -d "$SKILL_DIR/files" ]; then
  echo ""
  echo "❌ Error: files/ directory not found in skill directory"
  echo "   Expected location: $SKILL_DIR/files/"
  echo ""
  exit 1
fi

# Verify required files exist
REQUIRED_FILES=("config-manager.ts" "types.ts" "index.ts")
for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$SKILL_DIR/files/$file" ]; then
    echo ""
    echo "❌ Error: Required file missing: $file"
    echo "   Expected location: $SKILL_DIR/files/$file"
    echo ""
    exit 1
  fi
done

echo "✓ Verified skill files exist"

# Create target directory
TARGET_DIR="$PROJECT_ROOT/lib/config"
mkdir -p "$TARGET_DIR"
echo "✓ Created target directory: lib/config/"

# Copy files
echo ""
echo "📦 Copying files..."
cp "$SKILL_DIR/files/config-manager.ts" "$TARGET_DIR/config-manager.ts"
echo "   ✓ config-manager.ts"
cp "$SKILL_DIR/files/types.ts" "$TARGET_DIR/types.ts"
echo "   ✓ types.ts"
cp "$SKILL_DIR/files/index.ts" "$TARGET_DIR/index.ts"
echo "   ✓ index.ts"

# Verify installation
echo ""
echo "🔍 Verifying installation..."
if [ -f "$TARGET_DIR/config-manager.ts" ] && \
   [ -f "$TARGET_DIR/types.ts" ] && \
   [ -f "$TARGET_DIR/index.ts" ]; then
  echo "✓ All files copied successfully"
else
  echo "❌ Installation verification failed"
  exit 1
fi

# Check if TypeScript is configured
if [ ! -f "$PROJECT_ROOT/tsconfig.json" ]; then
  echo ""
  echo "⚠️  Warning: tsconfig.json not found"
  echo "   This skill requires TypeScript. Please ensure your project is configured for TypeScript."
fi

# Installation complete
echo ""
echo "✅ Installation complete!"
echo ""
echo "📝 Files installed:"
echo "   • lib/config/config-manager.ts - Core ConfigManager class"
echo "   • lib/config/types.ts          - TypeScript type definitions"
echo "   • lib/config/index.ts          - Public API exports"
echo ""
echo "📚 Next steps:"
echo ""
echo "   1. Set up environment variables in .env.local:"
echo "      DATABASE_URL=postgresql://localhost:5432/myapp"
echo "      API_URL=https://api.example.com"
echo "      API_KEY=your_api_key_here"
echo ""
echo "   2. Use in your application:"
echo "      import { ConfigManager } from '@/lib/config'"
echo "      import type { AppConfig } from '@/lib/config'"
echo ""
echo "      const config = ConfigManager.getInstance<AppConfig>({"
echo "        required: ['DATABASE_URL', 'API_URL'],"
echo "        defaults: { PORT: 3000, LOG_LEVEL: 'info' }"
echo "      })"
echo ""
echo "   3. See SKILL.md for complete documentation and examples"
echo ""
echo "🎉 Happy coding!"
