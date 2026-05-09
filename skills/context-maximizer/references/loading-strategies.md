# Context Loading Strategies

Comprehensive guide to exploiting Claude Opus 4.6's 1M token context window for maximum codebase awareness.

## Overview

With 1M tokens available, we can load:
- Entire small-to-medium codebases (< 250k LOC)
- All relevant context for large codebases (selective loading)
- Complete project documentation and specifications
- Multiple related skills and their references

## Token Budget Breakdown

### Typical Project Allocation

| Category | Tokens | Percentage | What It Includes |
|----------|--------|------------|------------------|
| Constitution | 10,000 | 1% | Project constitution, principles, standards |
| Specs | 50,000 | 5% | Active specs, PRDs, technical plans |
| Skills | 100,000 | 10% | 3-5 relevant skills with docs and examples |
| Codebase | 700,000 | 70% | Source files, schemas, configurations |
| Documentation | 50,000 | 5% | READMEs, API docs, architecture docs |
| Buffer | 90,000 | 9% | Safety margin, response generation |

### Micro-Project (<100k tokens)

For projects with minimal codebase:
- Load everything (100% context)
- Include test files
- Include all documentation
- Include historical specs
- No exclusions needed

### Small Project (100k-300k tokens)

- Load all source code
- Exclude test fixtures
- Summarize large generated files
- Include core documentation
- 90%+ utilization achievable

### Medium Project (300k-700k tokens)

- Load domain-relevant files (feature-specific)
- Exclude non-critical tests
- Skip legacy code unless relevant
- Summarize or exclude large vendor files
- 80-85% utilization target

### Large Project (700k+ tokens)

- Aggressive feature-based filtering
- Load only directly relevant modules
- Exclude all tests (load on demand)
- Load file summaries instead of full content for peripherals
- 70-80% utilization, maximize relevance

## Loading Patterns by Task

### 1. Spec Generation

**Goal**: Understand business requirements and existing architecture

**Load**:
- Constitution (principles, standards)
- Related existing specs
- Database schema (full)
- API routes (summaries)
- Service layer (summaries)
- UI components (summaries)
- Documentation

**Exclude**:
- Tests
- Build configs
- Dependencies
- Static assets
- Utilities (unless domain-relevant)

**Estimated**: 400k-600k tokens

### 2. Technical Planning

**Goal**: Create detailed implementation plan

**Load**:
- Constitution
- Active spec (PRD)
- Complete database schema
- Full service layer
- API implementations
- Type definitions
- Validation schemas
- Related skills (database, api, validation)

**Exclude**:
- UI components (unless frontend-heavy feature)
- Tests
- Documentation (already in spec)

**Estimated**: 500k-700k tokens

### 3. Implementation (Backend)

**Goal**: Implement backend feature

**Load**:
- Constitution
- Spec + Plan
- Database skill
- Complete database layer
- Service layer patterns
- API patterns
- Authentication/authorization
- Type definitions
- Validation

**Exclude**:
- Frontend code
- UI components
- Tests (load relevant ones only)
- Documentation

**Estimated**: 600k-800k tokens

### 4. Implementation (Frontend)

**Goal**: Implement UI feature

**Load**:
- Constitution
- Spec + Plan
- Frontend skill
- Component library
- UI patterns
- Form handling
- State management
- API client
- Type definitions

**Exclude**:
- Backend implementations (keep API signatures)
- Database layer
- Tests
- Server-side code

**Estimated**: 500k-700k tokens

### 5. Full-Stack Feature

**Goal**: Implement complete feature

**Load**:
- Constitution
- Spec + Plan
- Relevant skills (2-3)
- Database schema
- Service layer
- API layer
- UI components
- Type definitions
- Validation
- Key utilities

**Exclude**:
- Tests (load selectively)
- Unrelated features
- Documentation
- Build configs

**Estimated**: 750k-900k tokens

### 6. Refactoring

**Goal**: Restructure existing code

**Load**:
- Constitution (standards)
- Target modules (full)
- Dependent modules (summaries)
- Tests for target modules
- Type definitions
- Related patterns from elsewhere

**Exclude**:
- Unrelated features
- Documentation
- Specs

**Estimated**: 400k-600k tokens

### 7. Bug Investigation

**Goal**: Understand and fix issue

**Load**:
- Relevant modules (full)
- Related tests
- Database schema
- API contracts
- Error logs (if available)
- Related documentation

**Exclude**:
- Unrelated features
- Other tests
- Build configs

**Estimated**: 300k-500k tokens

## Domain-Specific Strategies

### Database-Heavy Features

**Priority**:
1. Database schema (complete)
2. Migration files
3. Database utilities
4. Type definitions
5. Validation schemas
6. Service layer
7. API layer

**Key Files**:
- `schema/**/*.ts` (Drizzle/Prisma)
- `migrations/**/*.sql`
- `lib/db/**`
- `types/database.ts`
- `lib/validation/**`

### API Development

**Priority**:
1. API routes
2. Server actions
3. Service layer
4. Type definitions
5. Validation
6. Middleware
7. Error handling

**Key Files**:
- `app/api/**/*.ts`
- `app/actions/**/*.ts`
- `lib/services/**/*.ts`
- `types/api.ts`
- `lib/validation/**`
- `middleware/**`

### Frontend Components

**Priority**:
1. Component library (shadcn/ui)
2. Existing similar components
3. Form patterns
4. State management
5. Hooks
6. Utilities
7. Type definitions

**Key Files**:
- `components/ui/**/*.tsx`
- `components/**/*.tsx`
- `lib/hooks/**`
- `lib/utils.ts`
- `types/components.ts`

### Authentication/Authorization

**Priority**:
1. Auth configuration
2. Middleware
3. Session management
4. User models
5. RLS policies
6. Auth utilities
7. Protected routes

**Key Files**:
- `lib/auth/**`
- `middleware.ts`
- `app/api/auth/**`
- `schema/users.ts`
- `database/rls/**`

## Optimization Techniques

### 1. File Summarization

For large files not central to the task, load summaries:

**Full File** (10k tokens):
```typescript
// Complete implementation with all details
```

**Summary** (500 tokens):
```typescript
// schema/posts.ts
// Exports: postsTable, PostInsert, PostSelect
// Key fields: id, title, content, userId, status, createdAt
// Relations: user (many-to-one), comments (one-to-many)
// Indexes: userId, status, createdAt
```

**Savings**: 9.5k tokens per file

### 2. Pattern Libraries

Load representative examples instead of all variations:

**Instead of**: Loading all 50 UI components
**Load**: 3-4 representative components + component library docs

**Savings**: ~200k tokens

### 3. Type Signature Only

For utilities and helpers, load signatures without implementations:

**Full** (2k tokens):
```typescript
export function formatDate(date: Date, format: string): string {
  // 40 lines of implementation
}
```

**Signature** (100 tokens):
```typescript
export function formatDate(date: Date, format: string): string;
```

**Savings**: 1.9k tokens per function

### 4. Test Exclusion Strategy

**Never Load**:
- Test fixtures
- Mock data
- Test utilities (unless debugging tests)

**Load Selectively**:
- Integration tests for the feature
- Key unit tests showing usage patterns

**Load Always**:
- Test utilities if creating new tests

### 5. Incremental Loading

For massive codebases, use multi-pass strategy:

**Pass 1**: Load summaries and build dependency graph (200k tokens)
**Pass 2**: Load identified relevant modules in full (500k tokens)
**Pass 3**: Load related tests and docs (200k tokens)

## Case Studies

### Case Study 1: CRUD Feature (Posts)

**Project Size**: 450k tokens total
**Feature**: Posts CRUD with RLS

**Loading Plan**:
```
Constitution:           8,500 tokens
Spec (prd.json):       15,000 tokens
Plan (plan.json):      12,000 tokens
Skills (3):            85,000 tokens
  - speckit/specify
  - speckit/plan
  - database
Database Schema:       45,000 tokens
Services:              60,000 tokens
API Layer:             80,000 tokens
Types:                 25,000 tokens
Validation:            20,000 tokens
Related Components:    40,000 tokens
Documentation:         15,000 tokens
---
Total:                405,500 tokens (40.5%)
Buffer Available:     594,500 tokens
```

**Result**: Plenty of headroom, could load more examples or tests if needed.

### Case Study 2: Authentication System

**Project Size**: 800k tokens total
**Feature**: Complete auth system (signup, login, session, middleware)

**Loading Plan**:
```
Constitution:           8,500 tokens
Spec:                  25,000 tokens
Plan:                  18,000 tokens
Skills (4):           110,000 tokens
  - speckit/specify
  - speckit/plan
  - database
  - security
Database (users):      35,000 tokens
Auth Library:          95,000 tokens
Middleware:            40,000 tokens
Session Management:    55,000 tokens
API Routes:            70,000 tokens
Types:                 30,000 tokens
RLS Policies:          45,000 tokens
Examples:              60,000 tokens
Documentation:         20,000 tokens
---
Total:                611,500 tokens (61.1%)
Buffer Available:     388,500 tokens
```

**Result**: Good utilization, space for additional context during implementation.

### Case Study 3: Large Refactoring

**Project Size**: 1.2M tokens total (large codebase)
**Feature**: Refactor service layer to new pattern

**Loading Plan** (Aggressive Filtering):
```
Constitution:          10,000 tokens
Refactoring Guide:     15,000 tokens
Target Services:      250,000 tokens (full detail)
New Pattern Examples:  80,000 tokens
Type Definitions:      40,000 tokens
Tests (signatures):    50,000 tokens
Related Utilities:     45,000 tokens
API Contracts:         60,000 tokens (signatures)
Database (summary):    30,000 tokens
---
Total:                580,000 tokens (58%)
Buffer Available:     420,000 tokens
```

**Result**: Focused loading, can load additional modules incrementally as needed.

## Best Practices

### 1. Always Load

- Project constitution
- Active specification
- Technical plan
- Core type definitions
- Database schema (at least summaries)

### 2. Load Conditionally

- Skills (only relevant ones, 2-4 max)
- Tests (only if debugging or writing tests)
- Documentation (only if needed for API references)
- Examples (only if learning new patterns)

### 3. Never Load (Auto-Exclude)

- `node_modules/`
- `.git/`
- Lock files
- Binary assets
- Build artifacts
- Vendor directories

### 4. Summarize When Possible

- Large generated files (Prisma client, type definitions)
- Utility libraries (load signatures only)
- UI component library (load examples, not all)
- Test suites (load key tests only)

### 5. Monitor and Adjust

- Check utilization regularly
- If >90%, start excluding low-priority files
- If <50%, consider loading more context
- Track what context was actually useful

## Tools Integration

### With SpecKit

```bash
# Generate loading plan for specification
python scripts/analyze_context.py . --feature "posts-crud" > context-plan.json

# Use in specify skill
claude-code /specify --context context-plan.json
```

### With Ralph++

```python
# In orchestrator
from context_maximizer import generate_plan

plan = generate_plan(
    project_path=".",
    feature="posts-crud",
    task="US-001-1"
)

agent.load_context(plan["high"] + plan["medium"])
```

### With Task Runner

```bash
# Generate context per task
python scripts/analyze_context.py . \
  --feature "posts-crud" \
  --task "database-schema" \
  --output task-context.json
```

## Future Enhancements

### 1. Smart Caching

Cache file summaries to avoid re-reading unchanged files.

### 2. Dependency Analysis

Build dependency graph to automatically include related files.

### 3. Usage Analytics

Track which files were actually referenced during generation.

### 4. Dynamic Adjustment

Automatically swap low-priority loaded files for high-priority ones mid-conversation.

### 5. Multi-Pass Strategy

Implement automatic incremental loading based on context usage.

## Conclusion

With 1M tokens, we have unprecedented context capacity. The key is:

1. **Always prioritize**: Constitution → Specs → Skills → Codebase → Docs
2. **Be selective**: Load what you need, not everything
3. **Summarize aggressively**: Full context for core, summaries for periphery
4. **Monitor utilization**: Aim for 70-85% for optimal performance
5. **Adjust dynamically**: Change loading strategy based on task type

The context maximizer automates these strategies, making it easy to exploit the full 1M token window effectively.
