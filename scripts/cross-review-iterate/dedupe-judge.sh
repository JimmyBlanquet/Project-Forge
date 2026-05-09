#!/usr/bin/env bash
# dedupe-judge.sh — LLM-as-judge sémantique : 2 findings sont-ils le même bug ?
#
# Usage:
#   dedupe-judge.sh "<file_a>" "<claim_a>" "<file_b>" "<claim_b>" [--model <name>]
#
# Output JSON : {"same_bug": true|false, "confidence": 0-100, "reasoning": "..."}
#
# Modèle par défaut : devstral-small-2 (rapide, suffisant pour binary classification)
# Override possible via --model qwen36-27b ou autre.
#
# Exit code : 0 = same_bug, 1 = different, 2 = error

set -uo pipefail

if [ $# -lt 4 ]; then
    echo "Usage: $0 <file_a> <claim_a> <file_b> <claim_b> [--model <name>]" >&2
    exit 2
fi

FILE_A="$1"
CLAIM_A="$2"
FILE_B="$3"
CLAIM_B="$4"
MODEL="${MODEL:-devstral-small-2}"

# Override model si flag
shift 4
while [ $# -gt 0 ]; do
    case "$1" in
        --model) MODEL="$2"; shift 2 ;;
        *) echo "Unknown arg: $1" >&2; exit 2 ;;
    esac
done

# Optimisation fast-path : si file_a != file_b ET pas de file:line shared → quasi-certainement
# différents bugs (sauf cas rare bug architectural cross-file). Skip LLM call.
# On compare les paths sans le numéro de ligne pour tolérer les drifts (refactor déplace
# une ligne mais le bug reste localisé au même fichier).
PATH_A="${FILE_A%%:*}"  # file path sans :line
PATH_B="${FILE_B%%:*}"
if [ "$PATH_A" != "$PATH_B" ]; then
    printf '{"same_bug":false,"confidence":85,"reasoning":"different files (fast-path skip LLM)"}\n'
    exit 1
fi

# LLM-as-judge call — endpoint configurable via env var
# Default: localhost (your local OpenAI-compatible LLM endpoint, e.g. llama-swap, vLLM, Ollama)
# Override: export LLM_ENDPOINT=https://your-llm-server/v1/chat/completions
ENDPOINT="${LLM_ENDPOINT:-http://localhost:11500/v1/chat/completions}"

PROMPT="You are deduplicating bug findings from a code reviewer. Two findings are 'same bug' if they describe the same root cause / same problematic behavior, even with different wording. Different wording, same code issue = SAME. Different code issues that happen to be in the same file = DIFFERENT.

Finding A:
- Location: $FILE_A
- Claim: $CLAIM_A

Finding B:
- Location: $FILE_B
- Claim: $CLAIM_B

Reply ONLY with this JSON, nothing else:
{\"same_bug\": true|false, \"confidence\": 0-100, \"reasoning\": \"<one sentence>\"}"

REQ=$(jq -nc --arg p "$PROMPT" --arg m "$MODEL" \
    '{model:$m,messages:[{role:"user",content:$p}],max_tokens:300,temperature:0.1}')

# Optional auth: if your LLM endpoint requires a Bearer token, set LLM_API_KEY env var.
# Many local setups (Ollama default, llama.cpp default) don't require auth — leave unset.
AUTH_HEADER=()
if [ -n "${LLM_API_KEY:-}" ]; then
    AUTH_HEADER=(-H "Authorization: Bearer ${LLM_API_KEY}")
fi

RAW=$(curl -s -m 60 -X POST "$ENDPOINT" \
    -H 'Content-Type: application/json' \
    "${AUTH_HEADER[@]}" \
    -d "$REQ" 2>&1)

RAW_RC=$?
if [ "$RAW_RC" -ne 0 ]; then
    printf '{"same_bug":false,"confidence":0,"reasoning":"LLM call failed (curl rc=%d)"}\n' "$RAW_RC" >&2
    exit 2
fi

# Extract content (fallback reasoning_content pour thinking models)
CONTENT=$(echo "$RAW" | jq -r '.choices[0].message.content // .choices[0].message.reasoning_content // empty' 2>/dev/null)

if [ -z "$CONTENT" ]; then
    printf '{"same_bug":false,"confidence":0,"reasoning":"LLM returned empty content"}\n' >&2
    exit 2
fi

# Parse : extraire le JSON {"same_bug":...} de la réponse
# (le LLM peut entourer de prose malgré l'instruction)
JSON=$(echo "$CONTENT" | grep -oE '\{[^{}]*"same_bug"[^{}]*\}' | head -1)

if [ -z "$JSON" ]; then
    printf '{"same_bug":false,"confidence":0,"reasoning":"LLM response not JSON-parsable: %s"}\n' \
        "$(echo "$CONTENT" | head -c 100 | tr '"' "'")" >&2
    exit 2
fi

# Output + exit code basé sur same_bug
echo "$JSON"
SAME=$(echo "$JSON" | jq -r '.same_bug // false')
[ "$SAME" = "true" ] && exit 0 || exit 1
