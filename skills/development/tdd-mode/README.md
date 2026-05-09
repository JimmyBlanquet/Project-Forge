# TDD Mode Skill

**Version:** 1.0.0
**Tier:** 2 (Development Practices)
**Source:** Inspired by obra/superpowers

---

## Quick Start

```bash
# Activate TDD mode
/tdd-mode

# Or integrate with Ralph++
/ralph-loop --tdd
```

---

## What This Skill Does

Enforces Test-Driven Development workflow with the **RED-GREEN-REFACTOR** cycle:

1. 🔴 **RED** - Write failing test
2. 🟢 **GREEN** - Make it pass (minimal code)
3. 🔵 **REFACTOR** - Clean up code

---

## Core Principles

- ✅ **NO production code without test first**
- ✅ **Tests must fail before implementing**
- ✅ **Minimal implementation in GREEN phase**
- ✅ **Refactor while keeping tests green**

---

## When to Use

**Always:**
- New features
- Bug fixes
- Refactoring
- Business logic

**Exceptions (require approval):**
- Configuration files
- Prototypes
- Generated code

---

## Example Workflow

```typescript
// 1. 🔴 RED - Write failing test
test('authenticates valid user', () => {
  const result = authenticateUser('user@test.com', 'pass');
  expect(result.authenticated).toBe(true);
});
// Run: npm test → ❌ FAIL (function not defined)

// 2. 🟢 GREEN - Minimal implementation
function authenticateUser(email: string, password: string) {
  return { authenticated: true };
}
// Run: npm test → ✅ PASS

// 3. 🔵 REFACTOR - Add real logic
function authenticateUser(email: string, password: string) {
  const user = db.findUser(email);
  return { authenticated: user?.password === password };
}
// Run: npm test → ✅ PASS (still green)
```

---

## Files

- `manifest.yaml` - Skill metadata
- `prompt.md` - Complete TDD guide (17 KB)
- `templates/tdd-cycle-example.md` - Full worked example

---

## Integration

### With Ralph++

```bash
/ralph-loop --tdd
```

Ralph++ will:
1. Apply TDD cycle to each story
2. Write tests before code
3. Verify RED/GREEN phases
4. Include test output in commits

### Manual Usage

```bash
/tdd-mode
```

Follow the skill's guidance for each feature you build.

---

## Benefits

1. **Find bugs before commit**
2. **Living documentation** (tests show how to use code)
3. **Safe refactoring** (tests catch regressions)
4. **Better design** (testable code = good code)
5. **Higher quality** (edge cases considered upfront)

---

## See Also

- [Complete Skill Documentation](./prompt.md)
- [TDD Example: String Calculator](./templates/tdd-cycle-example.md)
- [obra/superpowers TDD skill](https://github.com/obra/superpowers/tree/main/skills/test-driven-development)
