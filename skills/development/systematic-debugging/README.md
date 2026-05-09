# Systematic Debugging

4-phase systematic debugging approach for root cause analysis and minimal fixes.

## Quick Start

```bash
# Start systematic debugging workflow
/systematic-debugging
```

## What It Does

Guides you through a systematic 4-phase debugging process:

1. **🔴 REPRODUCE** - Create minimal test case that demonstrates the bug
2. **🔍 INVESTIGATE** - Find the root cause through elimination
3. **🔧 FIX** - Apply minimal change targeting root cause
4. **✅ VERIFY** - Ensure fix works and no regressions

## The 4 Phases

### Phase 1: Reproduce

Create a minimal test case:
- Strip away non-essential code
- Make it run quickly (< 1 second)
- Clear expected vs actual output
- No external dependencies

```typescript
test('bug description', () => {
  const result = buggyFunction(input);
  expect(result).toBe(expected); // ❌ FAILS
});
```

### Phase 2: Investigate

Find the root cause (not just symptoms):
- Use binary search / git bisect
- Test hypotheses systematically
- Analyze stack traces
- Document findings

**Root Cause vs Symptom:**
- ❌ Symptom: "Title is undefined"
- ✅ Root Cause: "Sanitizer doesn't copy title field"

### Phase 3: Fix

Apply minimal change:
- Target the root cause
- Don't fix symptoms
- Don't add unnecessary features
- Clear commit message explaining WHY

### Phase 4: Verify

Ensure fix is complete:
- ✅ Minimal test case passes
- ✅ All related tests pass
- ✅ No regressions introduced
- ✅ Edge cases covered
- ✅ Prevention measures added

## When to Use

**Use systematic debugging when:**
- Bug is complex or hard to reproduce
- Multiple possible causes
- Need to document findings
- Working on unfamiliar code
- Bug keeps coming back

**Skip for:**
- Obvious typos
- Simple missing imports
- Clear error messages with solution

## Integration

Works well with:
- **/tdd-mode** - Create test first, then debug
- **/code-review** - Review fixes before merging
- **Ralph++** - Systematic debugging in autonomous workflow

## Example Workflow

```bash
# User reports bug
/systematic-debugging

# Phase 1: Create minimal test case
test('post title lost after second save', () => {
  const post = createPost({ title: 'Title' });
  post.save();
  post.title = 'Updated';
  post.save();
  expect(post.title).toBe('Updated'); // ❌ FAILS
});

# Phase 2: Find root cause
# → Binary search through code
# → Found: sanitizer.js doesn't copy title field

# Phase 3: Apply minimal fix
function sanitize(post) {
  const cleaned = {};
  cleaned.title = post.title;  // ← ADDED
  cleaned.content = sanitizeHtml(post.content);
  return cleaned;
}

# Phase 4: Verify
npm test → ✅ All tests pass
# Add prevention test
# Document in checklist
```

## Benefits

✅ **Evidence-based** - No guessing, systematic investigation
✅ **Minimal fixes** - Target root cause, not symptoms
✅ **Prevention** - Document learnings to avoid repeat bugs
✅ **Reproducible** - Test case ensures bug stays fixed
✅ **Efficient** - Structured process saves time

## Files

- `prompt.md` - Complete debugging guide
- `templates/debugging-checklist.md` - Practical checklist for each bug
- `manifest.yaml` - Skill configuration

## Philosophy

> "The most effective debugging technique is still careful thought, coupled with judiciously placed print statements." - Brian Kernighan

This skill enforces:
- **Root cause over symptoms** - Fix the real problem
- **Evidence over intuition** - Test hypotheses systematically
- **Minimal over elaborate** - Simplest fix that works
- **Prevention over cure** - Add tests to prevent regression

## See Also

- `/tdd-mode` - Test-driven development workflow
- `/code-review` - Review fixes before merging
- `systems/ralph++/` - Autonomous orchestration
