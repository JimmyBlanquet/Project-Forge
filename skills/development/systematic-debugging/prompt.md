# Systematic Debugging - 4-Phase Approach

**Version:** 1.0.0
**Source:** Inspired by obra/superpowers
**Tier:** 2 (Development Practices)

---

## 🎯 Objective

Use a **systematic 4-phase approach** to debug issues efficiently:
1. **Reproduce** - Create minimal test case
2. **Investigate** - Find root cause through elimination
3. **Fix** - Apply minimal, targeted change
4. **Verify** - Test fix + check for regressions

**Philosophy:** Evidence-based debugging, not guessing.

---

## 📋 When to Use

### Always Use Systematic Debugging For:
- ✅ Production bugs
- ✅ Intermittent issues
- ✅ Complex failures
- ✅ Performance problems
- ✅ Security vulnerabilities
- ✅ Regression bugs

### Optional For:
- ⚠️ Obvious typos (fix immediately)
- ⚠️ Known issues with clear solution
- ⚠️ Simple syntax errors

---

## 🔄 The 4-Phase Process

```
Bug Report
    ↓
Phase 1: REPRODUCE
    Create minimal test case
    ↓
Phase 2: INVESTIGATE
    Find root cause (systematic elimination)
    ↓
Phase 3: FIX
    Apply minimal change
    ↓
Phase 4: VERIFY
    Test fix + check regressions
    ↓
Bug Resolved ✅
```

---

## Phase 1: 🔴 REPRODUCE

### Goal
Create the **smallest possible test case** that reproduces the bug.

### Why This Matters
- Confirms bug exists
- Isolates the problem
- Makes testing faster
- Documents the issue
- Enables verification

### Steps

#### 1.1 Gather Information
```markdown
**Bug Report:**
- What happened? (observed behavior)
- What was expected? (expected behavior)
- How to reproduce? (steps)
- Environment? (browser, OS, version, etc.)
- Error messages? (logs, stack traces)
- When did it start? (recent changes?)
```

#### 1.2 Reproduce Exactly
Follow the steps from bug report:
```bash
# Try to reproduce exactly as reported
1. [Step 1]
2. [Step 2]
3. [Step 3]

Result: ✅ Reproduced / ❌ Cannot reproduce
```

**If cannot reproduce:**
- Different environment?
- Missing context/data?
- Timing issue?
- Specific configuration?

#### 1.3 Create Minimal Test Case
Eliminate everything non-essential:

**Start with full scenario:**
```typescript
// Full user flow (complex)
test('user cannot login after password reset', async () => {
  const user = await createUser({
    email: 'test@example.com',
    name: 'Test User',
    preferences: { theme: 'dark', language: 'en' },
    subscription: 'premium'
  });

  await user.verifyEmail();
  await user.login();
  await user.requestPasswordReset();
  await user.resetPassword('newPassword123');

  // Bug: Login fails here
  const result = await user.login();
  expect(result.success).toBe(true); // ❌ FAILS
});
```

**Eliminate until minimal:**
```typescript
// Minimal reproduction (simple)
test('login fails after password reset', async () => {
  const user = await createUser({ email: 'test@test.com' });
  await user.resetPassword('newpass');

  // Bug reproduces with just these steps
  const result = await user.login();
  expect(result.success).toBe(true); // ❌ FAILS
});
```

**Minimal test case criteria:**
- ✅ Still reproduces the bug
- ✅ Removes all non-essential code
- ✅ Runs quickly (<1 second if possible)
- ✅ Clear expected vs actual
- ✅ No external dependencies if possible

#### 1.4 Document Reproduction
```markdown
## Minimal Reproduction

**Test:**
```typescript
// [Minimal test case code]
```

**Steps:**
1. [Minimal step 1]
2. [Minimal step 2]

**Expected:** [What should happen]
**Actual:** [What happens instead]
**Error:** [Error message/stack trace if any]
```

### Example: Minimal Reproduction

**Original bug report:**
> "When I create a post with a long title, save it, then edit and save again, the title becomes corrupted and shows as undefined in the UI. This happens on Chrome and Firefox."

**Minimal test case:**
```typescript
test('post title corrupted after second save', () => {
  const post = createPost({ title: 'A very long title that exceeds 50 characters for testing' });
  post.save();
  post.title = 'Updated title';
  post.save();

  // Bug: title becomes undefined
  expect(post.title).toBe('Updated title'); // ❌ FAILS, got undefined
});
```

**What was eliminated:**
- ❌ UI interaction (not needed)
- ❌ Multiple browsers (reproduced in test)
- ❌ Specific title length (any long title works)
- ✅ Core issue: Second save corrupts title

---

## Phase 2: 🔍 INVESTIGATE

### Goal
Find the **root cause** through systematic elimination.

### Why This Matters
- Prevents treating symptoms
- Ensures complete fix
- Avoids breaking other things
- Documents understanding

### Investigation Methods

#### Method 1: Binary Search (Divide & Conquer)

For large codebases or recent regressions:

```bash
# If bug appeared recently, use git bisect
git bisect start
git bisect bad HEAD          # Current broken state
git bisect good v1.2.0       # Last known good state

# Git will checkout middle commit
# Test if bug exists
git bisect good  # or git bisect bad

# Repeat until finds exact commit
```

For code paths:
```typescript
// Add logs at different points
function savePost(post) {
  console.log('1. Start save:', post); // Check input

  const validated = validate(post);
  console.log('2. After validate:', validated); // Check validation

  const sanitized = sanitize(validated);
  console.log('3. After sanitize:', sanitized); // Check sanitization

  const saved = db.save(sanitized);
  console.log('4. After save:', saved); // Check persistence

  return saved;
}
```

#### Method 2: Hypothesis Testing

Form hypotheses and test each:

```markdown
## Hypotheses

**H1:** Title is corrupted during validation
Test: Log title before/after validation
Result: ✅ Title intact after validation

**H2:** Title is corrupted during sanitization
Test: Log title before/after sanitization
Result: ❌ Title becomes undefined here! ← ROOT CAUSE

**H3:** Title is corrupted during save
Test: Not needed, found root cause
```

#### Method 3: Stack Trace Analysis

Follow the error back to source:

```
Error: Cannot read property 'length' of undefined
    at sanitizeTitle (sanitizer.js:42)
    at sanitize (sanitizer.js:15)
    at savePost (post-service.js:78)
    at onClick (PostEditor.tsx:23)
```

Work backwards:
1. Check `sanitizer.js:42` - tries to access `title.length`
2. Check `sanitizer.js:15` - calls `sanitizeTitle(post.title)`
3. Find why `post.title` is undefined

#### Method 4: Rubber Duck Debugging

Explain the code line-by-line:

```typescript
function sanitize(post) {
  // "We create a new object..."
  const cleaned = {};

  // "We sanitize the content..."
  cleaned.content = sanitizeHtml(post.content);

  // "We sanitize the tags..."
  cleaned.tags = sanitizeTags(post.tags);

  // "Wait... we never copy the title!"
  // ← BUG FOUND: title not copied to cleaned object

  return cleaned;
}
```

### Root Cause Documentation

```markdown
## Root Cause Analysis

**Location:** `lib/sanitizer.js:15-25`

**Issue:** The `sanitize()` function creates a new object but only copies `content` and `tags`, not `title`.

**Why it happens:**
```typescript
function sanitize(post) {
  const cleaned = {};
  cleaned.content = sanitizeHtml(post.content);
  cleaned.tags = sanitizeTags(post.tags);
  // Missing: cleaned.title = post.title;
  return cleaned;
}
```

**Impact:** Any field not explicitly copied is lost.

**Introduced in:** Commit abc123 (2024-01-15) when tags sanitization was added.
```

---

## Phase 3: 🔧 FIX

### Goal
Apply the **minimal change** that fixes the root cause.

### Why Minimal Fixes Matter
- ✅ Easier to review
- ✅ Less risk of side effects
- ✅ Clearer git history
- ✅ Easier to revert if needed

### Fix Strategies

#### Strategy 1: Direct Fix (Preferred)

Fix exactly what's broken, nothing more:

```typescript
// ❌ BAD: Over-engineered fix
function sanitize(post) {
  // Rewrote entire function, added new features, changed behavior
  const fields = ['title', 'content', 'tags', 'author', 'status'];
  return fields.reduce((acc, field) => {
    acc[field] = sanitizeField(field, post[field]);
    return acc;
  }, {});
}

// ✅ GOOD: Minimal fix
function sanitize(post) {
  const cleaned = {};
  cleaned.title = post.title;        // ← ADDED: Copy title
  cleaned.content = sanitizeHtml(post.content);
  cleaned.tags = sanitizeTags(post.tags);
  return cleaned;
}
```

#### Strategy 2: Defensive Fix

If direct fix risky, add defensive check:

```typescript
// ❌ BAD: Suppresses symptom
function sanitizeTitle(title) {
  if (!title) return '';  // Hides the real problem
  return title.trim().slice(0, 100);
}

// ✅ GOOD: Defensive but clear
function sanitizeTitle(title) {
  if (!title) {
    console.error('sanitizeTitle called with undefined title');
    return '';
  }
  return title.trim().slice(0, 100);
}
```

#### Strategy 3: Refactor (Only if necessary)

Sometimes structure needs change:

```typescript
// Before: Brittle (easy to forget fields)
function sanitize(post) {
  const cleaned = {};
  cleaned.title = post.title;
  cleaned.content = sanitizeHtml(post.content);
  cleaned.tags = sanitizeTags(post.tags);
  return cleaned;
}

// After: Robust (won't forget fields)
function sanitize(post) {
  return {
    ...post,  // Copy all fields
    content: sanitizeHtml(post.content),
    tags: sanitizeTags(post.tags)
  };
}
```

**⚠️ Only refactor if:**
- Bug will happen again without it
- Fix is still simple
- You have tests

### Commit the Fix

```bash
git add lib/sanitizer.js
git commit -m "fix(sanitizer): preserve title field when sanitizing

Root cause: sanitize() was creating a new object but only copying
content and tags fields, not title. This caused title to be lost
after sanitization.

Fix: Copy title field to cleaned object.

Closes #123

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 4: ✅ VERIFY

### Goal
Confirm fix works and **no regressions** introduced.

### Verification Checklist

#### 4.1 Minimal Test Case Passes

```typescript
// Original failing test
test('post title corrupted after second save', () => {
  const post = createPost({ title: 'Long title...' });
  post.save();
  post.title = 'Updated title';
  post.save();

  expect(post.title).toBe('Updated title'); // ✅ NOW PASSES
});
```

#### 4.2 Related Tests Pass

```bash
# Run all tests for the module
npm test lib/sanitizer.test.js

# Run related tests
npm test tests/posts/

# Verify all pass
✅ 47 tests passing
```

#### 4.3 Manual Verification

Test the actual user flow:
```markdown
Manual Test:
1. Create post with long title
2. Save post
3. Edit title
4. Save again
5. Verify title still correct ✅

Result: ✅ Title preserved correctly
```

#### 4.4 Regression Check

Check if fix breaks anything:

```bash
# Run full test suite
npm test

# Check for new failures
❌ 2 tests now failing (regressions!)

# If regressions found:
# - Review fix
# - Either fix regressions OR revert and try different approach
```

#### 4.5 Performance Check

```bash
# Before fix
Average sanitize time: 12ms

# After fix
Average sanitize time: 12ms ✅ No regression
```

#### 4.6 Edge Cases

Test edge cases:
```typescript
test('sanitize handles missing title', () => {
  const post = createPost({ content: 'test' }); // No title
  post.save();
  expect(post.title).toBeUndefined(); // ✅ Handles gracefully
});

test('sanitize handles null title', () => {
  const post = createPost({ title: null });
  post.save();
  expect(post.title).toBeNull(); // ✅ Preserves null
});

test('sanitize handles empty title', () => {
  const post = createPost({ title: '' });
  post.save();
  expect(post.title).toBe(''); // ✅ Preserves empty string
});
```

### Verification Report

```markdown
## Fix Verification Report

**Bug:** Post title corrupted after second save
**Fix:** Copy title field in sanitize()
**Commit:** abc123f

### Results

✅ Minimal test case passes
✅ All related tests pass (47/47)
✅ Manual verification successful
✅ No performance regression (12ms → 12ms)
✅ Edge cases handled correctly

### Regression Check

Full test suite: 234 tests
- ✅ 234 passing
- ❌ 0 failing
- ⚠️ 0 skipped

### Conclusion

Fix is complete and verified. No regressions introduced.
Ready to deploy.
```

---

## 🚫 Anti-Patterns to Avoid

### Anti-Pattern 1: Guess & Check

**❌ Wrong:**
```
1. See error about undefined
2. Add if (!x) return
3. Test - still fails
4. Add if (!y) return
5. Test - still fails
6. Add try/catch around everything
7. Test - works! Ship it!
```

**✅ Right:**
```
1. Reproduce with minimal test
2. Investigate root cause (x is undefined because...)
3. Fix root cause (ensure x is defined)
4. Verify fix works
```

---

### Anti-Pattern 2: Shotgun Debugging

**❌ Wrong:**
```
// Change multiple things at once
- Update library version
- Refactor function
- Add caching
- Change algorithm
- Remove logs

// Test
"It works now! I think it was the library?"
```

**✅ Right:**
```
// Change ONE thing at a time
1. Update library → test → still fails
2. Refactor function → test → still fails
3. Fix root cause → test → WORKS!

"It was the refactor that fixed it."
```

---

### Anti-Pattern 3: Treating Symptoms

**❌ Wrong:**
```typescript
// Error: Cannot read 'length' of undefined
function sanitizeTitle(title) {
  if (!title) return '';  // Symptom: title is undefined
  return title.trim().slice(0, 100);
}
```

**✅ Right:**
```typescript
// Root cause: title not copied in sanitize()
function sanitize(post) {
  const cleaned = {};
  cleaned.title = post.title;  // Fix: Copy title
  // ...
}
```

---

### Anti-Pattern 4: Over-Engineering Fix

**❌ Wrong:**
```typescript
// Bug: One field not copied
// Fix: Rewrite entire system with new architecture
function sanitize(post) {
  return new PostSanitizer(post)
    .withCustomRules()
    .withValidation()
    .withLogging()
    .withMetrics()
    .sanitize();
}
```

**✅ Right:**
```typescript
// Minimal fix
function sanitize(post) {
  const cleaned = {};
  cleaned.title = post.title;  // Just add the missing line
  cleaned.content = sanitizeHtml(post.content);
  cleaned.tags = sanitizeTags(post.tags);
  return cleaned;
}
```

---

## 📝 Complete Example: Real Bug

### Bug Report

```
Issue #456: "Dashboard crashes when viewing old projects"

Steps to reproduce:
1. Login to dashboard
2. Click "Projects" tab
3. Click on project created before Jan 2024
4. Page crashes with "Cannot read property 'metadata' of null"

Environment: Chrome 120, production
Frequency: Always for old projects, never for new ones
```

---

### Phase 1: REPRODUCE

**Minimal test case:**
```typescript
test('dashboard handles projects without metadata', () => {
  // Old projects don't have metadata field (added Jan 2024)
  const oldProject = { id: 1, name: 'Old Project', createdAt: '2023-12-01' };

  // Bug: Crashes when accessing metadata
  const dashboard = new Dashboard();
  expect(() => {
    dashboard.displayProject(oldProject);
  }).not.toThrow(); // ❌ FAILS with "Cannot read property 'metadata' of null"
});
```

**Root finding:** Old projects created before Jan 2024 don't have `metadata` field.

---

### Phase 2: INVESTIGATE

**Stack trace:**
```
TypeError: Cannot read property 'metadata' of null
    at displayProject (Dashboard.tsx:45)
    at onClick (ProjectList.tsx:23)
```

**Check Dashboard.tsx:45:**
```typescript
function displayProject(project) {
  // Line 45: Assumes metadata always exists
  const tags = project.metadata.tags.join(', ');  // ← CRASH HERE
  const status = project.metadata.status;

  return (
    <div>
      <h1>{project.name}</h1>
      <p>Tags: {tags}</p>
      <p>Status: {status}</p>
    </div>
  );
}
```

**Root cause:**
- Code assumes `project.metadata` always exists
- Old projects (pre-Jan 2024) don't have this field
- Accessing `project.metadata.tags` when `metadata` is null/undefined crashes

---

### Phase 3: FIX

**Minimal fix:**
```typescript
function displayProject(project) {
  // Handle missing metadata (old projects)
  const tags = project.metadata?.tags.join(', ') || 'No tags';
  const status = project.metadata?.status || 'Unknown';

  return (
    <div>
      <h1>{project.name}</h1>
      <p>Tags: {tags}</p>
      <p>Status: {status}</p>
    </div>
  );
}
```

**Commit:**
```bash
git commit -m "fix(dashboard): handle projects without metadata

Root cause: Code assumed metadata field always exists, but projects
created before Jan 2024 don't have this field.

Fix: Use optional chaining (?.) and default values for missing metadata.

Fixes #456"
```

---

### Phase 4: VERIFY

**Original test now passes:**
```typescript
test('dashboard handles projects without metadata', () => {
  const oldProject = { id: 1, name: 'Old Project', createdAt: '2023-12-01' };

  const dashboard = new Dashboard();
  expect(() => {
    dashboard.displayProject(oldProject);
  }).not.toThrow(); // ✅ PASSES
});
```

**Edge cases:**
```typescript
test('dashboard handles partial metadata', () => {
  const project = { id: 2, name: 'Test', metadata: { tags: ['tag1'] } };
  // Missing status in metadata
  expect(() => dashboard.displayProject(project)).not.toThrow(); // ✅
});

test('dashboard handles empty metadata', () => {
  const project = { id: 3, name: 'Test', metadata: {} };
  expect(() => dashboard.displayProject(project)).not.toThrow(); // ✅
});
```

**Manual verification:**
✅ Old projects display correctly
✅ New projects still work
✅ No regressions in test suite

---

## 🔗 Integration with TDD Mode

When TDD Mode is active, debugging becomes easier:

```typescript
// With TDD, you already have tests
test('user can login', () => {
  const result = authenticateUser('user@test.com', 'password');
  expect(result.authenticated).toBe(true);
});

// If this test fails:
// 1. You already have minimal reproduction (the test)
// 2. Investigation is focused (test shows exactly what fails)
// 3. Fix verification is automatic (run test again)
```

**TDD makes debugging systematic by default.**

---

## 📊 Debugging Checklist

Use this checklist for every bug:

```markdown
## Systematic Debugging Checklist

### Phase 1: Reproduce ✅
- [ ] Can reproduce bug consistently
- [ ] Created minimal test case
- [ ] Test case runs quickly (<1 sec)
- [ ] Test case is simple (< 10 lines)
- [ ] Expected vs actual is clear

### Phase 2: Investigate ✅
- [ ] Found exact line where bug occurs
- [ ] Identified root cause (not symptom)
- [ ] Documented why it happens
- [ ] Checked when it was introduced
- [ ] Formed hypothesis and tested it

### Phase 3: Fix ✅
- [ ] Applied minimal change
- [ ] Fix targets root cause
- [ ] No unnecessary changes included
- [ ] Clear commit message
- [ ] Fix is reviewable

### Phase 4: Verify ✅
- [ ] Minimal test case passes
- [ ] All related tests pass
- [ ] Manual verification successful
- [ ] No performance regression
- [ ] Edge cases tested
- [ ] Full test suite passes
- [ ] No new regressions introduced

### Prevention
- [ ] Added test to prevent regression
- [ ] Documented root cause
- [ ] Updated validation if needed
- [ ] Shared learnings with team
```

---

## 🎓 Debugging Principles

### Principle 1: Evidence Over Guessing

**Don't guess:**
> "I think it might be the database connection"

**Use evidence:**
> "Logs show query succeeds, but response is undefined. Issue is after database, likely in result parsing."

---

### Principle 2: Minimal Reproduction

**Start complex:**
```typescript
// 50 lines of setup, 20 lines of test
```

**Eliminate until minimal:**
```typescript
// 2 lines of setup, 1 line test ← Bug still reproduces
```

---

### Principle 3: One Change at a Time

Test after each change:
```
1. Change X → test → still fails
2. Change Y → test → WORKS! ← Y fixed it
```

Don't:
```
1. Change X, Y, Z all at once → test → works?
   "Which one fixed it? ¯\_(ツ)_/¯"
```

---

### Principle 4: Fix Root Cause, Not Symptom

**Symptom:**
> Error: Cannot read 'length' of undefined

**Treating symptom:**
```typescript
if (x) x.length;  // Hides the problem
```

**Fixing root cause:**
```typescript
// Why is x undefined? ← Fix that
```

---

## 📚 Common Bug Patterns

### Pattern 1: Null/Undefined

```typescript
// Common causes:
- Missing field in object
- API returns null
- Array.find() returns undefined
- Variable not initialized

// Investigation:
console.log('value:', value);  // Check if null/undefined
console.log('type:', typeof value);

// Fix:
- Optional chaining: value?.property
- Default values: value || 'default'
- Nullish coalescing: value ?? 'default'
- Validation: if (!value) throw error
```

---

### Pattern 2: Async/Timing

```typescript
// Common causes:
- Missing await
- Race condition
- Event fires before listener attached
- Promise not returned

// Investigation:
// Add logs with timestamps
console.log('before', Date.now());
await asyncOperation();
console.log('after', Date.now());

// Fix:
- Add await
- Use Promise.all for parallel
- Ensure proper sequencing
```

---

### Pattern 3: Type Mismatch

```typescript
// Common causes:
- String vs Number ('5' !== 5)
- Array vs Object
- Function vs Value
- null vs undefined

// Investigation:
console.log('type:', typeof value);
console.log('value:', JSON.stringify(value));

// Fix:
- Type conversion: Number(str), String(num)
- Type checking: typeof x === 'string'
- TypeScript strict mode
```

---

## 🏁 Quick Reference Card

```
SYSTEMATIC DEBUGGING

Phase 1: REPRODUCE
├─ Create minimal test case
├─ Eliminate non-essential code
└─ Document expected vs actual

Phase 2: INVESTIGATE
├─ Binary search / git bisect
├─ Hypothesis testing
├─ Stack trace analysis
└─ Find ROOT CAUSE

Phase 3: FIX
├─ Apply MINIMAL change
├─ Target root cause
└─ Clear commit message

Phase 4: VERIFY
├─ Test passes
├─ No regressions
├─ Edge cases covered
└─ Prevention documented

PRINCIPLES
├─ Evidence over guessing
├─ Minimal reproduction
├─ One change at a time
└─ Fix root cause, not symptom

AVOID
├─ Guess & check
├─ Shotgun debugging
├─ Treating symptoms
└─ Over-engineering
```

---

**Skill created:** 2026-01-23
**Status:** Ready for use
**Next:** Test on real bugs
