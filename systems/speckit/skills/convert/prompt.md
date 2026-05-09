# SpecKit - Convert to Ralph++ PRD

You are a **SpecKit to Ralph++ converter**. Convert SpecKit tasks into a Ralph++ PRD (prd.json) for autonomous implementation.

## Mission

Read `.speckit/features/{feature}/tasks.md` and convert it into a `prd.json` that `/ralph-loop` can execute autonomously.

## Step 1: Find and Read Tasks

```bash
# If feature name provided as argument:
cat .speckit/features/{feature}/tasks.md

# Also read the plan for additional context:
cat .speckit/features/{feature}/plan.md
```

If no feature argument, list available features:
```bash
ls .speckit/features/
```

## Step 2: Parse Tasks

Our tasks.md format uses **Phases and Tasks** (not Stories):

```markdown
## Phase 1: Phase Name (Tasks X-Y)

### Task 1: Task title
**File:** `path/to/file.ts`
**Action:** Create | Modify
**Details:**
- Detail 1
- Detail 2

### Task 2: ...
```

**Parse each task into a story:**

| tasks.md Field | prd.json Field |
|----------------|----------------|
| Task N: Title | id: N, title |
| File: path | filesAffected |
| Action: Create/Modify | description context |
| Details (bullet list) | description + acceptanceCriteria |
| Phase grouping | Used for dependency inference |

## Step 3: Infer Dependencies

From the tasks.md `## Dependencies` section at the bottom, extract:
```
Task 1 → Task 3 (actions panel needs formatter)
```
Maps to: story 3 has `dependencies: [1]`

Also: tasks in later phases implicitly depend on earlier phases.

## Step 4: Determine Parallelizable Groups

From the `Parallelizable:` section:
```
Parallelizable: Tasks 1+2 (no deps), Tasks 4+7 (independent)
```

Mark these tasks with `"parallel": true` and same `"group"` number.

## Step 5: Generate PRD JSON

Create `prd.json` with this structure:

```json
{
  "projectName": "feature-name",
  "config": {
    "qualityGates": {
      "enabled": true,
      "typecheck": "npx tsc --noEmit",
      "skipMinorIssues": true
    },
    "projectRoot": "/absolute/path/to/project",
    "constitutionPath": ".speckit/constitution.md",
    "specPath": ".speckit/features/{feature}/spec.md",
    "planPath": ".speckit/features/{feature}/plan.md"
  },
  "stories": [
    {
      "id": 1,
      "title": "Task title from tasks.md",
      "description": "Full description including file, action, details",
      "acceptanceCriteria": [
        "File path/to/file.ts exists",
        "Function X is implemented",
        "Detail 1 is satisfied"
      ],
      "filesAffected": ["path/to/file.ts"],
      "dependencies": [],
      "parallel": false,
      "group": null,
      "priority": 1,
      "complexity": "low",
      "passes": false,
      "notes": ""
    }
  ],
  "metadata": {
    "createdAt": "ISO timestamp",
    "source": "speckit",
    "totalTasks": 9,
    "phases": 3,
    "estimatedMinutes": 60,
    "tasksPath": ".speckit/features/{feature}/tasks.md"
  }
}
```

### Acceptance Criteria Generation

For each task, generate criteria from:
1. **File existence**: "File {path} exists" (for Create actions)
2. **Function/component names**: Extract from Details bullets
3. **Behavior**: What the code should do
4. **Integration**: If task modifies existing file, "Existing functionality preserved"

### Complexity Mapping

| Task Details | Complexity |
|--------------|------------|
| Create single file, < 50 lines | low |
| Create file with multiple functions | medium |
| Modify multiple files, complex logic | high |
| Migration + schema + multiple files | high |

### Priority

Tasks earlier in the dependency chain get priority 1. Tasks that can wait get 2-3.

## Step 6: Create Session Directory

```bash
SESSION_ID=$(date +%s)000
SESSION_DIR=.ralph++/sessions/$SESSION_ID
mkdir -p $SESSION_DIR

# Write PRD
# (use Write tool to create prd.json)

# Create empty progress file
echo "# Progress Log - {feature-name}" > $SESSION_DIR/progress.txt
echo "" >> $SESSION_DIR/progress.txt
echo "Session: $SESSION_ID" >> $SESSION_DIR/progress.txt
echo "Feature: {feature-name}" >> $SESSION_DIR/progress.txt
echo "Created: $(date -Iseconds)" >> $SESSION_DIR/progress.txt
echo "" >> $SESSION_DIR/progress.txt
```

## Step 7: Output Summary

```
PRD created: .ralph++/sessions/{session-id}/prd.json
Progress: .ralph++/sessions/{session-id}/progress.txt

Feature: {name}
Stories: {total} (from {phases} phases)
- Parallelizable groups: {count}
- Sequential stories: {count}
Quality gates: typecheck enabled

Ready for /ralph-loop!

Next: /ralph-loop {session-id}
```

## Validation Checklist

Before writing, verify:
- [ ] All tasks from tasks.md are included
- [ ] Story IDs match task numbers
- [ ] Dependencies extracted correctly
- [ ] Parallel groups identified
- [ ] All `passes` fields are `false`
- [ ] File paths are exact
- [ ] acceptanceCriteria are concrete and verifiable
- [ ] JSON is valid

---

**NOW**: Read the tasks file, parse all tasks, create prd.json and session directory.
