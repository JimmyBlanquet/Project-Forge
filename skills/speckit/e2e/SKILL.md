---
name: speckit-e2e
description: >
  Run comprehensive end-to-end tests on the application using agent-browser (accessibility-tree-based browser
  testing). Use this skill when the user wants to run E2E tests, perform automated browser testing, verify the
  app works end-to-end, test user journeys in a real browser, check for UI bugs or regressions, do responsive
  testing across viewports, hunt for security issues via browser interaction, or validate that a feature works
  from the user's perspective. Also triggers on "speckit e2e", "speckit-e2e", "test the app in the browser",
  "run browser tests", "check if the UI works", "test user flows", "verify the feature end to end", or
  "automated acceptance testing". This skill launches 3 parallel research sub-agents (app structure, data flows,
  bug hunting), starts the dev server, creates a combined test plan, executes tests with agent-browser snapshots
  and screenshots, and fixes bugs as they are found. It generates an e2e-report.md with results and evidence
  screenshots. This does NOT generate a recette/UAT checklist without running tests (use speckit-recette), write
  unit tests or integration tests in code (those are part of speckit-tasks), or run tests via Playwright/Cypress
  — it uses agent-browser for exploration. For deterministic regression tests in CI, use Playwright (`pnpm test:e2e`).
effort: medium
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Overview

This skill runs comprehensive E2E tests using `agent-browser` (Vercel Labs). Unlike Playwright, agent-browser produces **text-based accessibility snapshots** (~90% fewer tokens for AI agents).

Pattern inspired by coleam00/link-in-bio-page-builder: 3 parallel research sub-agents → combined test plan → execution with fix-as-you-go.

---

## Phase 0: Prerequisites

### Platform Check

```bash
# Verify platform (Linux or macOS)
uname -s

# Verify agent-browser is installed
which agent-browser || {
  echo "Installing agent-browser..."
  npm i -g agent-browser && agent-browser install --with-deps
}
```

If agent-browser is not installed and cannot be installed, STOP and inform the user.

### Project Check

Verify the project has a `package.json` with a `dev` script.

---

## Phase 1: Parallel Research (3 Sub-Agents)

Launch **3 sub-agents in parallel** using the Task tool:

### Sub-Agent 1: App Structure & User Journeys

```
Analyze the application structure:
1. Read app/ directory to identify all routes and pages
2. Read layout files to understand navigation structure
3. Identify main user journeys (auth flow, CRUD flows, payment flows)
4. List all interactive elements (forms, buttons, modals)
5. Return: list of routes, user journeys with steps, key interactive elements
```

### Sub-Agent 2: Schema & Data Flows

```
Analyze the data layer:
1. Read database schema (prisma/schema.prisma or utils/db/schema.ts)
2. Read API routes or server actions
3. Identify data validation rules (Zod schemas)
4. Map data flows: form → validation → API → DB → response
5. Return: entity list, validation rules, API endpoints, expected data states
```

### Sub-Agent 3: Bug Hunting & Security

```
Hunt for potential bugs and security issues:
1. Read components for common UI bugs (missing loading states, no error handling, unclosed modals)
2. Check auth middleware and protected routes
3. Look for XSS vectors (unsanitized user input, raw HTML injection)
4. Check form submissions without CSRF protection
5. Check for missing accessibility attributes (aria-label, role, alt text)
6. Return: list of suspected bugs, security concerns, accessibility issues
```

Wait for all 3 sub-agents to complete before proceeding.

---

## Phase 2: Start the Application

```bash
# Start dev server in background
pnpm dev &
DEV_PID=$!

# Wait for server to be ready
npx wait-on http://localhost:3000 --timeout 30000
```

If the server fails to start, check for port conflicts and try `PORT=3001 pnpm dev &`.

---

## Phase 3: Combine Research into Test Plan

From the 3 sub-agent results, create a combined test plan:

1. **User Journey Tests** (from Sub-Agent 1):
   - Map each journey to a sequence of agent-browser commands
   - Include navigation, form fills, button clicks, assertions

2. **Data Validation Tests** (from Sub-Agent 2):
   - Test form validation with invalid data
   - Verify error messages match Zod schemas
   - Test API error handling

3. **Bug & Security Tests** (from Sub-Agent 3):
   - Test each suspected bug scenario
   - Verify auth redirects work
   - Test with different viewport sizes

---

## Phase 4: Execute Tests

For each test in the plan:

```bash
# 1. Open the page
agent-browser open http://localhost:3000/{path}

# 2. ALWAYS snapshot first (accessibility tree with refs)
agent-browser snapshot -i

# 3. Interact using @eN refs from snapshot
agent-browser click @e3
agent-browser fill @e5 "test data"

# 4. CRITICAL: Re-snapshot after EVERY navigation or form submit
#    Refs @eN are invalidated when DOM changes!
agent-browser snapshot -i

# 5. Assert expected state from new snapshot

# 6. Take evidence screenshot
agent-browser screenshot tests/e2e/{test-name}.png

# 7. Close when done
agent-browser close
```

### Responsive Testing

Test each critical journey at 3 viewports:
- Mobile: 375x812
- Tablet: 768x1024
- Desktop: 1440x900

```bash
# Resize before testing
agent-browser open http://localhost:3000/{path} --viewport 375x812
agent-browser snapshot -i
agent-browser screenshot tests/e2e/{test-name}-mobile.png
```

### CRITICAL RULE

**ALWAYS re-snapshot after any action that changes the DOM** (navigation, form submit, modal open/close, tab switch). The `@eN` refs are positional and become stale on DOM change. Forgetting to re-snapshot is the #1 cause of test failures.

---

## Phase 5: Fix-As-You-Go

When a test fails:

1. **Identify the issue** from the snapshot (missing element, wrong text, error message)
2. **Read the source code** for the failing component
3. **Fix the code** (minimal fix only)
4. **Re-run the failing test** to verify the fix
5. **Take a new screenshot** as evidence

Track all fixes made during the E2E run.

---

## Phase 6: Generate Report

Create `tests/e2e/e2e-report.md`:

```markdown
# E2E Test Report

**Date**: [ISO date]
**Tool**: agent-browser
**Status**: [PASS/WARN/FAIL]

---

## Summary

| Category | Total | Pass | Fail | Fixed |
|----------|-------|------|------|-------|
| User Journeys | N | N | N | N |
| Data Validation | N | N | N | N |
| Bug/Security | N | N | N | N |
| Responsive | N | N | N | N |
| **Total** | **N** | **N** | **N** | **N** |

---

## Research Findings

### App Structure (Sub-Agent 1)
[Summary of routes and journeys discovered]

### Data Flows (Sub-Agent 2)
[Summary of schemas and validation rules]

### Bug Suspects (Sub-Agent 3)
[Summary of potential issues found]

---

## Test Results

### User Journey: [Journey Name]
- [x] Step 1: [description] — PASS (screenshot: tests/e2e/journey-1-step-1.png)
- [x] Step 2: [description] — PASS
- [ ] Step 3: [description] — FAIL: [reason]

[...for each test]

---

## Fixes Applied

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | path/to/file.tsx | Missing loading state | Added Suspense boundary |
| 2 | ... | ... | ... |

---

## Remaining Issues

| # | Severity | Description | Location |
|---|----------|-------------|----------|
| 1 | High | [description] | path/to/file.tsx:42 |
| 2 | ... | ... | ... |
```

---

## Phase 7: Cleanup

```bash
# Close any open browser sessions
agent-browser close

# Kill dev server
kill $DEV_PID 2>/dev/null || true
```

---

## Important Rules

- **ALWAYS re-snapshot after DOM changes** — this cannot be overstated
- **3 sub-agents MUST run in parallel** using the Task tool for efficiency
- **Fix-as-you-go**: don't just report bugs, fix them when possible
- **Screenshots are evidence**: always capture before/after for fixes
- **Minimal fixes only**: don't refactor during E2E testing
- **Kill the dev server** at the end, even if tests fail
- agent-browser uses accessibility trees, not pixel matching — test functional behavior, not visual layout

**NOW**: Check prerequisites, launch 3 research sub-agents, then execute the E2E test plan.
