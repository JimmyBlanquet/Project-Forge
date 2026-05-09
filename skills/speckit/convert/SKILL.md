---
name: speckit.convert
description: >
  Convert SpecKit tasks.md into a Ralph++ prd.json file for autonomous implementation. Use this skill when the
  user wants to convert tasks to PRD, generate prd.json, prepare for Ralph++ autonomous loop, create sub-stories
  from tasks, group tasks into atomic iterations, transform a task breakdown into an implementation-ready format,
  or bridge SpecKit planning output to Ralph++ execution input. Also triggers on "speckit convert",
  "speckit-convert", "ready for ralph", "create PRD", "generate PRD from tasks", "prepare autonomous
  implementation", or "convert to ralph format". This skill reads tasks.md, spec.md, and plan.md from the
  feature specs directory, intelligently groups tasks into 1-2 hour sub-stories by technical layer, generates
  acceptance criteria, and outputs a structured prd.json with dependency ordering and quality gates. It also
  creates the Ralph++ session directory with progress.txt. This does NOT generate tasks from a plan (use
  speckit-tasks), write specifications (use speckit-specify), or run the autonomous implementation itself (use
  ralph-loop). It is the bridge step between planning and execution.
effort: low
---

# SpecKit to Ralph++ Converter (Hybrid Sub-Stories Approach)

You are a **SpecKit to Ralph++ converter** with intelligent sub-story generation.

## Mission

Convert SpecKit `tasks.md` into Ralph++ `prd.json` by **intelligently grouping tasks into atomic, testable sub-stories**.

## Prerequisites

This skill requires:
- `specs/[###-feature]/tasks.md` (SpecKit format with phases, [P] markers, [US#] labels, T### IDs)
- `specs/[###-feature]/spec.md` (for user story context)
- `specs/[###-feature]/plan.md` (for file structure understanding)

## Key Concept: Hybrid Sub-Stories Approach

**Problem**: SpecKit User Stories contain 10-15 technical tasks, too large for Ralph++ (which needs 1-2h atomic iterations).

**Solution**: Group tasks into **sub-stories** of 3-5 tasks each, ensuring:
- Each sub-story = 1 Ralph++ iteration (1-2h of work)
- Atomic and independently testable
- Clear acceptance criteria with objective verification
- Proper dependency ordering

## Conversion Workflow

### Step 1: Detect Feature Directory

Run the prerequisite script to find the feature directory:

```bash
# From repo root
scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
```

Parse the JSON output to get `FEATURE_DIR` and available documents.

### Step 2: Load Context

Read the following files (use absolute paths from script output):
- **REQUIRED**: `FEATURE_DIR/tasks.md` - Complete task breakdown
- **REQUIRED**: `FEATURE_DIR/spec.md` - User stories for context
- **OPTIONAL**: `FEATURE_DIR/plan.md` - Tech stack and file structure
- **OPTIONAL**: `FEATURE_DIR/data-model.md` - Entity information

### Step 3: Parse tasks.md Structure

Extract from tasks.md:

1. **Phases**: Setup, Foundational, User Story phases, Polish
2. **Tasks**: For each task extract:
   - Task ID (T###)
   - Parallel marker ([P] present or not)
   - Story label ([US#] if present)
   - Description with file paths
   - Sequential order

Example task format:
```markdown
- [ ] T012 [P] [US1] Create User model in src/models/user.py
```

### Step 4: Intelligent Sub-Story Grouping

For each **User Story Phase** (Phase 3+), group tasks into sub-stories using these criteria:

#### Grouping Rules

1. **By Technical Layer** (primary criterion):
   - **Database layer**: schema, migrations -> Sub-story 1
   - **Type/Model layer**: TypeScript types, data models -> Sub-story 2
   - **Service/Logic layer**: business logic, services -> Sub-story 3
   - **API layer**: endpoints, routes -> Sub-story 4
   - **Frontend layer**: UI components -> Sub-story 5

2. **By File Proximity**:
   - Tasks affecting same or related files -> Same sub-story
   - Tasks in different layers -> Different sub-stories

3. **By Size Constraint**:
   - Max 3-5 tasks per sub-story
   - Target: 1-2 hours of work per sub-story
   - If a single task is complex (>2h), it becomes its own sub-story

4. **By Dependencies**:
   - Respect sequential dependencies (non-[P] tasks)
   - [P] tasks can be in same sub-story (parallel execution)
   - Ensure sub-story N can only start after sub-story N-1 completes

#### Example Grouping

**Input (tasks.md)**:
```markdown
## Phase 3: User Story 1 - Task Priority System (P1)

- [ ] T010 [P] [US1] Add priority column to tasks table in db/schema.sql
- [ ] T011 [US1] Generate and run migration for priority field
- [ ] T012 [P] [US1] Update Task type with priority field in src/types/task.ts
- [ ] T013 [US1] Update TaskService to handle priority in src/services/task.ts
- [ ] T014 [P] [US1] Add priority dropdown to TaskEdit modal in src/components/TaskEdit.tsx
- [ ] T015 [US1] Add priority badge to TaskCard in src/components/TaskCard.tsx
- [ ] T016 [US1] Verify priority system in browser using dev-browser skill
```

**Output (grouped sub-stories)**:
```
Sub-story US-001-1: Priority Database Schema (T010, T011)
  - Layer: Database
  - Size: 2 tasks
  - Duration: ~30min
  - Dependencies: none

Sub-story US-001-2: Priority Type Definitions (T012)
  - Layer: Types
  - Size: 1 task
  - Duration: ~30min
  - Dependencies: US-001-1

Sub-story US-001-3: Priority Service Logic (T013)
  - Layer: Service
  - Size: 1 task
  - Duration: ~1h
  - Dependencies: US-001-2

Sub-story US-001-4: Priority UI Components (T014, T015, T016)
  - Layer: Frontend
  - Size: 3 tasks
  - Duration: ~2h
  - Dependencies: US-001-3
```

### Step 5: Generate Acceptance Criteria

For each sub-story, create **objective, verifiable** acceptance criteria:

**Required criteria patterns**:

1. **Database sub-stories**:
   - "Schema updated successfully"
   - "Migration runs without errors"
   - "Database typecheck passes"

2. **Type/Model sub-stories**:
   - "Types updated with new fields"
   - "Typecheck passes with no errors"
   - "No TypeScript warnings"

3. **Service sub-stories**:
   - "Service implements [functionality]"
   - "Unit tests pass"
   - "Integration tests pass (if applicable)"

4. **API sub-stories**:
   - "Endpoint [/path] responds correctly"
   - "API contract tests pass"
   - "Typecheck passes"

5. **Frontend sub-stories**:
   - "[Component] renders correctly"
   - "[Feature] works as expected"
   - "Typecheck passes"
   - "**Verify in browser using dev-browser skill**" <- REQUIRED for UI

### Critère E2E obligatoire

Pour toute sub-story qui modifie des fichiers frontend (app/, components/, pages/) :
- Ajouter le critère d'acceptation : "E2E tests updated to cover new/modified user flows"
- Ce critère est vérifié par `pnpm test:traceability` dans les quality gates

**Critical**: Every acceptance criterion must be:
- Measurable/verifiable
- Technology-specific (use "typecheck", "tests", "browser verify")
- Non-ambiguous

### Step 6: Generate prd.json

Create the Ralph++ PRD file with this structure.

**IMPORTANT**: Always include a `config` section with quality gates. The `command` field is the combined gate that Ralph++ will run after each story:

```json
{
  "project": "[project-name]",
  "branchName": "[###-feature-name]",
  "description": "[feature description from spec.md]",
  "config": {
    "projectRoot": "[absolute-path-to-project-root]",
    "constitutionPath": ".speckit/constitution.md",
    "planPath": "specs/[###-feature]/plan.md",
    "qualityGates": {
      "typecheck": "npx tsc --noEmit",
      "lint": "npx next lint",
      "test": "npx vitest run",
      "command": "npx tsc --noEmit && npx next lint && npx vitest run && npm run quality:jscpd && npm run quality:knip"
    }
  },
  "userStories": [
    {
      "id": "US-001-1",
      "parentStory": "US-001",
      "title": "[Sub-story title]",
      "description": "[What this sub-story accomplishes]",
      "acceptanceCriteria": [
        "[Criterion 1]",
        "[Criterion 2]",
        "Typecheck passes"
      ],
      "priority": 1,
      "passes": false,
      "dependencies": [],
      "filesAffected": ["path/to/file1.ext", "path/to/file2.ext"],
      "notes": "",
      "taskIds": ["T010", "T011"]
    },
    {
      "id": "US-001-2",
      "parentStory": "US-001",
      "title": "[Next sub-story]",
      "description": "[What this accomplishes]",
      "acceptanceCriteria": ["..."],
      "priority": 2,
      "passes": false,
      "dependencies": ["US-001-1"],
      "filesAffected": ["..."],
      "notes": "",
      "taskIds": ["T012"]
    }
  ],
  "metadata": {
    "createdAt": "[ISO timestamp]",
    "source": "speckit",
    "specPath": "specs/[###-feature]/spec.md",
    "planPath": "specs/[###-feature]/plan.md",
    "tasksPath": "specs/[###-feature]/tasks.md",
    "totalSubStories": 0,
    "estimatedHours": 0
  }
}
```

### Step 7: Create Ralph++ Session Directory

```bash
# Create session directory
TIMESTAMP=$(date +%s000)
mkdir -p .ralph++/sessions/$TIMESTAMP

# Copy PRD to session
cp prd.json .ralph++/sessions/$TIMESTAMP/prd.json

# Create progress.txt
cat > .ralph++/sessions/$TIMESTAMP/progress.txt << EOF
# Progress Log for [project-name]

**Session ID:** $TIMESTAMP
**Created:** $(date -Iseconds)
**Feature:** [###-feature-name]
**Source:** SpecKit

## Codebase Patterns

(Will be populated during implementation)

## Overview

Total Sub-Stories: [X]
Estimated Time: [Y] hours

Parent User Stories:
- US-001: [Title] ([X] sub-stories)
- US-002: [Title] ([Y] sub-stories)

## Progress

Status: Ready for Ralph++ autonomous implementation

Run /ralph-loop to begin implementation.

---
EOF
```

### Step 8: Validation

Before finalizing, verify:

- [ ] All tasks from tasks.md are included in sub-stories
- [ ] Sub-story IDs are sequential (US-001-1, US-001-2, etc.)
- [ ] All acceptance criteria are objective and verifiable
- [ ] Frontend sub-stories include "Verify in browser" criterion
- [ ] Dependencies form a valid DAG (no cycles)
- [ ] Each sub-story has 1-5 tasks (target: 3)
- [ ] File paths are accurate from tasks.md
- [ ] All `passes` fields are `false`
- [ ] Metadata is complete
- [ ] JSON is valid

### Step 9: Output Summary

Report to the user:

```
PRD created: prd.json
Ralph++ session: .ralph++/sessions/[timestamp]/

Project: [name]
Feature: [###-feature-name]

Sub-Stories Generated: [X] total
- Parent US-001: [Y] sub-stories ([Z] hours estimated)
- Parent US-002: [Y] sub-stories ([Z] hours estimated)

Grouping Strategy:
- Database layer: [N] sub-stories
- Backend layer: [N] sub-stories
- Frontend layer: [N] sub-stories

Dependencies:
- [N] sub-stories can start immediately
- [N] sub-stories have dependencies
- Longest chain: [N] sequential sub-stories

Ready for Ralph++!

Next Step: Run /ralph-loop to begin autonomous implementation
```

## Special Cases

### Single-Task Sub-Stories

If a task is complex enough (marked as HIGH complexity in comments or >100 lines estimated):
- Create a dedicated sub-story for that single task
- Don't force grouping

### Cross-Cutting Tasks

Tasks that don't fit cleanly into a layer (e.g., "Update README"):
- Group similar cross-cutting tasks together
- Place in "Polish" phase if applicable

### Test Tasks

If tasks.md includes explicit test tasks:
- Group tests with the code they test
- Add test criteria to acceptance criteria

## Error Handling

If tasks.md is malformed:
1. Report specific parsing errors
2. Show which tasks couldn't be grouped
3. Suggest corrections
4. Offer to continue with partial conversion

## Important Notes

- **Preserve task order**: Sub-stories must respect original task sequencing
- **Dependencies are critical**: Wrong dependencies break Ralph++ flow
- **Acceptance criteria must be objective**: "Works correctly" is NOT acceptable, "Typecheck passes" IS
- **Browser verification required**: All UI changes MUST have browser verify criterion
- **Keep sub-stories atomic**: Each sub-story should be independently committable

---

**NOW**: Convert tasks to Ralph++ PRD with intelligent sub-story grouping.

Read the tasks.md, analyze dependencies, group intelligently, create prd.json with atomic sub-stories.
