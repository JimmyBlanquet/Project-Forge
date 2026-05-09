# Context Maximizer Skill - Summary

Created on: 2026-02-07

## Overview

The **context-maximizer** skill helps exploit Claude Opus 4.6's 1M token context window for maximum codebase awareness during specification, planning, and implementation phases in SpecKit.

## What It Does

1. **Analyzes** project structure and estimates token usage
2. **Categorizes** files by type (constitution, specs, skills, codebase, docs)
3. **Prioritizes** files based on relevance (critical, high, medium, low)
4. **Generates** optimized loading plans that stay within 1M token limit
5. **Reports** context usage with warnings and optimization suggestions
6. **Supports** domain-specific prioritization (e.g., "posts-crud", "auth", "api")

## Key Features

- Token estimation using industry-standard 1 token ≈ 4 characters
- Automatic exclusion of node_modules, .git, binaries, lock files
- Domain-aware file prioritization (database, api, auth, frontend, etc.)
- Custom configuration support via `.context-priority.json`
- JSON and text output formats
- Integration-ready for SpecKit workflows

## File Structure

```
skills/context-maximizer/
├── SKILL.md                              # Complete skill documentation
├── README.md                             # User guide and examples
├── QUICK_START.md                        # 5-minute getting started guide
├── SUMMARY.md                            # This file
├── scripts/
│   └── analyze_context.py               # Main analysis tool
├── references/
│   └── loading-strategies.md            # Detailed strategies and case studies
└── examples/
    └── posts-crud-example.md            # Real-world example with temp-saas-starter
```

## Usage

### Basic Analysis
```bash
python3 scripts/analyze_context.py /path/to/project --report
```

### Feature-Specific Loading Plan
```bash
python3 scripts/analyze_context.py /path/to/project --feature "posts-crud" --output plan.json
```

### From Spec File
```bash
python3 scripts/analyze_context.py /path/to/project --spec specs/feature/prd.json
```

## Example Output

### Report Format
```
Total Files: 76
Total Tokens: 423,491 / 1,000,000
Utilization: 42.3%
Within Limit: True

--- By Category ---
  codebase     418,402 tokens (98.8%)
  docs             946 tokens ( 0.2%)
  other          4,143 tokens ( 1.0%)

--- By Priority ---
  medium      418,402 tokens (98.8%)
  low           5,089 tokens ( 1.2%)
```

### Loading Plan Format
```json
{
  "total_tokens": 423491,
  "utilization": "42.3%",
  "loading_plan": {
    "critical": [],
    "high": ["app/actions/posts.ts", "components/posts/..."],
    "medium": [...],
    "low": [...]
  },
  "excluded_files": 0
}
```

## Integration with SpecKit

### Specification Phase
- Load: Entire codebase + specify skill + domain skills
- Target: 50-60% utilization

### Planning Phase
- Load: Codebase + spec + plan skill + implementation skills
- Target: 60-70% utilization

### Implementation Phase
- Load: Codebase + spec + plan + multiple implementation skills
- Target: 70-85% utilization

## Real-World Performance

Tested on **temp-saas-starter** (Next.js SaaS template):
- **76 files**, **423,491 tokens** (42.3% of limit)
- **Result**: Can load entire codebase + 5-6 skills + all specs
- **Benefit**: Complete architectural awareness at all times

Tested on **Project-Forge** (larger codebase):
- **880 files**, **1,432,563 tokens** (143.3% of limit)
- **Result**: Requires selective loading with domain filtering
- **Benefit**: Feature-specific loading reduces to ~950k tokens (95%)

## Domain Patterns

The tool recognizes these domain patterns automatically:

| Domain | Keywords |
|--------|----------|
| database | schema, migrations, .sql, db, drizzle, prisma |
| api | api/, routes/, actions/, services/ |
| auth | auth/, middleware/auth, authentication |
| frontend | components/, app/, pages/, ui/ |
| posts | posts, content, articles, blog |
| users | users, profiles, accounts |
| payments | payments, billing, stripe |

## Optimization Strategies

1. **Test Exclusion**: Saves ~50k tokens
2. **Fixture Exclusion**: Saves ~15k tokens
3. **Generated File Summary**: Saves ~30k tokens
4. **Domain Filtering**: Can reduce by 50-70%
5. **Custom Exclusions**: Project-specific savings

## Custom Configuration

Create `.context-priority.json` in project root:

```json
{
  "always_include": ["src/lib/constants.ts"],
  "always_exclude": ["src/legacy/"],
  "domain_patterns": {
    "posts": ["posts", "content", "articles"],
    "custom-domain": ["custom", "patterns"]
  }
}
```

## Token Budget Recommendations

| Project Size | Strategy |
|--------------|----------|
| < 100k tokens | Load everything |
| 100k-300k tokens | Load all source + selective docs |
| 300k-700k tokens | Domain-specific + core files |
| 700k+ tokens | Aggressive filtering + summaries |

## Testing

The skill has been tested with:
- ✓ Small projects (< 100k tokens)
- ✓ Medium projects (400k tokens) - temp-saas-starter
- ✓ Large projects (1.4M tokens) - Project-Forge
- ✓ Feature-specific filtering
- ✓ Spec-based analysis
- ✓ Custom configuration
- ✓ JSON and text output formats

## Documentation

- **SKILL.md**: Complete skill specification and API
- **README.md**: User guide with detailed examples
- **QUICK_START.md**: 5-minute getting started guide
- **references/loading-strategies.md**: Deep dive into strategies and case studies
- **examples/posts-crud-example.md**: Real-world example walkthrough

## Distribution

The skill is packaged as:
- **Directory**: `skills/context-maximizer/` (development)
- **Archive**: `skills/context-maximizer.skill` (distribution)

Extract and use:
```bash
unzip context-maximizer.skill
python3 context-maximizer/scripts/analyze_context.py /path/to/project --report
```

## Requirements

- Python 3.6+
- Standard library only (no external dependencies)
- Works on Linux, macOS, Windows

## Future Enhancements

Potential improvements:
1. Smart caching of file summaries
2. Dependency graph analysis
3. Usage analytics (track which files were useful)
4. Dynamic mid-conversation context swapping
5. Integration with Claude Desktop / Claude Code
6. Multi-pass incremental loading strategy

## Success Metrics

The skill is successful if:
- ✓ Accurately estimates token usage within ±15%
- ✓ Stays within 1M token limit
- ✓ Prioritizes relevant files effectively
- ✓ Provides actionable optimization suggestions
- ✓ Integrates seamlessly with SpecKit workflow

## Conclusion

The context-maximizer skill enables:
- **Maximum context utilization** for small/medium projects
- **Intelligent filtering** for large projects
- **Domain-aware prioritization** for focused work
- **SpecKit integration** for complete workflow support

Result: Higher quality specifications, plans, and implementations through comprehensive codebase awareness.

---

**Author**: AI Assistant (Claude Opus 4.5)
**Date**: 2026-02-07
**Version**: 1.0.0
**Location**: `skills/context-maximizer/`
