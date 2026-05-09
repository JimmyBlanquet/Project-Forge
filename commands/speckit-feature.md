---
description: Run full SpecKit pipeline (specify → plan → tasks → convert) for a feature — end-to-end from description to PRD
---

# SpecKit Feature Pipeline

Run the complete specification pipeline for a single feature.

## Dynamic Context

- Current directory: !`pwd`
- Existing features: !`cat .specify/features.json 2>/dev/null || cat .speckit/features.json 2>/dev/null | jq -r '.features[] | "\(.id) \(.name) [\(.status)]"' || echo "NO_FEATURES_JSON"`
- Constitution: !`head -5 .specify/memory/constitution.md 2>/dev/null || head -5 .speckit/constitution.md 2>/dev/null || echo "NO_CONSTITUTION"`

## User Input

```text
$ARGUMENTS
```

**Usage examples:**
- `/speckit-feature payments "Stripe checkout with subscriptions"`
- `/speckit-feature F02`
- `/speckit-feature auth`

**Now**: Follow the full skill at `skills/speckit/feature/SKILL.md` to run the pipeline.
