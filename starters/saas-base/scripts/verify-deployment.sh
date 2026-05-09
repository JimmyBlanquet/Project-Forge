#!/usr/bin/env bash
#
# Verify that a Vercel deployment matches the latest git commit on a branch.
# Usage: ./scripts/verify-deployment.sh [staging|production]
# Requires: VERCEL_TOKEN env var, vercel CLI, and gh CLI.

set -euo pipefail

ENV="${1:-staging}"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
    echo -e "${YELLOW}[warn]${NC} VERCEL_TOKEN not set — skipping deployment verification"
    exit 0
fi

BRANCH="main"
if [[ "$ENV" == "staging" ]]; then
    BRANCH="staging"
fi

# Get latest commit on branch
LATEST_COMMIT=$(git rev-parse "origin/$BRANCH" 2>/dev/null || git rev-parse "$BRANCH")
SHORT_COMMIT="${LATEST_COMMIT:0:7}"

echo "[verify] Checking $ENV deployment matches commit $SHORT_COMMIT ($BRANCH)..."

# Get latest Vercel deployment for the environment
DEPLOY_INFO=$(npx vercel ls --token "$VERCEL_TOKEN" --meta gitCommitSha="$LATEST_COMMIT" 2>/dev/null | head -5 || true)

if echo "$DEPLOY_INFO" | grep -q "$SHORT_COMMIT"; then
    echo -e "${GREEN}[ok]${NC} $ENV deployment matches latest commit ($SHORT_COMMIT)"
    exit 0
fi

# Check deployment age
DEPLOY_URL=$(npx vercel ls --token "$VERCEL_TOKEN" 2>/dev/null | grep "$ENV" | head -1 | awk '{print $2}' || true)
if [[ -n "$DEPLOY_URL" ]]; then
    echo -e "${YELLOW}[warn]${NC} $ENV deployment may be stale (expected $SHORT_COMMIT)"
    echo "  Latest deploy: $DEPLOY_URL"
    echo "  Expected commit: $SHORT_COMMIT"
    exit 2
fi

echo -e "${RED}[error]${NC} No $ENV deployment found"
exit 1
