
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

### Vertical slices via tracer bullets (anti-horizontal pattern)

Pattern emprunté à mattpocock : structurer chaque sub-story comme un **vertical slice** qui traverse toute la stack, pas comme une couche horizontale.

**Anti-pattern à éviter** : grouper "tous les tests d'abord" en sub-story 1, puis "toute l'implémentation" en sub-story 2, puis "toute la doc" en sub-story 3. Ça donne un faux sentiment de progrès et casse Ralph++ (rien n'est testable indépendamment).

**Pattern correct (tracer bullets)** : chaque sub-story = un mini-feature E2E qui contient :
- 1 test E2E (ou intégration) qui valide le comportement attendu
- Le minimum d'implémentation pour faire passer ce test
- La doc/types/migrations associés au comportement

**Conséquence pour le grouping** : quand tu décomposes les tasks de la User Story, ne groupe PAS par "couche" (tests / API / UI / doc). Groupe par "comportement utilisateur final" (1 sous-feature complète, traversant toute la stack).

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

1. **By User Behavior — vertical slice** (PRIMARY criterion, anti-horizontal):
   - Each sub-story = ONE user-visible behavior, traversing the full stack (DB + types + service + API + UI + test)
   - The sub-story must be **independently testable end-to-end** — typically 1 E2E test that validates the behavior
   - Anti-pattern : grouper "tous les tests d'abord", "toutes les migrations d'abord", "tout le frontend ensuite". Ça donne un faux progrès et casse Ralph++ (rien n'est testable indépendamment).
   - Cf. CLAUDE.md règle 15 du projet et `mattpocock` tracer-bullets pattern.

2. **By File Proximity** (secondary):
   - Tasks affecting the same user-facing flow -> same vertical slice
   - Tasks in unrelated flows -> different sub-stories

3. **By Size Constraint**:
   - Max 3-5 tasks per sub-story
   - Target: 1-2 hours of work per sub-story
   - If a single task is complex (>2h), it becomes its own sub-story (still vertical)

4. **By Dependencies**:
   - Respect sequential dependencies (non-[P] tasks)
   - [P] tasks can be in same sub-story (parallel execution)
   - Ensure sub-story N can only start after sub-story N-1 completes
   - Note : avec vertical slicing, les dépendances DB → API → UI sont gérées **dans** une sub-story (donc en interne, pas entre sub-stories), réduisant le séquentiel global.

#### Example Grouping (vertical slicing)

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

**Output (grouped sub-stories — vertical slices)**:
```
Sub-story US-001-1: User can set priority on a task (vertical: DB + types + service + UI edit)
  - Slice: traverse stack pour le comportement "set priority"
  - Tasks: T010 (schema) + T011 (migration) + T012 (type) + T013 (service.update) + T014 (UI dropdown) + T016 (verify "user can set")
  - Duration: ~1.5h
  - Dependencies: none
  - E2E acceptance: user opens TaskEdit, picks priority "high" via dropdown, saves, reload page, priority persisted

Sub-story US-001-2: Priority appears on task card (vertical: service.read + UI badge)
  - Slice: traverse stack pour le comportement "show priority"
  - Tasks: T013 (service.read variant si nécessaire) + T015 (badge component)
  - Duration: ~30min
  - Dependencies: US-001-1 (need data persisted first)
  - E2E acceptance: a task with priority "high" displays a red badge on its card
```

Note : T013 peut apparaître dans 2 sub-stories si la lecture et l'écriture sont des comportements distincts. C'est normal et préférable au découpage horizontal.

### Step 5: Generate Acceptance Criteria

For each sub-story (vertical slice), create **objective, verifiable** acceptance criteria centered on the user-visible behavior, not the technical layer.

**Required criteria patterns** :

1. **End-to-end behavior** (REQUIRED, primary criterion):
   - "When [user action], [observable outcome] happens" — phrased as a user scenario
   - Verified via E2E test (Playwright preferred), or via dev-browser smoke if E2E setup not yet available

2. **Persistence & integrity** (when applicable):
   - "Data persists across reload"
   - "No orphan records / no constraint violations"

3. **Static checks** (table stakes for any sub-story):
   - "Typecheck passes (`pnpm typecheck`)"
   - "Lint passes (`pnpm lint`)"
   - "Unit tests for new logic pass"

4. **Browser verification** (REQUIRED if UI is touched):
   - "**Verified in browser via dev-browser skill or Playwright** — screenshot attached"

**Anti-pattern** : "Database typecheck passes", "Service implements [functionality]", "Endpoint responds correctly" — phrasés par couche technique, indissociables de découpage horizontal. Préférer la formulation user-centric ci-dessus.

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
