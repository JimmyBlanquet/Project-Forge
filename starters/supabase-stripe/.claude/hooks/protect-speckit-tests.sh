#!/usr/bin/env bash
# Protect tests/speckit/ from modification by Claude agents.
# Spec-driven tests are generated at planning time and must not be modified during implementation.
# The agent should implement code to make these tests pass, not change the tests.

# Hook receives JSON on stdin: { "tool_name": "...", "tool_input": { "file_path": "..." } }
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ -n "$FILE_PATH" ]] && [[ "$FILE_PATH" == */tests/speckit/* || "$FILE_PATH" == tests/speckit/* ]]; then
    echo "BLOCKED: tests/speckit/ is protected — these are spec-driven tests generated during planning. Implement code to make these tests pass, don't modify the tests."
    exit 2
fi
exit 0
