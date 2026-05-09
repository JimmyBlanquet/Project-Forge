# Code Review - 2-Stage Process

**Version:** 1.0.0
**Source:** Inspired by obra/superpowers
**Tier:** 2 (Development Practices)

---

## 🎯 Objective

Systematic code review process with **two distinct stages**:
1. **Spec Compliance** - Does code match requirements?
2. **Code Quality** - Is implementation high quality?

Includes **review loops** to ensure all issues are fixed before approval.

---

## 📋 When to Use

### Always Use Code Review For:
- ✅ Completed features/stories
- ✅ Before merging to main branch
- ✅ After significant changes
- ✅ Pull request reviews
- ✅ Ralph++ quality gates mode

### Optional For:
- ⚠️ Work-in-progress (WIP) branches
- ⚠️ Experimental code
- ⚠️ Throwaway prototypes

---

## 🔄 The 2-Stage Process

### Process Flow

```
Implementation Complete
    ↓
Stage 1: Spec Compliance Review
    ↓
    ├─ PASS → Continue to Stage 2
    └─ FAIL → Fix Issues → Re-review Stage 1
              ↓
              Loop until PASS
    ↓
Stage 2: Code Quality Review
    ↓
    ├─ PASS → Approved ✅
    └─ FAIL → Fix Issues → Re-review Stage 2
              ↓
              Loop until PASS
    ↓
Complete ✅
```

**Critical:** Never start Stage 2 until Stage 1 passes.

---

## 📝 Stage 1: Specification Compliance

### Goal
Verify that implementation matches the specification exactly.

### What to Check

#### 1. Acceptance Criteria
```markdown
Story: User Authentication

Acceptance Criteria:
- [ ] User can login with email and password
- [ ] Invalid credentials show error message
- [ ] Successful login redirects to dashboard
- [ ] Session persists across page refresh
```

**Questions:**
- Are ALL criteria met?
- Does implementation do exactly what spec says?
- No more, no less?

#### 2. Files Affected
```markdown
Files to Create/Modify:
- lib/auth.ts
- components/LoginForm.tsx
- pages/api/auth/login.ts
```

**Questions:**
- Are all specified files created/modified?
- Are file names and locations correct?
- Any missing files?

#### 3. Functionality Match
**Questions:**
- Does behavior match spec description?
- Are error cases from spec handled?
- Are edge cases from spec covered?

#### 4. Scope Compliance
**Questions:**
- Is there scope creep? (extra features not in spec)
- Is functionality missing from spec?
- Did implementation stay focused?

### Review Checklist - Stage 1

```markdown
## Stage 1: Spec Compliance Review

### Acceptance Criteria
- [ ] Criterion 1: [description]
      Status: ✅/❌
      Notes: [if ❌, why?]

- [ ] Criterion 2: [description]
      Status: ✅/❌
      Notes: [if ❌, why?]

### Files Affected
- [ ] File 1: [path]
      Status: ✅ Created / ✅ Modified / ❌ Missing

### Scope Check
- [ ] No scope creep (extra features)?
- [ ] All required functionality present?
- [ ] Implementation focused?

### Overall Stage 1 Status: PASS / FAIL
```

### Output Format

```markdown
# Stage 1 Review Report: Spec Compliance

## Story
**ID:** US-001
**Title:** User Authentication

## Status: FAIL

## Acceptance Criteria
✅ User can login with email and password
❌ Invalid credentials show error message
   Issue: Error message not displayed in UI
❌ Session persists across page refresh
   Issue: Session not saved to localStorage

## Files Affected
✅ lib/auth.ts - Created
✅ components/LoginForm.tsx - Created
❌ pages/api/auth/login.ts - Missing

## Scope Issues
✅ No scope creep detected
❌ Password reset functionality added (not in spec)

## Critical Issues (Must Fix)
1. Missing error message display
2. Missing session persistence
3. Missing API route file
4. Scope creep: Remove password reset

## Next Action
Fix 4 issues → Re-review Stage 1
```

---

## 🔍 Stage 2: Code Quality

### Goal
Verify implementation quality and best practices.

**Only start after Stage 1 PASS.**

### What to Check

#### 1. Code Standards
```typescript
// ❌ BAD: No types, inconsistent style
function auth(e, p) {
  return db.query("SELECT * FROM users WHERE email='" + e + "'")
}

// ✅ GOOD: Typed, clear, secure
async function authenticateUser(
  email: string,
  password: string
): Promise<AuthResult> {
  const user = await db.users.findByEmail(email);
  // ...
}
```

**Questions:**
- Follows project coding standards?
- TypeScript types present (if TS project)?
- Consistent naming conventions?
- Proper code formatting?

#### 2. Tests
```typescript
// ✅ Tests present
describe('authenticateUser', () => {
  test('returns true for valid credentials', async () => {
    const result = await authenticateUser('user@test.com', 'pass');
    expect(result.authenticated).toBe(true);
  });

  test('returns false for invalid credentials', async () => {
    const result = await authenticateUser('user@test.com', 'wrong');
    expect(result.authenticated).toBe(false);
  });

  test('handles database errors', async () => {
    mockDb.findByEmail.mockRejectedValue(new Error('DB error'));
    await expect(authenticateUser('user@test.com', 'pass'))
      .rejects.toThrow('Authentication failed');
  });
});
```

**Questions:**
- Are tests present?
- Do tests cover happy path?
- Do tests cover error cases?
- Are tests passing?

#### 3. Error Handling
```typescript
// ❌ BAD: No error handling
async function authenticateUser(email: string, password: string) {
  const user = await db.users.findByEmail(email); // Can throw
  return { authenticated: user.password === password };
}

// ✅ GOOD: Proper error handling
async function authenticateUser(email: string, password: string) {
  try {
    const user = await db.users.findByEmail(email);
    if (!user) {
      return { authenticated: false, error: 'User not found' };
    }
    return { authenticated: user.password === password };
  } catch (error) {
    logger.error('Authentication failed', { error, email });
    throw new AuthenticationError('Authentication failed');
  }
}
```

**Questions:**
- Are errors caught and handled?
- Are error messages user-friendly?
- Are errors logged appropriately?
- Are edge cases handled?

#### 4. Security
```typescript
// ❌ BAD: SQL injection, plaintext password
function auth(email: string, password: string) {
  return db.query(`SELECT * FROM users WHERE email='${email}'`);
  // Stores password in plain text
}

// ✅ GOOD: Parameterized query, hashed password
async function authenticateUser(email: string, password: string) {
  const user = await db.users.findByEmail(email); // Parameterized
  const hashedPassword = await hashPassword(password);
  return { authenticated: user.passwordHash === hashedPassword };
}
```

**Questions:**
- No SQL injection vulnerabilities?
- Passwords hashed, not plaintext?
- Input validation present?
- XSS prevention in place?
- CSRF tokens used (if applicable)?

#### 5. Performance
```typescript
// ❌ BAD: N+1 query problem
async function getUsers() {
  const users = await db.users.findAll();
  for (const user of users) {
    user.posts = await db.posts.findByUserId(user.id); // N queries
  }
  return users;
}

// ✅ GOOD: Single query with join
async function getUsers() {
  return await db.users.findAll({
    include: { posts: true } // Single query
  });
}
```

**Questions:**
- No obvious performance issues?
- Database queries optimized?
- No memory leaks?
- Algorithms efficient?

#### 6. Documentation
```typescript
// ❌ BAD: No documentation
function auth(e: string, p: string) {
  // ...
}

// ✅ GOOD: Clear documentation
/**
 * Authenticates a user with email and password.
 *
 * @param email - User's email address
 * @param password - User's password (will be hashed)
 * @returns Promise resolving to authentication result
 * @throws {AuthenticationError} If database connection fails
 *
 * @example
 * const result = await authenticateUser('user@test.com', 'password123');
 * if (result.authenticated) {
 *   // User is authenticated
 * }
 */
async function authenticateUser(
  email: string,
  password: string
): Promise<AuthResult> {
  // ...
}
```

**Questions:**
- Complex logic documented?
- Public APIs have JSDoc comments?
- Unclear code explained?

### Review Checklist - Stage 2

```markdown
## Stage 2: Code Quality Review

### Code Standards
- [ ] Follows project conventions
- [ ] TypeScript types present (if TS)
- [ ] Consistent naming
- [ ] Properly formatted

### Testing
- [ ] Tests present
- [ ] Tests passing
- [ ] Happy path covered
- [ ] Error cases covered
- [ ] Edge cases covered

### Error Handling
- [ ] Errors caught and handled
- [ ] User-friendly error messages
- [ ] Errors logged appropriately
- [ ] Edge cases handled

### Security
- [ ] No SQL injection
- [ ] Passwords hashed
- [ ] Input validated
- [ ] XSS prevented
- [ ] CSRF tokens (if applicable)

### Performance
- [ ] No obvious bottlenecks
- [ ] Database queries optimized
- [ ] No memory leaks
- [ ] Algorithms efficient

### Documentation
- [ ] Complex logic documented
- [ ] Public APIs documented
- [ ] README updated (if needed)

### Overall Stage 2 Status: PASS / FAIL
```

### Output Format

```markdown
# Stage 2 Review Report: Code Quality

## Story
**ID:** US-001
**Title:** User Authentication

## Status: FAIL

## Code Standards: ✅ PASS
- TypeScript types present
- Follows naming conventions
- Properly formatted with Prettier

## Testing: ❌ FAIL
✅ Tests present
✅ Happy path covered
❌ Error cases not tested
   Missing: database error test, invalid email test
❌ Edge cases not covered
   Missing: empty string test, null test

## Error Handling: ❌ FAIL
✅ Database errors caught
❌ User-friendly messages missing
   Current: "Error 500"
   Expected: "Authentication failed. Please try again."

## Security: ✅ PASS
- Passwords hashed with bcrypt
- Parameterized queries used
- Input validation present

## Performance: ✅ PASS
- No N+1 queries
- Efficient algorithms

## Documentation: ⚠️ MINOR
✅ Public API documented
⚠️ Complex password hashing logic not explained

## Issues Summary

### Critical (Must Fix)
None

### Major (Should Fix)
1. Add error case tests (database errors, invalid inputs)
2. Add edge case tests (empty, null)
3. Improve error messages for users

### Minor (Nice to Have)
4. Document password hashing implementation

## Next Action
Fix 3 major issues → Re-review Stage 2
```

---

## 🏷️ Issue Categorization

### Critical (Blocker) 🔴

**Definition:** Issues that prevent code from working or pose serious risks.

**Examples:**
- Security vulnerabilities (SQL injection, XSS)
- Data loss risks
- Spec requirements not met
- Tests failing
- Application crashes

**Action:** **MUST fix before approval**

---

### Major (Should Fix) 🟡

**Definition:** Issues that impact quality but don't prevent functionality.

**Examples:**
- Missing tests for error cases
- Poor error handling
- Performance problems
- Code quality issues
- Missing documentation

**Action:** **SHOULD fix**, may proceed with plan to fix

---

### Minor (Nice to Have) 🟢

**Definition:** Improvements that enhance code but aren't essential.

**Examples:**
- Style inconsistencies
- Documentation gaps for internal functions
- Minor optimizations
- Refactoring opportunities

**Action:** **Nice to have**, can defer or create ticket

---

## 🔄 Review Loops

### Maximum Loops

Default: **3 loops per stage**

```yaml
# prd.json config
{
  "config": {
    "qualityGates": {
      "maxReviewLoops": 3
    }
  }
}
```

### Loop Workflow

```
Attempt 1: Implementation
    ↓
    Review → FAIL (5 issues)
    ↓
Attempt 2: Fix issues
    ↓
    Re-review → FAIL (2 issues remaining)
    ↓
Attempt 3: Fix remaining
    ↓
    Re-review → PASS ✅
```

### When Max Loops Reached

If issues remain after max loops:
1. Document remaining issues
2. Escalate to human reviewer
3. Decide: accept with issues or stop

**Do not bypass critical issues.**

---

## 📊 Review Report Template

```markdown
# Code Review Report

**Date:** 2026-01-23
**Reviewer:** [Name]
**Story:** US-001 - User Authentication
**Commit:** abc123f

---

## Stage 1: Spec Compliance

**Status:** ✅ PASS / ❌ FAIL

### Acceptance Criteria
- [✅/❌] User can login with email and password
- [✅/❌] Invalid credentials show error message
- [✅/❌] Successful login redirects to dashboard
- [✅/❌] Session persists across page refresh

### Files Affected
- [✅/❌] lib/auth.ts
- [✅/❌] components/LoginForm.tsx
- [✅/❌] pages/api/auth/login.ts

### Scope Check
- [✅/❌] No scope creep
- [✅/❌] All functionality present
- [✅/❌] Implementation focused

### Issues Found
**Critical:**
- [Issue 1 description]

**Major:**
- [Issue 2 description]

**Minor:**
- [Issue 3 description]

---

## Stage 2: Code Quality

**Status:** ✅ PASS / ❌ FAIL (only if Stage 1 PASS)

### Checklist
- [✅/❌] Code standards
- [✅/❌] Tests present and passing
- [✅/❌] Error handling
- [✅/❌] Security
- [✅/❌] Performance
- [✅/❌] Documentation

### Issues Found
**Critical:**
- [Issue 1 description]

**Major:**
- [Issue 2 description]

**Minor:**
- [Issue 3 description]

---

## Overall Status

[✅ APPROVED / ❌ NEEDS FIXES]

### Next Actions
- [ ] Fix critical issue 1
- [ ] Fix major issue 2
- [ ] Re-review after fixes

---

## Notes
[Additional observations, suggestions, or context]
```

---

## 🔗 Integration with Ralph++

When Ralph++ runs with `--quality-gates` flag:

```bash
/ralph-loop --quality-gates
```

### Workflow

```
Ralph++ Orchestrator
    ↓
Story Implementation Complete
    ↓
Spawn Review Agent (Stage 1)
    ├─ Read spec from prd.json
    ├─ Review implementation
    ├─ Generate report
    └─ Return: PASS/FAIL + issues
    ↓
IF FAIL:
    ├─ Spawn Fix Agent
    ├─ Fix issues
    └─ Re-review (loop)
    ↓
IF PASS (Stage 1):
    ↓
    Spawn Review Agent (Stage 2)
    ├─ Check code quality
    ├─ Generate report
    └─ Return: PASS/FAIL + issues
    ↓
    IF FAIL:
        ├─ Spawn Fix Agent
        ├─ Fix issues
        └─ Re-review (loop)
        ↓
    IF PASS (Stage 2):
        ↓
        Mark Story Complete ✅
```

### Configuration

```json
// prd.json
{
  "config": {
    "qualityGates": {
      "enabled": true,
      "specCompliance": true,
      "codeQuality": true,
      "maxReviewLoops": 3
    }
  },
  "stories": [
    {
      "id": 1,
      "title": "User Authentication",
      "acceptanceCriteria": [
        "User can login with email and password",
        "Invalid credentials show error message"
      ],
      "filesAffected": [
        "lib/auth.ts",
        "components/LoginForm.tsx"
      ]
    }
  ]
}
```

---

## ⚠️ Critical Rules

### Rule #1: Never Skip Stage 1

**Always check spec compliance first.**

**Why:**
- If spec isn't met, code quality doesn't matter
- Prevents wasted time reviewing wrong implementation
- Ensures alignment with requirements

❌ **Wrong:**
```
Implementation → Code Quality Review → Spec Review
```

✅ **Correct:**
```
Implementation → Spec Review → Code Quality Review
```

---

### Rule #2: Review Loops Are Mandatory

**Never bypass critical issues.**

**Why:**
- Critical issues pose serious risks
- Quality gates exist for a reason
- Short-term speed → long-term problems

❌ **Wrong:**
```
Review: 2 critical issues found
Action: Skip and merge anyway (we'll fix later)
```

✅ **Correct:**
```
Review: 2 critical issues found
Action: Fix issues → Re-review → Verify fixed
```

---

### Rule #3: Categorize Issues Properly

**Be honest about severity.**

**Why:**
- Critical = real blockers
- Inflating severity → loses meaning
- Deflating severity → miss important issues

❌ **Wrong:**
```
Issue: Missing semicolon
Severity: CRITICAL
```

✅ **Correct:**
```
Issue: Missing semicolon
Severity: MINOR (style issue)

Issue: SQL injection vulnerability
Severity: CRITICAL (security risk)
```

---

## 📝 Example: Complete Review

### Story Specification

```markdown
## Story 1: User Login

**Priority:** HIGH
**Complexity:** MEDIUM

### Acceptance Criteria
- [ ] User can login with email and password
- [ ] Invalid credentials show error message "Invalid email or password"
- [ ] Successful login redirects to /dashboard
- [ ] Login form has email and password fields
- [ ] Submit button says "Sign In"

### Files to Create/Modify
- components/LoginForm.tsx
- lib/auth.ts
- pages/api/auth/login.ts
```

---

### Implementation

```typescript
// components/LoginForm.tsx
export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (result.ok) {
      window.location.href = '/dashboard';
    } else {
      alert('Login failed');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}

// lib/auth.ts
export async function authenticateUser(email: string, password: string) {
  const user = await db.users.findByEmail(email);
  return user && user.password === password;
}

// pages/api/auth/login.ts
export default async function handler(req, res) {
  const { email, password } = req.body;
  const authenticated = await authenticateUser(email, password);
  if (authenticated) {
    res.status(200).json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
}
```

---

### Stage 1 Review: Spec Compliance

```markdown
# Stage 1 Review Report

## Status: ❌ FAIL

### Acceptance Criteria
✅ User can login with email and password
❌ Invalid credentials show error message "Invalid email or password"
   Found: Generic "Login failed" alert
   Expected: Specific error message
✅ Successful login redirects to /dashboard
✅ Login form has email and password fields
❌ Submit button says "Sign In"
   Found: "Login"
   Expected: "Sign In"

### Files Affected
✅ components/LoginForm.tsx - Created
✅ lib/auth.ts - Created
✅ pages/api/auth/login.ts - Created

### Issues

**Critical:**
1. Error message doesn't match spec
2. Button text doesn't match spec

## Next Action
Fix 2 critical issues → Re-review Stage 1
```

---

### Fix Issues (Attempt 2)

```typescript
// components/LoginForm.tsx - FIXED
export function LoginForm() {
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (result.ok) {
      window.location.href = '/dashboard';
    } else {
      setError('Invalid email or password'); // FIXED: Specific message
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {/* ... inputs ... */}
      <button type="submit">Sign In</button> {/* FIXED: Correct text */}
    </form>
  );
}
```

---

### Stage 1 Re-Review (Attempt 2)

```markdown
# Stage 1 Review Report - Attempt 2

## Status: ✅ PASS

### Acceptance Criteria
✅ User can login with email and password
✅ Invalid credentials show error message "Invalid email or password"
✅ Successful login redirects to /dashboard
✅ Login form has email and password fields
✅ Submit button says "Sign In"

### Files Affected
✅ All files present and correct

## Stage 1 Complete - Proceed to Stage 2
```

---

### Stage 2 Review: Code Quality

```markdown
# Stage 2 Review Report

## Status: ❌ FAIL

### Code Standards: ✅ PASS
- TypeScript types present
- Follows conventions

### Testing: ❌ FAIL
❌ No tests present
   Required: tests/LoginForm.test.tsx
   Required: tests/auth.test.ts

### Error Handling: ✅ PASS
- Errors caught and displayed

### Security: ❌ FAIL (CRITICAL)
❌ Password stored in plaintext in database
   Risk: Massive security vulnerability
   Required: Hash passwords with bcrypt

❌ No input validation
   Risk: SQL injection possible
   Required: Validate and sanitize inputs

### Performance: ✅ PASS
- No obvious issues

### Documentation: ⚠️ MINOR
⚠️ authenticateUser function not documented

### Issues Summary

**Critical:**
1. Passwords in plaintext - MUST fix immediately
2. No input validation - SQL injection risk

**Major:**
3. No tests present

**Minor:**
4. Missing documentation

## Next Action
Fix 2 critical + 1 major issue → Re-review Stage 2
```

---

### Fix Issues (Attempt 2)

```typescript
// lib/auth.ts - FIXED
import bcrypt from 'bcrypt';

/**
 * Authenticates user with email and password.
 * Passwords are hashed using bcrypt.
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<boolean> {
  // Input validation - FIXED
  if (!email || !password) return false;
  if (!email.includes('@')) return false;

  const user = await db.users.findByEmail(email);
  if (!user) return false;

  // Compare hashed password - FIXED
  return await bcrypt.compare(password, user.passwordHash);
}

// tests/auth.test.ts - ADDED
describe('authenticateUser', () => {
  test('returns true for valid credentials', async () => {
    await createTestUser('user@test.com', 'password123');
    const result = await authenticateUser('user@test.com', 'password123');
    expect(result).toBe(true);
  });

  test('returns false for invalid password', async () => {
    await createTestUser('user@test.com', 'password123');
    const result = await authenticateUser('user@test.com', 'wrong');
    expect(result).toBe(false);
  });

  test('returns false for invalid email', async () => {
    const result = await authenticateUser('invalid', 'password');
    expect(result).toBe(false);
  });
});
```

---

### Stage 2 Re-Review (Attempt 2)

```markdown
# Stage 2 Review Report - Attempt 2

## Status: ✅ PASS

### Code Standards: ✅ PASS
### Testing: ✅ PASS
- Tests added and passing
- Happy path and error cases covered

### Security: ✅ PASS
- Passwords hashed with bcrypt
- Input validation present

### Documentation: ✅ PASS
- Function documented

## Stage 2 Complete ✅

## Overall: APPROVED
Story US-001 is complete and meets all quality standards.
```

---

## 📚 References

### Inspiration
- obra/superpowers requesting-code-review skill
- obra/superpowers receiving-code-review skill
- Google Code Review Guidelines

### Tools
- **Linters:** ESLint, Pylint, RuboCop
- **Formatters:** Prettier, Black, gofmt
- **Type Checkers:** TypeScript, mypy
- **Security:** Snyk, OWASP ZAP

---

## 🏁 Quick Reference Card

```
CODE REVIEW PROCESS

STAGE 1: SPEC COMPLIANCE
├─ All acceptance criteria met?
├─ Required files present?
├─ No scope creep?
└─ PASS → Stage 2 / FAIL → Fix → Loop

STAGE 2: CODE QUALITY
├─ Code standards followed?
├─ Tests present and passing?
├─ Error handling adequate?
├─ Security considerations?
├─ Performance acceptable?
└─ PASS → Approve / FAIL → Fix → Loop

ISSUE CATEGORIES
├─ CRITICAL 🔴 - Must fix (security, spec, crashes)
├─ MAJOR 🟡 - Should fix (tests, quality)
└─ MINOR 🟢 - Nice to have (style, docs)

CRITICAL RULES
├─ Never skip Stage 1
├─ Review loops are mandatory
└─ Categorize issues properly

MAX LOOPS
└─ Default: 3 per stage
```

---

**Skill created:** 2026-01-23
**Status:** Ready for use
**Next:** Test with Ralph++ quality gates
