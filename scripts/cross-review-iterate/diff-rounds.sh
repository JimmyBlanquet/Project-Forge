#!/usr/bin/env bash
# diff-rounds.sh — compare 2 rounds de findings (fingerprints) et émet un verdict
#
# Usage:
#   diff-rounds.sh <prev-fingerprints-file> <current-fingerprints-file> [--divergence-ratio 1.5]
#
# Inputs : 2 fichiers contenant chacun 1 fingerprint par ligne (output de fingerprint.sh).
#
# Output JSON sur stdout :
#   {"new":N, "dropped":N, "stable":N, "prev_count":N, "current_count":N,
#    "verdict":"converging|stable|growing|diverging"}
#
# Verdicts :
#   - "stable"    : new == 0 (= 0 nouveau finding ce round)
#   - "converging": new > 0 ET dropped > 0 ET current_count <= prev_count (qualité monte)
#   - "growing"   : new > 0 ET current_count > prev_count (mais ratio < seuil divergence)
#   - "diverging" : new > divergence_ratio × prev_count (alarme spec drift)
#
# Exit codes :
#   0 = stable ou converging (signal CONTINUER ou STOP-stable selon STAGNATION_K appelant)
#   1 = growing  (signal CONTINUER, ne pas s'arrêter)
#   2 = diverging (signal STOP IMMÉDIAT)

set -uo pipefail

PREV=""
CURRENT=""
DIVERGENCE_RATIO="1.5"

while [ $# -gt 0 ]; do
    case "$1" in
        --divergence-ratio) DIVERGENCE_RATIO="$2"; shift 2 ;;
        -*) echo "Unknown option: $1" >&2; exit 3 ;;
        *)
            if [ -z "$PREV" ]; then PREV="$1"
            elif [ -z "$CURRENT" ]; then CURRENT="$1"
            else echo "Unexpected argument: $1" >&2; exit 3; fi
            shift ;;
    esac
done

if [ -z "$PREV" ] || [ -z "$CURRENT" ]; then
    echo "Usage: $0 <prev-fingerprints-file> <current-fingerprints-file> [--divergence-ratio N]" >&2
    exit 3
fi

if [ ! -f "$PREV" ] || [ ! -f "$CURRENT" ]; then
    echo "ERROR: input file(s) missing" >&2
    exit 3
fi

# Helper : count non-empty lines, retourne 0 si fichier vide ou inexistant
count_lines() {
    local input="$1"
    [ -z "$input" ] && { echo 0; return; }
    printf '%s' "$input" | grep -c . 2>/dev/null | head -1 || echo 0
}

# Compte
PREV_COUNT=$(count_lines "$(cat "$PREV" 2>/dev/null)")
CURRENT_COUNT=$(count_lines "$(cat "$CURRENT" 2>/dev/null)")

# Tri pour comm (sort gère bien les fichiers vides)
PREV_SORTED=$(sort -u "$PREV" 2>/dev/null)
CURRENT_SORTED=$(sort -u "$CURRENT" 2>/dev/null)

# new = present in current but not prev
NEW_COUNT=$(count_lines "$(comm -23 <(printf '%s' "$CURRENT_SORTED") <(printf '%s' "$PREV_SORTED"))")
# dropped = present in prev but not current
DROPPED_COUNT=$(count_lines "$(comm -13 <(printf '%s' "$CURRENT_SORTED") <(printf '%s' "$PREV_SORTED"))")
# stable = present in both
STABLE_COUNT=$(count_lines "$(comm -12 <(printf '%s' "$CURRENT_SORTED") <(printf '%s' "$PREV_SORTED"))")

# Verdict
if [ "$NEW_COUNT" -eq 0 ]; then
    VERDICT="stable"
    EXIT_CODE=0
elif [ "$PREV_COUNT" -gt 0 ]; then
    # Calcul ratio en utilisant awk (pas besoin de bc)
    DIVERGES=$(awk -v new="$NEW_COUNT" -v prev="$PREV_COUNT" -v ratio="$DIVERGENCE_RATIO" \
        'BEGIN { print (new > prev * ratio) ? "yes" : "no" }')
    if [ "$DIVERGES" = "yes" ]; then
        VERDICT="diverging"
        EXIT_CODE=2
    elif [ "$CURRENT_COUNT" -le "$PREV_COUNT" ] && [ "$DROPPED_COUNT" -gt 0 ]; then
        VERDICT="converging"
        EXIT_CODE=0
    else
        VERDICT="growing"
        EXIT_CODE=1
    fi
else
    # Pas de prev → tout est nouveau, ni stable ni diverging — growing par défaut
    VERDICT="growing"
    EXIT_CODE=1
fi

# Output JSON
printf '{"new":%d,"dropped":%d,"stable":%d,"prev_count":%d,"current_count":%d,"verdict":"%s"}\n' \
    "$NEW_COUNT" "$DROPPED_COUNT" "$STABLE_COUNT" "$PREV_COUNT" "$CURRENT_COUNT" "$VERDICT"

exit "$EXIT_CODE"
