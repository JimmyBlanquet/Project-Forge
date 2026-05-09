#!/usr/bin/env bash
#
# pre-compact-snapshot.sh — PreCompact hook for Claude Code improvement loop.
#
# Fired just before Claude Code auto-compacts the conversation (long sessions
# where context window fills up). Takes a snapshot of the transcript so we can
# still extract learnings from the pre-compaction state.
#
# Properties:
#   - async: true
#   - exit 0 always
#   - rotation: keep last 20 snapshots, prune the rest
#
# Registered in .claude/settings.json under hooks.PreCompact.
#

set +e

INPUT=$(cat 2>/dev/null || echo '{}')

SESSION_ID=$(printf '%s' "$INPUT" | python3 -c "
import json, sys
try:
    print(json.load(sys.stdin).get('session_id', 'unknown'))
except Exception:
    print('unknown')
" 2>/dev/null || echo "unknown")

TRANSCRIPT_PATH=$(printf '%s' "$INPUT" | python3 -c "
import json, sys
try:
    print(json.load(sys.stdin).get('transcript_path', ''))
except Exception:
    print('')
" 2>/dev/null || echo "")

CWD=$(printf '%s' "$INPUT" | python3 -c "
import json, sys
try:
    print(json.load(sys.stdin).get('cwd', ''))
except Exception:
    print('')
" 2>/dev/null || echo "")

[ -z "$CWD" ] && CWD="$(pwd)"

if [ -z "$TRANSCRIPT_PATH" ] || [ ! -f "$TRANSCRIPT_PATH" ]; then
    exit 0
fi

SNAPSHOTS_DIR="$CWD/.learnings/snapshots"
mkdir -p "$SNAPSHOTS_DIR" 2>/dev/null || exit 0

TS=$(date -u +"%Y%m%d-%H%M%S")
SNAPSHOT_FILE="$SNAPSHOTS_DIR/transcript-${TS}-${SESSION_ID}.jsonl"

# Copy transcript (cheap, usually < 1MB)
cp "$TRANSCRIPT_PATH" "$SNAPSHOT_FILE" 2>/dev/null || exit 0

# Rotation: keep last 20 snapshots
if command -v ls >/dev/null 2>&1; then
    (
        cd "$SNAPSHOTS_DIR" 2>/dev/null || exit 0
        ls -1t transcript-*.jsonl 2>/dev/null | tail -n +21 | xargs -r rm -f 2>/dev/null
    ) &
fi

# Append to index for traceability
INDEX="$SNAPSHOTS_DIR/index.jsonl"
printf '{"ts":"%s","session":"%s","file":"%s","reason":"pre-compact"}\n' \
    "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
    "$SESSION_ID" \
    "$(basename "$SNAPSHOT_FILE")" \
    >> "$INDEX" 2>/dev/null

exit 0
