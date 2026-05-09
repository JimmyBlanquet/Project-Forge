---
name: ralph-agent-teams
description: Parallel implementation of Ralph++ PRD sub-stories using Claude Opus 4.6 Agent Teams. Use when executing prd.json with multiple independent sub-stories that can run in parallel. Extends ralph-loop with multi-agent orchestration, dependency analysis, conflict resolution, and progress synchronization. Requires CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1.
effort: high
---

# Ralph Agent Teams

Orchestrate parallel implementation of Ralph++ PRD sub-stories using Agent Teams. Analyzes dependencies, groups parallelizable tasks by phase, spawns multiple agents, and coordinates their work.

## Prerequisites

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

## Workflow Overview

```
1. Load PRD → Parse prd.json and progress.txt
2. Analyze → Build dependency graph, identify parallel groups
3. Execute phases → For each phase:
   a. Spawn agents (max 4) for independent sub-stories
   b. Coordinate via shared task list
   c. Resolve file conflicts
   d. Sync progress.txt
   e. Commit atomically per sub-story
4. Report → Show metrics (time saved, parallel efficiency)
```

## Scripts

This skill includes helper scripts for orchestration:

- `scripts/analyze_dependencies.py` - Analyzes PRD and generates parallel phases
- `scripts/check_conflicts.py` - Detects file conflicts between sub-stories
- `scripts/sync_progress.py` - Merges progress from parallel agents

## Execution

### Step 1: Session Detection

```bash
SESSION_DIR=.ralph++/sessions/{session-id}
# Required: prd.json, progress.txt
```

If no session-id provided, auto-detect latest:
```bash
ls -t .ralph++/sessions/ | head -1
```

### Step 2: Dependency Analysis

Run `scripts/analyze_dependencies.py` on prd.json:

```bash
python scripts/analyze_dependencies.py $SESSION_DIR/prd.json
```

Output: `parallel_phases.json` with structure:
```json
{
  "phases": [
    {
      "id": 1,
      "substories": ["US-000-1"],
      "parallel": false,
      "reason": "foundation"
    },
    {
      "id": 2,
      "substories": ["US-000-2", "US-000-3"],
      "parallel": true,
      "max_agents": 2
    }
  ]
}
```

### Step 3: Phase Execution

For each phase in `parallel_phases.json`:

**Sequential phase** (parallel: false):
- Use standard ralph-loop for single agent execution

**Parallel phase** (parallel: true):
- Spawn up to `max_agents` agents (default 4, configurable)
- Each agent receives:
  - Sub-story details (id, title, AC, files)
  - Codebase patterns from progress.txt
  - Quality gates to validate
  - File lock list (files other agents are modifying)

### Step 4: Agent Coordination

**Shared Task List Pattern:**
```
Each agent:
1. Claims sub-story via TaskUpdate (status: in_progress, owner: agent-id)
2. Implements sub-story
3. Validates quality gates
4. Reports completion via TaskUpdate (status: completed)
```

**File Conflict Resolution:**

Before spawning agents, run `scripts/check_conflicts.py`:
```bash
python scripts/check_conflicts.py $SESSION_DIR/prd.json --substories US-001-1 US-001-2
```

- No conflicts → Run in parallel
- Conflicts detected → Follow suggested groupings

Conflict strategies:
1. `lock_files` (default): First agent locks, others wait
2. `sequential_fallback`: Revert to sequential if any overlap
3. `merge_after`: Agents work on temp branches, merge after

### Step 5: Progress Synchronization

After each phase completion, run `scripts/sync_progress.py`:
```bash
python scripts/sync_progress.py $SESSION_DIR --phase 2
```

1. Agent writes learnings to temp file: `progress_{agent-id}.txt`
2. Script merges all temp files into `progress.txt`
3. Next phase agents receive merged context

Merge format:
```markdown
## Phase {n} Learnings (Parallel)

### {sub-story-id}: {title}
**Agent:** {agent-id}
**Completed:** {timestamp}
**Learnings:**
- {pattern discovered}
- {gotcha encountered}
```

### Step 6: Atomic Commits

One commit per sub-story (same as ralph-loop):
```bash
git add {filesAffected}
git commit -m "{sub-story.id}: {sub-story.title}

{description}

Acceptance criteria:
{list of criteria}

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

### Step 7: Metrics Report

```
╔════════════════════════════════════════════════════════════════╗
║           RALPH++ AGENT TEAMS COMPLETE                        ║
╚════════════════════════════════════════════════════════════════╝

Feature: {project}
Branch: {branchName}

📊 Parallel Execution Metrics:
- Total Sub-Stories: {total}
- Parallel Phases: {parallelPhases} / {totalPhases}
- Max Concurrent Agents: {maxAgents}
- Sequential Time (estimated): {seqTime}
- Actual Time: {actualTime}
- Time Saved: {timeSaved} ({percentage}%)

✅ Phase Summary:
Phase 1 (sequential): US-000-1 ✅
Phase 2 (parallel x2): US-000-2 ✅, US-000-3 ✅
Phase 3 (parallel x3): US-001-1 ✅, US-001-2 ✅, US-002-2 ✅
...
```

## Effort Tuning

Optimize cost by task type (requires effort-optimizer skill):

| Task Type | Effort | Rationale |
|-----------|--------|-----------|
| database.schema | high | Critical foundation |
| database.rls | high | Security critical |
| types | medium | Derived from schema |
| service | medium | Standard patterns |
| api | low | Repetitive patterns |
| frontend | medium | Variable complexity |
| tests | low | Established patterns |

## Error Handling

### Agent Failure
- Retry up to 3 times with error context
- If still failing, mark sub-story blocked
- Continue with other agents in phase
- Report blocked stories at end

### Conflict Detection
- If agents modify same file simultaneously
- Orchestrator detects via file locks
- Triggers sequential fallback for affected sub-stories

### Quality Gate Failure
- Agent must fix before completing
- Backpressure ensures only passing work commits
- Failed gates prevent marking sub-story complete

## Inter-Agent Communication

> **Research preview:** The `--channels` flag (Claude Code v2.1.80+) enables MCP push messages between parallel agents, allowing real-time feedback and coordination without polling the filesystem. This could replace the current file-based progress sync for lower-latency inter-agent communication.

## Configuration

```yaml
# .ralph/agent-teams.yaml
enabled: true
max_parallel_agents: 4
conflict_strategy: lock_files  # lock_files | sequential_fallback | merge_after
effort_tuning: true
progress_sync_interval: 30s
```

## Usage

```bash
# Basic (auto-detect session)
/ralph-agent-teams

# With options
/ralph-agent-teams --max-agents 4 --session-id 1768747324000

# Effort tuning enabled
/ralph-agent-teams --effort-tuning
```
