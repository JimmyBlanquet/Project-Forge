# Code Review Skill

**Version:** 1.0.0
**Tier:** 2 (Development Practices)
**Source:** Inspired by obra/superpowers

---

## Quick Start

```bash
# Request code review
/code-review

# Or integrate with Ralph++
/ralph-loop --quality-gates
```

---

## What This Skill Does

Provides a **2-stage systematic code review process**:

1. **Stage 1: Spec Compliance** - Does code match requirements?
2. **Stage 2: Code Quality** - Is implementation high quality?

Includes **review loops** to ensure issues are fixed before approval.

---

## The 2-Stage Process

```
Implementation
    ↓
Stage 1: Spec Compliance
    ├─ Acceptance criteria met?
    ├─ Files created/modified?
    ├─ No scope creep?
    └─ PASS → Stage 2 / FAIL → Fix → Loop
    ↓
Stage 2: Code Quality
    ├─ Code standards?
    ├─ Tests present?
    ├─ Security checks?
    └─ PASS → Approve / FAIL → Fix → Loop
    ↓
Approved ✅
```

---

## Issue Categories

### Critical 🔴 (Must Fix)
- Security vulnerabilities
- Spec requirements not met
- Tests failing
- Data loss risks

### Major 🟡 (Should Fix)
- Missing tests
- Poor error handling
- Performance problems
- Code quality issues

### Minor 🟢 (Nice to Have)
- Style inconsistencies
- Documentation gaps
- Minor optimizations

---

## Integration with Ralph++

When Ralph++ runs with `--quality-gates`:

```bash
/ralph-loop --quality-gates
```

**Behavior:**
1. Story implementation completes
2. Spawn review agent (Stage 1)
3. If FAIL: Fix → Re-review (loop)
4. Spawn review agent (Stage 2)
5. If FAIL: Fix → Re-review (loop)
6. Mark story complete ✅

**Configuration:**
```json
{
  "config": {
    "qualityGates": {
      "enabled": true,
      "specCompliance": true,
      "codeQuality": true,
      "maxReviewLoops": 3
    }
  }
}
```

---

## Files

- `manifest.yaml` - Skill metadata
- `prompt.md` - Complete review guide (25 KB)
- `templates/review-checklist.md` - Systematic checklist
- `templates/review-report-template.md` - Report template

---

## Example Review

### Story
```markdown
## US-001: User Login

**Acceptance Criteria:**
- User can login with email and password
- Invalid credentials show error "Invalid email or password"
- Successful login redirects to /dashboard
```

### Stage 1: Spec Compliance
```markdown
Status: ❌ FAIL

Issues:
❌ Error message says "Login failed" not "Invalid email or password"
❌ Button text is "Login" not "Sign In" (spec requirement)

Next Action: Fix 2 issues → Re-review
```

### After Fix
```markdown
Status: ✅ PASS

All acceptance criteria met.
Proceed to Stage 2.
```

### Stage 2: Code Quality
```markdown
Status: ❌ FAIL

Issues:
🔴 CRITICAL: Passwords stored in plaintext
🔴 CRITICAL: No input validation (SQL injection risk)
🟡 MAJOR: No tests present

Next Action: Fix critical issues → Re-review
```

### After Fix
```markdown
Status: ✅ PASS

Security fixed, tests added.
Approved ✅
```

---

## Benefits

1. **Systematic** - Nothing missed
2. **Two-stage** - Spec first, quality second
3. **Issue tracking** - Critical/Major/Minor
4. **Review loops** - Fix until perfect
5. **Quality gates** - Automated with Ralph++

---

## See Also

- [Complete Skill Documentation](./prompt.md)
- [Review Checklist](./templates/review-checklist.md)
- [Review Report Template](./templates/review-report-template.md)
- [obra/superpowers review skills](https://github.com/obra/superpowers)
