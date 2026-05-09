#!/usr/bin/env bash
# scripts/check-ticket-update.sh
#
# Hook Stop : rappelle de mettre à jour les tickets GitHub référencés
# dans les commits récents.
#
# Pattern adapté de mattpocock/skills/git-guardrails-claude-code, mais
# pour la gestion des tickets au lieu des commandes git destructives.
#
# Trigger : à la fin de chaque tour Claude Code (hook Stop)
# Action : scan les 3 derniers commits pour des refs #N, vérifie l'état
# du ticket sur GitHub, alerte si toujours OPEN.
#
# Silence si rien à signaler (pas de commits récents avec refs, pas de
# repo Git, pas de gh auth).
#
# Codes de sortie :
#   0 = always (jamais bloquant — c'est un rappel, pas un gate)

# `set -uo pipefail` (sans -e) : convention safe pour Stop hook.
# Le hook ne doit JAMAIS bloquer la session sur une erreur transitoire (gh API
# down, fichier disparu, etc.). Les `|| true` ponctuels gèrent les cas attendus.
# Aligné avec scripts/test-verification-reminder.sh (même convention).
set -uo pipefail

# Skip si pas dans un repo Git
git rev-parse --git-dir > /dev/null 2>&1 || exit 0

# Skip si gh CLI pas installé ou pas authentifié
command -v gh > /dev/null 2>&1 || exit 0
gh auth status > /dev/null 2>&1 || exit 0

# Skip si user.email pas configuré (sinon git log --author="" matche tout
# et on scannerait les commits des autres collaborateurs)
AUTHOR_EMAIL=$(git config user.email 2>/dev/null || echo "")
[ -z "$AUTHOR_EMAIL" ] && exit 0

# Récupère les refs #N des 3 derniers commits (auteur courant uniquement)
# `|| true` neutralise pipefail : grep renvoie 1 quand aucun match, ce qui
# tuerait le script avec set -e.
RECENT_REFS=$(git log --oneline -3 --author="$AUTHOR_EMAIL" 2>/dev/null \
  | grep -oE '#[0-9]+' \
  | sort -u \
  || true)

[ -z "$RECENT_REFS" ] && exit 0

# Pour chaque ticket référencé, check son état
ALERTS=""
for REF in $RECENT_REFS; do
  NUM="${REF#\#}"

  # Essaye d'abord comme issue, puis comme PR
  STATE=""
  TITLE=""
  KIND=""

  if INFO=$(gh issue view "$NUM" --json state,title 2>/dev/null); then
    STATE=$(echo "$INFO" | python3 -c "import sys,json;print(json.load(sys.stdin).get('state',''))" 2>/dev/null || echo "")
    TITLE=$(echo "$INFO" | python3 -c "import sys,json;print(json.load(sys.stdin).get('title',''))" 2>/dev/null || echo "")
    KIND="issue"
  elif INFO=$(gh pr view "$NUM" --json state,title 2>/dev/null); then
    STATE=$(echo "$INFO" | python3 -c "import sys,json;print(json.load(sys.stdin).get('state',''))" 2>/dev/null || echo "")
    TITLE=$(echo "$INFO" | python3 -c "import sys,json;print(json.load(sys.stdin).get('title',''))" 2>/dev/null || echo "")
    KIND="PR"
  else
    continue
  fi

  # Si OPEN, alerte avec commande spécifique au type (issue vs PR)
  if [ "$STATE" = "OPEN" ]; then
    # Coupe le titre à 60 chars max
    SHORT_TITLE="${TITLE:0:60}"
    [ ${#TITLE} -gt 60 ] && SHORT_TITLE="${SHORT_TITLE}..."
    if [ "$KIND" = "issue" ]; then
      ICON="📋"
      CMD_HINT="gh issue close ${NUM} / gh issue comment ${NUM}"
    else
      ICON="🔀"
      CMD_HINT="gh pr close ${NUM} / gh pr comment ${NUM}"
    fi
    ALERTS="${ALERTS}  ${ICON}  ${REF} (${KIND}) toujours OPEN — \"${SHORT_TITLE}\"\n       → ${CMD_HINT}\n"
  fi
done

# Émet le rappel uniquement s'il y a des alertes
if [ -n "$ALERTS" ]; then
  echo ""
  echo "Tickets référencés dans les commits récents à vérifier :"
  echo -e "${ALERTS}"
fi

exit 0
