---
name: dev-pilot
description: >
  Full autonomous pipeline orchestrator that loops over features.json and executes the complete development cycle
  for each feature: spec → plan → tasks → implement → validate → deploy → smoke test. Use this when the user wants
  to run the autonomous development pipeline, process all pending features, execute the full dev cycle end-to-end,
  go from features.json to deployed features automatically, or automate the entire SDLC for a project. Also triggers
  on "dev pilot", "dev-pilot", "run the pipeline", "process all features", "autonomous mode", "full cycle", or
  "pipeline run". Manages feature lifecycle in features.json (todo → specifying → implementing → validating →
  staging → done) with escalation on failures. This does NOT implement individual features (use ralph-loop), run
  individual spec steps (use speckit-* skills), or manage infrastructure. It is the top-level orchestrator that
  chains all other tools together.
effort: medium
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Overview

Dev-pilot is the **top-level orchestrator** for the Project-Forge autonomous pipeline. It reads `features.json`, processes each feature in priority order, and drives the entire cycle:

```
features.json → for each feature (by priority):
  /speckit-feature  → spec + plan + tasks + prd
  tools/ralph       → implementation (parallel stories)
  tools/validate-feature → typecheck + lint + tests + build
  tools/deploy-staging   → push + Vercel preview
  tools/smoke-test       → verify routes
  [HUMAN REVIEW]         → approve + promote
  features.json status=done
```

## Prerequisites

Before running, verify:
1. Project has `.speckit/features.json` with at least one feature `status=todo`
2. `tools/ralph`, `tools/validate-feature`, `tools/deploy-staging`, `tools/smoke-test` exist and are executable
3. Git repo is clean (no uncommitted changes)
4. Required CLIs available: `gh`, `vercel`, `claude` (check with `command -v`)

If prerequisites fail, report what's missing and stop.

## Step 1: Load and Sort Features

```bash
# Read features.json
cat .speckit/features.json
```

Sort features by:
1. Priority: P1 before P2 before P3
2. Within same priority: by ID (F01 before F02)

Filter to features with `status=todo` or `status=specifying` (resume interrupted work).

If no features to process, report "All features are done or in progress" and stop.

## Step 2: Process Each Feature

For each feature in priority order:

### 2a. Specification Phase

If feature status is `todo`:
- Run `/speckit-feature {feature-id}` (chains specify → plan → tasks → convert)
- This updates status to `implementing`
- **On failure**: Log error, skip feature, continue to next

### 2b. Implementation Phase

If feature status is `implementing`:
- Find the ralph session from features.json `prdSession`
- Run `tools/ralph --session {session-id} --auto-merge`
- **On failure** (3 retries exhausted on a story):
  - Update features.json: `status=blocked`
  - Log: "Feature {id} blocked: story {N} failed after 3 retries"
  - Continue to next feature

### 2c. Validation Phase

After ralph completes:
- Run `tools/validate-feature`
- Update status to `validating`
- **On failure**:
  - Log validation errors
  - Keep status as `implementing` (don't advance)
  - Continue to next feature

### 2d. Staging Phase

After validation passes:
- Run `tools/deploy-staging`
- Update status to `staging`
- Read the preview URL from `.staging-url`
- **On failure**:
  - Log deployment error
  - Keep status as `validating`
  - Continue to next feature

### 2e. Smoke Test Phase

After deployment:
- Run `tools/smoke-test`
- **On failure**:
  - Log failed routes
  - Keep status as `staging` (deployed but not verified)
  - Continue to next feature

### 2f. Human Review Gate

After smoke tests pass:
- Report: "Feature {id} ({name}) is ready for review"
- Print preview URL
- Print summary of changes (stories completed, files modified)
- **STOP and wait for human input**

The human can:
- `approve` → run `tools/promote-to-prod --auto-merge`, set status to `done`
- `skip` → leave in `staging`, move to next feature
- `reject` → set status to `implementing`, move to next feature
- `abort` → stop the entire pipeline

## Step 3: Report

After all features processed (or pipeline aborted):

```
Dev-Pilot Pipeline Report
═════════════════════════

Features Processed: {N}

  F01 auth          done      ✓ (promoted to prod)
  F02 payments      staging   ⏳ (awaiting review)
  F03 dashboard     blocked   ✗ (story 4 failed)
  F04 settings      todo      — (not started)

Summary:
  Completed:  {N}
  Staging:    {N}
  Blocked:    {N}
  Remaining:  {N}

Next actions:
  - Review F02 at https://preview-url.vercel.app
  - Fix F03 story 4 manually, then re-run dev-pilot
```

## Escalation Rules

| Scenario | Action | Status |
|----------|--------|--------|
| speckit-feature fails | Skip feature, log error | remains `todo` |
| Ralph story fails 3x | Skip feature, log blocker | `blocked` |
| Validation fails | Don't advance, log errors | `implementing` |
| Deploy fails | Don't advance, log error | `validating` |
| Smoke test fails | Keep deployed, log routes | `staging` |
| Human rejects | Reset to implementing | `implementing` |

## Mutation Testing (Optional)

After validation passes (step 2c) and before deploy (step 2d):
- If `stryker.config.json` exists, run `pnpm test:mutation`
- If mutation score < 50%: warn "Tests may be insufficient" but don't block
- Log mutation score in the report

## Configuration

Dev-pilot reads configuration from features.json top level:

```json
{
  "project": "my-project",
  "config": {
    "autoMerge": true,
    "skipMutationTesting": false,
    "ralphModel": "sonnet",
    "ralphBudget": "2.00"
  },
  "features": [...]
}
```

Defaults if config section missing:
- `autoMerge`: false (require human approval)
- `skipMutationTesting`: true (opt-in)
- `ralphModel`: "sonnet"
- `ralphBudget`: "2.00"

## Headless Mode

Dev-pilot can run in fully headless mode (no human review gate):
- Pass `--headless` flag
- All features auto-promote after smoke tests pass
- Best for CI/CD environments
- Still stops on `blocked` features

## Safety

- NEVER force-push or delete branches
- NEVER modify main directly
- Always create feature branches via ralph
- Always wait for CI before merge (auto-merge handles this)
- Preserve features.json as single source of truth
