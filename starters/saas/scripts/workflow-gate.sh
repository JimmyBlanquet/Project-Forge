#!/usr/bin/env bash
# workflow-gate.sh — PreToolUse hook for Claude Code
# Blocks code modifications in app/lib/components/ when no spec.md exists.
#
# Receives JSON on stdin with tool_name and tool_input.
# Exit 0 = allow, Exit 2 = block with reason.
#
# Configure in .claude/settings.json:
# "hooks": { "PreToolUse": [{ "matcher": "Write|Edit", "hooks": [{ "type": "command", "command": "bash scripts/workflow-gate.sh" }] }] }

set -euo pipefail

# Read JSON from stdin
INPUT=$(cat)

# Extract the file path from tool input
FILE_PATH=$(echo "${INPUT}" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    inp = data.get('tool_input', {})
    print(inp.get('file_path', inp.get('content', '')))
except:
    print('')
" 2>/dev/null || echo "")

# If no file path, allow (non-file operation)
if [ -z "${FILE_PATH}" ]; then
  exit 0
fi

# Normalize path — extract relative path from project root
REL_PATH="${FILE_PATH}"
if [[ "${FILE_PATH}" == /* ]]; then
  PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
  REL_PATH="${FILE_PATH#${PROJECT_ROOT}/}"
fi

# Only check implementation directories
PROTECTED_DIRS="^(app|lib|components|utils|src)/"

if ! echo "${REL_PATH}" | grep -qE "${PROTECTED_DIRS}"; then
  # Not a protected directory (tests, docs, config, scripts, etc.) — allow
  exit 0
fi

# Exceptions: API health, config files, types
EXCEPTIONS="(\.d\.ts$|health|config|\.env|middleware\.ts$)"
if echo "${REL_PATH}" | grep -qE "${EXCEPTIONS}"; then
  exit 0
fi

# Check if SpecKit workflow has been followed
SPEC_EXISTS=false

# Check .specify/ directory (spec-kit v0.3.2+)
if [ -d ".specify" ]; then
  if find .specify -name "spec.md" -o -name "plan.md" 2>/dev/null | grep -q .; then
    SPEC_EXISTS=true
  fi
fi

# Check .speckit/ directory (legacy Project-Forge format)
if [ -d ".speckit" ]; then
  if find .speckit -name "spec.md" -o -name "plan.md" 2>/dev/null | grep -q .; then
    SPEC_EXISTS=true
  fi
fi

# Also check specs/ directory
if [ -d "specs" ]; then
  if find specs -name "spec.md" -o -name "plan.md" 2>/dev/null | grep -q .; then
    SPEC_EXISTS=true
  fi
fi

# Also allow if there's an active PRD (ralph-loop mode)
if find . -maxdepth 2 -name "prd.json" -o -name "skill-prd.json" 2>/dev/null | grep -q .; then
  SPEC_EXISTS=true
fi

if [ "${SPEC_EXISTS}" = true ]; then
  exit 0
fi

# Block with explanation
echo "⚠️  WORKFLOW NON RESPECTÉ"
echo ""
echo "Modification bloquée : ${REL_PATH}"
echo ""
echo "Aucun spec.md, plan.md ou prd.json trouvé dans .specify/, .speckit/ ou specs/."
echo "Le workflow spec-kit doit être suivi avant de coder :"
echo ""
echo "  1. /speckit.specify  → Définir QUOI construire"
echo "  2. /speckit.plan     → Définir COMMENT construire"
echo "  3. /speckit.tasks    → Générer les tâches"
echo ""
echo "Si vous devez contourner le workflow :"
echo "  → Demandez validation EXPLICITE à l'utilisateur"
echo "  → Documentez l'analyse coût/risque/bénéfice"
exit 2
