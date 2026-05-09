# Context Maximizer Skill

Exploit Claude Opus 4.6's 1M token context window for full codebase awareness in SpecKit.

## Quick Start

```bash
# Analyze current project context
python scripts/analyze_context.py . --report

# Generate loading plan for a feature
python scripts/analyze_context.py . --feature "posts-crud" --output loading-plan.json

# Check context for a specific spec
python scripts/analyze_context.py . --spec specs/1-posts-crud/prd.json
```

## What It Does

The context-maximizer skill helps you intelligently load context within Claude's 1M token limit by:

1. **Scanning** your project and estimating token usage
2. **Prioritizing** files based on category (constitution > specs > skills > codebase)
3. **Generating** optimized loading plans that stay within limits
4. **Reporting** context usage and suggesting optimizations

## Key Features

### Smart Prioritization

Files are automatically categorized and prioritized:

- **Critical**: Constitution, active specs, current plans
- **High**: Relevant skills, domain-specific code
- **Medium**: General codebase files
- **Low**: Documentation, examples

### Domain-Aware Loading

When you specify a feature domain, the tool automatically prioritizes relevant files:

```bash
python scripts/analyze_context.py . --feature "posts-crud"
```

This prioritizes:
- Database schemas with "posts"
- Services handling posts
- API routes for posts
- UI components for posts

### Automatic Exclusions

Automatically excludes:
- `node_modules/`, `.git/`, `dist/`, `build/`
- Lock files, binary assets
- Generated files (configurable)
- Test fixtures (configurable)

### Token Estimation

Uses industry-standard approximation: **1 token ≈ 4 characters**

More accurate for:
- Source code: 1 token ≈ 3.5-4 chars
- Documentation: 1 token ≈ 4-5 chars
- JSON data: 1 token ≈ 3-4 chars

## Usage Examples

### Example 1: Full Project Analysis

```bash
python scripts/analyze_context.py /path/to/project --report --format text
```

Output:
```
=== Context Analysis Report ===

Total Files: 880
Total Tokens: 1,432,563 / 1,000,000
Utilization: 143.3%
Within Limit: False

--- By Category ---
  codebase     574,669 tokens (40.1%)
  skills       558,886 tokens (39.0%)
  docs         158,197 tokens (11.0%)
  specs         95,393 tokens ( 6.7%)

--- Warnings ---
  ⚠️  Context exceeds limit by 432,563 tokens

--- Suggestions ---
  💡 Consider excluding test files to save ~50,778 tokens
```

### Example 2: Feature-Specific Loading Plan

```bash
python scripts/analyze_context.py . --feature "user-auth" --output auth-context.json
```

Output (auth-context.json):
```json
{
  "total_tokens": 820000,
  "utilization": "82.0%",
  "loading_plan": {
    "critical": [
      "constitution.yml",
      "specs/2-user-auth/prd.json",
      "specs/2-user-auth/plan.json"
    ],
    "high": [
      "skills/database/",
      "skills/security/",
      "src/db/schema/users.ts",
      "src/lib/auth/",
      "middleware.ts"
    ],
    "medium": [
      "src/app/api/auth/",
      "src/components/auth/"
    ],
    "low": [
      "docs/authentication.md"
    ]
  },
  "excluded_files": 143
}
```

### Example 3: JSON Report for Processing

```bash
python scripts/analyze_context.py . --report --format json > context-report.json
```

## Integration with SpecKit

### During Specification

```bash
# 1. Generate context plan
python scripts/analyze_context.py . --feature "posts-crud" --output context.json

# 2. Use in specify skill
# The context plan helps you understand what to include
```

### During Planning

```bash
# Load context for technical planning
python scripts/analyze_context.py . --spec specs/1-posts-crud/prd.json --output plan-context.json
```

### During Implementation

```bash
# Focus on specific sub-story
python scripts/analyze_context.py . --feature "posts-crud" --output impl-context.json
```

## Custom Configuration

Create `.context-priority.json` in your project root:

```json
{
  "always_include": [
    "src/lib/constants.ts",
    "src/types/index.ts"
  ],
  "always_exclude": [
    "src/legacy/",
    "scripts/one-time/"
  ],
  "domain_patterns": {
    "posts": ["posts", "articles", "content", "editor"],
    "users": ["users", "profiles", "auth", "accounts"]
  }
}
```

## Understanding the Output

### Loading Plan Structure

```json
{
  "critical": [],    // Always loaded first, highest priority
  "high": [],        // Loaded second, feature-relevant
  "medium": [],      // Loaded third, supporting files
  "low": [],         // Loaded last if space allows
  "excluded": []     // Not loaded (exceeds limit)
}
```

### Token Budget

Default allocation:
- Constitution: ~1% (10k tokens)
- Specs: ~5% (50k tokens)
- Skills: ~10% (100k tokens)
- Codebase: ~70% (700k tokens)
- Docs: ~5% (50k tokens)
- Buffer: ~9% (90k tokens)

### Utilization Targets

- **< 50%**: Consider loading more context
- **50-70%**: Good for general tasks
- **70-85%**: Optimal for complex tasks
- **85-95%**: Maximum utilization, little buffer
- **> 95%**: Warning issued, may need to exclude files

## Troubleshooting

### Context Exceeds Limit

If you see "Context exceeds limit by X tokens":

1. Use feature-specific loading: `--feature "domain-name"`
2. Exclude test files (often saves 50k+ tokens)
3. Summarize large generated files
4. Use custom exclusion patterns

### Too Few Tokens Loaded

If utilization is < 50%:

1. Include more skills
2. Load test files for the feature
3. Include more documentation
4. Load example files

### Files Not Found

If expected files aren't in the plan:

1. Check exclusion patterns
2. Verify file extensions are recognized
3. Add custom patterns in `.context-priority.json`
4. Use `--report` to see categorization

## Best Practices

1. **Always start with a report**: Understand your project's token usage
2. **Use feature names**: Domain-specific loading is more efficient
3. **Check utilization**: Aim for 70-85% for best results
4. **Monitor warnings**: Adjust strategy based on suggestions
5. **Update exclusions**: Customize for your project structure

## Advanced Usage

### Multi-Pass Loading

For very large codebases:

```bash
# Pass 1: Generate overview
python scripts/analyze_context.py . --feature "posts" --output pass1.json

# Pass 2: Load additional modules based on pass 1 insights
python scripts/analyze_context.py . --feature "posts-api" --output pass2.json
```

### Integration with CI/CD

```bash
# In CI pipeline, check if specs fit in context
python scripts/analyze_context.py . --spec specs/new-feature/prd.json --report
if [ $? -ne 0 ]; then
  echo "Spec requires optimization"
  exit 1
fi
```

## See Also

- `SKILL.md` - Complete skill documentation
- `references/loading-strategies.md` - Detailed strategies and case studies
- SpecKit documentation for integration examples
