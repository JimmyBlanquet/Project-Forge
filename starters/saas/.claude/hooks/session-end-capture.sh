#!/usr/bin/env bash
#
# session-end-capture.sh — SessionEnd hook for Claude Code improvement loop.
#
# Fired on /clear, exit, /resume, logout. Reads the session transcript and
# calls extract-lessons.py to append regex-matched learnings to
# .learnings/queue.jsonl.
#
# Properties:
#   - async: true (non-blocking, fire-and-forget)
#   - exit 0 always (cannot block session per Claude Code hook contract)
#   - idempotent (extract-lessons.py dedups by fingerprint)
#   - multi-instance safe (UUID per Claude Code instance)
#   - file-locked to avoid concurrent writes to queue.jsonl
#
# Registered in .claude/settings.json under hooks.SessionEnd.
#

set +e  # Never fail the session on hook errors

# Read hook input JSON from stdin
INPUT=$(cat 2>/dev/null || echo '{}')

# Extract fields (Python one-liner is more robust than jq for nested JSON)
SESSION_ID=$(printf '%s' "$INPUT" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    print(d.get('session_id', 'unknown'))
except Exception:
    print('unknown')
" 2>/dev/null || echo "unknown")

TRANSCRIPT_PATH=$(printf '%s' "$INPUT" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    print(d.get('transcript_path', ''))
except Exception:
    print('')
" 2>/dev/null || echo "")

CWD=$(printf '%s' "$INPUT" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    print(d.get('cwd', ''))
except Exception:
    print('')
" 2>/dev/null || echo "")

# Fall back to current working directory if not provided
if [ -z "$CWD" ]; then
    CWD="$(pwd)"
fi

# Silent exit if no transcript
if [ -z "$TRANSCRIPT_PATH" ] || [ ! -f "$TRANSCRIPT_PATH" ]; then
    exit 0
fi

# Resolve multi-instance UUID
# Claude Code does NOT currently expose CLAUDE_INSTANCE_ID, so we generate
# a stable ID per project+parent process and persist in .learnings/.instance-id
INSTANCE_FILE="$CWD/.learnings/.instance-id"
if [ -f "$INSTANCE_FILE" ]; then
    INSTANCE_ID=$(cat "$INSTANCE_FILE" 2>/dev/null || echo "default")
else
    # Generate stable ID from cwd + parent PID (best-effort)
    INSTANCE_SEED="${CWD}-${PPID:-0}-${CLAUDE_CODE_SESSION_ID:-nosession}"
    INSTANCE_ID=$(printf '%s' "$INSTANCE_SEED" | sha256sum 2>/dev/null | cut -c1-12)
    [ -z "$INSTANCE_ID" ] && INSTANCE_ID="default"
    mkdir -p "$CWD/.learnings" 2>/dev/null
    printf '%s\n' "$INSTANCE_ID" > "$INSTANCE_FILE" 2>/dev/null
fi

# Paths
QUEUE_FILE="$CWD/.learnings/queue.jsonl"
LOCK_FILE="$CWD/.learnings/.queue.lock"
EXTRACTOR="$CWD/.claude/hooks/extract-lessons.py"

# Extractor must exist
if [ ! -f "$EXTRACTOR" ]; then
    exit 0
fi

mkdir -p "$(dirname "$QUEUE_FILE")" 2>/dev/null

# File lock to avoid concurrent writes across multiple sessions on same repo
# flock exits 0 if lock acquired, 1 otherwise
(
    if command -v flock >/dev/null 2>&1; then
        flock -n 200 || exit 0
    fi
    python3 "$EXTRACTOR" \
        --transcript "$TRANSCRIPT_PATH" \
        --session-id "$SESSION_ID" \
        --instance-id "$INSTANCE_ID" \
        --output "$QUEUE_FILE" 2>/dev/null
) 200>"$LOCK_FILE" &

# Fire-and-forget: don't wait for the background task
# Claude Code hook contract: exit fast, never block
exit 0
