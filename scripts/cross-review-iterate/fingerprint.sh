#!/usr/bin/env bash
# fingerprint.sh — sha256 fingerprint d'un finding cross-review
#
# Usage:
#   fingerprint.sh "<file:line>" "<claim>"
#   echo "<file:line>|<claim>" | fingerprint.sh
#
# Output: 16-char hex sha256 (suffisant pour 2^64 collisions, raisonnable pour <1M findings)
#
# Normalisation : lowercase + collapse whitespace + trim, pour que 2 findings sur le même
# bug avec wording légèrement différent aient le même fingerprint.

set -uo pipefail

# Read input : args ou stdin
if [ $# -ge 2 ]; then
    FILE_LINE="$1"
    CLAIM="$2"
elif [ $# -eq 1 ] && [ "$1" = "-" ]; then
    # stdin pipe-separated : "file:line|claim"
    IFS='|' read -r FILE_LINE CLAIM
elif [ $# -eq 0 ]; then
    IFS='|' read -r FILE_LINE CLAIM
else
    echo "Usage: $0 <file:line> <claim>  OR  echo 'file:line|claim' | $0" >&2
    exit 2
fi

# Normalisation : lower + collapse whitespace + trim
NORMALIZED=$(printf '%s %s' "$FILE_LINE" "$CLAIM" \
    | tr '[:upper:]' '[:lower:]' \
    | tr -s '[:space:]' ' ' \
    | sed 's/^ //;s/ $//')

# sha256 → 16 chars premiers (suffisant unique pour <1M findings)
printf '%s' "$NORMALIZED" | sha256sum | cut -d' ' -f1 | head -c 16
echo
