# Code Review Report

**Date:** [YYYY-MM-DD]
**Reviewer:** [Your Name]
**Story ID:** [US-XXX]
**Story Title:** [Title]
**Commit:** [git commit hash]
**Branch:** [branch name]

---

## Stage 1: Specification Compliance

**Status:** ✅ PASS / ❌ FAIL

### Acceptance Criteria Review

#### Criterion 1: [Description]
- **Status:** ✅ Met / ❌ Not Met
- **Evidence:** [Where can we see this working?]
- **Notes:** [Any observations]

#### Criterion 2: [Description]
- **Status:** ✅ Met / ❌ Not Met
- **Evidence:** [Where can we see this working?]
- **Notes:** [Any observations]

[... Add more criteria as needed ...]

### Files Affected Review

#### Expected Files
- ✅ / ❌ `path/to/file1.ts` - Status: Created / Modified / Missing
- ✅ / ❌ `path/to/file2.tsx` - Status: Created / Modified / Missing

[... Add more files as needed ...]

### Functionality Review
- ✅ / ❌ Behavior matches spec description
- ✅ / ❌ Error cases from spec handled
- ✅ / ❌ Edge cases from spec covered

### Scope Review
- ✅ / ❌ No scope creep (extra features)
- ✅ / ❌ All required functionality present
- ✅ / ❌ Implementation stayed focused

### Stage 1 Issues

#### Critical Issues 🔴
1. **[Issue Title]**
   - **Description:** [Detailed description]
   - **Location:** [File:line]
   - **Impact:** [Why this is critical]
   - **Suggested Fix:** [How to fix]

[... Add more critical issues ...]

#### Major Issues 🟡
[Same format as critical]

#### Minor Issues 🟢
[Same format as critical]

### Stage 1 Summary
- **Total Issues:** [X critical, Y major, Z minor]
- **Status:** ✅ PASS / ❌ FAIL
- **Next Action:** [Continue to Stage 2 / Fix issues / Re-review]

---

## Stage 2: Code Quality

**Status:** ✅ PASS / ❌ FAIL / ⏸️ NOT STARTED (if Stage 1 failed)

### Code Standards: ✅ PASS / ❌ FAIL
- ✅ / ❌ Follows project conventions
- ✅ / ❌ TypeScript types present
- ✅ / ❌ Consistent naming
- ✅ / ❌ Properly formatted
**Notes:** [Any observations]

### Testing: ✅ PASS / ❌ FAIL
- ✅ / ❌ Tests present
- ✅ / ❌ Tests passing
- ✅ / ❌ Happy path covered
- ✅ / ❌ Error cases covered
- ✅ / ❌ Edge cases covered
**Notes:** [Any observations]
**Coverage:** [X%] (if available)

### Error Handling: ✅ PASS / ❌ FAIL
- ✅ / ❌ Errors caught
- ✅ / ❌ User-friendly messages
- ✅ / ❌ Errors logged
- ✅ / ❌ Edge cases handled
**Notes:** [Any observations]

### Security: ✅ PASS / ❌ FAIL
- ✅ / ❌ No SQL injection
- ✅ / ❌ Passwords hashed
- ✅ / ❌ Input validated
- ✅ / ❌ XSS prevented
- ✅ / ❌ No secrets in code
**Notes:** [Any observations]

### Performance: ✅ PASS / ❌ FAIL
- ✅ / ❌ No bottlenecks
- ✅ / ❌ Queries optimized
- ✅ / ❌ No memory leaks
- ✅ / ❌ Algorithms efficient
**Notes:** [Any observations]

### Documentation: ✅ PASS / ❌ FAIL
- ✅ / ❌ Complex logic documented
- ✅ / ❌ Public APIs documented
- ✅ / ❌ README updated
**Notes:** [Any observations]

### Stage 2 Issues

#### Critical Issues 🔴
1. **[Issue Title]**
   - **Description:** [Detailed description]
   - **Location:** [File:line]
   - **Impact:** [Why this is critical]
   - **Code:**
     ```typescript
     // Current problematic code
     ```
   - **Suggested Fix:**
     ```typescript
     // Suggested improvement
     ```

[... Add more issues ...]

#### Major Issues 🟡
[Same format]

#### Minor Issues 🟢
[Same format]

### Stage 2 Summary
- **Total Issues:** [X critical, Y major, Z minor]
- **Status:** ✅ PASS / ❌ FAIL
- **Next Action:** [Approve / Fix issues / Re-review]

---

## Overall Status

**Final Result:** ✅ APPROVED / ❌ NEEDS FIXES

### Summary
- **Stage 1:** ✅ PASS / ❌ FAIL
- **Stage 2:** ✅ PASS / ❌ FAIL
- **Total Issues:** [X critical, Y major, Z minor]

### Next Actions
- [ ] Fix critical issue: [description]
- [ ] Fix major issue: [description]
- [ ] Address minor issue: [description]
- [ ] Re-review after fixes
- [ ] Merge to main (if approved)

---

## Additional Notes

### Positive Observations
- [What was done well]
- [Good practices noticed]
- [Code that stood out positively]

### Suggestions for Future
- [Non-blocking improvements]
- [Ideas for refactoring]
- [Learning opportunities]

### Questions for Developer
- [Any clarifications needed]
- [Rationale behind certain decisions]

---

## Review Metadata

**Review Attempt:** [1, 2, 3, etc.]
**Time Spent:** [Approximate time for review]
**Previous Review Issues Fixed:** [X/Y issues from previous review]

---

## Sign-off

**Reviewer Signature:** [Your Name]
**Date:** [YYYY-MM-DD]
**Next Reviewer:** [If applicable]

---

## Template Version

**Version:** 1.0.0
**Last Updated:** 2026-01-23
