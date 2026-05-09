#!/usr/bin/env bash
# verify-test-traceability.sh
# Verifies that each Acceptance Scenario (AS) in spec files has a corresponding E2E test.
# Usage: ./scripts/verify-test-traceability.sh [spec-dir]
#
# Exit codes:
#   0 - All AS covered
#   1 - Missing coverage detected

set -euo pipefail

# Support both .specify/ (spec-kit) and .speckit/ (legacy)
if [ -n "${1:-}" ]; then
  SPEC_DIR="$1"
elif [ -d ".specify" ]; then
  SPEC_DIR=".specify"
elif [ -d ".speckit" ]; then
  SPEC_DIR=".speckit"
else
  SPEC_DIR="specs"
fi
TESTS_DIR="tests/e2e"
REPORT_FILE="test-traceability-report.md"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=== Test Traceability Verification ==="
echo ""

# 1. Extract all scenario references from spec files
# Supports: AS1.1 (legacy PF), SC-001 (spec-kit success criteria), FR-001 (spec-kit requirements)
echo "Scanning specs in ${SPEC_DIR}..."
SPEC_REFS=$(grep -rhoP '(AS\d+\.\d+|SC-\d+|FR-\d+)' "${SPEC_DIR}" 2>/dev/null | sort -u || true)
# Also scan specs/ directory if different from SPEC_DIR
if [ -d "specs" ] && [ "${SPEC_DIR}" != "specs" ]; then
  EXTRA_REFS=$(grep -rhoP '(AS\d+\.\d+|SC-\d+|FR-\d+)' "specs" 2>/dev/null | sort -u || true)
  SPEC_REFS=$(printf '%s\n%s' "${SPEC_REFS}" "${EXTRA_REFS}" | sort -u | grep -v '^$' || true)
fi
SPEC_COUNT=$(echo "${SPEC_REFS}" | grep -cE '(AS|SC-|FR-)' 2>/dev/null || echo 0)

if [ "${SPEC_COUNT}" -eq 0 ]; then
  echo -e "${YELLOW}No Acceptance Scenarios found in ${SPEC_DIR}${NC}"
  echo "Run /speckit.specify first to generate specs with scenario references."
  exit 0
fi

echo "Found ${SPEC_COUNT} Acceptance Scenarios in specs."

# 2. Extract all spec-ref annotations from test files
echo "Scanning tests in ${TESTS_DIR}..."
TEST_REFS=$(grep -rhoP '(AS\d+\.\d+|SC-\d+|FR-\d+)' "${TESTS_DIR}" 2>/dev/null | sort -u || true)
TEST_COUNT=$(echo "${TEST_REFS}" | grep -cE '(AS|SC-|FR-)' 2>/dev/null || echo 0)

echo "Found ${TEST_COUNT} AS references in tests."
echo ""

# 3. Find gaps
MISSING=""
COVERED=""
COVERED_COUNT=0
MISSING_COUNT=0

while IFS= read -r as_ref; do
  [ -z "${as_ref}" ] && continue
  if echo "${TEST_REFS}" | grep -q "^${as_ref}$"; then
    COVERED="${COVERED}${as_ref}\n"
    COVERED_COUNT=$((COVERED_COUNT + 1))
  else
    MISSING="${MISSING}${as_ref}\n"
    MISSING_COUNT=$((MISSING_COUNT + 1))
  fi
done <<< "${SPEC_REFS}"

# 4. Find orphan tests (tests without matching spec)
ORPHAN=""
ORPHAN_COUNT=0
while IFS= read -r test_ref; do
  [ -z "${test_ref}" ] && continue
  if ! echo "${SPEC_REFS}" | grep -q "^${test_ref}$"; then
    ORPHAN="${ORPHAN}${test_ref}\n"
    ORPHAN_COUNT=$((ORPHAN_COUNT + 1))
  fi
done <<< "${TEST_REFS}"

# 5. Generate report
COVERAGE_PCT=0
if [ "${SPEC_COUNT}" -gt 0 ]; then
  COVERAGE_PCT=$((COVERED_COUNT * 100 / SPEC_COUNT))
fi

cat > "${REPORT_FILE}" << EOF
# Test Traceability Report

**Generated:** $(date -Iseconds)
**Spec directory:** ${SPEC_DIR}
**Test directory:** ${TESTS_DIR}

## Summary

| Metric | Value |
|--------|-------|
| Total AS in specs | ${SPEC_COUNT} |
| AS with tests | ${COVERED_COUNT} |
| AS without tests | ${MISSING_COUNT} |
| Orphan test refs | ${ORPHAN_COUNT} |
| **Coverage** | **${COVERAGE_PCT}%** |

## Missing Coverage

$(if [ "${MISSING_COUNT}" -gt 0 ]; then
  echo "The following Acceptance Scenarios have NO corresponding test:"
  echo ""
  echo -e "${MISSING}" | while IFS= read -r m; do
    [ -n "${m}" ] && echo "- ❌ ${m}"
  done
else
  echo "✅ All Acceptance Scenarios are covered."
fi)

## Orphan Tests

$(if [ "${ORPHAN_COUNT}" -gt 0 ]; then
  echo "The following test references have NO matching spec (may be outdated):"
  echo ""
  echo -e "${ORPHAN}" | while IFS= read -r o; do
    [ -n "${o}" ] && echo "- ⚠️ ${o}"
  done
else
  echo "✅ No orphan test references."
fi)
EOF

# 6. Print results
echo "=== Results ==="
echo ""

if [ "${MISSING_COUNT}" -gt 0 ]; then
  echo -e "${RED}❌ ${MISSING_COUNT} Acceptance Scenarios without tests:${NC}"
  echo -e "${MISSING}" | while IFS= read -r m; do
    [ -n "${m}" ] && echo "   - ${m}"
  done
  echo ""
fi

if [ "${ORPHAN_COUNT}" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  ${ORPHAN_COUNT} orphan test references:${NC}"
  echo -e "${ORPHAN}" | while IFS= read -r o; do
    [ -n "${o}" ] && echo "   - ${o}"
  done
  echo ""
fi

echo -e "Coverage: ${COVERAGE_PCT}% (${COVERED_COUNT}/${SPEC_COUNT} AS covered)"
echo "Report: ${REPORT_FILE}"
echo ""

if [ "${MISSING_COUNT}" -gt 0 ]; then
  echo -e "${RED}FAIL: Missing test coverage for ${MISSING_COUNT} scenarios.${NC}"
  echo "Run: /speckit-test-bridge --generate"
  exit 1
else
  echo -e "${GREEN}PASS: All Acceptance Scenarios are covered.${NC}"
  exit 0
fi
