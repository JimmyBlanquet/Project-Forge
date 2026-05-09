# Ralph Loop - Autonomous Skill Implementation

Autonomous orchestrator that implements skills using fresh context agents following the TRUE Ralph philosophy.

## Quick Start

```bash
# Fast mode (default) - no quality gates
/ralph-loop config-centralization

# With quality gates (2-stage review)
/ralph-loop config-centralization --quality-gates

# Or specify session:
/ralph-loop config-centralization 1768686186559
```

## What It Does

The Ralph Loop orchestrator:

1. **Reads** PRD and progress from filesystem
2. **Finds** next incomplete story (where `passes: false`)
3. **Spawns** fresh Task agent with clean context
4. **Waits** for agent to complete story
5. **Verifies** completion by re-reading filesystem
6. **Loops** until all stories complete

## Fresh Context Pattern

Each story is implemented by a **fresh agent** with **zero context pollution**:

```
Orchestrator (coordinates)
├─ Story 1 → Spawns Fresh Agent 1
│  └─ Reads filesystem → Implements → Saves → Exits (context destroyed)
├─ Story 2 → Spawns Fresh Agent 2
│  └─ Reads filesystem → Implements → Saves → Exits (context destroyed)
├─ Story 3 → Spawns Fresh Agent 3
│  └─ Reads filesystem → Implements → Saves → Exits (context destroyed)
└─ Complete! ✅
```

**Key**: State lives in files (prd.json, progress.txt, git), NOT conversation.

## Arguments

- `skill-name` (required): Name of skill to implement
- `session-id` (optional): Ralph++ session ID (auto-detects latest if not provided)

## Example Usage

### Implement new skill

```bash
# 1. Generate skill PRD
ralph++ analyze
# Output: Detected skill "api-error-handling"

# 2. Run autonomous implementation
/ralph-loop api-error-handling

# Watch as it:
# ✅ Story 1/5 complete: Create skill structure
# ✅ Story 2/5 complete: Extract reusable code
# ✅ Story 3/5 complete: Write tests
# ✅ Story 4/5 complete: Document skill
# ✅ Story 5/5 complete: Create install script
# 🎉 All stories complete!
```

### Resume partial implementation

```bash
# If you stopped mid-way, just run again:
/ralph-loop api-error-handling

# Orchestrator reads filesystem, sees stories 1-3 complete
# Resumes from story 4
```

## How It Works

### 1. Orchestrator (This Session)

The orchestrator runs in your current Claude Code session:
- Maintains loop logic
- Reads filesystem between iterations
- Spawns fresh agents via Task tool
- Verifies completion
- Handles errors

### 2. Fresh Agents (New Context Each Time)

Each agent is spawned with Task tool:
```javascript
await Task({
  subagent_type: "general-purpose",
  description: "Implement Story 3",
  prompt: "You are a fresh agent with clean context..."
})
```

The agent:
1. Reads prd.json, progress.txt, git history
2. Implements ONE story only
3. Saves state to filesystem
4. Git commits
5. Exits (context destroyed)

### 3. State Management

All state lives in filesystem:

**PRD** (`systems/ralph++/.ralph++/sessions/{id}/{skill}-prd.json`):
```json
{
  "stories": [
    { "id": 1, "passes": true, "notes": "..." },
    { "id": 2, "passes": false, "notes": "" }
  ]
}
```

**Progress** (`systems/ralph++/.ralph++/sessions/{id}/progress.txt`):
```
## Iteration 1 - Story 1: Create skill structure
Agent: Fresh context agent
Status: Complete
Learnings: ...
```

**Git History**: Each story = 1 commit

## Stop Conditions

✅ **Success**: All stories have `passes: true`
⚠️ **Max Iterations**: 20 iterations reached (safety)
❌ **Error**: Critical error (asks user for help)

## Quality Gates (Optional)

Ralph++ can optionally enforce quality gates after each story implementation.

### Workflow with Quality Gates

```
Story Implementation
    ↓
Stage 1: Spec Compliance Review
    ├─ Check acceptance criteria
    ├─ Verify files created
    └─ PASS → Stage 2 / FAIL → Fix → Retry
    ↓
Stage 2: Code Quality Review
    ├─ Check tests, security, performance
    └─ PASS → Complete ✅ / FAIL → Fix → Retry
```

### Usage

```bash
# Enable quality gates with flag
/ralph-loop project-name --quality-gates

# Or configure in prd.json
{
  "config": {
    "qualityGates": {
      "enabled": true,
      "specCompliance": true,
      "codeQuality": true,
      "maxReviewLoops": 3
    }
  }
}
```

### Performance Impact

| Mode | Time/Story | Quality | Use Case |
|------|-----------|---------|----------|
| **Fast** (default) | 5-10 min | Good | Prototypes, familiar stack |
| **Quality Gates** | 10-20 min | High | Production, complex features |

### Review Process

**Stage 1: Spec Compliance**
- All acceptance criteria met?
- Required files present?
- No scope creep?
- Uses `/code-review` skill

**Stage 2: Code Quality**
- Tests present and passing?
- Security considerations?
- Error handling adequate?
- Code standards followed?

### Review Loops

If review fails:
1. Spawn fix agent with issues list
2. Fix critical/major issues
3. Re-review (max 3 loops per stage)
4. If still failing → report to orchestrator

### When to Use

**Use quality gates when:**
- Complex features
- Production code
- Learning new stack
- High quality requirements

**Skip (fast mode) when:**
- Prototypes
- Simple CRUD
- Familiar technology
- Speed is priority

---

## Error Handling

- **Story fails**: Retries same story with fresh agent (max 3 times)
- **Persistent failure**: Asks user for help
- **Filesystem issues**: Reports error and stops

## Advantages

✅ **True autonomy**: Runs without intervention
✅ **Fresh context**: Each story = clean slate
✅ **State in files**: No context pollution
✅ **Resumable**: Can stop/restart anytime
✅ **Verifiable**: Git history shows all changes
✅ **Scalable**: Works for any skill size

## Requirements

- Claude Code environment (for Task tool)
- Ralph++ session with generated PRD
- Git repository

## See Also

- `SKILL.md` - Detailed documentation
- `systems/ralph++/` - Ralph++ core system
- `systems/ralph++/docs/TRUE-RALPH.md` - Philosophy

## Philosophy

Based on the TRUE Ralph pattern:

> "State lives in files, not conversation"

Each fresh agent reconstructs reality from filesystem, implements ONE story, saves state, exits. The orchestrator coordinates but never accumulates context pollution.

This is the real Ralph, not the superficial plugin approach.
