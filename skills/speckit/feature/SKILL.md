---
name: speckit-feature
description: >
  Composite headless skill that runs the full spec-kit + Project-Forge pipeline (specify → plan → tasks → convert)
  for a single feature in one shot. Use this when the user wants to spec and plan a complete feature end-to-end,
  run the full speckit pipeline, go from feature description to PRD automatically, prepare a feature for Ralph++
  implementation, or automate the specify-plan-tasks-convert chain. Also triggers on "speckit feature",
  "speckit-feature", "full pipeline for feature", "spec to PRD", "prepare feature for ralph", or "end-to-end
  feature planning". Manages a features.json registry tracking feature lifecycle (todo → specifying → implementing →
  validating → staging → done). This does NOT implement the feature (use ralph-loop after), run individual pipeline
  steps (use /speckit.specify, /speckit.plan, /speckit.tasks, /speckit-convert separately), or manage deployments.
effort: medium
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Overview

This skill runs the complete pipeline for a single feature, using GitHub spec-kit for the core
planning steps and Project-Forge extensions for conversion:

1. **Resolve feature** from features.json or user input
2. **specify** → Generate spec.md (via spec-kit `/speckit.specify`)
3. **plan** → Generate plan.md + data-model.md + contracts/ (via spec-kit `/speckit.plan`)
4. **tasks** → Generate tasks.md + spec-driven test files (via spec-kit `/speckit.tasks`)
5. **convert** → Generate prd.json for Ralph++ (via PF `/speckit-convert`)
6. **Update** features.json status throughout

## Step 1: Initialize features.json

Check if `.specify/features.json` exists (or `.speckit/features.json` for legacy projects). If not, create it:

```json
{
  "project": "PROJECT_NAME_FROM_PACKAGE_JSON",
  "features": []
}
```

Read the project name from `package.json` if available, otherwise use the directory name.

## Step 2: Resolve Feature

**If feature ID provided** (e.g., `F02`):
- Find it in features.json
- Use its name and description

**If feature name provided** (e.g., `payments`):
- Check if it exists in features.json
- If not, create a new entry with next available ID

**If description provided** (e.g., `"Stripe checkout with subscriptions"`):
- Generate a kebab-case name from the description
- Create a new entry in features.json

**New feature entry format:**
```json
{
  "id": "F{NN}",
  "name": "{kebab-case-name}",
  "description": "{user description}",
  "priority": "P1",
  "status": "todo",
  "routes": [],
  "specDir": null,
  "prdSession": null
}
```

## Step 3: Run Pipeline

Update features.json status to `specifying`.

### 3a. Specify

Run the `/speckit.specify` command (GitHub spec-kit):
- Create `specs/{name}/` directory
- Generate `spec.md` from the feature description
- Read constitution from `.specify/memory/constitution.md` if it exists
- Follows spec-kit format: user stories with priorities (P1/P2/P3), Given/When/Then acceptance scenarios, FR-/SC- requirements

**Verify**: spec.md exists and is non-empty.

### 3b. Plan

Run the `/speckit.plan` command (GitHub spec-kit):
- Read spec.md
- Generate `plan.md` with technical architecture
- Generate `data-model.md` if entities are involved
- Generate `contracts/` if API endpoints are needed
- Generate `research.md` if unknowns exist
- Generate `quickstart.md` test scenarios

**Verify**: plan.md exists and is non-empty.

### 3c. Tasks

Run the `/speckit.tasks` command (GitHub spec-kit):
- Read plan.md + spec.md
- Generate `tasks.md` with phased task breakdown (T001, T002... format)
- Generate spec-driven test files in `tests/speckit/{feature}/` (see Test Generation below)

**Verify**: tasks.md exists and is non-empty.

### 3d. Convert

Run the `/speckit-convert` command (Project-Forge extension):
- Read tasks.md + plan.md + spec.md
- Generate `prd.json` in `.ralph++/sessions/{timestamp}/`
- Create `progress.txt`

**Verify**: prd.json exists and is valid JSON.

## Step 4: Update Registry

After successful pipeline:
- Set status to `implementing`
- Set specDir to `specs/{name}/`
- Set prdSession to `.ralph++/sessions/{session-id}/`
- Infer routes from spec.md user stories and contracts

Write updated features.json.

## Step 5: Report

```
Feature Pipeline Complete: {name} ({id})

  Status:    specifying → implementing
  Spec:      specs/{name}/spec.md
  Plan:      specs/{name}/plan.md
  Tasks:     specs/{name}/tasks.md ({N} tasks)
  Tests:     tests/speckit/{name}/ ({N} test files)
  PRD:       .ralph++/sessions/{session-id}/prd.json ({N} stories)

Ready for implementation:
  /ralph-loop
```

## Test Generation (Spec-Driven, Option B)

During the tasks step (3c), generate real test files alongside tasks.md:

### Unit Tests (per sub-story)

For each sub-story in tasks.md, create `tests/speckit/{feature}/{sub-story-id}.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('{US-ID}: {Story title}', () => {
  it('should export {functionName} function', async () => {
    const mod = await import('{import-path}');
    expect(mod.{functionName}).toBeDefined();
    expect(typeof mod.{functionName}).toBe('function');
  });

  it('should {expected behavior from acceptance criteria}', async () => {
    const { {functionName} } = await import('{import-path}');
    const result = await {functionName}({minimal valid input});
    expect(result).toHaveProperty('{expected property}');
  });

  it('should reject {error case from edge cases}', async () => {
    const { {functionName} } = await import('{import-path}');
    await expect({functionName}({invalid input})).rejects.toThrow();
  });
});
```

### Integration Tests (per user story)

Create `tests/speckit/{feature}/integration.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('{Feature}: Integration Tests', () => {
  it('{API route} should return {expected status} without auth', async () => {
    const res = await fetch('http://localhost:3000{route}', { method: '{method}' });
    expect(res.status).toBe({expected status});
  });

  it('{API route} should {expected behavior} with valid session', async () => {
    // authenticated request pattern
    const res = await fetch('http://localhost:3000{route}', {
      method: '{method}',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({minimal valid body})
    });
    expect(res.status).toBe(200);
  });
});
```

### Test Rules

- Tests MUST compile (valid TypeScript, correct imports)
- Tests MUST use vitest (import from 'vitest')
- Tests assert on existence, types, and basic behavior — NOT implementation details
- Use dynamic import `await import()` for modules that may not exist yet
- Tests are placed in `tests/speckit/{feature}/` — this directory is PROTECTED (Ralph++ cannot modify it)

## Headless Mode

This skill is designed to work with `claude -p` (no user interaction):
- All decisions are made from the feature description + constitution
- No clarification prompts — make informed guesses based on context
- If constitution doesn't exist, use sensible defaults
- Log progress to stdout for pipeline monitoring

## Error Handling

If any step fails:
- Log the error clearly
- Do NOT update features.json status beyond the failed step
- Report what succeeded and what failed
- Suggest manual recovery steps
