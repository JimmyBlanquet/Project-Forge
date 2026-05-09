# Context Maximizer - Quick Start Guide

Get started with the context-maximizer skill in 5 minutes.

## Installation

The skill is ready to use. No installation required.

```bash
cd /path/to/your/project
python3 /path/to/skills/context-maximizer/scripts/analyze_context.py . --report
```

## Basic Commands

### 1. Check Your Project's Context

```bash
python3 analyze_context.py . --report --format text
```

**Tells you**:
- Total files and tokens
- Whether you're within the 1M limit
- Breakdown by category (codebase, docs, specs)
- Warnings and optimization suggestions

### 2. Generate Loading Plan for a Feature

```bash
python3 analyze_context.py . --feature "feature-name" --output plan.json
```

**Creates**:
- Prioritized file list (critical → high → medium → low)
- Token estimates for each priority level
- List of files to exclude if over limit

### 3. Analyze Specific Spec

```bash
python3 analyze_context.py . --spec specs/your-spec/prd.json
```

**Extracts** feature name from spec path and generates targeted loading plan.

## Example Workflow

### Scenario: Creating a Posts CRUD Feature

#### Step 1: Understand Your Context Budget

```bash
cd my-saas-app
python3 ../skills/context-maximizer/scripts/analyze_context.py . --report
```

Output tells you:
```
Total Tokens: 423,491 / 1,000,000
Utilization: 42.3%
Within Limit: True
```

**Insight**: You have 577k tokens free, plenty of room.

#### Step 2: Generate Feature Context

```bash
python3 ../skills/context-maximizer/scripts/analyze_context.py . \
  --feature "posts-crud" \
  --output posts-context.json
```

Output (`posts-context.json`):
```json
{
  "total_tokens": 423491,
  "utilization": "42.3%",
  "loading_plan": {
    "critical": [...],
    "high": ["app/actions/posts.ts", "components/posts/..."],
    "medium": [...],
    "low": [...]
  }
}
```

#### Step 3: Use in Your Workflow

Now you know:
- ✓ What files are relevant to posts
- ✓ How much context you're using
- ✓ What you can additionally load (specs, skills)

## Common Use Cases

### Use Case 1: "Can I Load Everything?"

```bash
python3 analyze_context.py . --report
```

If utilization < 70%: **Yes, load everything**

### Use Case 2: "What's Relevant to My Feature?"

```bash
python3 analyze_context.py . --feature "your-feature"
```

Check the `high` priority files in output.

### Use Case 3: "I'm Over the Limit, What Should I Exclude?"

```bash
python3 analyze_context.py . --report
```

Check the `suggestions` section for optimization ideas.

### Use Case 4: "Custom Prioritization"

Create `.context-priority.json`:
```json
{
  "always_include": ["src/lib/constants.ts"],
  "always_exclude": ["src/legacy/"],
  "domain_patterns": {
    "posts": ["posts", "content", "articles"]
  }
}
```

Then run as normal:
```bash
python3 analyze_context.py . --feature "posts"
```

## Understanding the Output

### Categories

- **constitution**: Project principles, standards
- **specs**: Specifications, PRDs, plans
- **skills**: Reusable skill definitions
- **codebase**: Source code files
- **docs**: Documentation files

### Priority Levels

- **critical**: Always loaded (constitution, active specs)
- **high**: Feature-relevant files
- **medium**: Supporting files
- **low**: Documentation, examples

### Warnings

- "Context exceeds limit": You need to exclude files
- "Files exceeding 100k tokens": Consider summarizing large files
- "Context usage at X%": Getting close to limit

### Suggestions

- "Exclude test files": Common optimization (~50k tokens)
- "Exclude fixtures": Common optimization (~15k tokens)
- "Summarize generated files": For large auto-generated code

## Tips for Optimal Results

### ✓ DO

- Run analysis before starting a feature
- Use feature-specific loading (--feature flag)
- Aim for 70-85% utilization for complex tasks
- Load entire codebase if < 500k tokens
- Use custom config for your project structure

### ✗ DON'T

- Load at 95%+ (no buffer for responses)
- Forget to exclude node_modules (auto-excluded)
- Load test fixtures unless debugging
- Include binary/image files (auto-excluded)

## Integration with SpecKit

### Before Specification

```bash
# Know what context you can load
python3 analyze_context.py . --feature "new-feature" --output spec-context.json
```

### Before Planning

```bash
# Load spec + context
python3 analyze_context.py . --spec specs/new-feature/prd.json --output plan-context.json
```

### Before Implementation

```bash
# Full context available
python3 analyze_context.py . --feature "new-feature" --output impl-context.json
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `--report` | Show detailed analysis |
| `--feature "name"` | Filter by feature domain |
| `--spec path/to/spec.json` | Extract feature from spec |
| `--output file.json` | Save loading plan |
| `--format text\|json` | Output format |

## Troubleshooting

### Problem: "command not found"

**Solution**: Use full path to script or add to PATH.

### Problem: "Context exceeds limit"

**Solution**:
1. Use `--feature` for targeted loading
2. Check `suggestions` in report
3. Add exclusions to `.context-priority.json`

### Problem: "Important files not in high priority"

**Solution**: Add to `.context-priority.json`:
```json
{
  "always_include": ["path/to/important/file.ts"]
}
```

### Problem: "Too many files in loading plan"

**Solution**: This is fine! The plan is prioritized, load what fits.

## Next Steps

1. ✓ Run analysis on your project
2. ✓ Generate feature-specific plan
3. ✓ Check loading strategies in `references/loading-strategies.md`
4. ✓ Customize with `.context-priority.json`
5. ✓ Integrate with your SpecKit workflow

## More Information

- **Full Documentation**: See `SKILL.md`
- **Strategies & Case Studies**: See `references/loading-strategies.md`
- **Examples**: See `examples/posts-crud-example.md`
- **Script Source**: See `scripts/analyze_context.py`
