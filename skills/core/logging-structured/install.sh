#!/bin/bash
set -e
GREEN='\033[0;32m'; NC='\033[0m'
echo -e "${GREEN}📦 Installing logging-structured${NC}"

PROJECT_ROOT=$(pwd)
while [[ ! -f "$PROJECT_ROOT/package.json" ]] && [[ "$PROJECT_ROOT" != "/" ]]; do
  PROJECT_ROOT=$(dirname "$PROJECT_ROOT")
done
[[ ! -f "$PROJECT_ROOT/package.json" ]] && echo "Error: No package.json found" && exit 1

SKILL_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TARGET_DIR="$PROJECT_ROOT/src/lib/logger"
mkdir -p "$TARGET_DIR"
cp -r "$SKILL_DIR/files/lib/logger/"* "$TARGET_DIR/"

echo -e "${GREEN}✓ Files copied to src/lib/logger/${NC}"
echo -e "${GREEN}✅ Installation complete!${NC}"
echo ""
echo "Usage:"
echo '  import { createLogger } from "@/lib/logger"'
echo '  const logger = createLogger({ module: "api" })'
echo '  logger.info("Hello", { userId })'
