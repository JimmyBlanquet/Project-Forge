#!/usr/bin/env bash
# test-reminder.sh — Stop hook for Claude Code
# Warns when implementation files are modified without corresponding test updates.
#
# This is a WARNING, not a blocker — some changes don't need tests.
# The hard enforcement is in CI (coverage delta via Codecov).
#
# Configure in .claude/settings.json:
# "hooks": { "Stop": [{ "matcher": "", "hooks": [{ "type": "command", "command": "bash scripts/test-reminder.sh" }] }] }

set -euo pipefail

# Check git diff for modified files in this session
IMPL_FILES=$(git diff --name-only HEAD 2>/dev/null | grep -E '^(app|lib|components|utils|src)/' || true)
TEST_FILES=$(git diff --name-only HEAD 2>/dev/null | grep -E '^tests/' || true)

# Also check staged files
IMPL_STAGED=$(git diff --cached --name-only 2>/dev/null | grep -E '^(app|lib|components|utils|src)/' || true)
TEST_STAGED=$(git diff --cached --name-only 2>/dev/null | grep -E '^tests/' || true)

# Combine
ALL_IMPL=$(echo -e "${IMPL_FILES}\n${IMPL_STAGED}" | sort -u | grep -v '^$' || true)
ALL_TESTS=$(echo -e "${TEST_FILES}\n${TEST_STAGED}" | sort -u | grep -v '^$' || true)

# If no implementation files modified, nothing to check
if [ -z "${ALL_IMPL}" ]; then
  exit 0
fi

IMPL_COUNT=$(echo "${ALL_IMPL}" | wc -l | tr -d ' ')

# If implementation files modified but no test files
if [ -z "${ALL_TESTS}" ]; then
  echo ""
  echo "⚠️  RAPPEL TESTS"
  echo "   ${IMPL_COUNT} fichier(s) d'implémentation modifié(s) sans mise à jour de tests."
  echo ""
  echo "   Fichiers modifiés :"
  echo "${ALL_IMPL}" | head -10 | sed 's/^/     - /'
  if [ "${IMPL_COUNT}" -gt 10 ]; then
    echo "     ... et $((IMPL_COUNT - 10)) autres"
  fi
  echo ""
  echo "   Actions suggérées :"
  echo "     → /speckit-test-bridge pour générer les tests manquants"
  echo "     → pnpm test:traceability pour vérifier la couverture"
  echo ""
fi

# Always exit 0 — this is a warning, not a blocker
exit 0
