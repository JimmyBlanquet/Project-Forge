# Systematic Debugging Checklist

Use this checklist for every bug you debug.

---

## Bug Information

**Bug ID:** [#123]
**Reporter:** [Name]
**Date:** [YYYY-MM-DD]
**Priority:** [Critical/High/Medium/Low]

**Description:**
[Brief description of the bug]

**Environment:**
- OS: [Windows/Mac/Linux]
- Browser: [Chrome/Firefox/Safari] [Version]
- App Version: [Version]

---

## Phase 1: Reproduce ✅

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Can reproduce?** ☐ Yes ☐ No ☐ Intermittent

### Minimal Test Case

```typescript
// Paste your minimal test case here
test('bug description', () => {
  // Setup (minimal)

  // Action that triggers bug

  // Assertion
  expect(actual).toBe(expected); // ❌ FAILS
});
```

**Test case criteria:**
- ☐ Reproduces bug consistently
- ☐ Runs quickly (< 1 second)
- ☐ Simple (< 10 lines)
- ☐ Expected vs actual is clear
- ☐ No external dependencies

**Time spent:** [X minutes]

---

## Phase 2: Investigate 🔍

### Hypotheses

**H1:** [First hypothesis]
- Test: [How to test it]
- Result: ☐ Confirmed ☐ Rejected

**H2:** [Second hypothesis]
- Test: [How to test it]
- Result: ☐ Confirmed ☐ Rejected

**H3:** [Third hypothesis]
- Test: [How to test it]
- Result: ☐ Confirmed ☐ Rejected

### Stack Trace

```
[Paste stack trace if available]
```

### Root Cause

**Location:** [File:Line]

**What's wrong:**
[Description of the root cause]

**Why it happens:**
```
[Code snippet showing the problem]
```

**When introduced:**
- Commit: [abc123]
- Date: [YYYY-MM-DD]
- Author: [Name]

**Time spent:** [X minutes]

---

## Phase 3: Fix 🔧

### Fix Strategy

☐ Direct fix (add missing code)
☐ Defensive fix (add validation)
☐ Refactor (change structure)

### Changes Made

**File:** [path/to/file.ts]

**Before:**
```typescript
[Code before fix]
```

**After:**
```typescript
[Code after fix]
```

**Why this fix:**
[Explanation of why this fixes the root cause]

### Commit Message

```
fix(module): [short description]

Root cause: [Explanation]

Fix: [What was changed]

Fixes #[issue-number]
```

**Time spent:** [X minutes]

---

## Phase 4: Verify ✅

### Test Results

**Minimal test case:**
- ☐ ✅ Passes

**Related tests:**
- ☐ ✅ All passing
- ☐ ❌ [X] failing (regressions)

**Full test suite:**
- Total: [X] tests
- Passing: [X]
- Failing: [X]
- Skipped: [X]

### Manual Verification

**Test scenario:**
1. [Manual step 1]
2. [Manual step 2]
3. [Manual step 3]

**Result:** ☐ ✅ Works ☐ ❌ Still broken

### Edge Cases Tested

- ☐ Null values
- ☐ Empty strings
- ☐ Undefined values
- ☐ Boundary values
- ☐ Large inputs
- ☐ Invalid inputs

### Performance Check

**Before fix:** [X]ms
**After fix:** [X]ms
**Regression?** ☐ No ☐ Yes ([details])

**Time spent:** [X minutes]

---

## Prevention

### How to Prevent This Bug

- ☐ Added test to prevent regression
- ☐ Updated validation logic
- ☐ Added TypeScript types
- ☐ Updated documentation
- ☐ Shared learnings with team

### Prevention Measures

```typescript
// Example: Added validation
function processData(data) {
  if (!data || !data.metadata) {
    throw new Error('Missing required metadata');
  }
  // ...
}
```

---

## Summary

**Total Time:** [X hours]

**Root Cause:** [One sentence summary]

**Fix:** [One sentence summary]

**Tests Added:** [Number of new tests]

**Status:** ☐ Fixed ☐ Partial ☐ Cannot reproduce

---

## Learnings

**What went well:**
- [Learning 1]
- [Learning 2]

**What could improve:**
- [Improvement 1]
- [Improvement 2]

**Notes for future:**
- [Note 1]
- [Note 2]

---

## Sign-off

**Debugger:** [Your name]
**Date:** [YYYY-MM-DD]
**Reviewer:** [Reviewer name]
**Status:** ☐ Ready to merge ☐ Needs review
