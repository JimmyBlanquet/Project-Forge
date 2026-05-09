---
name: ralph-loop
description: Autonomous orchestrator that implements Project-Forge skills using the TRUE Ralph pattern with fresh context agents.
effort: high
---

# Ralph Loop - Complete Documentation

## Overview

Ralph Loop is an autonomous orchestrator that implements Project-Forge skills using the TRUE Ralph pattern with fresh context agents.

**Version**: 1.0.0
**Category**: Core
**Type**: Orchestrator / Slash Command

## Philosophy

Based on the TRUE Ralph pattern discovered through research:

### Core Principles

1. **State Lives in Files, Not Conversation**
   - PRD (prd.json) tracks story status
   - Progress log (progress.txt) captures learnings
   - Git history is the memory layer

2. **Fresh Context Agents**
   - Each story = NEW agent with CLEAN context
   - Zero context pollution between stories
   - Agent reads ALL state from filesystem
   - Agent implements ONE story only
   - Agent saves state and exits (context destroyed)

3. **Orchestrator Coordinates**
   - Reads filesystem to find next story
   - Spawns fresh agents via Task tool
   - Verifies completion from filesystem (not agent result)
   - Loops until all stories complete

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Ralph Loop Orchestrator (Single Session)               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Loop Iteration 1:                                      │
│  ├─ Read PRD → Story 1 incomplete                      │
│  ├─ Spawn Task Agent 1 (FRESH context)                 │
│  │  └─ Read filesystem (prd.json, progress.txt, git)   │
│  │  └─ Implement Story 1                               │
│  │  └─ Save state (update prd, append progress, commit)│
│  │  └─ EXIT → Context destroyed                        │
│  └─ Re-read PRD → Story 1 now passes=true ✅           │
│                                                         │
│  Loop Iteration 2:                                      │
│  ├─ Read PRD → Story 2 incomplete                      │
│  ├─ Spawn Task Agent 2 (FRESH context)                 │
│  │  └─ Read filesystem                                 │
│  │  └─ Implement Story 2                               │
│  │  └─ Save state                                      │
│  │  └─ EXIT → Context destroyed                        │
│  └─ Re-read PRD → Story 2 now passes=true ✅           │
│                                                         │
│  ... continue for all stories ...                      │
│                                                         │
│  All stories complete → SUCCESS ✅                      │
└─────────────────────────────────────────────────────────┘
```

## Installation

This skill is a slash command - no installation needed.

Simply use `/ralph-loop` in Claude Code.

## Usage

### Basic Usage

```bash
/ralph-loop <skill-name> [session-id]
```

**Arguments**:
- `skill-name` (required): Name of the skill to implement
- `session-id` (optional): Ralph++ session ID (auto-detects latest if omitted)

### Example Workflow

#### 1. Generate Skill PRD

First, use Ralph++ to analyze your work and generate a skill:

```bash
cd /path/to/project
ralph++ analyze

# Output:
# Skill Gaps Detected: 1
# 1. api-error-handling (HIGH)
#    PRD: systems/ralph++/.ralph++/sessions/1234567890/api-error-handling-prd.json
```

#### 2. Run Autonomous Implementation

In Claude Code:

```bash
/ralph-loop api-error-handling
```

The orchestrator will:

```
[Ralph Loop] Starting autonomous implementation
[Ralph Loop] Skill: api-error-handling
[Ralph Loop] Session: 1234567890
[Ralph Loop] Stories: 0/5 complete

[Iteration 1] Story 1/5: Create api-error-handling skill structure
[Spawning] Fresh agent for Story 1...
[Agent 1] Reading filesystem...
[Agent 1] Implementing Story 1...
[Agent 1] Saving state...
[Agent 1] Git commit: feat: create skill structure
[Agent 1] ✅ Complete
[Verified] Story 1/5 complete ✅

[Iteration 2] Story 2/5: Extract reusable code
[Spawning] Fresh agent for Story 2...
[Agent 2] Reading filesystem...
[Agent 2] Implementing Story 2...
[Agent 2] Saving state...
[Agent 2] Git commit: feat: extract reusable code
[Agent 2] ✅ Complete
[Verified] Story 2/5 complete ✅

... continues for all stories ...

[Complete] All 5/5 stories complete! 🎉
[Output] Skill: skills/core/api-error-handling/
[Output] Commits: 5
[Output] Duration: 8m 34s
```

#### 3. Review Results

```bash
cd skills/core/api-error-handling
ls -la

# Structure created:
# files/          - Implementation code
# tests/          - Test suite
# SKILL.md        - Documentation
# README.md       - Quick start
# install.sh      - Installation script
```

### Resume Partial Implementation

If the orchestrator stops mid-way (error, manual stop, etc.), just run again:

```bash
/ralph-loop api-error-handling
```

It will:
1. Read PRD from filesystem
2. See stories 1-3 already complete (`passes: true`)
3. Resume from Story 4
4. Continue until all complete

**State is always in files**, so resuming is seamless.

## How Fresh Agents Work

### Agent Prompt Template

Each fresh agent receives a prompt like this:

```markdown
# Ralph++ Implementation Agent (Story 2)

You are a **fresh agent** with CLEAN context.

## Your ONLY source of truth: Filesystem

Read these files:
- systems/ralph++/.ralph++/sessions/XXX/skill-prd.json
- systems/ralph++/.ralph++/sessions/XXX/progress.txt
- git log --oneline --since="4 hours ago"

## Your Task (ONE Story Only)

Implement Story 2: "Extract reusable code"

Acceptance Criteria:
1. Code extracted to files/ directory
2. Generic implementation (no hardcoded values)
3. TypeScript types defined
4. Exports working
5. No external dependencies

## Implementation Steps

1. Read source files
2. Identify reusable patterns
3. Extract to generic code
4. Create TypeScript types
5. Export public API

## Save State

Update prd.json → set story.passes = true
Append progress.txt → learnings for next agent
Git commit → feat: extract reusable code

## EXIT

You are DONE. The orchestrator will spawn next agent.
```

### State Files

**PRD** (`{session}/skill-prd.json`):
```json
{
  "skillName": "api-error-handling",
  "stories": [
    {
      "id": 1,
      "title": "Create skill structure",
      "passes": true,
      "notes": "Implemented by fresh agent iteration 1"
    },
    {
      "id": 2,
      "title": "Extract reusable code",
      "passes": false,
      "acceptanceCriteria": [...]
    }
  ]
}
```

**Progress Log** (`{session}/progress.txt`):
```
## Iteration 1 - Story 1: Create skill structure
Timestamp: 2026-01-18T10:00:00Z
Agent: Fresh context agent
Status: Complete

What I did:
- Created directory structure
- Created README.md, SKILL.md, install.sh
- Made install.sh executable

Learnings:
- Skill structure follows Project-Forge conventions
- Documentation should match implementation

Files created:
- skills/core/api-error-handling/README.md
- skills/core/api-error-handling/SKILL.md
- skills/core/api-error-handling/install.sh

Notes for next agent:
- Implementation code needed in files/ directory
- Use TypeScript for type safety
```

## Configuration

### Orchestrator Limits

- **Max Iterations**: 20 (safety limit)
- **Max Retries per Story**: 3
- **Delay Between Iterations**: 2000ms

### Customization

To customize behavior, edit `prompt.md`:

```yaml
# Change max iterations
MAX_ITERATIONS: 50  # Default: 20

# Change retry logic
MAX_RETRIES_PER_STORY: 5  # Default: 3

# Change delay
ITERATION_DELAY_MS: 1000  # Default: 2000
```

## Error Handling

### Story Implementation Fails

If a story fails to complete:

1. **Retry Logic**: Spawns fresh agent to retry (max 3 times)
2. **Verification**: Re-reads filesystem to check if `passes: true`
3. **Error Analysis**: Checks git status, test output, error messages
4. **User Intervention**: After 3 retries, asks user for help

### Critical Errors

If orchestrator encounters critical error:
- Saves current state to filesystem
- Reports error with details
- Asks user how to proceed

### Filesystem Issues

If PRD or progress file missing/corrupted:
- Reports specific issue
- Suggests corrective action
- Stops safely

## Stop Conditions

The orchestrator stops when:

✅ **All Stories Complete**
```
All stories have passes: true
Skill is production-ready
```

⚠️ **Max Iterations Reached**
```
20 iterations completed
Some stories still incomplete
Reports which stories failed
```

❌ **Critical Error**
```
Unrecoverable error occurred
State saved to filesystem
User intervention required
```

🛑 **User Stop**
```
User manually stops orchestrator
State saved to filesystem
Can resume later
```

## Advanced Usage

### Multiple Skills in Parallel

Run multiple skills concurrently (different Claude Code sessions):

```bash
# Session 1
/ralph-loop api-error-handling

# Session 2
/ralph-loop auth-middleware

# Session 3
/ralph-loop rate-limiting
```

Each runs independently, no conflicts (separate PRD files).

### Custom Session Directory

Specify exact session:

```bash
/ralph-loop api-error-handling 1768686186559
```

Useful for:
- Resuming specific session
- Multiple PRDs for same skill
- Testing different approaches

### Integration with CI/CD

The orchestrator can run in CI/CD:

```yaml
# .github/workflows/generate-skills.yml
- name: Generate Skills
  run: |
    ralph++ analyze
    # Parse output to get skill name
    # Then: /ralph-loop $skill_name
```

## Troubleshooting

### "PRD not found"

**Cause**: Skill PRD doesn't exist
**Solution**: Run `ralph++ analyze` first to generate PRD

### "Session directory not found"

**Cause**: Invalid session ID
**Solution**: Check `systems/ralph++/.ralph++/sessions/` for valid IDs

### "Story keeps failing"

**Cause**: Story implementation has issues
**Solution**:
1. Check `progress.txt` for error details
2. Review acceptance criteria
3. Manually fix issue
4. Update `prd.json` to mark `passes: true`
5. Resume orchestrator

### "Orchestrator stuck in loop"

**Cause**: Story not updating PRD correctly
**Solution**:
1. Check git log for commits
2. Verify `prd.json` has `passes: true` for completed stories
3. Manually update if needed

## Best Practices

1. **Let It Run**: Don't interrupt unless necessary (fresh agents handle errors)
2. **Check Progress**: Monitor `progress.txt` for learnings
3. **Review Commits**: Each story = 1 commit, easy to review
4. **Resume Anytime**: Safe to stop/start (state in files)
5. **Trust Filesystem**: The orchestrator reads actual state, not assumptions

### Performance in Headless Mode

When running via `claude -p` (headless), set `thinking.display: "omitted"` in the API parameters to skip streaming extended thinking output. This reduces I/O overhead and speeds up agent execution, especially for multi-story runs where thinking output is not observed.

## Comparison: Ralph Loop vs Manual

### Manual Implementation (Old Way)

```
User: "continue story 1"
→ Agent implements Story 1
User: "continue story 2"
→ Agent implements Story 2
User: "continue story 3"
→ Agent implements Story 3
...
```

**Issues**:
- User must remember to continue
- Manual intervention between stories
- Risk of forgetting stories

### Ralph Loop (Autonomous)

```
User: "/ralph-loop skill-name"
→ Orchestrator implements ALL stories automatically
→ User reviews when complete
```

**Benefits**:
✅ Zero intervention needed
✅ Runs until complete
✅ Fresh context per story
✅ Resumable if stopped

## Technical Details

### Task Tool Integration

The orchestrator uses Claude Code's Task tool:

```typescript
await Task({
  subagent_type: "general-purpose",
  description: `Implement Story ${storyId}`,
  prompt: agentPrompt
})
```

**Key Properties**:
- `subagent_type`: "general-purpose" for full tool access
- `description`: Short description for tracking
- `prompt`: Complete instructions for fresh agent

The Task tool is **blocking** - orchestrator waits for agent to complete.

### Filesystem Verification

After each Task completes, orchestrator re-reads PRD:

```typescript
const prd = JSON.parse(fs.readFileSync(prdPath))
const story = prd.stories.find(s => s.id === storyId)

if (story.passes === true) {
  console.log("✅ Story complete")
} else {
  console.log("⚠️ Story incomplete, retrying...")
}
```

**We don't trust agent's return value** - we check filesystem for truth.

## See Also

- `systems/ralph++/README.md` - Ralph++ system overview
- `systems/ralph++/docs/TRUE-RALPH.md` - Philosophy documentation
- `systems/ralph++/core/ralph-orchestrator.ts` - Orchestrator implementation
- `skills/core/config-centralization/` - Example skill created with Ralph Loop

## License

MIT
