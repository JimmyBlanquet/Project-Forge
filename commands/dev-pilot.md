---
description: Run the full autonomous development pipeline — loops over features.json processing each feature from spec to deploy
---

# Dev-Pilot — Autonomous Pipeline Orchestrator

Process all pending features through the complete development cycle.

## Dynamic Context

- Current directory: !`pwd`
- Features: !`cat .speckit/features.json 2>/dev/null | jq -r '.features[] | "\(.id) \(.name) [\(.status)] \(.priority)"' || echo "NO_FEATURES_JSON"`
- Tools available: !`for t in tools/ralph tools/validate-feature tools/deploy-staging tools/smoke-test; do [ -x "$t" ] && echo "  ✓ $t" || echo "  ✗ $t (missing)"; done`
- Git status: !`git status --short | head -5 || echo "NOT_A_GIT_REPO"`

## User Input

```text
$ARGUMENTS
```

**Usage:**
- `/dev-pilot` — Process all todo features with human review gates
- `/dev-pilot --headless` — Fully autonomous (no review gates)
- `/dev-pilot F02` — Process only feature F02

**Now**: Follow the full skill at `skills/dev-pilot/SKILL.md` to run the pipeline.
