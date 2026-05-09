# Example: Context Maximizer for Posts CRUD

This example demonstrates using the context-maximizer skill for the Posts CRUD feature in temp-saas-starter.

## Project Overview

- **Project**: temp-saas-starter
- **Feature**: Posts CRUD (specs/1-posts-crud/)
- **Total Project Tokens**: 423,491 (42.3% of 1M limit)

## Usage

### 1. Analyze Overall Context

```bash
cd ./temp-saas-starter
python3 ../skills/context-maximizer/scripts/analyze_context.py . --report --format text
```

**Result**:
```
Total Files: 76
Total Tokens: 423,491 / 1,000,000
Utilization: 42.3%
Within Limit: True

--- By Category ---
  codebase     418,402 tokens (98.8%)
  docs             946 tokens ( 0.2%)
  other          4,143 tokens ( 1.0%)
```

**Analysis**: The project is well within the 1M token limit, using only 42%. This means we can load the entire codebase plus additional context (specs, skills, documentation).

### 2. Generate Feature-Specific Loading Plan

```bash
python3 ../skills/context-maximizer/scripts/analyze_context.py . \
  --feature "posts-crud" \
  --output posts-context.json
```

**Result**: The tool automatically prioritizes files related to posts:

**High Priority** (11 files):
- `app/actions/posts.ts` - Server actions for posts
- `components/posts/post-form.tsx` - Post creation/edit form
- `app/(dashboard)/posts/page.tsx` - Posts list page
- `components/posts/posts-list.tsx` - Posts listing component
- `app/(dashboard)/posts/[id]/edit/page.tsx` - Edit page
- `lib/db/migrations/0001_create_posts.sql` - Database migration
- `components/posts/posts-filters.tsx` - Filter component
- `components/posts/delete-modal.tsx` - Delete confirmation
- `app/api/posts/[id]/route.ts` - API routes
- `app/(dashboard)/posts/new/page.tsx` - New post page
- `components/posts/status-badge.tsx` - Status display

**Medium Priority** (57 files):
- Database schema and queries
- UI components (shadcn/ui)
- Auth middleware
- Validation schemas
- Configuration files

**Low Priority** (8 files):
- Styles, README, config files

### 3. Context for Specification Phase

When creating the spec for Posts CRUD, we want to understand the existing architecture:

```bash
python3 ../skills/context-maximizer/scripts/analyze_context.py . \
  --feature "posts-crud" \
  --output spec-context.json
```

**Load**:
- Entire codebase (423k tokens)
- SpecKit specify skill (~30k tokens)
- Database patterns (~20k tokens)
- API patterns (~20k tokens)

**Total Context**: ~493k tokens (49.3%)

**Benefit**: Full awareness of existing patterns, database schema, auth system, and UI components while creating the spec.

### 4. Context for Implementation Phase

When implementing the feature, we might want to add more specific context:

```bash
# Load context + related specs + skills
# Manually add:
# - specs/1-posts-crud/prd.json (~15k tokens)
# - specs/1-posts-crud/plan.json (~12k tokens)
# - skills/database/ (~40k tokens)
# - skills/api/ (~40k tokens)
```

**Total Context**: ~600k tokens (60%)

**Benefit**: Full project context + specification + implementation skills while coding.

## Recommendations for Posts CRUD

### Phase 1: Specification
**Target**: 50-60% context utilization

**Load**:
```
✓ Entire temp-saas-starter codebase      423k tokens
✓ SpecKit specify skill                   30k tokens
✓ Database skill                          40k tokens
✓ Existing similar features examples      20k tokens
✓ Constitution (if exists)                10k tokens
─────────────────────────────────────────────────────
  Total:                                 ~523k tokens (52.3%)
```

### Phase 2: Technical Planning
**Target**: 60-70% context utilization

**Load**:
```
✓ Entire codebase                        423k tokens
✓ Posts CRUD spec (prd.json)              15k tokens
✓ SpecKit plan skill                      25k tokens
✓ Database skill                          40k tokens
✓ API patterns skill                      35k tokens
✓ Validation patterns                     20k tokens
✓ Constitution                            10k tokens
─────────────────────────────────────────────────────
  Total:                                 ~568k tokens (56.8%)
```

### Phase 3: Implementation
**Target**: 70-80% context utilization

**Load**:
```
✓ Entire codebase                        423k tokens
✓ Posts CRUD spec                         15k tokens
✓ Posts CRUD plan                         12k tokens
✓ Database skill                          40k tokens
✓ API skill                               35k tokens
✓ Frontend skill                          40k tokens
✓ Validation patterns                     20k tokens
✓ Test examples                           30k tokens
✓ Constitution                            10k tokens
─────────────────────────────────────────────────────
  Total:                                 ~625k tokens (62.5%)
```

## Key Insights

### 1. Small Codebase Advantage
With only 423k tokens for the entire codebase, we can:
- Load everything without selective filtering
- Add multiple skills (up to 5-6)
- Include comprehensive documentation
- Keep full specs and plans in context
- Still have 400k+ tokens buffer

### 2. No Context Limits for Posts CRUD
The Posts CRUD feature can have:
- Complete project awareness
- All related files loaded
- Multiple reference skills
- Full specification documents
- Room for interactive refinement

### 3. Optimal Strategy
For this project size, the best strategy is:
1. Always load the entire codebase
2. Add relevant skills based on phase
3. Include active specs and plans
4. Use remaining context for examples and docs

## Command Reference

### Quick Analysis
```bash
# Check current project context
python3 ../skills/context-maximizer/scripts/analyze_context.py . --report
```

### Feature-Specific Plan
```bash
# Generate loading plan for posts
python3 ../skills/context-maximizer/scripts/analyze_context.py . \
  --feature "posts-crud" \
  --output posts-context.json
```

### With Spec
```bash
# Generate plan based on spec file
python3 ../skills/context-maximizer/scripts/analyze_context.py . \
  --spec ../specs/1-posts-crud/prd.json \
  --output posts-from-spec.json
```

### JSON Report
```bash
# Get machine-readable report
python3 ../skills/context-maximizer/scripts/analyze_context.py . \
  --report \
  --format json > context-report.json
```

## Integration with SpecKit Workflow

### Step 1: Before Specification
```bash
# Understand what context is available
cd temp-saas-starter
python3 ../skills/context-maximizer/scripts/analyze_context.py . --report
```

### Step 2: Generate Spec Context Plan
```bash
# Create loading plan for spec phase
python3 ../skills/context-maximizer/scripts/analyze_context.py . \
  --feature "posts-crud" \
  --output spec-context.json
```

### Step 3: Use in Claude
```
Claude, I'm about to generate a specification for Posts CRUD.

Context available:
- Entire codebase (423k tokens)
- Space for 577k more tokens

Please load:
- All project files (high priority: posts-related)
- SpecKit specify skill
- Database skill
- Validation patterns

We have plenty of context headroom (58% available) so be comprehensive.
```

### Step 4: During Planning
```bash
# Add spec to context
# Now we have: codebase + spec + planning skills
```

### Step 5: During Implementation
```bash
# Full context: codebase + spec + plan + implementation skills
# Still only ~625k tokens (62.5% utilization)
```

## Conclusion

The temp-saas-starter project is an ideal size for exploiting the full 1M context window:
- Complete codebase awareness at all times
- Room for multiple skills and references
- No need for selective loading or exclusions
- Can maintain full context throughout entire feature lifecycle

This enables the highest quality spec generation, planning, and implementation with complete architectural understanding.
