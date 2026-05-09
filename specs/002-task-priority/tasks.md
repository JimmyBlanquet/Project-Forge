# Implementation Tasks: Task Priority System

**Version:** 1.0.0
**Date:** 2026-01-18
**Based on:**
- Constitution: `constitution.yml`
- Specification: `spec.md`
- Plan: `plan.md`

**Total Tasks:** 19
**Estimated Duration:** 8-10 hours

---

## Phase 1: Setup

- [ ] T001 Review existing task system codebase structure
- [ ] T002 Verify database access and migration tooling

## Phase 2: Foundational

- [ ] T003 Create priority migration in db/migrations/add_priority_to_tasks.sql
- [ ] T004 Run migration and verify priority column exists
- [ ] T005 [P] Create TaskPriority type in src/types/task.ts
- [ ] T006 [P] Add priority validation schema in src/lib/validations/task.ts

## Phase 3: User Story 1 - Add Priority to Tasks (P1)

- [ ] T007 [P] [US1] Update Task interface with priority field in src/types/task.ts
- [ ] T008 [US1] Update taskService.create to handle priority in src/lib/services/taskService.ts
- [ ] T009 [US1] Update taskService.update to handle priority in src/lib/services/taskService.ts
- [ ] T010 [P] [US1] Create PriorityBadge component in src/components/tasks/PriorityBadge.tsx
- [ ] T011 [P] [US1] Create PrioritySelector component in src/components/tasks/PrioritySelector.tsx
- [ ] T012 [US1] Add PrioritySelector to TaskForm in src/components/tasks/TaskForm.tsx
- [ ] T013 [US1] Add PriorityBadge to TaskCard in src/components/tasks/TaskCard.tsx
- [ ] T014 [US1] Update create task API endpoint to accept priority in src/app/api/tasks/route.ts
- [ ] T015 [US1] Update edit task API endpoint to accept priority in src/app/api/tasks/[id]/route.ts
- [ ] T016 [US1] Verify priority creation and display in browser using dev-browser skill

## Phase 4: User Story 2 - Filter Tasks by Priority (P2)

- [ ] T017 [P] [US2] Add priority filter to TaskFilters component in src/components/tasks/TaskFilters.tsx
- [ ] T018 [US2] Update GET /api/tasks to support priority query param in src/app/api/tasks/route.ts
- [ ] T019 [US2] Update taskService.list to filter by priority in src/lib/services/taskService.ts
- [ ] T020 [US2] Add filter state management in tasks page in src/app/tasks/page.tsx
- [ ] T021 [US2] Verify priority filtering in browser using dev-browser skill

## Phase 5: User Story 3 - Sort Tasks by Priority (P3)

- [ ] T022 [P] [US3] Add priority sort option to TaskSort component in src/components/tasks/TaskSort.tsx
- [ ] T023 [US3] Update GET /api/tasks to support sortBy=priority in src/app/api/tasks/route.ts
- [ ] T024 [US3] Update taskService.list to sort by priority in src/lib/services/taskService.ts
- [ ] T025 [US3] Add sort state management in tasks page in src/app/tasks/page.tsx
- [ ] T026 [US3] Verify priority sorting in browser using dev-browser skill

## Phase 6: Polish

- [ ] T027 [P] Add unit tests for priority validation schemas
- [ ] T028 [P] Add integration tests for priority filtering/sorting
- [ ] T029 Update README with priority feature documentation

---

## Task Format Legend

- `T###` - Sequential task ID
- `[P]` - Parallelizable (can be done simultaneously with other [P] tasks)
- `[US#]` - User Story reference (US1, US2, US3)

## Dependencies

### Sequential Dependencies
- T004 must complete before T007 (DB migration before type updates)
- T005-T006 should complete before T007 (types before usage)
- T007-T009 should complete before T010-T013 (backend before frontend)
- T010-T013 should complete before T014-T015 (components before API integration)
- All US1 tasks must complete before US2 tasks
- All US2 tasks must complete before US3 tasks

### Parallel Opportunities
- T005 and T006 can run in parallel (different files)
- T010 and T011 can run in parallel (independent components)
- T027 and T028 can run in parallel (different test types)

## Testing Checkpoints

### After T016 (US1 Complete)
- Can create task with priority
- Priority badge displays correctly
- Priority saved to database
- Typecheck passes

### After T021 (US2 Complete)
- Can filter tasks by priority
- Only matching priority tasks shown
- Filter state persists
- Typecheck passes

### After T026 (US3 Complete)
- Can sort tasks by priority
- HIGH → MEDIUM → LOW order correct
- Sort preference saved
- Typecheck passes

## Estimated Time Breakdown

- **Phase 1-2 (Setup):** 1 hour
- **Phase 3 (US1):** 4-5 hours
- **Phase 4 (US2):** 2 hours
- **Phase 5 (US3):** 1.5 hours
- **Phase 6 (Polish):** 1 hour

**Total:** 9.5-10.5 hours
