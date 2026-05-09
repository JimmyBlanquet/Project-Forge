---
name: effort-optimizer
description: Optimize API costs by adjusting thinking effort per task type. Use with ralph-agent-teams or ralph-loop to reduce token usage on repetitive tasks while maximizing quality on critical tasks. Categorizes tasks (database, types, api, frontend, tests) and suggests effort levels (high/medium/low).
effort: medium
---

# Effort Optimizer

Optimize Claude API costs by matching thinking effort to task complexity. Critical tasks get maximum reasoning; repetitive patterns get minimal overhead.

## Task Categories & Effort Levels

| Category | Effort | Tokens | When to Use |
|----------|--------|--------|-------------|
| `database.schema` | high | max | Table design, migrations |
| `database.rls` | high | max | Security policies |
| `database.indexes` | medium | balanced | Performance optimization |
| `types` | medium | balanced | Type definitions |
| `validation` | medium | balanced | Zod schemas |
| `service` | medium | balanced | Business logic |
| `api.routes` | low | minimal | CRUD endpoints |
| `api.actions` | medium | balanced | Server actions |
| `frontend.components` | medium | balanced | React components |
| `frontend.forms` | medium | balanced | Form handling |
| `frontend.pages` | low | minimal | Page composition |
| `tests.unit` | low | minimal | Unit tests |
| `tests.integration` | medium | balanced | Integration tests |
| `tests.e2e` | low | minimal | E2E tests |

## Usage

### Categorize a Sub-Story

Run `scripts/categorize_task.py`:

```bash
python scripts/categorize_task.py "Create RLS policies for posts table"
# Output: { "category": "database.rls", "effort": "high" }
```

### Analyze PRD for Effort Distribution

```bash
python scripts/analyze_effort.py specs/1-posts-crud/prd.json
```

Output:
```json
{
  "summary": {
    "high": 3,
    "medium": 10,
    "low": 6
  },
  "estimated_savings_pct": 35,
  "stories": [
    { "id": "US-000-1", "category": "database.schema", "effort": "high" },
    { "id": "US-001-1", "category": "api.actions", "effort": "medium" }
  ]
}
```

### Generate Frontmatter Suggestions for Skills

Scan all SKILL.md files and suggest `effort` frontmatter values based on each skill's name and description:

```bash
python scripts/analyze_effort.py --generate-frontmatter skills/
```

Output flags mismatches between current and suggested effort levels:
```json
{
  "total_skills": 33,
  "suggested_distribution": { "high": 5, "medium": 20, "low": 8 },
  "mismatches": 2,
  "skills": [
    { "name": "ralph-loop", "current_effort": "high", "suggested_effort": "high" },
    { "name": "speckit-specify", "current_effort": "medium", "suggested_effort": "medium" }
  ]
}
```

## Relationship with Native `effort` Frontmatter

Claude Code now supports `effort` frontmatter natively in SKILL.md files:

```yaml
---
name: my-skill
effort: low   # low | medium | high
---
```

All 33 skills in this project already have this frontmatter set. The two mechanisms are complementary:

| Scope | Mechanism | What It Controls |
|-------|-----------|-----------------|
| **Skill-level** | `effort` frontmatter in SKILL.md | Default thinking effort when Claude executes a skill |
| **Task-level** | effort-optimizer analysis | Per-story effort in a PRD, used by Ralph++ agents |

The frontmatter sets a static default per skill. The effort-optimizer does dynamic analysis: given a PRD with N sub-stories, it categorizes each one and assigns effort levels based on content, enabling cost optimization across a full implementation run.

### Mapping: Task Categories to Frontmatter Values

If you want to set frontmatter for a new skill based on its dominant task type:

| Dominant Category | Suggested Frontmatter `effort` |
|-------------------|-------------------------------|
| `database.schema`, `database.rls` | `high` |
| `service`, `validation`, `api.actions`, `frontend.components`, `frontend.forms`, `tests.integration` | `medium` |
| `api.routes`, `frontend.pages`, `tests.unit`, `tests.e2e` | `low` |

Use `--generate-frontmatter` with `analyze_effort.py` to scan SKILL.md files and suggest effort values (see below).

## Integration with Ralph++

In `ralph-agent-teams`, effort tuning is applied per sub-story:

```python
# In team orchestrator
effort = get_effort_for_story(story)
agent_config = {
    "thinking": effort,  # "high" | "medium" | "low"
    "max_tokens": EFFORT_TOKENS[effort]
}
spawn_agent(story, config=agent_config)
```

## Categorization Rules

Task categorization uses keyword matching:

```python
CATEGORY_KEYWORDS = {
    "database.schema": ["schema", "table", "migration", "drizzle"],
    "database.rls": ["rls", "policy", "security", "row level"],
    "database.indexes": ["index", "performance"],
    "types": ["type", "interface", "typedef"],
    "validation": ["zod", "validation", "schema"],
    "service": ["service", "business", "logic"],
    "api.routes": ["route", "endpoint", "api"],
    "api.actions": ["action", "server action", "mutation"],
    "frontend.components": ["component", "ui", "shadcn"],
    "frontend.forms": ["form", "input", "react-hook-form"],
    "frontend.pages": ["page", "layout", "route"],
    "tests.unit": ["unit test", "test file"],
    "tests.integration": ["integration", "api test"],
    "tests.e2e": ["e2e", "playwright", "browser"]
}
```

## Cost Estimation

Assuming base cost of 100 for high effort:

| Effort | Relative Cost | Use Case |
|--------|--------------|----------|
| high | 100% | Critical decisions, security |
| medium | 60% | Standard development |
| low | 30% | Repetitive patterns |

For 19 sub-stories with typical distribution (3 high, 10 medium, 6 low):
- Without tuning: 19 × 100 = 1900 units
- With tuning: 3×100 + 10×60 + 6×30 = 1080 units
- **Savings: ~43%**
