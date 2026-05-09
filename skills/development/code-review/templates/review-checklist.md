# Code Review Checklist

Use this checklist for systematic code reviews.

---

## Stage 1: Specification Compliance

### Acceptance Criteria
For each criterion in the spec:

```
- [ ] Criterion: [description]
      Status: ✅ Met / ❌ Not Met
      Notes: [if not met, why?]
      Evidence: [where to see it working]
```

### Files Affected
For each file specified:

```
- [ ] File: [path]
      Status: ✅ Created / ✅ Modified / ❌ Missing
      Notes: [any issues?]
```

### Functionality Check
```
- [ ] Does behavior match spec description?
- [ ] Are error cases from spec handled?
- [ ] Are edge cases from spec covered?
```

### Scope Check
```
- [ ] No scope creep (extra features not in spec)?
- [ ] All required functionality present?
- [ ] Implementation stayed focused?
```

### Stage 1 Result
```
Overall Status: ✅ PASS / ❌ FAIL

Critical Issues:
1. [Issue description]

Major Issues:
1. [Issue description]

Minor Issues:
1. [Issue description]
```

---

## Stage 2: Code Quality

### Code Standards
```
- [ ] Follows project coding conventions
- [ ] TypeScript types present (if TS project)
- [ ] Consistent naming (camelCase, PascalCase, etc.)
- [ ] Properly formatted (Prettier, ESLint, etc.)
- [ ] No commented-out code
- [ ] No console.log in production code
```

### Testing
```
- [ ] Tests present for new code
- [ ] Tests passing (npm test / pytest / etc.)
- [ ] Happy path tested
- [ ] Error cases tested
- [ ] Edge cases tested (null, empty, boundary)
- [ ] Test coverage adequate (>80% if configured)
```

### Error Handling
```
- [ ] Errors caught and handled gracefully
- [ ] User-friendly error messages
- [ ] Errors logged appropriately (not to console)
- [ ] Edge cases handled (null, undefined, empty)
- [ ] No swallowed exceptions
```

### Security
```
- [ ] No SQL injection vulnerabilities
- [ ] Passwords hashed, not plaintext
- [ ] Input validated and sanitized
- [ ] XSS prevention (escaped output)
- [ ] CSRF tokens used (if applicable)
- [ ] No secrets in code (use env vars)
- [ ] Authentication/authorization checks
```

### Performance
```
- [ ] No obvious performance bottlenecks
- [ ] Database queries optimized (no N+1)
- [ ] No memory leaks
- [ ] Algorithms efficient (consider Big O)
- [ ] Large lists paginated
- [ ] Heavy operations cached (if applicable)
```

### Documentation
```
- [ ] Complex logic documented
- [ ] Public APIs have JSDoc/docstring comments
- [ ] README updated (if API changed)
- [ ] Migration guide (if breaking change)
- [ ] Environment variables documented
```

### Code Organization
```
- [ ] Functions are small and focused
- [ ] No duplicate code (DRY principle)
- [ ] Clear separation of concerns
- [ ] Appropriate use of constants
- [ ] Magic numbers explained
```

### Dependencies
```
- [ ] New dependencies justified
- [ ] Dependencies up to date
- [ ] No security vulnerabilities (npm audit)
- [ ] License compatible with project
```

### Stage 2 Result
```
Overall Status: ✅ PASS / ❌ FAIL

Critical Issues:
1. [Issue description]

Major Issues:
1. [Issue description]

Minor Issues:
1. [Issue description]
```

---

## Final Approval

```
[ ] Stage 1: Spec Compliance - PASS
[ ] Stage 2: Code Quality - PASS

Overall Status: ✅ APPROVED / ❌ NEEDS FIXES

Next Actions:
- [ ] [Action item 1]
- [ ] [Action item 2]

Reviewer: [Name]
Date: [YYYY-MM-DD]
```

---

## Notes

Use this space for additional observations, suggestions, or context:

```
[Your notes here]
```

---

## Quick Reference: Issue Severity

### Critical 🔴 (Must Fix)
- Security vulnerabilities
- Data loss risks
- Spec requirements not met
- Application crashes
- Tests failing

### Major 🟡 (Should Fix)
- Missing tests
- Poor error handling
- Performance problems
- Code quality issues
- Missing documentation

### Minor 🟢 (Nice to Have)
- Style inconsistencies
- Documentation gaps
- Minor optimizations
- Refactoring opportunities
