#!/usr/bin/env bash
# diff-rounds-semantic.sh — diff sémantique de 2 rounds de findings via LLM-as-judge
#
# Usage:
#   diff-rounds-semantic.sh <prev-findings-file> <current-findings-file> [--divergence-ratio 1.5]
#
# Inputs : 2 fichiers contenant chacun 1 finding par ligne au format "file:line|claim"
#
# Algorithme :
#   1. Pour chaque finding R(N) : essaye match exact via fingerprint sha256
#   2. Pour les non-matchés : essaye match sémantique via dedupe-judge LLM
#   3. Compte stable / new / dropped et émet verdict
#
# Output JSON identique à diff-rounds.sh :
#   {"new":N, "dropped":N, "stable":N, "prev_count":N, "current_count":N,
#    "verdict":"converging|stable|growing|diverging", "method":"semantic"}
#
# Exit codes identiques à diff-rounds.sh :
#   0 = stable ou converging
#   1 = growing
#   2 = diverging

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

if [ -z "$PREV" ] || [ -z "$CURRENT" ] || [ ! -f "$PREV" ] || [ ! -f "$CURRENT" ]; then
    echo "Usage: $0 <prev-findings-file> <current-findings-file> [--divergence-ratio N]" >&2
    echo "Each file: 1 finding per line, format 'file:line|claim'" >&2
    exit 3
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FP_SCRIPT="$SCRIPT_DIR/fingerprint.sh"
DJ_SCRIPT="$SCRIPT_DIR/dedupe-judge.sh"

[ -x "$FP_SCRIPT" ] || { echo "ERROR: $FP_SCRIPT missing or not executable" >&2; exit 3; }
[ -x "$DJ_SCRIPT" ] || { echo "ERROR: $DJ_SCRIPT missing or not executable" >&2; exit 3; }

# Helper : count non-empty lines (robust : gère fichier vide / inexistant sans concat)
count_lines() {
    local f="$1"
    if [ ! -s "$f" ]; then echo 0; return; fi
    grep -c . "$f" 2>/dev/null | head -1
}

PREV_COUNT=$(count_lines "$PREV")
CURRENT_COUNT=$(count_lines "$CURRENT")

# Phase 1 : exact fingerprint match (fast)
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

# Compute fingerprints + keep mapping fp → finding line
> "$TMPDIR/prev.fp"
while IFS= read -r line; do
    [ -z "$line" ] && continue
    file="${line%%|*}"; claim="${line#*|}"
    fp=$(bash "$FP_SCRIPT" "$file" "$claim")
    echo "$fp|$line" >> "$TMPDIR/prev.fp"
done < "$PREV"

> "$TMPDIR/current.fp"
while IFS= read -r line; do
    [ -z "$line" ] && continue
    file="${line%%|*}"; claim="${line#*|}"
    fp=$(bash "$FP_SCRIPT" "$file" "$claim")
    echo "$fp|$line" >> "$TMPDIR/current.fp"
done < "$CURRENT"

# Exact stable = fps présents dans les 2
comm -12 \
    <(cut -d'|' -f1 "$TMPDIR/prev.fp" | sort -u) \
    <(cut -d'|' -f1 "$TMPDIR/current.fp" | sort -u) \
    > "$TMPDIR/exact_stable.txt"
EXACT_STABLE=$(count_lines "$TMPDIR/exact_stable.txt")

# Findings sans match exact
grep -vFf <(cut -d'|' -f1 "$TMPDIR/current.fp") "$TMPDIR/prev.fp" 2>/dev/null \
    | cut -d'|' -f2- > "$TMPDIR/prev.unmatched"
grep -vFf <(cut -d'|' -f1 "$TMPDIR/prev.fp") "$TMPDIR/current.fp" 2>/dev/null \
    | cut -d'|' -f2- > "$TMPDIR/current.unmatched"

PREV_UNMATCHED=$(count_lines "$TMPDIR/prev.unmatched")
CURRENT_UNMATCHED=$(count_lines "$TMPDIR/current.unmatched")

# Phase 2 : semantic dedup pour non-matchés (LLM-as-judge)
SEMANTIC_STABLE=0
JUDGE_ERRORS=0
> "$TMPDIR/current.semantic_matched"
> "$TMPDIR/prev.semantic_matched"

if [ "$PREV_UNMATCHED" -gt 0 ] && [ "$CURRENT_UNMATCHED" -gt 0 ]; then
    while IFS= read -r curr_line; do
        [ -z "$curr_line" ] && continue
        curr_file="${curr_line%%|*}"; curr_claim="${curr_line#*|}"

        # Cherche match sémantique parmi prev unmatched non-déjà-matchés
        while IFS= read -r prev_line; do
            [ -z "$prev_line" ] && continue
            # Skip si déjà matché
            grep -qxF "$prev_line" "$TMPDIR/prev.semantic_matched" 2>/dev/null && continue

            prev_file="${prev_line%%|*}"; prev_claim="${prev_line#*|}"

            # LLM-as-judge call (stderr preserved — RC=2 errors must not be silenced)
            JUDGE_OUT=$(bash "$DJ_SCRIPT" "$prev_file" "$prev_claim" "$curr_file" "$curr_claim")
            JUDGE_RC=$?

            if [ "$JUDGE_RC" -eq 0 ]; then
                # SAME bug
                SEMANTIC_STABLE=$((SEMANTIC_STABLE + 1))
                echo "$curr_line" >> "$TMPDIR/current.semantic_matched"
                echo "$prev_line" >> "$TMPDIR/prev.semantic_matched"
                break
            elif [ "$JUDGE_RC" -eq 2 ]; then
                # Judge error (network/parse failure) — not a "different" verdict
                JUDGE_ERRORS=$((JUDGE_ERRORS + 1))
                echo "WARN: dedupe-judge error ($prev_file vs $curr_file), skipping pair" >&2
                break  # don't try other prev candidates for this curr_line either
            fi
            # JUDGE_RC=1 (different) → continue inner loop to next prev candidate
        done < "$TMPDIR/prev.unmatched"
    done < "$TMPDIR/current.unmatched"
fi

# Final counts
STABLE=$((EXACT_STABLE + SEMANTIC_STABLE))
SEMANTIC_MATCHED_CURRENT=$(count_lines "$TMPDIR/current.semantic_matched")
SEMANTIC_MATCHED_PREV=$(count_lines "$TMPDIR/prev.semantic_matched")
NEW=$((CURRENT_UNMATCHED - SEMANTIC_MATCHED_CURRENT))
DROPPED=$((PREV_UNMATCHED - SEMANTIC_MATCHED_PREV))

# Verdict (même logique que diff-rounds.sh)
if [ "$NEW" -eq 0 ]; then
    VERDICT="stable"
    EXIT_CODE=0
elif [ "$PREV_COUNT" -gt 0 ]; then
    DIVERGES=$(awk -v new="$NEW" -v prev="$PREV_COUNT" -v ratio="$DIVERGENCE_RATIO" \
        'BEGIN { print (new > prev * ratio) ? "yes" : "no" }')
    if [ "$DIVERGES" = "yes" ]; then
        VERDICT="diverging"
        EXIT_CODE=2
    elif [ "$CURRENT_COUNT" -le "$PREV_COUNT" ] && [ "$DROPPED" -gt 0 ]; then
        VERDICT="converging"
        EXIT_CODE=0
    else
        VERDICT="growing"
        EXIT_CODE=1
    fi
else
    VERDICT="growing"
    EXIT_CODE=1
fi

printf '{"new":%d,"dropped":%d,"stable":%d,"prev_count":%d,"current_count":%d,"verdict":"%s","method":"semantic","exact_stable":%d,"semantic_stable":%d,"judge_errors":%d}\n' \
    "$NEW" "$DROPPED" "$STABLE" "$PREV_COUNT" "$CURRENT_COUNT" "$VERDICT" "$EXACT_STABLE" "$SEMANTIC_STABLE" "$JUDGE_ERRORS"

exit "$EXIT_CODE"
