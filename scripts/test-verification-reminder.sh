#!/usr/bin/env bash
# test-verification-reminder.sh — Stop hook for Project-Forge
#
# Rappelle d'exécuter `bash tests/forge-eval.sh` quand du code meta
# (skills/tools/scripts/starters/systems) a été modifié dans la session.
# Cohérent avec Quality Gate Niveau 1 du CLAUDE.md.
#
# Différent de starters/*/scripts/test-reminder.sh qui vérifie la PRÉSENCE
# de tests dans le diff. Ici on rappelle l'EXÉCUTION effective.
#
# Configure dans .claude/settings.json (Stop hook).
# Source : rapport Claude Code Insights 2026-05-01 — pattern récurrent
# "déclaré done sans test exécuté" (31 buggy_code + 19 wrong_approach).

set -uo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR" || exit 0

# Vérifie qu'on est bien dans un git repo
if ! git rev-parse --git-dir >/dev/null 2>&1; then
    exit 0
fi

# Détecte les fichiers meta modifiés (unstaged + staged + untracked)
# Inclut `tests/` pour rappeler de relancer le harness quand on modifie le harness lui-même
# (sinon angle mort : modifier forge-eval.sh ne déclenche pas le rappel d'exécuter forge-eval.sh).
META_REGEX='^(skills|tools|scripts|starters|systems|extensions|tests)/'
MODIFIED=$(git diff --name-only HEAD 2>/dev/null | grep -E "$META_REGEX" || true)
STAGED=$(git diff --cached --name-only 2>/dev/null | grep -E "$META_REGEX" || true)
UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | grep -E "$META_REGEX" || true)

ALL_MODIFIED=$(printf '%s\n%s\n%s\n' "${MODIFIED}" "${STAGED}" "${UNTRACKED}" | sort -u | grep -v '^$' || true)

if [ -z "$ALL_MODIFIED" ]; then
    exit 0
fi

COUNT=$(echo "$ALL_MODIFIED" | wc -l | tr -d ' ')

# Détecte la commande de test à recommander.
# Surchargeable via TEST_CMD env var ; sinon fallback selon ce qui existe dans le projet.
if [ -n "${TEST_CMD:-}" ]; then
    SUGGESTED_CMD="$TEST_CMD"
elif [ -f "$PROJECT_DIR/tests/forge-eval.sh" ]; then
    SUGGESTED_CMD="bash tests/forge-eval.sh"
elif [ -f "$PROJECT_DIR/package.json" ] && grep -qE '"(test|test:run)":' "$PROJECT_DIR/package.json" 2>/dev/null; then
    if grep -q '"test:run":' "$PROJECT_DIR/package.json" 2>/dev/null; then
        SUGGESTED_CMD="pnpm test:run"
    else
        SUGGESTED_CMD="pnpm test"
    fi
elif [ -f "$PROJECT_DIR/pyproject.toml" ] || [ -f "$PROJECT_DIR/pytest.ini" ]; then
    SUGGESTED_CMD="pytest"
else
    SUGGESTED_CMD="<your test suite>"
fi

# Rappel non bloquant (warning visible)
echo ""
echo "🧪 RAPPEL TEST-VERIFICATION"
echo "   $COUNT fichier(s) meta modifié(s) — n'oublie pas la vérification :"
echo "     → $SUGGESTED_CMD"
echo ""
echo "   Cohérent avec Quality Gate Niveau 1 (CLAUDE.md règle absolue)."
echo "   Si les tests passent : tu peux dire \"c'est fait\". Sinon : ne déclare pas done."
echo ""

exit 0
