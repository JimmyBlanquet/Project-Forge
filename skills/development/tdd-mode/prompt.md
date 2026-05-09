# TDD Mode - Test-Driven Development

**Version:** 1.0.0
**Source:** Inspired by obra/superpowers
**Tier:** 2 (Development Practices)

---

## 🎯 Objective

Enforce Test-Driven Development workflow with the **RED-GREEN-REFACTOR** cycle to improve code quality, catch bugs early, and create living documentation.

---

## 📋 When to Use

### Always Use TDD For:
- ✅ New features
- ✅ Bug fixes
- ✅ Refactoring existing code
- ✅ Any behavior changes
- ✅ Business logic
- ✅ API endpoints
- ✅ Data transformations

### Exceptions (Require Explicit Approval):
- Configuration files (JSON, YAML, ENV)
- Throwaway prototypes
- Generated code (scaffolding)
- Simple data structures (types, interfaces)
- Build scripts
- Documentation

---

## 🔄 The Three-Phase Cycle

### Phase 1: 🔴 RED - Write Failing Test

**Goal:** Write a test that demonstrates the desired behavior

**Steps:**
1. Write **ONE** minimal test demonstrating desired behavior
2. Run the test and **VERIFY it fails**
3. Confirm failure reason is **correct** (missing feature, not typo)

**Example:**
```typescript
// tests/auth.test.ts
describe('authenticateUser', () => {
  it('should return user when credentials are valid', () => {
    const result = authenticateUser('user@test.com', 'password123');

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('email', 'user@test.com');
    expect(result.authenticated).toBe(true);
  });
});
```

**Run:**
```bash
npm test tests/auth.test.ts
```

**Expected Output:**
```
❌ FAIL tests/auth.test.ts
  ● authenticateUser › should return user when credentials are valid

    ReferenceError: authenticateUser is not defined
```

**✅ Good RED:** Function doesn't exist (expected)
**❌ Bad RED:** Typo in test, wrong import, syntax error

---

### Phase 2: 🟢 GREEN - Make It Pass

**Goal:** Write the simplest code possible to make the test pass

**Steps:**
1. Write **minimal** code to pass the test
2. Run the test and **VERIFY it passes**
3. **No over-engineering** - just make it work

**Example:**
```typescript
// lib/auth.ts
export function authenticateUser(email: string, password: string) {
  // Minimal implementation - just enough to pass the test
  return {
    id: 1,
    email: email,
    authenticated: true
  };
}
```

**Run:**
```bash
npm test tests/auth.test.ts
```

**Expected Output:**
```
✅ PASS tests/auth.test.ts
  ✓ authenticateUser › should return user when credentials are valid (5ms)
```

**Key Points:**
- Don't add database logic yet
- Don't add validation yet
- Don't add error handling yet
- **Just make the test green**

---

### Phase 3: 🔵 REFACTOR - Clean Up

**Goal:** Improve code quality while keeping tests green

**Steps:**
1. Improve code quality
2. Run tests **frequently** during refactoring
3. **No new features**, no behavior changes
4. Stop when code is clean

**Example:**
```typescript
// lib/auth.ts
import { db } from './db';
import { hashPassword } from './crypto';

export interface AuthResult {
  id: number;
  email: string;
  authenticated: boolean;
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthResult> {
  // Now add proper implementation
  const user = await db.users.findByEmail(email);

  if (!user) {
    return { id: 0, email: '', authenticated: false };
  }

  const hashedPassword = hashPassword(password);
  const authenticated = user.passwordHash === hashedPassword;

  return {
    id: user.id,
    email: user.email,
    authenticated
  };
}
```

**Run tests after each change:**
```bash
npm test tests/auth.test.ts
```

**Keep tests green throughout refactoring**

---

## ⚠️ Critical Rules

### Rule #1: NO CODE WITHOUT TEST

If you write production code before its test:
- ❌ **DELETE the code entirely**
- ❌ Don't keep it "for reference"
- ❌ Don't adapt it while writing test
- ✅ **Start over with test first**

**Why:** Code written first leads to:
- Tests that don't actually validate behavior
- Over-engineering (solving problems that don't exist)
- Missing edge cases
- False confidence

---

### Rule #2: Tests Must Fail First

**Tests passing immediately prove nothing**

You MUST:
1. ✅ Watch the test fail before implementing
2. ✅ Verify failure is for the expected reason
3. ✅ See the RED output in your terminal

**Why:**
- Validates the test actually catches bugs
- Ensures test is testing the right thing
- Prevents false positives

**Bad Example:**
```typescript
// Writing test after code
function add(a: number, b: number) {
  return a + b;
}

// This test tells you nothing
test('add works', () => {
  expect(add(2, 3)).toBe(5); // Already passes, no RED phase
});
```

---

### Rule #3: Minimal Implementation

In the GREEN phase:
- ✅ Write the **simplest** code to pass
- ❌ Don't add extra features
- ❌ Don't solve future problems
- ❌ Don't over-engineer

**Example:**

**❌ Over-engineered GREEN:**
```typescript
// Too much code for first test
export function authenticateUser(email: string, password: string) {
  // Validation
  if (!email || !email.includes('@')) throw new Error('Invalid email');
  if (!password || password.length < 8) throw new Error('Weak password');

  // Database
  const user = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) throw new Error('User not found');

  // Password hashing with multiple algorithms
  const hashedPassword = await bcrypt.hash(password, 10);
  const isValid = await bcrypt.compare(password, user.passwordHash);

  // Logging, metrics, caching...
  return { id: user.id, email: user.email, authenticated: isValid };
}
```

**✅ Good GREEN (for first test):**
```typescript
// Just enough to make test pass
export function authenticateUser(email: string, password: string) {
  return { id: 1, email, authenticated: true };
}
```

Add complexity in REFACTOR phase or **when you have a test that requires it**.

---

## 📝 Complete Workflow Example

### Feature: User Authentication

#### Iteration 1: Happy Path

**🔴 RED:**
```typescript
// tests/auth.test.ts
test('authenticates valid user', () => {
  const result = authenticateUser('user@test.com', 'password123');
  expect(result.authenticated).toBe(true);
});
```

**Run:** `npm test` → ❌ FAIL (authenticateUser not defined)

**🟢 GREEN:**
```typescript
// lib/auth.ts
export function authenticateUser(email: string, password: string) {
  return { authenticated: true };
}
```

**Run:** `npm test` → ✅ PASS

**🔵 REFACTOR:** *(code is simple, skip for now)*

---

#### Iteration 2: Invalid Credentials

**🔴 RED:**
```typescript
test('rejects invalid credentials', () => {
  const result = authenticateUser('user@test.com', 'wrongpassword');
  expect(result.authenticated).toBe(false);
});
```

**Run:** `npm test` → ❌ FAIL (always returns true)

**🟢 GREEN:**
```typescript
export function authenticateUser(email: string, password: string) {
  // Now we need actual logic
  const validPassword = 'password123';
  return { authenticated: password === validPassword };
}
```

**Run:** `npm test` → ✅ PASS (both tests)

**🔵 REFACTOR:**
```typescript
export function authenticateUser(email: string, password: string) {
  const VALID_CREDENTIALS = {
    email: 'user@test.com',
    password: 'password123'
  };

  const authenticated =
    email === VALID_CREDENTIALS.email &&
    password === VALID_CREDENTIALS.password;

  return { authenticated };
}
```

**Run:** `npm test` → ✅ PASS

---

#### Iteration 3: Database Integration

**🔴 RED:**
```typescript
test('authenticates user from database', async () => {
  await db.users.create({
    email: 'user@test.com',
    passwordHash: hashPassword('password123')
  });

  const result = await authenticateUser('user@test.com', 'password123');
  expect(result.authenticated).toBe(true);
  expect(result.id).toBeDefined();
});
```

**Run:** `npm test` → ❌ FAIL (not async, no database)

**🟢 GREEN:**
```typescript
export async function authenticateUser(email: string, password: string) {
  const user = await db.users.findByEmail(email);
  if (!user) return { id: 0, authenticated: false };

  const authenticated = user.passwordHash === hashPassword(password);
  return { id: user.id, authenticated };
}
```

**Run:** `npm test` → ✅ PASS

---

## ✅ Verification Checklist

Before marking work complete, verify:

- [ ] **Every new function has a test**
  - Public functions = must have test
  - Private/internal = optional

- [ ] **You watched each test fail before implementing**
  - Saw RED in terminal
  - Failure was for expected reason

- [ ] **Failures occurred for expected reasons**
  - Not typos
  - Not wrong imports
  - Not syntax errors

- [ ] **Code is minimal (no over-engineering)**
  - Only code required to pass tests
  - No "future-proofing"
  - No "just in case" features

- [ ] **All tests pass with clean output**
  - No warnings
  - No skipped tests
  - No flaky tests

- [ ] **Edge cases covered**
  - Empty strings
  - Null/undefined values
  - Boundary conditions
  - Large inputs

- [ ] **Error conditions tested**
  - Invalid inputs
  - Network failures
  - Database errors
  - Timeout scenarios

---

## 🔗 Integration with Ralph++

When Ralph++ runs with `--tdd` flag:

```bash
/ralph-loop --tdd
```

**Behavior:**
1. For each story, apply TDD cycle
2. Write tests in separate commits
3. Verify RED phase (include test output in commit)
4. Implement code
5. Verify GREEN phase (include test output in commit)
6. Refactor if needed
7. Final commit with all tests passing

**Commit messages:**
```
✅ RED: Add test for user authentication
Expected: Function not defined
Actual: ReferenceError: authenticateUser is not defined

✅ GREEN: Implement authenticateUser
Tests: 1 passing

🔵 REFACTOR: Extract password hashing
Tests: 1 passing
```

---

## 🚫 Common Mistakes to Avoid

### 1. Writing Test After Code

**❌ Wrong:**
```typescript
// 1. Write code first
function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 2. Write test after
test('validates email', () => {
  expect(validateEmail('user@test.com')).toBe(true);
});
```

**Why wrong:** Test can't validate it catches bugs (it already passes)

**✅ Correct:**
```typescript
// 1. Write test first
test('validates email', () => {
  expect(validateEmail('user@test.com')).toBe(true);
});
// Output: ❌ validateEmail is not defined

// 2. Implement
function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
// Output: ✅ Tests passing
```

---

### 2. Tests Passing Immediately

**❌ Wrong:**
```typescript
// Test passes on first run (no RED phase)
test('adds numbers', () => {
  expect(1 + 1).toBe(2); // Built-in operator, always works
});
```

**Why wrong:** Didn't validate test catches bugs

**✅ Correct:**
```typescript
// Test calls function that doesn't exist
test('adds numbers', () => {
  expect(add(1, 1)).toBe(2); // ❌ add is not defined
});

function add(a: number, b: number) {
  return a + b; // ✅ Now test passes
}
```

---

### 3. Over-Engineering in GREEN Phase

**❌ Wrong:**
```typescript
// Too much code for first test
function add(a: number, b: number) {
  // Validation
  if (typeof a !== 'number') throw new TypeError('a must be number');
  if (typeof b !== 'number') throw new TypeError('b must be number');
  if (!isFinite(a)) throw new RangeError('a must be finite');
  if (!isFinite(b)) throw new RangeError('b must be finite');

  // Logging
  console.log(`Adding ${a} + ${b}`);

  // Metrics
  metrics.increment('math.add');

  // Result
  return a + b;
}
```

**Why wrong:** Test doesn't require any of this

**✅ Correct:**
```typescript
// Just make test pass
function add(a: number, b: number) {
  return a + b;
}

// Add complexity when you have tests that require it
```

---

### 4. Skipping Edge Cases

**❌ Wrong:**
```typescript
// Only testing happy path
test('validates email', () => {
  expect(validateEmail('user@test.com')).toBe(true);
});

function validateEmail(email: string) {
  return email.includes('@');
}
```

**Why wrong:** Doesn't test edge cases (null, empty, malformed)

**✅ Correct:**
```typescript
describe('validateEmail', () => {
  test('accepts valid email', () => {
    expect(validateEmail('user@test.com')).toBe(true);
  });

  test('rejects email without @', () => {
    expect(validateEmail('usertest.com')).toBe(false);
  });

  test('rejects empty string', () => {
    expect(validateEmail('')).toBe(false);
  });

  test('rejects null', () => {
    expect(validateEmail(null)).toBe(false);
  });

  test('rejects email without domain', () => {
    expect(validateEmail('user@')).toBe(false);
  });
});
```

---

## 📚 Testing Patterns

### Pattern 1: One Assertion Per Test

**✅ Good:**
```typescript
test('returns user ID', () => {
  const result = authenticateUser('user@test.com', 'pass');
  expect(result.id).toBeDefined();
});

test('returns user email', () => {
  const result = authenticateUser('user@test.com', 'pass');
  expect(result.email).toBe('user@test.com');
});

test('sets authenticated flag', () => {
  const result = authenticateUser('user@test.com', 'pass');
  expect(result.authenticated).toBe(true);
});
```

**Why:** Pinpoints exactly what failed

---

### Pattern 2: Arrange-Act-Assert (AAA)

```typescript
test('authenticates valid user', () => {
  // Arrange - setup test data
  const email = 'user@test.com';
  const password = 'password123';

  // Act - call function
  const result = authenticateUser(email, password);

  // Assert - verify result
  expect(result.authenticated).toBe(true);
});
```

---

### Pattern 3: Test Naming Convention

```
test('[function] should [expected behavior] when [condition]')
```

**Examples:**
```typescript
test('authenticateUser should return true when credentials valid')
test('authenticateUser should return false when password wrong')
test('authenticateUser should throw error when email missing')
```

---

## 🎓 Benefits of TDD

### 1. Find Bugs Before Commit
- Tests catch bugs during development
- No "it works on my machine" surprises
- Faster feedback loop

### 2. Living Documentation
- Tests document how code should behave
- Examples of correct usage
- Updated automatically (or tests fail)

### 3. Enable Safe Refactoring
- Change code with confidence
- Tests catch regressions
- Refactor fearlessly

### 4. Better Design
- Writing tests first forces good design
- Testable code = modular code
- YAGNI enforcement (only code what you need)

### 5. Higher Quality
- Edge cases considered upfront
- Error handling built in
- Fewer production bugs

---

## 📚 References

### Inspiration
- obra/superpowers test-driven-development skill
- Kent Beck - Test-Driven Development by Example
- Martin Fowler - Refactoring

### Testing Frameworks
- **JavaScript/TypeScript:** Jest, Vitest, Mocha
- **Python:** pytest, unittest
- **Ruby:** RSpec, Minitest
- **Go:** testing package
- **Rust:** cargo test

---

## 🏁 Quick Reference Card

```
TDD CYCLE CHEAT SHEET

🔴 RED (Write Failing Test)
├─ Write ONE test
├─ Run test → verify ❌ FAIL
└─ Confirm reason is correct

🟢 GREEN (Make It Pass)
├─ Write minimal code
├─ Run test → verify ✅ PASS
└─ No over-engineering

🔵 REFACTOR (Clean Up)
├─ Improve code quality
├─ Run tests → keep ✅ GREEN
└─ Stop when clean

CRITICAL RULES
├─ NO code without test
├─ Must see RED first
└─ Minimal implementation

WHEN TO USE
├─ New features ✅
├─ Bug fixes ✅
├─ Refactoring ✅
├─ Config files ❌
└─ Prototypes ❌
```

---

**Skill created:** 2026-01-23
**Status:** Ready for use
**Next:** Test on real project
