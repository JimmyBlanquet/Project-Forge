---
name: ralph-loop
description: Use when implementing features autonomously from a prd.json, spawning fresh Task agents per story with quality gates and atomic commits
effort: high
---

# Ralph++ Autonomous Implementation Loop

Orchestrate feature implementation by spawning fresh Task agents for each story in a prd.json, with quality gate verification and atomic git commits.

## When to Use

- After `/speckit-convert` has created a prd.json from SpecKit tasks
- When implementing a multi-story feature autonomously
- When you need one-agent-per-story isolation with clean context

## Core Pattern

```
Load prd.json → Find next story (dependency-aware) → Spawn Task agent
→ Verify quality gate → Update state → Git commit → Loop
```

## Key Principles

1. **State in files** - prd.json + progress.txt are truth, not memory
2. **Fresh agents** - Each story = new Task agent with zero context pollution
3. **Verify independently** - Run typecheck yourself after agent completes
4. **One story per agent** - Never let an agent implement multiple stories
5. **Atomic commits** - One commit per story for clean git history
6. **Retry with context** - Failed stories get 3 retries with error context

## File Structure

```
.ralph++/sessions/{id}/
├── prd.json         # Stories, dependencies, passes status
└── progress.txt     # Learnings accumulate across agents
```

## Agent Prompt Essentials

Each spawned agent needs:
- Project root, constitution path, plan path
- ONE story: title, description, files, acceptance criteria
- Learnings from progress.txt
- Quality gate command
- Explicit "DO NOT commit" instruction

## Commands

- `/speckit-convert {feature}` - Create prd.json from tasks.md
- `/ralph-loop [session-id]` - Run the implementation loop
