#!/bin/bash
set -e
GREEN='\033[0;32m'; NC='\033[0m'
echo -e "${GREEN}📦 Installing cicd-github-actions-base${NC}"

PROJECT_ROOT=$(pwd)
while [[ ! -f "$PROJECT_ROOT/package.json" ]] && [[ "$PROJECT_ROOT" != "/" ]]; do
  PROJECT_ROOT=$(dirname "$PROJECT_ROOT")
done

SKILL_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TARGET_DIR="$PROJECT_ROOT/.github/workflows"
mkdir -p "$TARGET_DIR"
cp "$SKILL_DIR/files/.github/workflows/"* "$TARGET_DIR/"

echo -e "${GREEN}✓ Workflows copied to .github/workflows/${NC}"
echo -e "${GREEN}✅ Push to GitHub to see CI in action!${NC}"
