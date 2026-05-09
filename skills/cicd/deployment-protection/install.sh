#!/bin/bash
set -e
GREEN='\033[0;32m'; NC='\033[0m'
echo -e "${GREEN}📦 Installing cicd-deployment-protection${NC}"

PROJECT_ROOT=$(pwd)
while [[ ! -f "$PROJECT_ROOT/package.json" ]] && [[ "$PROJECT_ROOT" != "/" ]]; do
  PROJECT_ROOT=$(dirname "$PROJECT_ROOT")
done

SKILL_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cp -r "$SKILL_DIR/files/.husky" "$PROJECT_ROOT/"

echo -e "${GREEN}✓ Hooks copied to .husky/${NC}"
echo "Run: npx husky install"
