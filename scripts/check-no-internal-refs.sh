#!/usr/bin/env bash
# check-no-internal-refs.sh — Generic scanner for sensitive references
#
# Detects in tracked files :
#   - API keys in clear (OpenAI sk-*, Anthropic sk-ant-*, Google AIza*, AWS AKIA*)
#   - Private IPs (RFC 1918, Tailscale 100.64-127.x.x.x)
#   - Credentials inline in URLs (https://user:pass@host)
#   - .env files tracked (should be gitignored)
#   - Custom project-specific patterns via .security-patterns file
#
# Usage:
#   bash scripts/check-no-internal-refs.sh                    # scan all tracked files
#   bash scripts/check-no-internal-refs.sh --staged           # scan git staged files only
#   bash scripts/check-no-internal-refs.sh --since main       # scan files changed since main
#   bash scripts/check-no-internal-refs.sh --paths-from FILE  # scan paths listed in FILE
#
# Custom patterns:
#   Create .security-patterns at repo root with one regex per line.
#   Lines starting with # are comments. Empty lines ignored.
#   Example :
#     # My company internal endpoints
#     ^https://internal\.mycompany\.com
#     PRIVATE_KEY_PROD=
#
# Allowlist (false positives):
#   Create .security-allowlist with one path glob per line to skip.
#   Example :
#     docs/examples/**
#     README.md
#
# Exit codes:
#   0 = no findings (clean)
#   1 = findings detected (sensitive content)
#   2 = usage error / setup problem

set -uo pipefail

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$REPO_ROOT" ]; then
    echo "ERROR: not in a git repo" >&2
    exit 2
fi
cd "$REPO_ROOT"

PATTERNS_FILE="${REPO_ROOT}/.security-patterns"
ALLOWLIST_FILE="${REPO_ROOT}/.security-allowlist"
SCAN_MODE="all"
SINCE_REF=""
PATHS_FILE=""
VERBOSE="${VERBOSE:-false}"

# ---------------------------------------------------------------------------
# CLI parsing
# ---------------------------------------------------------------------------
while [ $# -gt 0 ]; do
    case "$1" in
        --staged) SCAN_MODE="staged"; shift ;;
        --since) SCAN_MODE="since"; SINCE_REF="$2"; shift 2 ;;
        --paths-from) SCAN_MODE="file"; PATHS_FILE="$2"; shift 2 ;;
        --verbose|-v) VERBOSE=true; shift ;;
        -h|--help)
            sed -n '2,40p' "$0" | sed 's/^# \?//'
            exit 0
            ;;
        *) echo "ERROR: unknown option $1" >&2; exit 2 ;;
    esac
done

# ---------------------------------------------------------------------------
# Built-in patterns (generic, broadly applicable)
# ---------------------------------------------------------------------------
# Format: "regex|description"
BUILTIN_PATTERNS=(
    'sk-[A-Za-z0-9]{20,}|OpenAI/Anthropic API key in clear'
    'sk-ant-api[0-9]{2}-[A-Za-z0-9_-]{40,}|Anthropic API key (specific format)'
    'AIza[A-Za-z0-9_-]{35}|Google Cloud API key'
    'AKIA[0-9A-Z]{16}|AWS Access Key ID'
    'aws_secret_access_key\s*[=:]\s*[A-Za-z0-9/+=]{40}|AWS Secret in clear'
    'ghp_[A-Za-z0-9]{36}|GitHub Personal Access Token'
    'github_pat_[A-Za-z0-9_]{82}|GitHub Fine-grained PAT'
    'xoxb-[0-9]+-[0-9]+-[A-Za-z0-9]+|Slack Bot Token'
    '-----BEGIN [A-Z ]*PRIVATE KEY-----|Private key in clear'
    'https?://[^[:space:]/]+:[^[:space:]/@]+@|Credentials inline in URL'
    '(^|[[:space:]])100\.(6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\.[0-9]+\.[0-9]+|Tailscale CGNAT IP (100.64-127.x.x.x)'
    '(^|[[:space:]])192\.168\.[0-9]+\.[0-9]+|Private IP (RFC 1918, 192.168.x.x)'
    '(^|[[:space:]])10\.[0-9]+\.[0-9]+\.[0-9]+|Private IP (RFC 1918, 10.x.x.x)'
    '(^|[[:space:]])172\.(1[6-9]|2[0-9]|3[01])\.[0-9]+\.[0-9]+|Private IP (RFC 1918, 172.16-31.x.x)'
)

# Load custom project-specific patterns
CUSTOM_PATTERNS=()
if [ -f "$PATTERNS_FILE" ]; then
    while IFS= read -r line; do
        # Skip blank lines and comments
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        CUSTOM_PATTERNS+=("$line|Custom pattern from .security-patterns")
    done < "$PATTERNS_FILE"
fi

# Load allowlist (paths to skip)
ALLOWLIST_GLOBS=()
if [ -f "$ALLOWLIST_FILE" ]; then
    while IFS= read -r line; do
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        ALLOWLIST_GLOBS+=("$line")
    done < "$ALLOWLIST_FILE"
fi

# Always-skip paths (binary, build artifacts)
SKIP_PATHS=(
    'node_modules/'
    '.git/'
    'dist/'
    'build/'
    '.next/'
    '*.lock'
    '*.png' '*.jpg' '*.jpeg' '*.gif' '*.ico' '*.webp'
    '*.pdf' '*.zip' '*.tar.gz' '*.tgz'
    'scripts/check-no-internal-refs.sh'  # this script itself contains patterns
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
in_allowlist() {
    local path="$1"
    for glob in "${ALLOWLIST_GLOBS[@]}"; do
        # shellcheck disable=SC2053
        [[ "$path" == $glob ]] && return 0
    done
    return 1
}

is_skipped() {
    local path="$1"
    for pattern in "${SKIP_PATHS[@]}"; do
        # shellcheck disable=SC2053
        [[ "$path" == $pattern || "$path" == */$pattern || "$path" == $pattern/* ]] && return 0
    done
    return 1
}

# ---------------------------------------------------------------------------
# Determine files to scan
# ---------------------------------------------------------------------------
get_files() {
    case "$SCAN_MODE" in
        all)
            git ls-files
            ;;
        staged)
            git diff --cached --name-only --diff-filter=ACM
            ;;
        since)
            git diff --name-only --diff-filter=ACM "${SINCE_REF}...HEAD"
            ;;
        file)
            cat "$PATHS_FILE"
            ;;
    esac
}

# ---------------------------------------------------------------------------
# Scan
# ---------------------------------------------------------------------------
FILES=$(get_files)
if [ -z "$FILES" ]; then
    echo "✓ No files to scan (mode=$SCAN_MODE)"
    exit 0
fi

FILE_COUNT=$(echo "$FILES" | wc -l)
$VERBOSE && echo "Scanning $FILE_COUNT files (mode=$SCAN_MODE)..."

FINDINGS_COUNT=0
declare -a FINDINGS

# Combine builtin + custom patterns
ALL_PATTERNS=("${BUILTIN_PATTERNS[@]}" "${CUSTOM_PATTERNS[@]}")

while IFS= read -r file; do
    [ -z "$file" ] && continue
    [ ! -f "$file" ] && continue
    is_skipped "$file" && continue
    in_allowlist "$file" && continue

    for pattern_entry in "${ALL_PATTERNS[@]}"; do
        regex="${pattern_entry%%|*}"
        desc="${pattern_entry##*|}"

        if matches=$(grep -nE "$regex" "$file" 2>/dev/null); then
            while IFS= read -r match; do
                FINDINGS_COUNT=$((FINDINGS_COUNT + 1))
                FINDINGS+=("$file: $match  [$desc]")
            done <<< "$matches"
        fi
    done

    # Special check: .env files tracked
    if [[ "$(basename "$file")" =~ ^\.env(\..*)?$ ]] && [[ "$(basename "$file")" != ".env.example" ]] && [[ "$(basename "$file")" != ".env.template" ]]; then
        FINDINGS_COUNT=$((FINDINGS_COUNT + 1))
        FINDINGS+=("$file: tracked .env file (should be gitignored)")
    fi
done <<< "$FILES"

# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------
if [ "$FINDINGS_COUNT" -eq 0 ]; then
    echo "✓ No sensitive references detected ($FILE_COUNT files scanned)"
    exit 0
fi

echo "⚠️  $FINDINGS_COUNT sensitive reference(s) detected:" >&2
for finding in "${FINDINGS[@]}"; do
    echo "  $finding" >&2
done
echo "" >&2
echo "Action :" >&2
echo "  - Replace secrets/IPs with environment variables" >&2
echo "  - Add false positives to .security-allowlist (path globs)" >&2
echo "  - Add custom project patterns to .security-patterns" >&2
echo "" >&2
exit 1
