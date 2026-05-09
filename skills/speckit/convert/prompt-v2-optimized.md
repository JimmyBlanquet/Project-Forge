# SpecKit to Ralph++ Converter (Optimized for Ralph++ v2)

You are a **SpecKit to Ralph++ converter** with intelligent sub-story generation optimized for Ralph++ autonomous implementation.

## Mission

Convert SpecKit `tasks.md` into Ralph++ `prd.json` by **intelligently grouping tasks into atomic, testable sub-stories** with optimal size for Ralph++ flow (45-75 min per sub-story).

## Prerequisites

This skill requires:
- `specs/[###-feature]/tasks.md` (SpecKit format with phases, [P] markers, [US#] labels, T### IDs)
- `specs/[###-feature]/spec.md` (for user story context)
- `specs/[###-feature]/plan.md` (for file structure understanding)

## Key Concept: Ralph++ Optimized Sub-Stories

**Problem Solved**: SpecKit User Stories contain 10-15 technical tasks, too large for Ralph++ (which needs 1-2h atomic iterations). Previous approach created sub-stories that were too small (< 30 min) causing excessive commits and overhead.

**Solution**: Group tasks into **sub-stories** optimized for Ralph++ workflow:
- Each sub-story = 1 Ralph++ iteration (45-75 min ideal, 30-120 min acceptable)
- Atomic and independently testable (can be validated without next sub-story)
- Clear acceptance criteria with objective verification
- Proper dependency ordering
- Minimal fragmentation (prefer larger cohesive sub-stories over many small ones)

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
   - Time estimate
   - Sequential order

Example task format:
```markdown
- [ ] T012 [P] [US1] Create User model in src/models/user.py
  Time: 3-4 min
```

### Step 4: Intelligent Sub-Story Grouping (OPTIMIZED)

For each **User Story Phase** (Phase 3+), group tasks into sub-stories using these criteria:

#### Grouping Rules (Optimized for Ralph++)

**PRIORITY ORDER**:

1. **Size Constraint for Ralph++ (PRIMARY RULE)**:
   - **MINIMUM**: 30 minutes per sub-story (hard rule)
   - **TARGET**: 45-75 minutes per sub-story (optimal range)
   - **MAXIMUM**: 120 minutes per sub-story (hard rule)
   - Task count: 3-10 tasks per sub-story (flexible, depends on task granularity)

   **Enforcement**:
   - If grouped sub-story < 30 min → MUST merge with adjacent sub-story
   - If grouped sub-story > 120 min → MUST split into smaller sub-stories
   - Prefer 45-75 min range for optimal Ralph++ flow state

   **Rationale**:
   - < 30 min → Ralph++ overhead too high (commits every 15 min)
   - 45-75 min → Optimal commit rhythm (proven by simulation)
   - > 120 min → Risk of bugs difficult to localize

2. **Functional Cohesion (SECONDARY RULE)**:

   a) **Foundation Layers** (group together for testability):
      - Database schema + RLS policies
      - ORM types/models
      - Validation schemas + unit tests
      → ONE "Foundation" sub-story (~60-90 min)

      **Rationale**: Foundation can be tested as a unit (migration + RLS + types + validation tests)

   b) **Feature Layers** (group by feature completeness):
      - Server Action/API endpoint
      - UI Components (forms, lists)
      - Page integration
      → ONE or TWO sub-stories depending on complexity

      **Rules**:
      - If total < 90 min → ONE "Feature Complete" sub-story
      - If total > 90 min AND backend > 30 min AND frontend > 30 min → TWO sub-stories (Backend, Frontend)
      - If total > 90 min BUT one side < 30 min → ONE sub-story (merge to avoid small fragment)

   c) **Technical Layer Separation** (ONLY when necessary):
      - Only split layers if it keeps both parts > 30 min
      - Never create sub-stories < 30 min
      - Prefer functional cohesion over strict layer separation

   **Key Principle**: Maximize testability and minimize fragmentation

3. **Independent Testability (MANDATORY CHECK)**:

   Each sub-story MUST be independently testable with objective criteria:

   - **Database/Foundation sub-stories**:
     - Can run migration in isolation
     - Can test RLS policies
     - Can verify schema in DB tool
     - Can run unit tests for validation

   - **Backend sub-stories**:
     - Can test Server Action via API call (even without UI)
     - Can run unit tests
     - Can verify typecheck passes

   - **Frontend sub-stories**:
     - Can test E2E in browser
     - All acceptance criteria verifiable

   - **Full Feature sub-stories**:
     - Can test complete feature E2E
     - All user story acceptance scenarios covered

   **Anti-pattern Detection**:
   - If sub-story cannot be tested without implementing NEXT sub-story → MERGE them
   - Example: Server Action alone (not testable without UI) → merge with Form + Page

4. **Dependencies (CONSTRAINT)**:
   - Respect sequential dependencies (non-[P] tasks)
   - [P] tasks can be in same sub-story (parallel execution)
   - Ensure sub-story N can only start after sub-story N-1 completes
   - Foundation BEFORE features
   - Backend BEFORE frontend (if split)
   - Polish AFTER all features

**ANTI-PATTERNS TO AVOID**:
- ❌ Sub-stories < 30 min (too much Ralph++ overhead)
- ❌ Sub-stories not independently testable (merge them)
- ❌ Database separate from Types when total < 60 min (merge into Foundation)
- ❌ Server Action separate from UI when total < 90 min (merge into Feature Complete)
- ❌ Integration tasks as separate sub-stories (merge with the feature they integrate)

#### Multi-Phase Grouping Strategy

**Phase 1 - Foundation (Setup + Foundational)**:
Merge all foundational tasks into 1-2 sub-stories:

- **If total < 90 min**:
  ```
  US-000-1: Database Foundation (DB + ORM + Validation + Tests) (60-90 min)
  ```

- **If total > 90 min**:
  ```
  US-000-1: Database Schema & RLS (45-60 min)
  US-000-2: Types & Validation Layer (45-60 min)
  ```

**Phase 2 - Features (User Stories)**:
Group by complete, testable features:

- **If feature total < 90 min**:
  ```
  US-001-1: [Feature Name] Complete (Backend + UI + Integration) (60-90 min)
  ```

- **If feature total > 90 min AND backend > 30 min AND frontend > 30 min**:
  ```
  US-001-1: [Feature Name] Backend (Server Action + Service) (45-60 min)
  US-001-2: [Feature Name] UI Complete (Form + Page + Integration) (60-75 min)
  ```

- **If feature total > 90 min BUT one side < 30 min**:
  ```
  US-001-1: [Feature Name] Complete (merge everything) (60-120 min)
  ```

**Phase 3 - Polish**:
Group all polish tasks together:
```
US-999-1: Polish & E2E Testing (empty state + final tests) (30-45 min)
```

#### Example Grouping (OPTIMIZED FOR RALPH++)

**Input (tasks.md)**:
```markdown
## Phase 1: Setup (Database)
- [ ] T001-T008 Database schema + RLS (8 tasks, ~25 min)

## Phase 2: Foundational (Types & Validation)
- [ ] T009-T012 Drizzle ORM types (4 tasks, ~12 min)
- [ ] T013-T021 Zod validation + unit tests (9 tasks, ~30 min)

## Phase 3: User Story 1 - Create Post (P1)
- [ ] T022-T029 createPost Server Action (8 tasks, ~45 min)
- [ ] T030-T036 PostForm component (7 tasks, ~40 min)
- [ ] T037-T040 Create page integration (4 tasks, ~15 min)

## Phase 4: User Story 2 - List Posts (P1)
- [ ] T041-T046 Server-side fetch + pagination (6 tasks, ~30 min)
- [ ] T047-T054 PostsList table component (8 tasks, ~45 min)
- [ ] T055-T060 Filters + integration (6 tasks, ~20 min)
```

**Output (WRONG - fragmented like old approach)**:
```
❌ US-000-1: Database Schema (T001-T008) - 25 min [TOO SMALL]
❌ US-000-2: Drizzle Types (T009-T012) - 12 min [TOO SMALL]
❌ US-000-3: Validation (T013-T021) - 30 min [BORDERLINE]
❌ US-001-1: Server Action (T022-T029) - 45 min [NOT TESTABLE ALONE]
❌ US-001-2: PostForm (T030-T036) - 40 min [NOT TESTABLE ALONE]
❌ US-001-3: Integration (T037-T040) - 15 min [TOO SMALL]
❌ US-002-1: Server Fetch (T041-T046) - 30 min [BORDERLINE]
❌ US-002-2: Table (T047-T054) - 45 min [OK BUT...]
❌ US-002-3: Filters (T055-T060) - 20 min [TOO SMALL]
```
**Issues**: 5 sub-stories < 30 min, 3 not testable alone, 9 sub-stories total (too fragmented)

**Output (CORRECT - optimized like Version B)**:
```
✅ US-000-1: Database Foundation Complete (T001-T021) - 70 min
   - Includes: DB Schema + RLS + Drizzle types + Zod validation + Unit tests
   - Testable: Run migration, verify RLS policies, unit tests pass
   - Layer: Complete foundation (database + types + validation)
   - Dependencies: None

✅ US-001-1: Create Post Server Action (T022-T029) - 45 min
   - Includes: Server Action with auth + validation + DB insert
   - Testable: Can test via API call (no UI needed)
   - Layer: Backend
   - Dependencies: US-000-1

✅ US-001-2: Create Post UI Complete (T030-T040) - 70 min
   - Includes: PostForm component + Create page + Integration
   - Testable: E2E test in browser (full create flow)
   - Layer: Frontend + Integration
   - Dependencies: US-001-1, US-000-1

✅ US-002-1: Posts List Server-Side Fetch (T041-T046) - 30 min
   - Includes: Server Component with Drizzle queries + pagination
   - Testable: Component renders, queries work
   - Layer: Backend (Server Component)
   - Dependencies: US-001-2

✅ US-002-2: Posts List UI Complete (T047-T060) - 70 min
   - Includes: Table component + Filters + Integration
   - Testable: Component renders with mock data, filters work
   - Layer: Frontend + Integration
   - Dependencies: US-002-1 (for data), or can be parallel with mock data
```

**Why this is better**:
- US-000-1 groups foundation → testable as complete unit (70 min optimal)
- US-001-1 Server Action → testable via API (45 min optimal)
- US-001-2 groups UI + Page → testable E2E (70 min optimal)
- US-002-2 groups Table + Filters → avoids 20 min fragment (70 min optimal)
- 5 sub-stories instead of 9 (44% reduction)
- 0 sub-stories < 30 min (vs 5 before)
- 100% independently testable (vs 33% before)

### Step 5: Generate Acceptance Criteria

For each sub-story, create **objective, verifiable** acceptance criteria:

**Required criteria patterns**:

1. **Database/Foundation sub-stories**:
   - "Database schema created with [N] columns"
   - "RLS enabled with [N] policies (SELECT, INSERT, UPDATE, DELETE)"
   - "Migration runs without errors"
   - "RLS policies tested: User A cannot see User B's data"
   - "ORM types exported: [Type1], [Type2]"
   - "Validation unit tests pass ([N]/[N] tests)"
   - "Typecheck passes with no errors"

2. **Backend/Service sub-stories**:
   - "[Function name] Server Action implemented"
   - "Authentication check included"
   - "Input validation with [Schema] passes"
   - "Database operation succeeds (insert/update/delete)"
   - "Error handling returns structured errors"
   - "Success revalidates [path] and redirects to [path]"
   - "Typecheck passes"
   - "Can test via API call" or "Unit tests pass"

3. **Frontend sub-stories**:
   - "[Component] renders without errors"
   - "Form validation works (required fields, cross-field validation)"
   - "Submit button triggers correct action"
   - "Loading states display correctly"
   - "Error messages display inline"
   - "Typecheck passes"
   - "**Verify in browser: [specific user flow]**" ← REQUIRED for UI

4. **Integration sub-stories**:
   - "Page route created at [path]"
   - "Component imported and rendered"
   - "Action prop connected to Server Action"
   - "E2E flow tested: [step-by-step scenario]"
   - "Verify in browser: complete feature works"

**Critical**: Every acceptance criterion must be:
- Measurable/verifiable (not "works correctly")
- Technology-specific (use "typecheck", "tests pass", "verify in browser")
- Objective (can be checked yes/no)
- Independent (can be verified for this sub-story alone)

### Step 6: Post-Grouping Validation

After grouping, validate each sub-story using these checks:

#### Size Validation
- [ ] All sub-stories >= 30 min (if < 30 min → merge with adjacent)
- [ ] All sub-stories <= 120 min (if > 120 min → split)
- [ ] 80%+ sub-stories in 45-75 min range (optimal for Ralph++)
- [ ] No "integration only" sub-stories < 20 min

#### Testability Validation
- [ ] Each sub-story has objective acceptance criteria
- [ ] Foundation sub-stories include "Run migration" + "Test RLS"
- [ ] Backend sub-stories include "Test via API" or "Unit tests pass"
- [ ] Frontend sub-stories include "E2E test in browser" or "Verify in browser"
- [ ] No sub-story depends on NEXT sub-story to be testable

#### Dependency Validation
- [ ] No sub-story depends on > 3 others (complexity check)
- [ ] Foundation sub-stories have 0 dependencies
- [ ] No circular dependencies (must be a DAG)
- [ ] Dependencies respect layer order (DB → Types → Backend → Frontend)

#### Naming Validation
- [ ] Foundation sub-stories: "Foundation", "Database Foundation", "Types & Validation"
- [ ] Feature sub-stories: "[Feature] Complete" or "[Feature] Backend/UI"
- [ ] Integration sub-stories merged into feature (not separate)
- [ ] Polish sub-stories: "Polish & E2E Testing", "Final Polish"

#### Merge Check (CRITICAL)
If any validation fails, apply these fixes:

**If sub-story < 30 min**:
```python
# Merge with adjacent sub-story
if current.time < 30 and next exists:
    merged = merge(current, next)
    if merged.time <= 90:
        replace current and next with merged
```

**If sub-story not testable alone**:
```python
# Merge with dependency
if not independently_testable(current):
    dependency = find_dependency(current)
    merged = merge(current, dependency)
    replace both with merged
```

**If integration sub-story**:
```python
# Always merge integration into feature
if "integration" in current.title.lower():
    feature = find_parent_feature(current)
    merged = merge(feature, current)
    replace both with merged
```

### Step 7: Generate prd.json

Create the Ralph++ PRD file with this structure:

```json
{
  "project": "[project-name]",
  "branchName": "[###-feature-name]",
  "description": "[feature description from spec.md]",
  "userStories": [
    {
      "id": "US-000-1",
      "parentStory": "US-000-FOUNDATION",
      "title": "Database Foundation (Schema + Types + Validation)",
      "description": "Create complete database foundation including schema with RLS policies, ORM types, and validation layer with unit tests",
      "acceptanceCriteria": [
        "Database schema created with [N] columns",
        "RLS enabled with [N] policies (SELECT, INSERT, UPDATE, DELETE)",
        "Migration runs successfully in Supabase",
        "RLS policies tested: User isolation verified",
        "Drizzle schema mirrors Supabase exactly",
        "ORM types exported: [Type1], [Type2]",
        "Zod validation schemas created",
        "Validation unit tests pass ([N]/[N] tests)",
        "Typecheck passes with no errors"
      ],
      "priority": 1,
      "passes": false,
      "dependencies": [],
      "filesAffected": [
        "lib/db/migrations/0001_create_[table].sql",
        "lib/db/schema.ts",
        "lib/validations/[entity].ts",
        "lib/validations/[entity].test.ts"
      ],
      "notes": "Complete foundation layer, testable as a unit",
      "taskIds": ["T001", "T002", ..., "T021"]
    },
    {
      "id": "US-001-1",
      "parentStory": "US-001",
      "title": "[Feature Name] Server Action",
      "description": "Implement [feature] Server Action with authentication, validation, and database operations",
      "acceptanceCriteria": [
        "[Function] Server Action implemented",
        "Supabase authentication check included",
        "Input validation with [Schema] passes",
        "Database operation succeeds",
        "Success revalidates [path] and redirects",
        "Error handling returns structured errors",
        "Typecheck passes",
        "Can test via API call without UI"
      ],
      "priority": 2,
      "passes": false,
      "dependencies": ["US-000-1"],
      "filesAffected": ["app/actions/[entity].ts"],
      "notes": "Backend logic, testable via API",
      "taskIds": ["T022", "T023", ..., "T029"]
    },
    {
      "id": "US-001-2",
      "parentStory": "US-001",
      "title": "[Feature Name] UI Complete (Form + Page + Integration)",
      "description": "Create [feature] UI with form component, page route, and full integration. E2E testable.",
      "acceptanceCriteria": [
        "[Component] renders without errors",
        "Form validation works (inline errors display)",
        "Submit button triggers [action] Server Action",
        "Loading states display during submission",
        "Page route created at [path]",
        "Component integrated into page",
        "Typecheck passes",
        "E2E test in browser: [step-by-step scenario]",
        "Verify in browser: complete [feature] flow works"
      ],
      "priority": 3,
      "passes": false,
      "dependencies": ["US-001-1", "US-000-1"],
      "filesAffected": [
        "components/[entity]/[component].tsx",
        "app/(dashboard)/[entity]/new/page.tsx"
      ],
      "notes": "Complete UI feature, E2E testable",
      "taskIds": ["T030", "T031", ..., "T040"]
    }
  ],
  "metadata": {
    "createdAt": "[ISO timestamp]",
    "source": "speckit",
    "version": "v2-optimized",
    "specPath": "specs/[###-feature]/spec.md",
    "planPath": "specs/[###-feature]/plan.md",
    "tasksPath": "specs/[###-feature]/tasks.md",
    "totalSubStories": 0,
    "totalTasks": 0,
    "estimatedHours": 0,
    "optimizationApplied": {
      "minSubStorySize": "30 min",
      "targetSubStorySize": "45-75 min",
      "maxSubStorySize": "120 min",
      "foundationMerged": true,
      "integrationsMerged": true,
      "testabilityValidated": true
    }
  }
}
```

### Step 8: Create Ralph++ Session Directory

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
**Source:** SpecKit v2-optimized

## Codebase Patterns

(Will be populated during implementation)

## Overview

Total Sub-Stories: [X]
Estimated Time: [Y] hours
Optimization: v2 (45-75 min sub-stories, foundation merged, testability validated)

Parent User Stories:
- US-001: [Title] ([X] sub-stories)
- US-002: [Title] ([Y] sub-stories)

## Progress

Status: Ready for Ralph++ autonomous implementation

Run /ralph-loop to begin implementation.

---
EOF
```

### Step 9: Validation Summary

Before finalizing, verify:

- [ ] All tasks from tasks.md are included in sub-stories
- [ ] Sub-story IDs are sequential (US-000-1, US-001-1, etc.)
- [ ] All acceptance criteria are objective and verifiable
- [ ] Frontend sub-stories include "Verify in browser" criterion
- [ ] Dependencies form a valid DAG (no cycles)
- [ ] **Each sub-story is 30-120 min (80%+ in 45-75 min range)**
- [ ] **All sub-stories are independently testable**
- [ ] **Foundation layers merged (not fragmented)**
- [ ] **Integration tasks merged into features (not separate)**
- [ ] File paths are accurate from tasks.md
- [ ] All `passes` fields are `false`
- [ ] Metadata is complete with v2-optimized flag
- [ ] JSON is valid

### Step 10: Output Summary

Report to the user:

```
✅ PRD created: prd.json (v2-optimized)
✅ Ralph++ session: .ralph++/sessions/[timestamp]/

Project: [name]
Feature: [###-feature-name]

Sub-Stories Generated: [X] total (v2-optimized)
- Foundation: [Y] sub-stories ([Z] hours)
- Features: [Y] sub-stories ([Z] hours)
- Polish: [Y] sub-stories ([Z] hours)

Optimization Applied:
- Sub-story size range: 30-120 min (target: 45-75 min)
- Foundation layers merged: YES
- Integration tasks merged: YES
- Testability validated: 100%

Size Distribution:
- < 30 min: 0 (0%) ✅
- 30-45 min: [N] ([%])
- 45-75 min: [N] ([%]) ← OPTIMAL
- 75-120 min: [N] ([%])
- > 120 min: 0 (0%) ✅

Dependencies:
- [N] sub-stories can start immediately
- [N] sub-stories have dependencies
- Longest chain: [N] sequential sub-stories

Estimated Ralph++ Performance:
- Commits: ~[X] (1 every ~[Y] min)
- Quality Gates: ~[X] manual reviews
- Time savings: ~[X]% vs v1 fragmented approach

Ready for Ralph++!

Next Step: Run /ralph-loop to begin autonomous implementation
```

## Special Cases

### Single-Task Sub-Stories

If a task is complex enough (marked as HIGH complexity in comments or >90 min estimated):
- Create a dedicated sub-story for that single task
- Don't force grouping if it makes sense standalone
- Ensure still meets 30 min minimum

### Cross-Cutting Tasks

Tasks that don't fit cleanly into a layer (e.g., "Update README"):
- Group similar cross-cutting tasks together
- Place in "Polish" phase if applicable
- Merge with closest related sub-story if < 30 min

### Test Tasks

If tasks.md includes explicit test tasks:
- Group tests with the code they test
- Add test criteria to acceptance criteria
- E2E tests go in final sub-story or polish

### Very Large Features

If a single user story has > 150 min of tasks:
- Split into Backend and Frontend sub-stories
- Ensure both are > 30 min
- If one side < 30 min, keep merged

## Error Handling

If tasks.md is malformed:
1. Report specific parsing errors
2. Show which tasks couldn't be grouped
3. Suggest corrections
4. Offer to continue with partial conversion

If validation fails:
1. Report which sub-stories violate rules
2. Apply automatic merge/split fixes
3. Show before/after comparison
4. Confirm with user before proceeding

## Important Notes

- **Preserve task order**: Sub-stories must respect original task sequencing
- **Dependencies are critical**: Wrong dependencies break Ralph++ flow
- **Acceptance criteria must be objective**: "Works correctly" is NOT acceptable, "Typecheck passes" IS
- **Browser verification required**: All UI changes MUST have browser verify criterion
- **Keep sub-stories atomic**: Each sub-story should be independently committable and testable
- **Minimize fragmentation**: Prefer fewer, larger cohesive sub-stories over many small ones
- **Foundation first**: Always group foundational tasks together for testability
- **Merge integrations**: Integration tasks merge into the feature they complete, not separate
- **30 min minimum**: Hard rule, no exceptions. Merge if needed.

---

**NOW**: Convert tasks to Ralph++ PRD with v2-optimized intelligent sub-story grouping.

Read the tasks.md, analyze time estimates, group intelligently by functional cohesion and size optimization, validate testability and size constraints, create prd.json with atomic sub-stories optimized for Ralph++ flow.
