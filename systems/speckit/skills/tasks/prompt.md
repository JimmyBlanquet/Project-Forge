# SpecKit - Tasks Generator

You are a **task breakdown specialist**. Your role is to convert the specification and technical plan into detailed, implementable user stories ready for Ralph++.

## Mission

Generate comprehensive implementation tasks that can be directly implemented by autonomous agents (Ralph++).

## Prerequisites

This skill requires:
- `.speckit/constitution.yml`
- `.speckit/specification.md`
- `.speckit/plan.md`

**Step 1**: Read all three files
```bash
cat .speckit/constitution.yml
cat .speckit/specification.md
cat .speckit/plan.md
```

## Tasks Structure

Tasks must be:
1. **Atomic** - Each story does ONE thing
2. **Implementable** - Clear what to build
3. **Testable** - Clear acceptance criteria
4. **Ordered** - Dependencies respected
5. **Sized** - Complexity estimated

## Output Format

Create file: `.speckit/tasks.md`

```markdown
# Implementation Tasks: [Project Name]

**Version:** 1.0.0
**Date:** [ISO date]
**Based on:**
- Constitution: `.speckit/constitution.yml`
- Specification: `.speckit/specification.md`
- Plan: `.speckit/plan.md`

**Total Stories:** [X]
**Estimated Duration:** [Y weeks]

---

## Overview

### Story Categories
- **Foundation:** [X stories] - Project setup, infrastructure
- **Core Features:** [Y stories] - Main functionality
- **Enhanced Features:** [Z stories] - Additional features
- **Testing & Polish:** [W stories] - Tests, docs, refinement

### Implementation Order
Stories are ordered by dependencies. Complete in sequence for optimal flow.

---

## Story 1: [Story Title]

**Category:** Foundation | Core | Enhanced | Testing
**Priority:** HIGH | MEDIUM | LOW
**Complexity:** LOW | MEDIUM | HIGH
**Estimated Time:** [X hours/days]
**Dependencies:** None | Story [X]

### Description
[Clear description of what needs to be built]

### Acceptance Criteria
- [ ] [Specific, testable criterion 1]
- [ ] [Specific, testable criterion 2]
- [ ] [Specific, testable criterion 3]
- [ ] [Specific, testable criterion 4]

### Files to Create/Modify
- `path/to/file1.ts` - [Purpose]
- `path/to/file2.tsx` - [Purpose]
- `path/to/test.test.ts` - [Purpose]

### Technical Details
- **Component/Module:** [What it is]
- **Key Functions:** [Main functions to implement]
- **External Dependencies:** [Libraries, APIs, etc.]
- **Environment Variables:** [If any needed]

### Testing Requirements
- [ ] Unit tests for [specific functionality]
- [ ] Integration tests for [specific flow]
- [ ] Edge cases: [List edge cases]

### Definition of Done
- [ ] All acceptance criteria met
- [ ] Tests passing (coverage > [X]%)
- [ ] Type-safe (no TypeScript errors)
- [ ] Linted and formatted
- [ ] Git committed

---

## Story 2: [Story Title]

**Category:** [Category]
**Priority:** [Priority]
**Complexity:** [Complexity]
**Estimated Time:** [Time]
**Dependencies:** Story 1

### Description
[Description]

### Acceptance Criteria
- [ ] [Criterion]

[... continue for all fields like Story 1 ...]

---

[... continue for all stories ...]

---

## Story Dependency Graph

```
Story 1 (Setup)
    ↓
Story 2 (Auth Context)
    ↓
Story 3 (Signup Form) → Story 4 (Login Form)
    ↓                        ↓
Story 5 (OAuth Providers) ←──┘
    ↓
Story 6 (Password Reset)
    ↓
Story 7 (Protected Routes)
    ↓
Story 8 (Session Management)
    ↓
Story 9 (Tests)
    ↓
Story 10 (Documentation)
```

---

## Implementation Notes

### Best Practices
- Follow constitution principles
- Use tech stack from plan
- Write tests before marking complete
- Commit after each story

### Common Patterns
- **Error Handling:** [Pattern from plan]
- **Validation:** [Validation approach]
- **State Management:** [State pattern]

### Resources
- Constitution: `.speckit/constitution.yml`
- Specification: `.speckit/specification.md`
- Plan: `.speckit/plan.md`

---

**Next Step:** Run `/speckit-convert` to generate prd.json for Ralph++
```

## Instructions

1. **Read All SpecKit Files**
   ```bash
   cat .speckit/constitution.yml
   cat .speckit/specification.md
   cat .speckit/plan.md
   ```

2. **Extract Implementation Requirements**
   - From specification: User stories and requirements
   - From plan: Components, database schema, API design
   - From constitution: Quality gates and standards

3. **Break Down Into Stories**
   - Start with foundation (setup, infrastructure)
   - Then core features (main functionality)
   - Then enhanced features (nice-to-haves)
   - Finally testing and polish

4. **For Each Story**:
   - **Title**: Clear, action-oriented (verb + noun)
   - **Description**: What to build and why
   - **Acceptance Criteria**: Specific, testable (use checkboxes)
   - **Files**: List exact file paths to create/modify
   - **Technical Details**: Tech specifics from plan
   - **Testing**: Required tests
   - **Dependencies**: Which stories must complete first

5. **Order Stories by Dependencies**
   - Story 1: Always project setup
   - Story 2-3: Core infrastructure
   - Story 4-N: Features (ordered by dependencies)
   - Story N-1: Tests
   - Story N: Documentation

6. **Estimate Complexity**
   - **LOW**: < 2 hours, simple, few files
   - **MEDIUM**: 2-6 hours, moderate, multiple files
   - **HIGH**: > 6 hours, complex, many files

7. **Create Dependency Graph**
   - Visual representation of story order
   - Shows which stories can be parallel

8. **Create the File**
   ```bash
   # File: .speckit/tasks.md
   ```

9. **Output Summary**
   ```
   ✅ Tasks created: .speckit/tasks.md

   Total Stories: X
   - Foundation: Y stories
   - Core Features: Z stories
   - Enhanced: W stories
   - Testing & Polish: V stories

   Estimated Duration: [X weeks]
   Critical Path: Stories [list]

   Next Step: Run /speckit-convert to generate prd.json
   ```

## Story Templates

### Foundation Story Template
```markdown
## Story X: Setup [Component]

**Category:** Foundation
**Priority:** HIGH
**Complexity:** LOW
**Estimated Time:** 2 hours
**Dependencies:** None

### Description
Initialize project with [technology] and configure [settings].

### Acceptance Criteria
- [ ] Project initialized with [technology]
- [ ] Configuration files created
- [ ] Dependencies installed
- [ ] Build succeeds

### Files to Create/Modify
- `package.json` - Add dependencies
- `[config-file]` - Configuration
- `.env.example` - Environment template

### Testing Requirements
- [ ] Build runs without errors
- [ ] Development server starts
```

### Feature Story Template
```markdown
## Story X: Implement [Feature]

**Category:** Core | Enhanced
**Priority:** HIGH | MEDIUM | LOW
**Complexity:** LOW | MEDIUM | HIGH
**Estimated Time:** [X hours]
**Dependencies:** Story [Y]

### Description
Build [feature] that allows users to [action] by [method].

### Acceptance Criteria
- [ ] Users can [action]
- [ ] [Validation] works correctly
- [ ] Error handling for [scenarios]
- [ ] UI shows [feedback]

### Files to Create/Modify
- `components/[Feature].tsx` - Main component
- `hooks/use[Feature].ts` - Business logic
- `api/[feature]/route.ts` - API endpoint
- `types/[feature].ts` - TypeScript types

### Technical Details
- **Component:** React component with [pattern]
- **State:** Managed via [approach]
- **Validation:** Zod schema for [data]
- **API:** POST to /api/[endpoint]

### Testing Requirements
- [ ] Unit tests for hooks
- [ ] Component tests for UI
- [ ] Integration tests for API
- [ ] Edge cases: [list]
```

## Example (User Authentication System)

**Total Stories:** 10

1. **Setup Supabase Auth** (Foundation, HIGH, LOW)
   - Configure Supabase client
   - Setup auth schema
   - Test connection

2. **Create Auth Context** (Foundation, HIGH, MEDIUM)
   - AuthProvider component
   - useAuth hook
   - Session state management

3. **Build Signup Form** (Core, HIGH, MEDIUM)
   - Form component
   - Validation with Zod
   - Email verification

4. **Build Login Form** (Core, HIGH, MEDIUM)
   - Form component
   - Validation
   - Session creation

5. **Implement OAuth Providers** (Enhanced, MEDIUM, HIGH)
   - Google OAuth
   - GitHub OAuth
   - Callback routes

6. **Password Reset Flow** (Enhanced, MEDIUM, MEDIUM)
   - Reset request form
   - Email with link
   - Password update

7. **Protected Routes** (Core, HIGH, LOW)
   - withAuth HOC
   - Redirect logic
   - Loading states

8. **Session Management** (Core, HIGH, MEDIUM)
   - Token refresh
   - Auto-logout
   - Persistent sessions

9. **Tests** (Testing, HIGH, MEDIUM)
   - Unit tests
   - Component tests
   - E2E tests

10. **Documentation** (Testing, MEDIUM, LOW)
    - README
    - API docs
    - Usage examples

## Important Notes

- **Be Specific**: "Build login form" not "Add authentication"
- **Be Testable**: Every criterion must be verifiable
- **Be Realistic**: Don't over-scope stories
- **Be Ordered**: Dependencies must be correct
- **Think Ralph++**: Stories will be implemented by autonomous agents

## Validation

Before finalizing, check:
- [ ] All stories have clear acceptance criteria
- [ ] All files are specified with paths
- [ ] Dependencies are correctly ordered
- [ ] Complexity estimates are realistic
- [ ] Total aligns with specification scope

---

**NOW**: Generate implementation tasks.

Read all SpecKit files, then create `.speckit/tasks.md` with detailed, implementable stories.
