#!/usr/bin/env bash
#
# Vercel Gatekeeper — blocks builds on staging/main that bypass PR workflow.
# Called by: "vercel-build": "bash scripts/vercel-gatekeeper-check.sh && next build"
#
# Feature branches always pass (no check needed).
# Staging/main require a merge commit or Ralph++/Claude co-authored commit.

set -euo pipefail

BRANCH="${VERCEL_GIT_COMMIT_REF:-unknown}"
MESSAGE="${VERCEL_GIT_COMMIT_MESSAGE:-}"

# Feature branches: always allow
if [[ "$BRANCH" != "main" && "$BRANCH" != "master" && "$BRANCH" != "staging" ]]; then
    echo "[gatekeeper] Feature branch ($BRANCH) — skipping check"
    exit 0
fi

# Check for allowed commit patterns
ALLOWED_PATTERNS=(
    "Merge pull request"
    "Merge branch"
    "Merge .* into"
    "Co-Authored-By: Claude"
    "Co-Authored-By: Ralph"
    "Generated with Claude Code"
    "ci: auto-merge"
)

for pattern in "${ALLOWED_PATTERNS[@]}"; do
    if echo "$MESSAGE" | grep -qiE "$pattern"; then
        echo "[gatekeeper] Allowed pattern matched: $pattern"
        exit 0
    fi
done

echo "============================================"
echo "[gatekeeper] BLOCKED: Direct commit to $BRANCH"
echo ""
echo "Commits to $BRANCH must come from a PR merge"
echo "or be co-authored by Claude/Ralph++."
echo ""
echo "Commit message: $MESSAGE"
echo ""
echo "Workflow:"
echo "  1. Create a feature branch: git checkout -b feat/my-feature"
echo "  2. Push and create PR: gh pr create --base main"
echo "  3. Merge after CI passes"
echo "============================================"
exit 1
