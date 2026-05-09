# SpecKit - Spec-Driven Development for Project-Forge

**Version:** 1.0.0 (Phase 1)
**Status:** Skills Implementation Complete

Spec-Driven Development system that converts high-level project descriptions into detailed implementation plans ready for autonomous execution by Ralph++.

## What is SpecKit?

SpecKit is inspired by [GitHub SpecKit](https://github.com/github/spec-kit) and adapted for Project-Forge's autonomous development workflow.

**Core Philosophy**: Define WHAT before HOW, then let Ralph++ autonomously implement.

## Workflow

```
Project Idea
     ↓
1. /speckit-constitution → .speckit/constitution.yml
     ↓ (Principles, standards, constraints)
2. /speckit-specify → .speckit/specification.md
     ↓ (Requirements, user stories)
3. /speckit-plan → .speckit/plan.md
     ↓ (Architecture, tech stack)
4. /speckit-tasks → .speckit/tasks.md
     ↓ (Implementation tasks)
5. /speckit-convert → prd.json
     ↓
6. /ralph-loop → Autonomous Implementation! 🚀
```

## Quick Start

### Step 1: Constitution

Define project principles and standards.

```bash
/speckit-constitution "User authentication system with email and social login"
```

**Output**: `.speckit/constitution.yml`
- Architecture principles
- Quality standards
- Tech stack standards
- Constraints
- Quality gates

### Step 2: Specification

Define functional requirements (WHAT to build).

```bash
/speckit-specify
```

Reads `constitution.yml`, generates `.speckit/specification.md`:
- Functional requirements
- Non-functional requirements
- User stories
- Success criteria
- Scope definition

### Step 3: Technical Plan

Define architecture (HOW to build).

```bash
/speckit-plan
```

Reads `constitution.yml` + `specification.md`, generates `.speckit/plan.md`:
- System architecture
- Tech stack (specific versions)
- Component design
- Database schema
- API design
- File structure
- Implementation approach

### Step 4: Tasks

Generate implementation tasks.

```bash
/speckit-tasks
```

Reads all previous files, generates `.speckit/tasks.md`:
- Detailed user stories
- Acceptance criteria
- File paths to create
- Dependencies
- Complexity estimates

### Step 5: Convert to PRD

Convert to Ralph++ format.

```bash
/speckit-convert
```

Reads `tasks.md`, generates `prd.json`:
- Ralph++-compatible JSON format
- Ready for autonomous implementation

### Step 6: Autonomous Implementation

Launch Ralph++.

```bash
/ralph-loop
```

Ralph++ implements all stories autonomously!

## Complete Example

### Input

```bash
/speckit-constitution "Task management app with real-time collaboration"
```

### Generated Files

```
.speckit/
├── constitution.yml       # Principles, standards, constraints
├── specification.md       # Requirements, user stories
├── plan.md                # Architecture, tech stack, design
└── tasks.md               # Implementation stories

prd.json                   # Ralph++ PRD

.ralph++/
└── sessions/[timestamp]/
    ├── prd.json           # Copy of PRD
    └── progress.txt       # Implementation log
```

### Constitution (constitution.yml)

```yaml
name: Task Management App
principles:
  architecture:
    - Real-time first architecture
    - Optimistic UI updates
    - Offline-capable
  quality:
    - Test coverage > 80%
    - Type-safe (TypeScript strict)
  ux:
    - Instant feedback
    - Collaborative features
standards:
  frontend:
    - Next.js 14 App Router
    - TypeScript strict
    - Tailwind CSS
  backend:
    - Supabase Realtime
    - PostgreSQL
    - Row Level Security
quality_gates:
  testing:
    unit_coverage: 80
  performance:
    api_response_ms: 200
```

### Specification (specification.md)

```markdown
# Specification: Task Management App

## Functional Requirements

### FR1: Task Creation
Users can create tasks with title, description, due date, priority.

### FR2: Real-time Collaboration
Multiple users can collaborate on same task list in real-time.

### FR3: Task Assignment
Users can assign tasks to team members.

## User Stories

### US1: Create Task
**As a** user
**I want** to create tasks
**So that** I can track my work

**Acceptance Criteria:**
- [ ] User can add task with title
- [ ] User can set priority (high/medium/low)
- [ ] Task appears in list immediately
```

### Tasks (tasks.md)

```markdown
# Implementation Tasks

## Story 1: Setup Supabase with Realtime

**Priority:** HIGH
**Complexity:** MEDIUM

### Acceptance Criteria
- [ ] Supabase client configured
- [ ] Realtime subscriptions working
- [ ] Connection tested

### Files to Create/Modify
- `lib/supabase/client.ts`
- `lib/supabase/realtime.ts`
```

### PRD (prd.json)

```json
{
  "projectName": "task-management-app",
  "stories": [
    {
      "id": 1,
      "title": "Setup Supabase with Realtime",
      "acceptanceCriteria": [
        "Supabase client configured",
        "Realtime subscriptions working",
        "Connection tested"
      ],
      "priority": 1,
      "complexity": "medium",
      "passes": false,
      "filesAffected": [
        "lib/supabase/client.ts",
        "lib/supabase/realtime.ts"
      ]
    }
  ],
  "metadata": {
    "source": "speckit",
    "constitutionPath": ".speckit/constitution.yml"
  }
}
```

### Autonomous Implementation

```bash
/ralph-loop

# Ralph++ output:
# [Iteration 1] Story 1/10: Setup Supabase with Realtime
# [Agent 1] Reading filesystem...
# [Agent 1] Implementing...
# [Agent 1] Tests passing ✅
# [Agent 1] Committed
# [Verified] Story 1/10 complete ✅
#
# [Iteration 2] Story 2/10: Create Task Model...
# ...
```

## Skills Documentation

### /speckit-constitution

Generates project constitution (principles, standards).

**Inputs**: Project description (argument)
**Outputs**: `.speckit/constitution.yml`

**What it defines**:
- Architecture principles
- Quality standards
- UX principles
- Security principles
- Tech stack standards
- Tooling standards
- Constraints (technical, business, performance)
- Quality gates

### /speckit-specify

Generates functional specification (requirements).

**Inputs**: Reads `constitution.yml`
**Outputs**: `.speckit/specification.md`

**What it defines**:
- Functional requirements (WHAT to build)
- Non-functional requirements (quality attributes)
- User stories (who, what, why)
- Success criteria
- Out of scope
- Dependencies
- Risks

### /speckit-plan

Generates technical architecture plan.

**Inputs**: Reads `constitution.yml` + `specification.md`
**Outputs**: `.speckit/plan.md`

**What it defines**:
- System architecture
- Tech stack (specific versions)
- Component design
- Database schema
- API design
- Security approach
- File structure
- Implementation phases

### /speckit-tasks

Generates implementation tasks.

**Inputs**: Reads `constitution.yml` + `specification.md` + `plan.md`
**Outputs**: `.speckit/tasks.md`

**What it defines**:
- Detailed user stories
- Acceptance criteria (testable)
- Files to create/modify
- Dependencies
- Complexity estimates
- Testing requirements
- Definition of done

### /speckit-convert

Converts tasks to Ralph++ PRD.

**Inputs**: Reads `tasks.md`
**Outputs**: `prd.json` + `.ralph++/sessions/[timestamp]/prd.json`

**What it does**:
- Parses tasks.md
- Converts to Ralph++ JSON format
- Creates Ralph++ session directory
- Initializes progress.txt

## Benefits

### vs Traditional Development

**Traditional**:
```
Idea → Start coding → Realize unclear requirements → Refactor → Repeat
```

**SpecKit + Ralph++**:
```
Idea → SpecKit (30 min spec) → Ralph++ (autonomous implementation)
```

### Advantages

✅ **Clarity**: Requirements defined upfront
✅ **Consistency**: Standards enforced via constitution
✅ **Traceability**: Requirements → Stories → Code
✅ **Automation**: Ralph++ implements autonomously
✅ **Quality**: Quality gates built-in
✅ **Speed**: Spec once, implement autonomously

## Integration with Ralph++

SpecKit generates `prd.json` that Ralph++ can execute:

```
SpecKit → prd.json → Ralph++ → Production Code
```

Ralph++ will:
1. Read `prd.json`
2. Spawn fresh agents for each story
3. Implement with fresh context (no pollution)
4. Update `prd.json` as stories complete
5. Continue until all `passes: true`

## File Structure

```
project-root/
├── .speckit/                    # SpecKit outputs
│   ├── constitution.yml         # From /speckit-constitution
│   ├── specification.md         # From /speckit-specify
│   ├── plan.md                  # From /speckit-plan
│   └── tasks.md                 # From /speckit-tasks
│
├── prd.json                     # Ralph++ PRD (from /speckit-convert)
│
└── .ralph++/                    # Ralph++ workspace
    └── sessions/[timestamp]/
        ├── prd.json             # Session PRD copy
        └── progress.txt         # Implementation log
```

## Best Practices

1. **Start with Constitution**: Define principles FIRST
2. **Be Specific**: Vague requirements = vague implementation
3. **Think User-First**: Every requirement should serve users
4. **Validate Each Step**: Review each file before next step
5. **Iterate if Needed**: Re-run skills to refine
6. **Trust Ralph++**: Let it implement autonomously

## Phase 1 Limitations

Current implementation (Phase 1 - Skills):

✅ **What Works**:
- 5 slash commands for full pipeline
- Generate constitution, spec, plan, tasks
- Convert to Ralph++ prd.json
- Integration with /ralph-loop

❌ **What's Missing** (Future Phases):
- CLI (`speckit init`, `speckit run`, etc.)
- Templates (pre-made constitutions for common projects)
- Validation tools
- Version control for specs
- Multi-project support

## Roadmap

### Phase 1 (Complete) ✅
- Skills implementation
- Manual workflow
- Integration with Ralph++

### Phase 2 (Future)
- CLI wrapper
- Templates library
- Validation tools

### Phase 3 (Future)
- Auto-spec from code analysis
- Spec versioning
- Team collaboration features

## Comparison to GitHub SpecKit

| Feature | GitHub SpecKit | Project-Forge SpecKit |
|---------|----------------|----------------------|
| Language | Python | Claude Code Skills |
| Pipeline | 5 steps | 5 steps (same) |
| Output | Markdown files | Markdown + JSON (prd.json) |
| Integration | General | Ralph++ specific |
| Execution | Manual | Autonomous (Ralph++) |

## See Also

- [Ralph++ Documentation](../ralph++/README.md) - Autonomous implementation
- [Ralph Loop Skill](../../skills/core/ralph-loop/) - Orchestrator
- [GitHub SpecKit](https://github.com/github/spec-kit) - Original inspiration

## License

MIT
